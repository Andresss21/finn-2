import { describe, expect, it } from 'vitest';
import { decodificar, leerEstado } from './index';

const enc = new TextEncoder();
const bytes = (s: string): Uint8Array => enc.encode(s);
/** Windows-1252 para el rango Latin-1 que usan los ejemplos (coincide byte a byte). */
const cp1252 = (s: string): Uint8Array => Uint8Array.from(s, (c) => c.charCodeAt(0));
const conBom = (b: Uint8Array): Uint8Array => Uint8Array.from([0xef, 0xbb, 0xbf, ...b]);

const celdas = (b: Uint8Array): string[][] => {
  const r = decodificar(b);
  if (!r.ok) throw new Error(r.error);
  return r.filas;
};

// ⚠ (S6-1): muestra SINTÉTICA, no un estado real del BAC (TU-13 pendiente).
const MUESTRA_BAC = [
  'Pro000000000000duct,VISA ****1234',
  'Fecha de corte,15/10/2026',
  'Saldo final,"1,234.50"',
  'Date,Description,Reference,Amount',
  '03/10/2026,"SUPER  SELECTOS, S.A.",000123,25.50',
  '12/10/2026,PAGO RECIBIDO,,-100.00',
  '',
].join('\n');

describe('PRU-DOM-CONC', () => {
  it('PRU-DOM-CONC-001 [V-25, ADR-17] UTF-8 con y sin BOM, Windows-1252 y ASCII dan las mismas celdas', () => {
    const contenido = 'Fecha,Descripción,Monto\n01/10/2026,"PAGO, TARJETA ÑANDÚ",10.00\n';
    const esperado = [
      ['Fecha', 'Descripción', 'Monto'],
      ['01/10/2026', 'PAGO, TARJETA ÑANDÚ', '10.00'],
    ];
    expect(celdas(bytes(contenido))).toEqual(esperado);
    expect(celdas(conBom(bytes(contenido)))).toEqual(esperado);
    expect(celdas(cp1252(contenido))).toEqual(esperado);

    const ascii = 'Fecha,Descripcion,Monto\n01/10/2026,"PAGO, TARJETA",10.00\n';
    expect(celdas(bytes(ascii))).toEqual(celdas(cp1252(ascii)));
    expect(celdas(bytes(ascii))[1]).toEqual(['01/10/2026', 'PAGO, TARJETA', '10.00']);

    expect(decodificar(bytes('%PDF-1.7\n...'))).toEqual({ ok: false, error: 'archivo_pdf' });
  });

  it('[ADR-17] el registro rechaza PDF, formatos desconocidos, ambiguos y Cuscatlán excluido', () => {
    expect(leerEstado(bytes('%PDF-1.4'))).toEqual({ error: 'archivo_pdf' });
    expect(leerEstado(bytes('a,b\n1,2\n'))).toEqual({ error: 'formato_no_reconocido' });
    expect(leerEstado(bytes('Historial de movimientos\nx,y\n'))).toEqual({
      error: 'formato_excluido',
      formato: 'cuscatlan_tarjeta',
    });
    // Dos firmas a la vez: BAC tarjeta (Date,) y Cuscatlán.
    expect(leerEstado(bytes('Historial de movimientos\nDate,x\n'))).toEqual({
      error: 'formato_ambiguo',
    });
    // Los dos "Detalle de Estado Bancario" se distinguen por la segunda firma.
    expect(leerEstado(bytes('Detalle de Estado Bancario\nSaldo Inicial,1\n'))).toEqual({
      error: 'formato_no_disponible',
      formato: 'bac_debito',
    });
    expect(leerEstado(bytes('Detalle de Estado Bancario\nReferencia de Transacción,1\n'))).toEqual({
      error: 'formato_no_disponible',
      formato: 'ba_debito',
    });
    expect(leerEstado(bytes('VT123,x\n'))).toEqual({
      error: 'formato_no_disponible',
      formato: 'ba_tarjeta_pdf_csv',
    });
  });

  it('[CONC-BAC-tarjeta, ⚠ S6-1] BAC tarjeta (muestra sintética): cargo negativo, pago positivo, deuda negativa', () => {
    expect(leerEstado(bytes(MUESTRA_BAC))).toEqual({
      formato: 'bac_tarjeta',
      fechaEstado: '2026-10-15',
      saldoFinal: -123_450,
      movimientos: [
        {
          indice: 0,
          fecha: '2026-10-03',
          monto: -2_550,
          descripcion: 'SUPER SELECTOS, S.A.',
          referencia: '000123',
        },
        { indice: 1, fecha: '2026-10-12', monto: 10_000, descripcion: 'PAGO RECIBIDO' },
      ],
    });
  });

  it('[CONC-BAC-tarjeta] filas inválidas devuelven fila_invalida con su número', () => {
    const malo = MUESTRA_BAC.replace('03/10/2026', '31/02/2026');
    expect(leerEstado(bytes(malo))).toMatchObject({ error: 'fila_invalida', fila: 5 });
    const monto = MUESTRA_BAC.replace('25.50', 'abc');
    expect(leerEstado(bytes(monto))).toMatchObject({ error: 'fila_invalida', fila: 5 });
  });
});
