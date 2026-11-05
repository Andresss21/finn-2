// Rótulo de un día de la lista de Actividad (export 02-actividad): «Hoy · jueves 15/10», «Ayer · miércoles 14/10» y, para los
// demás, «Domingo 11/10». El año va solo si no es el de hoy. Solo nombra el día de la semana: no toca montos (PF-3). `Date`
// vive acá, en `src/formato/` (L7).
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MS_POR_DIA = 86_400_000;

const partes = (f: string): [number, number, number] => {
  const [a = 0, m = 1, d = 1] = f.split('-').map(Number);
  return [a, m, d];
};
const dosDigitos = (n: number): string => String(n).padStart(2, '0');

/** `fecha` y `hoy` son `AAAA-MM-DD`. */
export function rotuloDeDia(fecha: string, hoy: string): string {
  const [a, m, d] = partes(fecha);
  const [ah, mh, dh] = partes(hoy);
  const ese = Date.UTC(a, m - 1, d);
  const dia = DIAS[new Date(ese).getUTCDay()] ?? '';
  const corta = `${dosDigitos(d)}/${dosDigitos(m)}${a === ah ? '' : `/${a}`}`;
  const atras = (Date.UTC(ah, mh - 1, dh) - ese) / MS_POR_DIA;
  if (atras === 0) return `Hoy · ${dia} ${corta}`;
  if (atras === 1) return `Ayer · ${dia} ${corta}`;
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${corta}`;
}
