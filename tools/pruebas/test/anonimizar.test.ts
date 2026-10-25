// PRU-SEG-BAND-002 (TA-180, 07 §23, CH-03): las muestras del repositorio no tienen números de tarjeta ni
// los últimos 4 reales, y anonimizar.ts hace los reemplazos de 07 §23 y escribe muestras-cobertura.json.
// Todos los datos son inventados y evidentemente falsos: 1111/2222/3333 como últimos 4, 1234567890123
// como número largo y "MARIA EJEMPLO" como nombre. FINN_ULTIMOS4_REALES solo existe en CI (TU-12).
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  anonimizarTexto,
  archivosDeMuestras,
  clasificarSms,
  ejecutar,
  leerUltimos4,
  revisar,
} from '../anonimizar.ts';

const raiz = fileURLToPath(new URL('../../../', import.meta.url));
const ULTIMOS4 = ['1111', '2222', '3333'];
const NOMBRES = [['MARIA EJEMPLO', 'M. EJEMPLO'], ['JUAN PRUEBA']];
const config = { ultimos4: ULTIMOS4, nombres: NOMBRES };

const SMS_CRUDO =
  'BAC: VISA 2222: MARIA EJEMPLO, has realizado una compra por USD 1,250.40 en el comercio: SUPER X 2026/10/05 ref 987654321';
const CSV_CRUDO = [
  'Product,Tarjeta ****1111',
  'Titular,Juan Prueba',
  'Fecha de corte,05/10/2026',
  'Saldo final,1234.56',
  'Date,Description,Reference,Amount',
  '01/10/2026,PAGO DE M. EJEMPLO,1234567890123,-25.00',
  '02/10/2026,COMPRA 20261002,200-123456-7,12.5',
  '',
].join('\r\n');

const temporales: string[] = [];
function carpeta(): string {
  const d = mkdtempSync(join(tmpdir(), 'finn-anonimizar-'));
  temporales.push(d);
  return d;
}
afterEach(() => {
  for (const d of temporales.splice(0)) rmSync(d, { recursive: true, force: true });
});

function privado(archivos: Record<string, string | Uint8Array>): string {
  const d = carpeta();
  for (const [ruta, contenido] of Object.entries(archivos)) {
    mkdirSync(join(d, ruta, '..'), { recursive: true });
    writeFileSync(join(d, ruta), contenido);
  }
  return d;
}

