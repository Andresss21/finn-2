// PRU-SEG-OPER-105 (TA-015, DT-27, CH-08): M18, los CA pendientes de punta a punta de pruebas/pendientes-e2e.json.
// Usa CA y fichas reales de docs/06: CA-03.3 lo completa FT-34 ([I]) y CA-09.11 lo completa FT-28 ([M]).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { verificar } from './matriz.ts';
import type { Entradas } from './matriz.ts';
import { lineasResumen, resumenPendientes } from './pendientes.ts';
import type { Pendiente } from './pendientes.ts';

const doc = (n: string): string =>
  readFileSync(new URL(`../../docs/${n}`, import.meta.url), 'utf8');
const E2E = 'apps/web/e2e/pendientes.e2e.ts';
const base = (pendientes: Pendiente[], features: Entradas['features']): Entradas => ({
  d01: doc('01-dominio.md'),
  d04: doc('04-backend.md'),
  d05: doc('05-frontend.md'),
  d06: doc('06-features.md'),
  inventario: [
    { titulo: 'PRU-INT-PRES-101 [CA-03.3] con el estado sembrado', archivo: 'x.int.test.ts' },
  ],
  features,
  pendientes,
  mapa: [],
  manuales: '',
  resultadosManuales: '',
  previas: null,
  cuarentena: [],
  hoy: '2027-03-01',
  puerta: false,
  codigo: [],
});
const m18 = (e: Entradas): string[] => verificar(e).errores.filter((x) => x.startsWith('M18 '));
const conE2E = (e: Entradas, ca: string): Entradas => {
  e.inventario.push({ titulo: `PRU-E2E-PROG-101 [${ca}] de punta a punta`, archivo: E2E });
  return e;
};
const P33: Pendiente = { ca: 'CA-03.3', completa: 'FT-34' };
const P911: Pendiente = { ca: 'CA-09.11', completa: 'FT-28' };

