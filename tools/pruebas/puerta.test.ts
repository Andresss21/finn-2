// PRU-SEG-OPER-114 a PRU-SEG-OPER-120 (TA-485, CH-211): `pnpm pruebas:puerta`, una prueba por condición de 07 §30;
// PRU-SEG-OPER-122 (CH-219): manuales diferidas al uso diario.
// Todo sale de datos de prueba armados acá: nunca lee pruebas/manuales/resultados.md ni muestras-cobertura.json reales.
import { describe, expect, it } from 'vitest';
import { evaluar } from './puerta.ts';
import type { EntradasPuerta } from './puerta.ts';

const fila = (id: string, resultado: string, nota: string, fecha = '2026-11-05'): string =>
  `| ${id} | ${fecha} | PC con Windows | ${resultado} | Andres | abc1234 | ${nota} |`;
const EXCLUSIONES = [
  'institucion:Banco Agrícola',
  'institucion:Cuscatlán',
  'csv:ba_tarjeta_portal',
  'csv:ba_tarjeta_pdf_csv',
  'csv:ba_debito',
  'csv:cuscatlan_tarjeta',
].map((c) => `| exclusión SP-01 | ${c} | sin cuentas |`);
const FILAS = [
  fila('PRU-MAN-BAND-003', 'pasa', 'muestras del BAC'),
  fila('PRU-MAN-BAND-004', 'pasa', 'F-1 pasa la política'),
  fila('PRU-MAN-CONC-001', 'pasa', 'CSV del BAC'),
  fila('PRU-MAN-ESQ-001', 'pasa', 'H-01 a H-12; H-05 con diff vacío, sin disparador P7-12'),
  fila('PRU-MAN-BAND-001', 'pasa', 'Variante B; reintentos ante 404 verificados'),
  fila('PRU-MAN-OPER-002', 'pasa', 'motivo ensayo, mismo commit que producción'),
];
const MIGRACION =
  "UPDATE finn.formatos_bancarios\n  SET activo = false\n  WHERE nombre IN ('Banco Agrícola compra', 'Cuscatlán compra');";

/** La puerta abierta: cada prueba rompe una sola cosa sobre esta base. */
const base = (): EntradasPuerta => ({
  matriz: { errores: [], fichasConManualPendiente: [], conCorrida: true },
  diferidas: {},
  resultados: [
    '| Manual | Fecha | Dispositivo | Resultado | Quién | Versión | Nota |',
    ...FILAS,
    ...EXCLUSIONES,
  ].join('\n'),
  cobertura: {
    sms: [{ institucion: 'BAC', archivo: 'm/bac.txt', tipos: { compra: 2 } }],
    csv: [
      { formato: 'bac_debito', institucion: 'BAC', archivos: ['m/bac_debito-01.csv'] },
      { formato: 'bac_tarjeta', institucion: 'BAC', archivos: ['m/bac_tarjeta-01.csv'] },
    ],
  },
  existe: () => true,
  migraciones: [MIGRACION],
  firmas: {
    codigo: 0,
    salida: 'ok    filas de pruebas/manuales/resultados.md en abc1234 resultado\nPASA',
  },
});
const sin = (e: EntradasPuerta, texto: string): EntradasPuerta => ({
  ...e,
  resultados: e.resultados
    .split('\n')
    .filter((l) => !l.includes(texto))
    .join('\n'),
});
const con = (e: EntradasPuerta, ...filas: string[]): EntradasPuerta => ({
  ...e,
  resultados: [e.resultados, ...filas].join('\n'),
});
const c = (e: EntradasPuerta, n: number, simular = false) => {
  const r = evaluar(e, simular)[n - 1];
  if (r?.n !== n) throw new Error(`falta la condición ${n}`);
  return r;
};
const motivos = (e: EntradasPuerta, n: number, simular = false): string =>
  c(e, n, simular).motivos.join('\n');

