# Prueba de balizas BLE — EduPass Pick

Proyecto aislado para validar si las balizas Bluetooth (ej. DX-SMART CP35) se
detectan de forma confiable desde un celular Android, **antes** de integrar
nada de esto a EduPass real. No toca el repo de EduPass2.0 ni se despliega a
ningun lado.

Es Capacitor envolviendo una pagina simple (`www/index.html`, JS plano, sin
build step, mismo estilo que EduPass) + el plugin `@capacitor-community/bluetooth-le`
para el escaneo BLE nativo.

📄 **[`docs/DX-CP35-manual.md`](docs/DX-CP35-manual.md)** — manual completo de
la baliza que se va a comprar (parametros de fabrica, como configurarla con
la app del fabricante, modelo de bateria, etc.). Leer antes de que lleguen
las balizas fisicas.

## Que ya esta hecho

- `www/index.html` — pantalla de prueba: boton de escanear, lista de balizas
  detectadas con su RSSI (fuerza de senal) y cuantas veces se han visto.
- `www/queue-logic.js` — motor de fila: convierte lecturas de RSSI en zonas
  (lejos / acercandose / en la estacion), suaviza el ruido de la senal,
  ordena por quien llego primero (no por senal instantanea) y descarta
  balizas que dejaron de verse. Sin dependencias, se puede probar con Node
  directo (ver mas abajo) o dentro del navegador.
- `www/pairing-store.js` + `www/emparejamiento.html` — pantalla para asociar
  el ID de cada baliza fisica con el nombre del carro/familia y el/los
  alumno(s) que recoge. Se guarda en `localStorage` del navegador (es
  prototipo; cuando esto se integre a EduPass real, se cambia por el backend
  de verdad en `work/server.js`, guardado junto con el resto del estado en
  Postgres).
- `www/simulador.html` — simulador visual de la fila con carros falsos
  (sliders de senal) ya conectado al emparejamiento: si una baliza no esta
  emparejada, avisa y te manda directo a emparejarla; si ya lo esta, muestra
  el nombre y los alumnos. Funciona en cualquier navegador, sin celular ni
  Android Studio — util para seguir ajustando la logica antes de que lleguen
  las balizas.
- `android/` — proyecto nativo Android ya generado (`npx cap add android`).
- Permisos de Bluetooth/ubicacion ya declarados via el plugin (se mezclan
  automaticamente al compilar, no hay que tocar el `AndroidManifest.xml`).

### Probar la logica de fila sin abrir el navegador

```bash
cd edupass-pick-beacon-test
node -e "
const { BeaconQueue } = require('./www/queue-logic.js');
const bq = new BeaconQueue();
bq.onReading('mi-baliza', -55);
console.log(bq.getQueue());
"
```

### Ver el simulador y la pantalla de emparejamiento ahora mismo

No necesitan Android Studio ni celular — son paginas web normales:

```bash
cd edupass-pick-beacon-test
npx serve www -l 8091
```

Y abre `http://localhost:8091/simulador.html` o `http://localhost:8091/emparejamiento.html`.

## Lo que falta de tu lado para poder correrlo

Este equipo no tiene instalado Android Studio ni el SDK de Android — hace
falta para compilar un APK real. Pasos:

1. Instala [Android Studio](https://developer.android.com/studio) (incluye el
   SDK).
2. Abre una terminal en esta carpeta y corre:
   ```
   npx cap open android
   ```
   Esto abre el proyecto directo en Android Studio.
3. Conecta tu celular Android por USB con "Depuracion USB" activada
   (Ajustes > Opciones de desarrollador), o usa un emulador.
4. Dale "Run" (▶) en Android Studio. Se instala la app de prueba en el
   celular.
5. Enciende la baliza, abre la app, dale "Iniciar escaneo" y acepta los
   permisos de Bluetooth/ubicacion que pida Android.

## Que observar durante la prueba

- **¿Aparece la baliza en la lista?** Si no aparece nunca, revisa que la
  baliza este encendida/pareada segun su manual — algunas balizas BLE vienen
  en modo "apagado" de fabrica.
- **Estabilidad del RSSI** — el numero en dBm (ej. `-65 dBm`) deberia moverse
  poco si la baliza esta quieta. Si brinca mucho (de -50 a -90 y de regreso
  cada segundo), la senal no va a ser confiable para detectar "posicion en la
  fila" de forma precisa.
- **Alcance real afuera** — el fabricante anuncia 70m en interiores; en
  exterior (fila de coches, sin paredes) normalmente es mejor. Camina con la
  baliza alejandote del celular y anota a que distancia deja de detectarse o
  se vuelve inestable.
- **Multiples balizas a la vez** — si consigues 2-3 balizas, prueba si el
  celular las distingue bien todas al mismo tiempo (por su ID unico) o se
  confunde.

## Como ajustar la logica de fila (zonas, orden, cuando se descarta)

Todo eso vive en `www/queue-logic.js`, en un solo lugar:

- `FAR_THRESHOLD` / `NEAR_THRESHOLD` (dBm) — donde empiezan las zonas
  "acercandose" y "en la estacion". Son un punto de partida; hay que
  recalibrarlos una vez que se pruebe con las balizas reales afuera de la
  escuela (el RSSI real varia segun el modelo de baliza y el celular).
- `SMOOTHING_ALPHA` — que tan rapido reacciona a cambios de senal vs. que
  tan estable se mantiene. Mas bajo = mas estable pero mas lento para notar
  que un carro se acerco de verdad.
- `EXPIRE_AFTER_MS` — cuanto tiempo sin verse una baliza antes de quitarla
  sola de la fila (el carro se fue).

El punto de seguridad importante: **la confirmacion final de "entregado"
siempre es un boton manual del staff** (`markDelivered`), nunca se dispara
sola por perdida de senal — eso solo controla si el carro sigue *visible* en
la lista, no si se marca como resuelto.

## Siguiente paso (una vez que el hardware funcione)

Si las balizas se comportan bien en la prueba con Android, el siguiente paso
es integrar este mismo patron (Capacitor + plugin BLE + `queue-logic.js` +
la idea de `pairing-store.js`, ya pero contra el backend real) directamente
sobre el `outputs/index.html`/`work/server.js` real de EduPass, y agregar el
lado iOS (`npx cap add ios`, requiere una Mac). Nada de eso esta hecho
todavia — se detuvo aqui a proposito hasta confirmar que el hardware sirve.
