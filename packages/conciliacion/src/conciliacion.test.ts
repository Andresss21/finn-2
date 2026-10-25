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
    // Los dos "Detalle de Estado Bancario" se distinguen por la segunda firma (PRU-DOM-CONC-102).
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

  it('PRU-DOM-CONC-102 [CONC-BAC-debito, CONC-Agricola, ⚠ S6-1] cada adaptador extrae fecha, monto, descripción, fecha del estado y saldo final; cero o dos firmas se rechazan', () => {
    // Muestras SINTÉTICAS (TU-13 y TU-14 pendientes).
    const bacDebito = [
      'Detalle de Estado Bancario',
      'Fecha de corte,30/09/2026',
      'Saldo Inicial,"1,000.00"',
      'Saldo Final,"1,234.50"',
      'Fecha,Descripcion,Referencia,Debito,Credito',
      '05/09/2026,RETIRO  ATM,R1,50.00,',
      '20/09/2026,DEPOSITO PLANILLA,,,"284.50"',
      '',
    ].join('\n');
    expect(leerEstado(bytes(bacDebito))).toEqual({
      formato: 'bac_debito',
      fechaEstado: '2026-09-30',
      saldoFinal: 123_450,
      movimientos: [
        {
          indice: 0,
          fecha: '2026-09-05',
          monto: -5_000,
          descripcion: 'RETIRO ATM',
          referencia: 'R1',
        },
        { indice: 1, fecha: '2026-09-20', monto: 28_450, descripcion: 'DEPOSITO PLANILLA' },
      ],
    });

    const agricolaDebito = [
      'Detalle de Estado Bancario',
      'Fecha de corte,30/09/2026',
      'Saldo Final,75.25',
      'Fecha,Descripcion,Referencia de Transaccion,Cargos,Abonos',
      '02/09/2026,COMPRA POS,T-9,24.75,',
      '10/09/2026,TRANSFERENCIA RECIBIDA,T-10,,100.00',
    ].join('\n');
    expect(leerEstado(bytes(agricolaDebito))).toEqual({
      formato: 'ba_debito',
      fechaEstado: '2026-09-30',
      saldoFinal: 7_525,
      movimientos: [
        {
          indice: 0,
          fecha: '2026-09-02',
          monto: -2_475,
          descripcion: 'COMPRA POS',
          referencia: 'T-9',
        },
        {
          indice: 1,
          fecha: '2026-09-10',
          monto: 10_000,
          descripcion: 'TRANSFERENCIA RECIBIDA',
          referencia: 'T-10',
        },
      ],
    });

    const portal = [
      'Fecha de corte,25/09/2026',
      'Saldo al corte,"310.00"',
      'Autorizacion,Fecha Transaccion,Fecha Aplicada,Concepto,Cargos ($),Abonos ($)',
      '123456,01/09/2026,02/09/2026,RESTAURANTE  LA PALMA,35.00,',
      '654321,15/09/2026,15/09/2026,PAGO TARJETA,,200.00',
    ].join('\n');
    expect(leerEstado(bytes(portal))).toEqual({
      formato: 'ba_tarjeta_portal',
      fechaEstado: '2026-09-25',
      saldoFinal: -31_000,
      movimientos: [
        {
          indice: 0,
          fecha: '2026-09-01',
          monto: -3_500,
          descripcion: 'RESTAURANTE LA PALMA',
          referencia: '123456',
        },
        {
          indice: 1,
          fecha: '2026-09-15',
          monto: 20_000,
          descripcion: 'PAGO TARJETA',
          referencia: '654321',
        },
      ],
    });

    const pdf = [
      'Estado de cuenta convertido,pagina 1',
      'Fecha de corte,25/09/2026',
      'Saldo final,"1,310.00"',
      'VT0001,03/09/2026,FARMACIA  CENTRO,"1,010.00"',
      'VT0002,18/09/2026,ABONO EN LINEA,300.00CR',
    ].join('\n');
    expect(leerEstado(bytes(pdf))).toEqual({
      formato: 'ba_tarjeta_pdf_csv',
      fechaEstado: '2026-09-25',
      saldoFinal: -131_000,
      movimientos: [
        {
          indice: 0,
          fecha: '2026-09-03',
          monto: -101_000,
          descripcion: 'FARMACIA CENTRO',
          referencia: 'VT0001',
        },
        {
          indice: 1,
          fecha: '2026-09-18',
          monto: 30_000,
          descripcion: 'ABONO EN LINEA',
          referencia: 'VT0002',
        },
      ],
    });

    // Dos firmas a la vez (las dos de "Detalle de Estado Bancario") o ninguna: rechazo.
    expect(
      leerEstado(
        bytes('Detalle de Estado Bancario\nSaldo Inicial,1\nReferencia de Transacción,1\n'),
      ),
    ).toEqual({ error: 'formato_ambiguo' });
    expect(leerEstado(bytes('Detalle de Estado\nSaldo,1\n'))).toEqual({
      error: 'formato_no_reconocido',
    });

    // Filas inválidas con su número.
    expect(leerEstado(bytes(bacDebito.replace('50.00', 'x')))).toMatchObject({
      error: 'fila_invalida',
      fila: 6,
    });
    expect(leerEstado(bytes(pdf.replace('18/09/2026', '31/02/2026')))).toMatchObject({
      error: 'fila_invalida',
      fila: 5,
    });
  });
});
