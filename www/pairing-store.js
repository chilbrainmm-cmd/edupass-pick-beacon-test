/**
 * Almacen de emparejamientos baliza -> alumno(s)/familia.
 *
 * Prototipo: guarda en localStorage del navegador. Cuando esto se integre a
 * EduPass de verdad, este modulo se reemplaza por llamadas al backend real
 * (work/server.js -> mismo patron que ya usan alumnos/institucion, guardado
 * en el blob de Postgres) -- pero la forma de los datos (beaconId, label,
 * students) se puede mantener igual para no rehacer las pantallas.
 */

const STORAGE_KEY = "edupass_pick_beacon_pairings";

function getPairings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function savePairings(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function findPairing(beaconId) {
  return getPairings().find((p) => p.beaconId === beaconId) || null;
}

/** Crea o actualiza el emparejamiento de una baliza. `students` es un arreglo de {name, grupo, nivel}. */
function upsertPairing({ beaconId, label, students }) {
  if (!beaconId || !beaconId.trim()) throw new Error("Falta el ID de la baliza");
  if (!label || !label.trim()) throw new Error("Falta el nombre para identificar el carro/familia");
  const list = getPairings();
  const idx = list.findIndex((p) => p.beaconId === beaconId.trim());
  const cleanStudents = (students || [])
    .map((s) => ({ name: (s.name || "").trim(), grupo: (s.grupo || "").trim(), nivel: (s.nivel || "").trim() }))
    .filter((s) => s.name);
  if (cleanStudents.length === 0) throw new Error("Agrega al menos un alumno");

  const now = Date.now();
  if (idx >= 0) {
    list[idx] = { ...list[idx], label: label.trim(), students: cleanStudents, updatedAt: now };
  } else {
    list.push({ beaconId: beaconId.trim(), label: label.trim(), students: cleanStudents, createdAt: now, updatedAt: now });
  }
  savePairings(list);
  return findPairing(beaconId.trim());
}

function deletePairing(beaconId) {
  savePairings(getPairings().filter((p) => p.beaconId !== beaconId));
}

/** Solo siembra datos de ejemplo si no hay nada guardado todavia (para que el simulador se vea bien la primera vez). */
function seedDefaultsIfEmpty(defaults) {
  if (getPairings().length === 0) savePairings(defaults);
}

if (typeof window !== "undefined") {
  window.PairingStore = { getPairings, savePairings, findPairing, upsertPairing, deletePairing, seedDefaultsIfEmpty };
}
