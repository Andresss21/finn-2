// Los días de un tramo de fechas con los dos extremos incluidos: el período de transición de AV-12 (FT-72). Es un conteo del
// calendario, no un monto (PF-3). Vive en `formato/` porque solo allí se usa `Date` (L7).
const MS_POR_DIA = 86_400_000;

const aDias = (f: string): number =>
  Date.UTC(Number(f.slice(0, 4)), Number(f.slice(5, 7)) - 1, Number(f.slice(8, 10))) / MS_POR_DIA;

export function diasDelTramo(inicio: string, fin: string): number {
  return aDias(fin) - aDias(inicio) + 1;
}
