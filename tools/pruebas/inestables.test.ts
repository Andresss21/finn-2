// inestables (TA-013; 07 §7.2, §7.3; DP-11): lectura del informe de Playwright y regla de cuarentena de
// tools/pruebas/inestables.mjs, sin red ni reloj. La entrada vencida la prueba la matriz (M9, matriz.test.ts).
import { describe, expect, it } from 'vitest';
import { aCuarentena, fechas, flaky } from './inestables.mjs';

const informe = {
  suites: [
    {
      title: 'presupuesto.e2e.ts',
      specs: [
        {
          title: 'PRU-E2E-PRES-001 [CA-01.1] asigna',
          tests: [
            {
              projectName: 'movil',
              status: 'flaky',
              results: [{ attachments: [{ name: 'trace', path: 'test-results/a/trace.zip' }] }, {}],
            },
          ],
        },
        {
          title: 'PRU-E2E-PRES-002 [CA-01.2] mueve',
          tests: [{ projectName: 'movil', status: 'expected' }],
        },
      ],
      suites: [
        {
          title: 'anidada',
          specs: [
            { title: 'sin identificador', tests: [{ projectName: 'escritorio', status: 'flaky' }] },
          ],
        },
      ],
    },
  ],
};

describe('inestables: aviso y cuarentena (07 §7.3)', () => {
  it('inestables: lista solo las flaky, con identificador y traza, también en suites anidadas', () => {
    expect(flaky(informe)).toEqual([
      {
        id: 'PRU-E2E-PRES-001',
        titulo: 'PRU-E2E-PRES-001 [CA-01.1] asigna',
        proyecto: 'movil',
        traza: 'test-results/a/trace.zip',
      },
      { id: 'sin identificador', titulo: 'sin identificador', proyecto: 'escritorio', traza: null },
    ]);
    expect(flaky({})).toEqual([]);
  });

  it('inestables: el historial sale de las líneas del issue', () => {
    expect(
      fechas([
        '- PRU-X inestable el 2026-10-20 (movil)',
        null,
        'otro\n- inestable el 2026-10-24 (movil)',
      ]),
    ).toEqual(['2026-10-20', '2026-10-24']);
  });

  it('inestables: 2 veces en 7 días entra en cuarentena por 14 días; 1, o 2 separadas, no', () => {
    const hoy = new Date('2026-10-25T08:00:00Z');
    expect(aCuarentena([], 'PRU-E2E-PRES-001', ['2026-10-20', '2026-10-25'], hoy)).toEqual({
      id: 'PRU-E2E-PRES-001',
      motivo: 'inestable 2 veces en 7 días (07 §7.3)',
      desde: '2026-10-25',
      vence: '2026-11-08',
    });
    expect(aCuarentena([], 'PRU-E2E-PRES-001', ['2026-10-25'], hoy)).toBeNull();
    expect(aCuarentena([], 'PRU-E2E-PRES-001', ['2026-10-17', '2026-10-25'], hoy)).toBeNull();
    const ya = [{ id: 'PRU-E2E-PRES-001', motivo: 'x', desde: '2026-10-20', vence: '2026-11-03' }];
    expect(aCuarentena(ya, 'PRU-E2E-PRES-001', ['2026-10-24', '2026-10-25'], hoy)).toBeNull();
  });
});
