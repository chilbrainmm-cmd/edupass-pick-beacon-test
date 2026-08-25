/**
 * Logica de fila de EduPass Pick basada en balizas BLE.
 * Modulo puro (sin dependencias de Capacitor/DOM) para que se pueda probar
 * tanto con lecturas reales del plugin BLE como con el simulador.
 *
 * Orden de la fila: ESTRICTAMENTE por fuerza de señal (RSSI), de mayor a
 * menor -- el carro más cerca del lector siempre es el candidato a la
 * posición #1. No hay "quien llegó primero" que lo detenga.
 *
 * Para que ese orden no "parpadee" quinto a quinto por el ruido normal del
 * Bluetooth, se aplica HISTERESIS: un carro solo rebasa al de adelante si su
 * señal es mas fuerte por MAS del margen configurado (no con cualquier
 * diferencia de 1-2 dBm).
 *
 * Zonas por RSSI (calibrar estos umbrales una vez que se pruebe con balizas
 * reales -- estos valores son un punto de partida razonable, no definitivos):
 *   - "lejos":         mas debil que FAR_THRESHOLD (fuera de la fila, ver MIN_RSSI_TO_QUEUE)
 *   - "acercandose":   entre FAR_THRESHOLD y NEAR_THRESHOLD
 *   - "en_estacion":   mas fuerte que NEAR_THRESHOLD
 */

const FAR_THRESHOLD = -85; // dBm
const NEAR_THRESHOLD = -65; // dBm
const MIN_RSSI_TO_QUEUE = FAR_THRESHOLD; // mas debil que esto = falso positivo lejano, no entra a la fila visible
const HYSTERESIS_MARGIN_DB = 4; // un carro solo rebasa al de adelante si su señal es al menos esto mas fuerte
const SMOOTHING_ALPHA = 0.3; // 0-1, mas alto = reacciona mas rapido a cambios, mas bajo = mas estable
const EXPIRE_AFTER_MS = 45 * 1000; // sin ninguna lectura (silencio total) en este tiempo -> se quita de la fila

// Contingencia: si al guardia se le olvida picar "Entregado" y el carro se va,
// el RSSI cae a niveles de "se esta yendo" -- se le da un colchon de gracia
// (por si fue solo un bache momentaneo de senal) y si sigue debil pasado ese
// tiempo, se quita solo de la fila (sin marcarse como "entregado" -- eso
// siempre requiere el boton manual, esto solo lo saca de la lista visible).
const DEPARTURE_RSSI_THRESHOLD = -90; // dBm
const DEPARTURE_GRACE_MS = 15 * 1000;

function classifyZone(rssi) {
  if (rssi >= NEAR_THRESHOLD) return "en_estacion";
  if (rssi >= FAR_THRESHOLD) return "acercandose";
  return "lejos";
}

// Motivo de salida de la fila -- IMPORTANTE: solo CONFIRMED debe notificarse
// al salon de clases como exito. Los otros dos son "se fue sin que el
// guardia confirmara" -- se limpian de la fila pero deben alertar al
// guardia, nunca reportarse como entrega exitosa (no hay garantia de que el
// alumno correcto subio al carro correcto).
const REMOVE_REASON = {
  CONFIRMED: "confirmado_por_guardia", // boton manual "Entregado" -- unico caso de exito real
  DEPARTED_UNCONFIRMED: "se_alejo_sin_confirmar", // señal cayo y no se recupero dentro del margen de gracia
  SIGNAL_LOST: "silencio_total", // dejo de verse por completo (sin pasar primero por "debil")
};

class BeaconQueue {
  constructor({ onChange, onRemove } = {}) {
    this.beacons = new Map(); // deviceId -> state
    this.order = []; // orden estable actual (con histeresis ya aplicada), arreglo de deviceIds
    this.onChange = onChange || (() => {});
    this.onRemove = onRemove || (() => {}); // (deviceId, reason, label) -- ver REMOVE_REASON
  }

  /** Alimentar una lectura cruda de RSSI (llamar cada vez que el escaneo BLE detecta la baliza) */
  onReading(deviceId, rssi, label) {
    const now = Date.now();
    let b = this.beacons.get(deviceId);
    if (!b) {
      b = {
        deviceId,
        label: label || deviceId,
        smoothedRssi: rssi,
        zone: classifyZone(rssi),
        firstSeenAt: now,
        lastSeenAt: now,
        enteredZoneAt: now,
        weakSince: null, // desde cuando esta por debajo de DEPARTURE_RSSI_THRESHOLD sin recuperarse
        samples: 0,
      };
      this.beacons.set(deviceId, b);
    }
    b.smoothedRssi = SMOOTHING_ALPHA * rssi + (1 - SMOOTHING_ALPHA) * b.smoothedRssi;
    b.lastSeenAt = now;
    b.samples += 1;

    const newZone = classifyZone(b.smoothedRssi);
    if (newZone !== b.zone) {
      const zoneRank = { lejos: 0, acercandose: 1, en_estacion: 2 };
      if (zoneRank[newZone] > zoneRank[b.zone]) b.enteredZoneAt = now;
      b.zone = newZone;
    }

    // Contingencia de "se me fue el carro y se me olvido picar Entregado":
    // si la señal se mantiene debil (<= DEPARTURE_RSSI_THRESHOLD) sin
    // recuperarse por mas de DEPARTURE_GRACE_MS, se descarta solo en
    // _expireStale. Un rebote momentaneo (recupera señal) reinicia el reloj.
    if (b.smoothedRssi <= DEPARTURE_RSSI_THRESHOLD) {
      if (b.weakSince === null) b.weakSince = now;
    } else {
      b.weakSince = null;
    }

    this._expireStale(now);
    this.onChange(this.getQueue());
  }

