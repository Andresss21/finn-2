// Armado puro de las exportaciones (OPT-08; 04 §16, ADR-22): JSON completo de hechos y CSV de transacciones con sus
// líneas. Sin E/S: recibe los hechos de una instantánea y devuelve texto. Orden estable (claveOrden, id).
import type { Hechos } from '@finn/dominio';
import {
  VERSION_FORMATO,
  type ArchivoExportado,
  type ExportacionJson,
} from '../contratos/exportacion.ts';

/** Centavos enteros → `-45.00` (guion ASCII, dos decimales, sin separador de miles). */
export function montoExportado(centavos: number): string {
  const abs = Math.abs(centavos);
  const signo = centavos < 0 ? '-' : '';
  return `${signo}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** Texto libre para CSV: comillas RFC 4180 y neutralización de fórmulas de hoja de cálculo. */
function celdaTexto(valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '';
  const t = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return /[",\n\r]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t;
}

const porOrden = (a: { claveOrden: string; id: string }, b: { claveOrden: string; id: string }) =>
  a.claveOrden < b.claveOrden ? -1 : a.claveOrden > b.claveOrden ? 1 : a.id < b.id ? -1 : 1;

export function armarJson(hechos: Hechos, revision: string, hoy: string): ArchivoExportado {
  const cuerpo: ExportacionJson = {
    aplicacion: 'finn',
    versionFormato: VERSION_FORMATO,
    revision,
    hoy,
    hechos: Object.fromEntries(
      Object.entries(hechos).map(([tabla, filas]) => [
        tabla,
        [...filas] as unknown as Record<string, unknown>[],
      ]),
    ),
  };
  return {
    nombre: `finn-hechos-${hoy}.json`,
    tipoMime: 'application/json; charset=utf-8',
    contenido: JSON.stringify(cuerpo, null, 2),
  };
}

const ENCABEZADO = [
  'transaccion_id',
  'fecha',
  'tipo',
  'comercio',
  'nota',
  'total',
  'linea_orden',
  'linea_monto',
  'categoria',
  'deudor',
];

export function armarCsv(hechos: Hechos, hoy: string): ArchivoExportado {
  const categorias = new Map(hechos.categorias.map((c) => [c.id as string, c.nombre]));
  const deudores = new Map(hechos.deudores.map((d) => [d.id as string, d.nombre]));
  const lineasDe = new Map<string, (typeof hechos.lineas)[number][]>();
  for (const l of hechos.lineas) {
    const g = lineasDe.get(l.transaccionId) ?? [];
    g.push(l);
    lineasDe.set(l.transaccionId, g);
  }
  const filas: string[] = [ENCABEZADO.join(',')];
  for (const t of [...hechos.transacciones].sort(porOrden)) {
    const base = [
      t.id,
      t.fecha,
      t.tipo,
      celdaTexto(t.comercio),
      celdaTexto(t.nota),
      montoExportado(t.total),
    ];
    const lineas = [...(lineasDe.get(t.id) ?? [])].sort((a, b) => a.orden - b.orden);
    if (lineas.length === 0) filas.push([...base, '', '', '', ''].join(','));
    for (const l of lineas) {
      filas.push(
        [
          ...base,
          String(l.orden),
          montoExportado(l.monto),
          celdaTexto(l.categoriaId === null ? null : categorias.get(l.categoriaId)),
          celdaTexto(l.deudorId === null ? null : deudores.get(l.deudorId)),
        ].join(','),
      );
    }
  }
  return {
    nombre: `finn-transacciones-${hoy}.csv`,
    tipoMime: 'text/csv; charset=utf-8',
    contenido: `${filas.join('\r\n')}\r\n`,
  };
}