describe('PRU-SEG-BAND', () => {
  it('PRU-SEG-BAND-002 [CH-03, SP-01-anonimizar] ninguna muestra del repositorio tiene 13 a 19 dígitos seguidos ni unos últimos 4 de FINN_ULTIMOS4_REALES', () => {
    const ultimos4 = leerUltimos4(process.env['FINN_ULTIMOS4_REALES'] ?? '');
    for (const archivo of archivosDeMuestras(raiz))
      expect(revisar(readFileSync(archivo, 'latin1'), ultimos4), archivo).toEqual([]);
  });

  it('PRU-SEG-BAND-002 [CH-03, SP-01-anonimizar] control: una muestra sin anonimizar falla', () => {
    const hallazgos = revisar(CSV_CRUDO, ULTIMOS4);
    expect(hallazgos).toContain('línea 1: últimos 4 reales 1111');
    expect(hallazgos).toContain('línea 6: secuencia de 13 dígitos');
    expect(revisar(SMS_CRUDO, ULTIMOS4)).toEqual(['línea 1: últimos 4 reales 2222']);
    expect(revisar('ref 12345678901234567890', [])).toEqual(['línea 1: secuencia de 20 dígitos']);
    // Un 4 dentro de un número más largo no es un "últimos 4"; 12 dígitos todavía no es tarjeta.
    expect(revisar('fecha 20221111 cuenta 123456789012', ULTIMOS4)).toEqual([]);
  });

  it('PRU-SEG-BAND-002 [CH-03, SP-01-anonimizar] reemplazos de 07 §23: últimos 4 a 0000..0009, personas, cuentas y referencias a ceros; montos y fechas intactos', () => {
    const sms = anonimizarTexto(SMS_CRUDO, config).texto;
    expect(sms).toBe(
      'BAC: VISA 0001: PERSONA A, has realizado una compra por USD 1,250.40 en el comercio: SUPER X 2026/10/05 ref 000000000',
    );
    const csv = anonimizarTexto(CSV_CRUDO, config).texto;
    expect(csv.split('\r\n')).toEqual([
      'Product,Tarjeta ****0000',
      'Titular,PERSONA B',
      'Fecha de corte,05/10/2026',
      'Saldo final,1234.56',
      'Date,Description,Reference,Amount',
      '01/10/2026,PAGO DE PERSONA A,0000000000000,-25.00',
      '02/10/2026,COMPRA 20261002,000-000000-0,12.5',
      '',
    ]);
    // La tarjeta con espacios y la fecha AAAAMMDD de los SMS del BAC.
    expect(anonimizarTexto('tarjeta 1234 5678 9012 3333 el 20261005', config).texto).toBe(
      'tarjeta 0000 0000 0000 0002 el 20261005',
    );
    // Unos últimos 4 enmascarados que no están en la lista no se adivinan: se detiene.
    expect(() => anonimizarTexto('VISA ****9876 compra', config)).toThrow(/9876/);
  });

  it('PRU-SEG-BAND-002 [CH-03, SP-01-anonimizar] clasifica los SMS por tipo, con "tipo:" como corrección explícita', () => {
    expect(clasificarSms('has realizado una compra por USD 5.00')).toEqual({
      tipo: 'compra',
      texto: 'has realizado una compra por USD 5.00',
    });
    expect(clasificarSms('Transaccion RECHAZADA por USD 5.00').tipo).toBe('rechazo');
    expect(clasificarSms('Devolucion de compra USD 5.00').tipo).toBe('devolucion');
    expect(clasificarSms('Se aplico su pago de USD 5.00').tipo).toBe('pago_tarjeta');
    expect(clasificarSms('Hola').tipo).toBe('sin_clasificar');
    expect(clasificarSms('tipo: avance\nRetiro USD 5.00')).toEqual({
      tipo: 'avance',
      texto: 'Retiro USD 5.00',
    });
  });

  it('PRU-SEG-BAND-002 [CH-03, SP-01-anonimizar] ejecutar escribe solo las salidas anonimizadas y muestras-cobertura.json por institución y formato', async () => {
    const csv1252 = Uint8Array.from([
      ...Buffer.from('Titular,JUAN PRUEBA\r\nDescripci'),
      0xf3,
      0x6e,
    ]);
    const entrada = privado({
      'nombres.txt': '# una persona por línea\nMARIA EJEMPLO | M. EJEMPLO\nJUAN PRUEBA\n',
      'sms/bac.txt': `${SMS_CRUDO}\n\ntipo: deposito\nAbono a cuenta 000123456789 USD 10.00\n`,
      // 12 dígitos de referencia: los 13 del control quedarían en 13 ceros y no pasarían.
      'csv/bac_tarjeta septiembre 1111.csv': CSV_CRUDO.replace('1234567890123', '123456789012'),
      'csv/bac_debito.csv': csv1252,
    });
    const repo = carpeta();
    const r = await ejecutar(entrada, repo, '1111, 2222,3333');

    const sms = readFileSync(join(repo, 'packages/sms/pruebas/muestras/bac.txt'), 'utf8');
    expect(sms).toContain('VISA 0001: PERSONA A');
    expect(sms).toContain('Abono a cuenta 000000000000 USD 10.00');
    expect(sms).not.toContain('tipo:');
    const dir = join(repo, 'packages/conciliacion/pruebas/muestras');
    // El nombre de salida no conserva el del archivo privado (podría tener números de cuenta).
    expect(existsSync(join(dir, 'bac_tarjeta-01.csv'))).toBe(true);
    // Windows-1252 se vuelve a escribir en Windows-1252 (04 §9.3).
    expect([...readFileSync(join(dir, 'bac_debito-01.csv'))].slice(-2)).toEqual([0xf3, 0x6e]);
    expect(readFileSync(join(dir, 'bac_debito-01.csv'), 'latin1')).toContain('PERSONA B');

    const cobertura: unknown = JSON.parse(
      readFileSync(join(repo, 'pruebas/muestras-cobertura.json'), 'utf8'),
    );
    expect(cobertura).toEqual({
      sms: [
        {
          institucion: 'BAC',
          archivo: 'packages/sms/pruebas/muestras/bac.txt',
          tipos: { compra: 1, deposito: 1 },
        },
      ],
      csv: [
        {
          formato: 'bac_debito',
          institucion: 'BAC',
          archivos: ['packages/conciliacion/pruebas/muestras/bac_debito-01.csv'],
        },
        {
          formato: 'bac_tarjeta',
          institucion: 'BAC',
          archivos: ['packages/conciliacion/pruebas/muestras/bac_tarjeta-01.csv'],
        },
      ],
    });
    expect(r.escritos).toHaveLength(4);
    for (const archivo of archivosDeMuestras(repo))
      expect(revisar(readFileSync(archivo, 'latin1'), ULTIMOS4)).toEqual([]);

    // Una segunda corrida con solo Banco Agrícola (TU-14) conserva la cobertura del BAC.
    const agricola = privado({ 'nombres.txt': '', 'sms/agricola.txt': 'Compra (3333) USD 2.00' });
    await ejecutar(agricola, repo, '1111,2222,3333');
    const despues = JSON.parse(
      readFileSync(join(repo, 'pruebas/muestras-cobertura.json'), 'utf8'),
    ) as { sms: { institucion: string }[]; csv: unknown[] };
    expect(despues.sms.map((s) => s.institucion)).toEqual(['BAC', 'Banco Agrícola']);
    expect(despues.csv).toHaveLength(2);
  });

  it('PRU-SEG-BAND-002 [CH-03, SP-01-anonimizar] ejecutar se detiene sin escribir nada ante una salida que no pasaría el control o una entrada incompleta', async () => {
    const repo = carpeta();
    const base = { 'nombres.txt': '', 'sms/bac.txt': 'compra USD 1.00' };
    // 16 dígitos a ceros siguen siendo 16 dígitos: el control fallaría, así que no se escribe.
    const larga = privado({ ...base, 'csv/bac_tarjeta.csv': 'ref,1234567890123456\n' });
    await expect(ejecutar(larga, repo, '1111')).rejects.toThrow(/secuencia de 16 dígitos/);
    expect(archivosDeMuestras(repo)).toEqual([]);
    expect(existsSync(join(repo, 'pruebas/muestras-cobertura.json'))).toBe(false);

    const falla = (archivos: Record<string, string>, env: string | undefined) =>
      expect(ejecutar(privado(archivos), repo, env)).rejects;
    await falla(base, undefined).toThrow(/FINN_ULTIMOS4_REALES/);
    await falla(base, '12345').toThrow(/FINN_ULTIMOS4_REALES/);
    await falla({ 'sms/bac.txt': 'x' }, '1111').toThrow(/nombres\.txt/);
    await falla({ ...base, 'sms/otro.txt': 'x' }, '1111').toThrow(/otro\.txt/);
    await falla({ ...base, 'csv/estado.csv': 'x' }, '1111').toThrow(/estado\.csv/);
    await falla({ ...base, 'csv/bac_tarjeta.pdf': 'x' }, '1111').toThrow(/bac_tarjeta\.pdf/);
    await falla({ ...base, 'sms/bac.txt': 'VISA ****9876' }, '1111').toThrow(/9876/);
    expect(archivosDeMuestras(repo)).toEqual([]);
  });
});
