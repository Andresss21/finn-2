// Pruebas de tools/plan/estado.ts (DT-04, 08 §1.4) sobre un plan y un estado en memoria: no leen el repositorio ni git.
import { describe, expect, it } from 'vitest';
import { leerFichas } from './encargo.ts';
import { verificarEstado } from './estado.ts';

const ficha = (id: string, depende: string): string =>
  [`#### ${id} Ficha de prueba`, '```tarea', `depende: ${depende}`, '```', ''].join('\n');
const fichas = leerFichas(
  [ficha('TA-001', '—'), ficha('TA-002', 'TA-001'), ficha('TA-003', 'TA-002')].join('\n'),
);
const base = {
  'TA-001': { estado: 'pendiente' },
  'TA-002': { estado: 'pendiente' },
  'TA-003': { estado: 'pendiente' },
};
const grupo = { estado: 'terminada', rama: 'ht-11-entrega-4', pr: 7 };
const s5 = (e: Record<string, { estado: string; rama?: string; pr?: number }>): string[] =>
  verificarEstado(e, { fichas, base, rama: 'ht-11-entrega-4', d06: '' })
    .filter((h) => h.codigo === 'S5-dependencia')
    .map((h) => h.detalle);

// TA-002 no se ampara en TA-001 (otro pr u otra rama) y TA-003 no se ampara en TA-002
const ambas = [
  'TA-002 está terminada y TA-001 no está terminada en la base',
  'TA-003 está terminada y TA-002 no está terminada en la base',
];

describe('PRU-SEG-OPER', () => {
  it('PRU-SEG-OPER-124 [S5] CH-249: S5 acepta una dependencia que queda terminada en el mismo diff con el mismo pr y la misma rama; con otro pr, otra rama o en curso sigue fallando', () => {
    // Grupo en un PR: TA-001 → TA-002 → TA-003, las tres terminadas con el PR 7 en la rama del PR
    expect(s5({ 'TA-001': grupo, 'TA-002': grupo, 'TA-003': grupo })).toEqual([]);
    // Misma rama, otro pr
    expect(s5({ 'TA-001': grupo, 'TA-002': { ...grupo, pr: 8 }, 'TA-003': grupo })).toEqual(ambas);
    // Mismo pr, otra rama
    expect(
      s5({ 'TA-001': grupo, 'TA-002': { ...grupo, rama: 'ta-002-otra' }, 'TA-003': grupo }),
    ).toEqual(ambas);
    // Dependencia en curso en el diff
    expect(
      s5({
        'TA-001': grupo,
        'TA-002': { estado: 'en_curso', rama: 'ht-11-entrega-4' },
        'TA-003': grupo,
      }),
    ).toEqual([
      'TA-002 está en_curso y TA-001 no está terminada en la base',
      'TA-003 está terminada y TA-002 no está terminada en la base',
    ]);
    // Una dependencia pendiente sigue fallando
    expect(s5({ 'TA-001': { estado: 'pendiente' }, 'TA-002': grupo, 'TA-003': grupo })).toEqual([
      'TA-002 está terminada y TA-001 no está terminada en la base',
    ]);
  });
});