  /** Confirmacion manual del staff: el carro ya recibio a su alumno(s). SIEMPRE explicita, nunca automatica -- unico camino que cuenta como exito real. */
  markDelivered(deviceId) {
    this._removeBeacon(deviceId, REMOVE_REASON.CONFIRMED);
  }

  /** Saca una baliza de la fila y avisa el motivo -- unico punto de salida, usado tanto por el boton manual como por los descartes automaticos. */
  _removeBeacon(deviceId, reason) {
    const b = this.beacons.get(deviceId);
    if (!b) return;
    this.beacons.delete(deviceId);
    this.order = this.order.filter((id) => id !== deviceId);
    this.onRemove(deviceId, reason, b.label);
    this.onChange(this.getQueue());
  }

  _expireStale(now) {
    for (const [id, b] of [...this.beacons]) {
      const silencioTotal = now - b.lastSeenAt > EXPIRE_AFTER_MS;
      const seFueYNoConfirmaron = b.weakSince !== null && now - b.weakSince > DEPARTURE_GRACE_MS;
      if (silencioTotal) this._removeBeacon(id, REMOVE_REASON.SIGNAL_LOST);
      else if (seFueYNoConfirmaron) this._removeBeacon(id, REMOVE_REASON.DEPARTED_UNCONFIRMED);
    }
  }

  /**
   * Recalcula el orden estable con histeresis:
   *   1. Quita del orden a quien ya no califica (se fue, o su señal cayó
   *      bajo MIN_RSSI_TO_QUEUE -- se trata como falso positivo lejano).
   *   2. Inserta a los que califican por primera vez, ya ordenados por RSSI
   *      puro (no hay posición previa que proteger todavía).
   *   3. Pasadas tipo burbuja: dos vecinos solo intercambian posición si el
   *      de atrás supera al de adelante por más de HYSTERESIS_MARGIN_DB.
   */
  _reconcileOrder() {
    const activeIds = new Set(
      [...this.beacons.values()].filter((b) => b.smoothedRssi > MIN_RSSI_TO_QUEUE).map((b) => b.deviceId)
    );

    this.order = this.order.filter((id) => activeIds.has(id));

    for (const id of activeIds) {
      if (this.order.includes(id)) continue;
      const rssi = this.beacons.get(id).smoothedRssi;
      let insertAt = this.order.length;
      for (let i = 0; i < this.order.length; i++) {
        if (rssi > this.beacons.get(this.order[i]).smoothedRssi) {
          insertAt = i;
          break;
        }
      }
      this.order.splice(insertAt, 0, id);
    }

    let swapped = true;
    while (swapped) {
      swapped = false;
      for (let i = 0; i < this.order.length - 1; i++) {
        const front = this.beacons.get(this.order[i]).smoothedRssi;
        const behind = this.beacons.get(this.order[i + 1]).smoothedRssi;
        if (behind - front > HYSTERESIS_MARGIN_DB) {
          [this.order[i], this.order[i + 1]] = [this.order[i + 1], this.order[i]];
          swapped = true;
        }
      }
    }
  }

  /** Fila ordenada (con histeresis ya aplicada) -- items[0] es siempre el "auto en la puerta". */
  getQueue() {
    this._reconcileOrder();
    return this.order.map((id) => {
      const b = this.beacons.get(id);
      return {
        ...b,
        secondsInZone: Math.round((Date.now() - b.enteredZoneAt) / 1000),
        secondsSinceLastSeen: Math.round((Date.now() - b.lastSeenAt) / 1000),
      };
    });
  }
}

if (typeof window !== "undefined") {
  window.BeaconQueue = BeaconQueue;
  window.REMOVE_REASON = REMOVE_REASON;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BeaconQueue,
    classifyZone,
    REMOVE_REASON,
    FAR_THRESHOLD,
    NEAR_THRESHOLD,
    MIN_RSSI_TO_QUEUE,
    HYSTERESIS_MARGIN_DB,
    EXPIRE_AFTER_MS,
    DEPARTURE_RSSI_THRESHOLD,
    DEPARTURE_GRACE_MS,
  };
}