describe('PRU-SEG-OPER', () => {
  it('PRU-SEG-OPER-105 [M18] pendientes de punta a punta (DT-27, CH-08): pruebas:matriz lee pruebas/pendientes-e2e.json, exige la ficha que completa cada CA y su E2E al terminarla, y --puerta falla con un pendiente de una ficha que no es [P]', () => {
    // El archivo del repositorio existe y es una lista de pendientes bien formados (vacía antes de la primera tarea de B6)
    const real: unknown = JSON.parse(
      readFileSync(new URL('../../pruebas/pendientes-e2e.json', import.meta.url), 'utf8'),
    );
    expect(Array.isArray(real)).toBe(true);
    for (const p of real as Pendiente[]) {
      expect(p.ca).toMatch(/^CA-\d{2}\.\d{1,2}$/);
      expect(p.completa).toMatch(/^FT-\d{2}$/);
    }

    // Abierto y bien marcado: pasa, y la matriz lo muestra con la ficha que lo completa
    const abierto = base([P33], { 'FT-03': 'terminada', 'CA-03.3': 'pendiente_e2e' });
    const r = verificar(abierto);
    expect(r.errores.filter((x) => x.startsWith('M18 '))).toEqual([]);
    expect(r.avisos).toContain('M18 CA-03.3 (FT-03) pendiente de punta a punta: lo completa FT-34');

    // Un CA pendiente sin la ficha que lo completa, o con una que no existe
    expect(m18(base([{ ca: 'CA-03.3', completa: '' }], { 'CA-03.3': 'pendiente_e2e' }))).toEqual([
      'M18 CA-03.3 en pruebas/pendientes-e2e.json no dice qué ficha lo completa',
    ]);
    expect(
      m18(base([{ ca: 'CA-03.3', completa: 'FT-99' }], { 'CA-03.3': 'pendiente_e2e' })),
    ).toEqual(['M18 CA-03.3 lo completa FT-99, que no tiene ficha en 06']);
    // El CA tiene que existir y ser de una ficha [I], y no completarlo su propia ficha
    expect(m18(base([{ ca: 'CA-03.99', completa: 'FT-34' }], {}))).toEqual([
      'M18 pruebas/pendientes-e2e.json cita CA-03.99, que no existe en 06',
    ]);
    expect(
      m18(base([{ ca: 'CA-28.1', completa: 'FT-34' }], { 'CA-28.1': 'pendiente_e2e' })),
    ).toEqual([
      'M18 CA-28.1 es de FT-28 [M]: solo un CA de una ficha [I] queda pendiente de punta a punta',
    ]);
    expect(
      m18(base([{ ca: 'CA-03.3', completa: 'FT-03' }], { 'CA-03.3': 'pendiente_e2e' })),
    ).toEqual(['M18 CA-03.3 no puede completarlo su propia ficha (FT-03)']);
    expect(m18(base([P33, P33], { 'CA-03.3': 'pendiente_e2e' }))).toEqual([
      'M18 CA-03.3 aparece 2 veces en pruebas/pendientes-e2e.json',
    ]);

    // features.json marca el CA como pendiente_e2e mientras la ficha que lo completa no está terminada
    expect(m18(base([P33], { 'FT-03': 'terminada' }))).toEqual([
      'M18 CA-03.3 es pendiente de punta a punta: pruebas/features.json lo marca "pendiente_e2e" hasta que FT-34 esté terminada',
    ]);
    expect(m18(base([], { 'CA-03.3': 'pendiente_e2e' }))).toEqual([
      'M18 pruebas/features.json marca CA-03.3 como "pendiente_e2e" y no está en pruebas/pendientes-e2e.json',
    ]);
    expect(m18(base([P33], { 'CA-03.3': 'terminada' }))).toContain(
      'M18 pruebas/features.json marca CA-03.3 como "terminada": un CA solo admite "pendiente_e2e"',
    );

    // Cierre: la ficha que lo completa en terminada con su E2E y sin la marca pasa
    expect(m18(conE2E(base([P33], { 'FT-34': 'terminada' }), 'CA-03.3'))).toEqual([]);
    // ... y en terminada con la E2E, la marca sobra
    expect(
      m18(conE2E(base([P33], { 'FT-34': 'terminada', 'CA-03.3': 'pendiente_e2e' }), 'CA-03.3')),
    ).toEqual(['M18 CA-03.3 ya lo cerró FT-34: quitá "pendiente_e2e" de pruebas/features.json']);

    // Puerta: un pendiente de una ficha [P] no la cierra
    const deP = base([{ ca: 'CA-03.3', completa: 'FT-56' }], { 'CA-03.3': 'pendiente_e2e' });
    deP.puerta = true;
    expect(m18(deP)).toEqual([]);
  });

  it('PRU-SEG-OPER-105 [M18] control: la ficha que completa un pendiente pasa a terminada sin la E2E', () => {
    const e = base([P33], { 'FT-34': 'terminada' });
    // Una prueba que no es E2E no alcanza, ni una E2E en cuarentena
    e.inventario.push({
      titulo: 'PRU-INT-PROG-101 [CA-03.3] sin pantalla',
      archivo: 'y.int.test.ts',
    });
    const sin =
      'M18 FT-34 está terminada y no tiene una E2E que cite CA-03.3 (pendiente de punta a punta de FT-03)';
    expect(m18(e)).toEqual([sin]);
    conE2E(e, 'CA-03.3');
    e.cuarentena.push({
      id: 'PRU-E2E-PROG-101',
      motivo: 'inestable',
      desde: '2027-02-25',
      vence: '2027-03-11',
    });
    expect(m18(e)).toEqual([sin]);
  });

  it('PRU-SEG-OPER-105 [M18] control: la puerta con un pendiente de una ficha [M] falla', () => {
    const e = base([P911], { 'CA-09.11': 'pendiente_e2e' });
    expect(m18(e)).toEqual([]); // incremental: es un aviso
    e.puerta = true;
    expect(m18(e)).toEqual([
      'M18 CA-09.11 sigue pendiente de punta a punta: lo completa FT-28 [M], y la puerta solo admite pendientes de fichas [P]',
    ]);
  });

  it('PRU-SEG-OPER-105 [M18] resumen de pr:mergear: los pendientes que el PR abre y cierra', () => {
    const antes = {
      pendientes: [P33],
      features: { 'CA-03.3': 'pendiente_e2e' } as Entradas['features'],
    };
    const despues = {
      pendientes: [P33, P911],
      features: { 'FT-34': 'terminada', 'CA-09.11': 'pendiente_e2e' } as Entradas['features'],
    };
    const r = resumenPendientes(antes, despues);
    expect(r).toEqual({ abre: [P911], cierra: [P33] });
    expect(lineasResumen(r)).toEqual([
      'pendientes de punta a punta: abre 1, cierra 1',
      '  abre   CA-09.11 (lo completa FT-28)',
      '  cierra CA-03.3 (lo completa FT-34)',
    ]);
    // Quitar la entrada también la cierra; sin cambios, una sola línea
    expect(resumenPendientes(antes, { pendientes: [], features: {} }).cierra).toEqual([P33]);
    expect(lineasResumen(resumenPendientes(antes, antes))).toEqual([
      'pendientes de punta a punta: ninguno abierto ni cerrado por este PR',
    ]);
  });
});
