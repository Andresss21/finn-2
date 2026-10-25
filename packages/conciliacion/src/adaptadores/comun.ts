import { Centavos, FechaLocal } from '@finn/dominio/valores';
import { ErrorFormato, type MovimientoNormalizado } from '../tipos';

/** DD/MM/AAAA → FechaLocal; valida que el día exista (04 §9.4). */
export function fecha(texto: string, nFila: number): FechaLocal {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (m === null) throw new ErrorFormato(nFila, `fecha inválida: "${texto}"`);
  try {
    return FechaLocal.desdePartes(Number(m[3]), Number(m[2]), Number(m[1]));
  } catch {
    throw new ErrorFormato(nFila, `la fecha no existe: "${texto}"`);
  }
}

/** Importe con `,` de miles y `.` decimal. */
export function importe(texto: string, nFila: number): Centavos {
  const limpio = texto.trim().replace(/,/g, '');
  try {
    return Centavos.desdeTexto(limpio);
  } catch {
    throw new ErrorFormato(nFila, `monto inválido: "${texto}"`);
  }
}

/** Columna de cargo o abono que puede venir vacía: vacío = 0. */
export const importeOpcional = (texto: string | undefined, nFila: number): Centavos =>
  (texto ?? '').trim() === '' ? Centavos.cero : importe(texto ?? '', nFila);

export const normalizar = (texto: string): string => texto.trim().replace(/\s+/g, ' ');

/** Valor de la fila `etiqueta,valor` anterior a `limite`. */
export function buscar(
  filas: string[][],
  etiqueta: string,
  limite: number,
): { valor: string; fila: number } {
  const i = filas.findIndex((f, k) => k < limite && f[0]?.trim() === etiqueta);
  const valor = filas[i]?.[1];
  if (valor === undefined) throw new ErrorFormato(1, `falta "${etiqueta}"`);
  return { valor, fila: i + 1 };
}

/** El encabezado en `inicio` debe tener exactamente las columnas esperadas. */
export function exigirColumnas(filas: string[][], inicio: number, columnas: string[]): void {
  const encabezado = (filas[inicio] ?? []).map((c) => c.trim());
  if (columnas.some((c, i) => encabezado[i] !== c))
    throw new ErrorFormato(inicio + 1, `columnas inesperadas: ${encabezado.join(',')}`);
}

export function conReferencia(
  base: Omit<MovimientoNormalizado, 'referencia'>,
  referencia: string | undefined,
): MovimientoNormalizado {
  const r = (referencia ?? '').trim();
  return r === '' ? base : { ...base, referencia: r };
}
