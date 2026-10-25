import { bacTarjeta } from './adaptadores/bac-tarjeta';
import { decodificar } from './decodificar';
import {
  ErrorFormato,
  type Adaptador,
  type EstadoNormalizado,
  type ErrorLectura,
  type IdFormatoCsv,
} from './tipos';

interface Firma {
  id: IdFormatoCsv;
  tipoCuenta: 'efectivo' | 'tarjeta';
  detectar: Adaptador['detectar'];
}

const empiezaCon = (filas: string[][], prefijo: string): boolean =>
  filas.some((f) => f[0]?.trim().startsWith(prefijo) === true);

/** Las seis firmas de ADR-17, de la más específica a la más general. */
export const FIRMAS: readonly Firma[] = [
  {
    id: 'ba_tarjeta_portal',
    tipoCuenta: 'tarjeta',
    detectar: (t) =>
      t.includes('Autorizacion,Fecha Transaccion,Fecha Aplicada,Concepto,Cargos ($),Abonos ($)'),
  },
  {
    id: 'ba_debito',
    tipoCuenta: 'efectivo',
    detectar: (t) =>
      t.includes('Detalle de Estado Bancario') && t.includes('Referencia de Transacci'),
  },
  {
    id: 'bac_debito',
    tipoCuenta: 'efectivo',
    detectar: (t) => t.includes('Detalle de Estado Bancario') && t.includes('Saldo Inicial'),
  },
  {
    id: 'cuscatlan_tarjeta',
    tipoCuenta: 'tarjeta',
    detectar: (t) => t.includes('Historial de movimientos'),
  },
  {
    id: 'ba_tarjeta_pdf_csv',
    tipoCuenta: 'tarjeta',
    detectar: (_t, filas) => empiezaCon(filas, 'VT'),
  },
  { id: 'bac_tarjeta', tipoCuenta: 'tarjeta', detectar: (t, f) => bacTarjeta.detectar(t, f) },
];

/** Formatos reconocidos y rechazados (CH-03: Cuscatlán excluido). */
const EXCLUIDOS: ReadonlySet<IdFormatoCsv> = new Set(['cuscatlan_tarjeta']);

/** Adaptadores con `extraer` implementado; TA-183 agrega los demás. */
export const ADAPTADORES: Partial<Record<IdFormatoCsv, Adaptador>> = { bac_tarjeta: bacTarjeta };

export function leerEstado(bytes: Uint8Array): EstadoNormalizado | ErrorLectura {
  const d = decodificar(bytes);
  if (!d.ok) return { error: d.error };
  const coinciden = FIRMAS.filter((f) => f.detectar(d.texto, d.filas));
  const [primera] = coinciden;
  if (primera === undefined) return { error: 'formato_no_reconocido' };
  if (coinciden.length > 1) return { error: 'formato_ambiguo' };
  if (EXCLUIDOS.has(primera.id)) return { error: 'formato_excluido', formato: primera.id };
  const adaptador = ADAPTADORES[primera.id];
  if (adaptador === undefined) return { error: 'formato_no_disponible', formato: primera.id };
  try {
    return adaptador.extraer(d.filas);
  } catch (e) {
    if (e instanceof ErrorFormato)
      return { error: 'fila_invalida', fila: e.fila, motivo: e.motivo };
    throw e;
  }
}