describe('PRU-SEG-OPER pruebas:puerta', () => {
  it('PRU-SEG-OPER-114 [fila 1] los CA [I] y [M]: pasa sin errores de la matriz y con la corrida de main; falla con un error o una ficha con manual pendiente', () => {
    const e = base();
    expect(evaluar(e, false).map((x) => x.estado)).toEqual(Array(7).fill('pasa'));
    expect(c(e, 1).estado).toBe('pasa');
    const m1 = { ...e, matriz: { ...e.matriz, errores: ['M1 CA-10.1 sin prueba activa'] } };
    expect(c(m1, 1).estado).toBe('falla');
    expect(motivos(m1, 1)).toContain('M1 CA-10.1 sin prueba activa');
    // M18 es de la condición 7, no de la 1
    const m18 = {
      ...e,
      matriz: { ...e.matriz, errores: ['M18 CA-03.3 pendiente de punta a punta'] },
    };
    expect(c(m18, 1).estado).toBe('pasa');
    // Un manual pendiente espera al usuario: falla en la puerta y queda "manual pendiente" al simular
    const man = {
      ...e,
      matriz: {
        ...e.matriz,
        errores: ['M16 FT-55 con manual pendiente: PRU-MAN-CTA-001 (sin resultado)'],
        fichasConManualPendiente: ['FT-55'],
      },
    };
    expect(c(man, 1).estado).toBe('falla');
    expect(c(man, 1, true).estado).toBe('manual pendiente');
    expect(motivos(man, 1)).toContain('FT-55');
    expect(motivos(man, 1)).not.toContain('M16 FT-55'); // sin repetir el error de M16
    // Sin los informes de la última corrida verde de main (artefacto de CI, fuera del repositorio)
    const sinCorrida = { ...e, matriz: { ...e.matriz, conCorrida: false } };
    expect(c(sinCorrida, 1).estado).toBe('falla');
    expect(c(sinCorrida, 1, true).estado).toBe('manual pendiente');
    expect(motivos(sinCorrida, 1)).toContain('--resultados');
  });

  it('PRU-SEG-OPER-115 [fila 2] SP-01: pasa con los manuales, las muestras del BAC y las seis exclusiones (CH-03, CH-210); falla sin muestra ni exclusión, con F-n activo, con una clave desconocida o con M11', () => {
    const e = base();
    expect(c(e, 2).estado).toBe('pasa');
    // Un manual de SP-01 sin resultado espera al usuario; uno que falló, falla
    const sin003 = sin(e, 'PRU-MAN-BAND-003');
    expect(c(sin003, 2).estado).toBe('falla');
    expect(c(sin003, 2, true).estado).toBe('manual pendiente');
    expect(motivos(sin003, 2)).toContain('PRU-MAN-BAND-003');
    const fallo = con(e, fila('PRU-MAN-CONC-001', 'falla', 'no reconoce', '2026-11-06'));
    expect(c(fallo, 2, true).estado).toBe('falla');
    // M11: un CA ⚠ sin su prueba reescrita
    const m11 = {
      ...e,
      matriz: { ...e.matriz, errores: ['M11 CA-30.2 ⚠ (S6-1): falta la PRU-MAN'] },
    };
    expect(c(m11, 2, true).estado).toBe('falla');
    // Banco Agrícola sin SMS y sin su fila de exclusión
    const sinBa = sin(e, 'institucion:Banco Agrícola');
    expect(c(sinBa, 2).estado).toBe('falla');
    expect(c(sinBa, 2, true).estado).toBe('manual pendiente');
    expect(motivos(sinBa, 2)).toContain('SMS de Banco Agrícola');
    // Un formato de CSV sin muestras ni exclusión
    const sinCsv = sin(e, 'csv:ba_debito');
    expect(motivos(sinCsv, 2)).toContain('CSV ba_debito');
    // El BAC sin muestras de CSV (y sin exclusión)
    const sinBac = { ...e, cobertura: { sms: base().cobertura?.sms ?? [], csv: [] } };
    expect(motivos(sinBac, 2)).toContain('CSV bac_debito');
    // Una muestra que cobertura cita y no está en el repositorio
    const perdida = { ...e, existe: (r: string) => r !== 'm/bac.txt' };
    expect(c(perdida, 2, true).estado).toBe('falla');
    expect(motivos(perdida, 2)).toContain('m/bac.txt');
    // Sin muestras-cobertura.json: espera a anonimizar.ts (TU-13)
    const sinCob = { ...e, cobertura: null };
    expect(c(sinCob, 2, true).estado).toBe('manual pendiente');
    // Excluida, pero su formato SMS sigue activo según la última migración que lo toca
    const activo = {
      ...e,
      migraciones: [
        MIGRACION,
        "UPDATE finn.formatos_bancarios SET activo = true WHERE nombre = 'Cuscatlán compra';",
      ],
    };
    expect(c(activo, 2, true).estado).toBe('falla');
    expect(motivos(activo, 2)).toContain('Cuscatlán');
    const nunca = { ...e, migraciones: [] };
    expect(c(nunca, 2, true).estado).toBe('falla');
    // La clave vieja de TU-14 (csv:agricola_<formato>) no es la de anonimizar.ts (CH-210)
    const vieja = con(e, '| exclusión SP-01 | csv:agricola_tarjeta | el banco no ofrece CSV |');
    expect(c(vieja, 2, true).estado).toBe('falla');
    expect(motivos(vieja, 2)).toContain('csv:agricola_tarjeta');
    // Una exclusión sin motivo no cuenta
    const sinMotivo = con(
      sin(e, 'csv:cuscatlan_tarjeta'),
      '| exclusión SP-01 | csv:cuscatlan_tarjeta |  |',
    );
    expect(motivos(sinMotivo, 2)).toContain('CSV cuscatlan_tarjeta');
  });

  it('PRU-SEG-OPER-116 [fila 3] SP-02: pasa con PRU-MAN-ESQ-001 en "pasa" y el disparador de P7-12 en la nota; falla si su último resultado es "falla" o la nota no lo dice', () => {
    const e = base();
    expect(c(e, 3).estado).toBe('pasa');
    expect(c(sin(e, 'PRU-MAN-ESQ-001'), 3).estado).toBe('falla');
    expect(c(sin(e, 'PRU-MAN-ESQ-001'), 3, true).estado).toBe('manual pendiente');
    // Vale el último resultado: el de fecha mayor
    const despues = con(
      e,
      fila('PRU-MAN-ESQ-001', 'falla', 'H-09 lento; P7-12 sin disparar', '2026-11-06'),
    );
    expect(c(despues, 3, true).estado).toBe('falla');
    const antes = con(e, fila('PRU-MAN-ESQ-001', 'falla', 'H-09 lento', '2026-10-01'));
    expect(c(antes, 3).estado).toBe('pasa');
    const muda = con(sin(e, 'PRU-MAN-ESQ-001'), fila('PRU-MAN-ESQ-001', 'pasa', 'H-01 a H-12'));
    expect(c(muda, 3, true).estado).toBe('falla');
    expect(motivos(muda, 3)).toContain('P7-12');
  });

  it('PRU-SEG-OPER-117 [fila 4] SP-04: pasa con PRU-MAN-BAND-001 en "pasa" con la variante y los reintentos; falla sin ellos en la nota', () => {
    const e = base();
    expect(c(e, 4).estado).toBe('pasa');
    expect(c(sin(e, 'PRU-MAN-BAND-001'), 4, true).estado).toBe('manual pendiente');
    const sinVariante = con(
      sin(e, 'PRU-MAN-BAND-001'),
      fila('PRU-MAN-BAND-001', 'pasa', 'reintentos ante 404'),
    );
    expect(c(sinVariante, 4, true).estado).toBe('falla');
    expect(motivos(sinVariante, 4)).toContain('variante');
    const sinReintentos = con(
      sin(e, 'PRU-MAN-BAND-001'),
      fila('PRU-MAN-BAND-001', 'pasa', 'Variante A'),
    );
    expect(motivos(sinReintentos, 4)).toContain('reintentos');
    const fallo = con(
      e,
      fila('PRU-MAN-BAND-001', 'falla', 'Variante A; reintentos no', '2026-11-06'),
    );
    expect(c(fallo, 4, true).estado).toBe('falla');
  });

  it('PRU-SEG-OPER-118 [fila 5] firmas: pasa cuando firmas.sh (M17) pasa; falla con una fila sin firma; sin poder verificar queda pendiente al simular', () => {
    const e = base();
    expect(c(e, 5).estado).toBe('pasa');
    const mal = {
      ...e,
      firmas: {
        codigo: 1,
        salida:
          'FALLA filas de pruebas/manuales/resultados.md en 1234567 x: commit sin firma válida\nFALLA',
      },
    };
    expect(c(mal, 5, true).estado).toBe('falla');
    expect(motivos(mal, 5)).toContain('1234567');
    const noPuede = {
      ...e,
      firmas: { codigo: 2, salida: 'FALLA no existe la rama base origin/main' },
    };
    expect(c(noPuede, 5).estado).toBe('falla');
    expect(c(noPuede, 5, true).estado).toBe('manual pendiente');
    expect(motivos(noPuede, 5)).toContain('origin/main');
  });

  it('PRU-SEG-OPER-119 [fila 6] ensayo de TU-17: pasa con PRU-MAN-OPER-002 en "pasa" y motivo ensayo; sin registrar queda "manual pendiente" al simular, sin inventar el resultado', () => {
    const e = base();
    expect(c(e, 6).estado).toBe('pasa');
    const sinEnsayo = sin(e, 'PRU-MAN-OPER-002');
    expect(c(sinEnsayo, 6).estado).toBe('falla');
    expect(c(sinEnsayo, 6, true).estado).toBe('manual pendiente');
    expect(motivos(sinEnsayo, 6, true)).toContain('TU-17');
    const emergencia = con(
      sinEnsayo,
      fila('PRU-MAN-OPER-002', 'pasa', 'despliegue de emergencia real'),
    );
    expect(c(emergencia, 6, true).estado).toBe('falla');
    const fallo = con(e, fila('PRU-MAN-OPER-002', 'falla', 'ensayo: no levantó', '2026-11-06'));
    expect(c(fallo, 6, true).estado).toBe('falla');
  });

  it('PRU-SEG-OPER-120 [fila 7] pendientes de punta a punta: pasa sin errores de M18; falla con uno, también al simular', () => {
    const e = base();
    expect(c(e, 7).estado).toBe('pasa');
    const m18 = {
      ...e,
      matriz: { ...e.matriz, errores: ['M18 CA-09.11 sigue pendiente de punta a punta (FT-28)'] },
    };
    expect(c(m18, 7).estado).toBe('falla');
    expect(c(m18, 7, true).estado).toBe('falla');
    expect(motivos(m18, 7)).toContain('CA-09.11');
    // Otros errores de la matriz son de la condición 1
    const m1 = { ...e, matriz: { ...e.matriz, errores: ['M1 CA-10.1 sin prueba activa'] } };
    expect(c(m1, 7).estado).toBe('pasa');
  });
  it('PRU-SEG-OPER-122 [fila 2] CH-219: PRU-MAN-CONC-001 diferida al uso diario sin resultado no bloquea; sin diferir, o con una falla registrada, sigue bloqueando', () => {
    const sinConc = sin(base(), 'PRU-MAN-CONC-001');
    expect(c(sinConc, 2).estado).toBe('falla');
    expect(c(sinConc, 2, true).estado).toBe('manual pendiente');
    const diferida = { ...sinConc, diferidas: { 'PRU-MAN-CONC-001': 'uso diario (CH-219)' } };
    expect(c(diferida, 2).estado).toBe('pasa');
    expect(evaluar(diferida, false).map((x) => x.estado)).toEqual(Array(7).fill('pasa'));
    // Diferir una manual no exime a las demás de SP-01
    const sin003 = sin(diferida, 'PRU-MAN-BAND-003');
    expect(c(sin003, 2).estado).toBe('falla');
    expect(motivos(sin003, 2)).toContain('PRU-MAN-BAND-003 sin resultado');
    expect(motivos(sin003, 2)).not.toContain('PRU-MAN-CONC-001');
    // Una falla registrada de la diferida falla, también al simular
    const fallo = con(diferida, fila('PRU-MAN-CONC-001', 'falla', 'no reconoce', '2026-11-06'));
    expect(c(fallo, 2, true).estado).toBe('falla');
    expect(motivos(fallo, 2)).toContain('PRU-MAN-CONC-001: el último resultado');
  });
});
