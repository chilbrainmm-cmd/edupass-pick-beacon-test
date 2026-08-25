/**
 * Parser de paquetes iBeacon dentro del manufacturerData de un ScanResult de
 * @capacitor-community/bluetooth-le, + filtro por UUID escolar.
 *
 * Formato iBeacon dentro del manufacturerData de Apple (id de fabricante 76 =
 * 0x004C, asi lo entrega el plugin como clave de manufacturerData):
 *   byte 0-1:   0x02 0x15  (tipo iBeacon + longitud, fijo)
 *   byte 2-17:  UUID (16 bytes)
 *   byte 18-19: Major (2 bytes)
 *   byte 20-21: Minor (2 bytes)
 *   byte 22:    Tx power calibrado (1 byte, con signo)
 */

const APPLE_MANUFACTURER_ID = "76"; // 0x004C en decimal, formato de clave que entrega el plugin

function bytesToUuid(bytes) {
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`.toUpperCase();
}

function toByteArray(data) {
  if (typeof DataView !== "undefined" && data instanceof DataView) {
    const arr = [];
    for (let i = 0; i < data.byteLength; i++) arr.push(data.getUint8(i));
    return arr;
  }
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    const clean = data.replace(/^0x/i, "");
    const arr = [];
    for (let i = 0; i < clean.length; i += 2) arr.push(parseInt(clean.substr(i, 2), 16));
    return arr;
  }
  return [];
}

function int8(byte) {
  return byte > 127 ? byte - 256 : byte;
}

/** Parsea el iBeacon dentro de manufacturerData. Devuelve null si no hay un paquete iBeacon valido ahi. */
function parseIBeacon(manufacturerData) {
  if (!manufacturerData) return null;
  const raw = manufacturerData[APPLE_MANUFACTURER_ID];
  if (!raw) return null;
  const bytes = toByteArray(raw);
  if (bytes.length < 23 || bytes[0] !== 0x02 || bytes[1] !== 0x15) return null;
  return {
    uuid: bytesToUuid(bytes.slice(2, 18)),
    major: (bytes[18] << 8) | bytes[19],
    minor: (bytes[20] << 8) | bytes[21],
    txPower: int8(bytes[22]),
  };
}

/** true si el resultado del escaneo es una baliza iBeacon con el UUID escolar configurado (ignora audifonos, relojes, etc). */
function matchesSchoolUuid(scanResult, schoolUuid) {
  const parsed = parseIBeacon(scanResult && scanResult.manufacturerData);
  return !!parsed && parsed.uuid.toUpperCase() === String(schoolUuid).toUpperCase();
}

if (typeof window !== "undefined") {
  window.IBeacon = { parseIBeacon, matchesSchoolUuid, APPLE_MANUFACTURER_ID };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { parseIBeacon, matchesSchoolUuid, APPLE_MANUFACTURER_ID };
}
