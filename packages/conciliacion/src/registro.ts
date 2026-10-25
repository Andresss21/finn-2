import { agricolaDebito } from './adaptadores/agricola-debito';
import { agricolaPdf } from './adaptadores/agricola-pdf';
import { agricolaPortal } from './adaptadores/agricola-portal';
import { bacDebito } from './adaptadores/bac-debito';
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

/** Las seis firmas de ADR-17, de la más específica a la más general. */
export const FIRMAS: readonly Firma[] = [
  {
    id: 'ba_tarjeta_portal',
    tipoCuenta: 'tarjeta',
    detectar: (t, f) => agricolaPortal.detectar(t, f),
  },
  { id: 'ba_debito', tipoCuenta: 'efectivo', detectar: (t, f) => agricolaDebito.detectar(t, f) },
  { id: 'bac_debito', tipoCuenta: 'efectivo', detectar: (t, f) => bacDebito.detectar(t, f) },
  {
    id: 'cuscatlan_tarjeta',
    tipoCuenta: 'tarjeta',
    detectar: (t) => t.includes('Historial de movimientos'),
  },
  {
    id: 'ba_tarjeta_pdf_csv',
    tipoCuenta: 'tarjeta',
    detectar: (t, f) => agricolaPdf.detectar(t, f),
  },
  { id: 'bac_tarjeta', tipoCuenta: 'tarjeta', detectar: (t, f) => bacTarjeta.detectar(t, f) },
];

/** Formatos reconocidos y rechazados (CH-03: Cuscatlán excluido). */
const EXCLUIDOS: ReadonlySet<IdFormatoCsv> = new Set(['cuscatlan_tarjeta']);

/** Adaptadores con `extraer` implementado (⚠ S6-1: sintéticos hasta TU-13 y TU-14); Cuscatlán no tiene (CH-03). */
export const ADAPTADORES: Partial<Record<IdFormatoCsv, Adaptador>> = {
  bac_tarjeta: bacTarjeta,
  bac_debito: bacDebito,
  ba_tarjeta_portal: agricolaPortal,
  ba_tarjeta_pdf_csv: agricolaPdf,
  ba_debito: agricolaDebito,
};

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
