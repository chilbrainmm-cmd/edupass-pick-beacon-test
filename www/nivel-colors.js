/**
 * Colores por nivel -- copiado tal cual de la logica real de EduPass
 * (outputs/index.html: BADGE_PALETTE, NIVEL_COLOR_MAP, normalizeForMatch,
 * lightenColor, colorForNivel) para que los niveles se vean con el MISMO
 * color aqui que en las credenciales QR reales. Si esos colores cambian en
 * EduPass, hay que actualizarlos aqui tambien a mano (es una copia, no un
 * import -- este proyecto es aislado a proposito, ver README.md).
 */

const BADGE_PALETTE = ["#16264A", "#1F9D6B", "#E1503D", "#2E6F9E", "#8B5FBF", "#C98A1E", "#0E7C7B"];
const NIVEL_COLOR_MAP = [
  { test: /kinder|preescolar|jard[ií]n/, strong: "#8B5FBF" }, // preescolar: morado
  { test: /primaria/, strong: "#C98A1E" },                          // primaria: ambar
  { test: /secundaria/, strong: "#1F9D6B" },                        // secundaria: verde
  { test: /prepa|bachiller/, strong: "#2E9FE0" },                   // preparatoria: azul cielo
];

function normalizeForMatch(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function lightenColor(hex, amount = 0.88) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `rgb(${nr},${ng},${nb})`;
}

function colorForNivel(nivel) {
  const norm = normalizeForMatch(nivel);
  const known = NIVEL_COLOR_MAP.find((m) => m.test.test(norm));
  let strong;
  if (known) {
    strong = known.strong;
  } else {
    let hash = 0;
    for (let i = 0; i < norm.length; i++) hash = (hash * 31 + norm.charCodeAt(i)) >>> 0;
    strong = BADGE_PALETTE[hash % BADGE_PALETTE.length];
  }
  return { strong, light: lightenColor(strong) };
}

if (typeof window !== "undefined") {
  window.NivelColors = { colorForNivel };
}
