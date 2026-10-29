// El generador de volumen (07 §12.7): determinista, de los tamaños de 02 §2.2 y válido para el motor.
import { describe, expect, it } from 'vitest';
import { calcular, verificarInvariantes } from '../../../packages/dominio/src/index.ts';
import {
  conteo,
  fechaFinal,
  generarHechos,
  generarPeriodos,
  TABLAS_MOTOR,
  type OpcionesVolumen,
} from './generar.ts';

const BASE_3: OpcionesVolumen = { nivel: 'base', anios: 3, semilla: 7 };

describe('generador de volumen', () => {
  it('la misma semilla da los mismos hechos y otra semilla, otros', () => {
    const a = JSON.stringify(generarHechos(BASE_3));
    expect(JSON.stringify(generarHechos(BASE_3))).toBe(a);
    expect(JSON.stringify(generarHechos({ ...BASE_3, semilla: 8 }))).not.toBe(a);
  });

  it('un período por mes del ciclo 21, con hoy en el fin del período, y los hechos son su unión', () => {
    const periodos = generarPeriodos(BASE_3);
    expect(periodos).toHaveLength(36);
    expect(periodos[0]?.inicio).toBe('2027-01-21');
    expect(periodos[0]?.hoy).toBe('2027-02-20');
    expect(periodos[35]?.hoy).toBe(fechaFinal(BASE_3));
    for (const p of periodos) {
      for (const t of p.filas.transacciones)
        expect(t.fecha >= p.inicio && t.fecha <= p.hoy).toBe(true);
      for (const a of p.filas.asignaciones) expect(a.periodoInicio).toBe(p.inicio);
    }
    const unidas = TABLAS_MOTOR.map((t) => periodos.flatMap((p) => p.filas[t]).length);
    expect(unidas).toEqual(Object.values(conteo(generarHechos(BASE_3)).tablas));
  });

  it('el volumen base a 10 años ronda las 70.000 filas y el alto se acerca a las 200.000', () => {
    const base = conteo(generarHechos({ nivel: 'base', anios: 10, semilla: 1 }));
    const alto = conteo(generarHechos({ nivel: 'alto', anios: 10, semilla: 1 }));
    expect(base.total).toBeGreaterThan(65_000);
    expect(base.total).toBeLessThan(80_000);
    expect(alto.total).toBeGreaterThan(170_000);
    expect(alto.total).toBeLessThan(210_000);
    expect(alto.tablas['transacciones']).toBeGreaterThan(49_000);
    expect(alto.tablas['categorias']).toBe(40);
    expect(alto.tablas['tarjetas']).toBe(2);
  });

  it('el motor calcula el volumen sin violar ningún invariante', () => {
    const op: OpcionesVolumen = { nivel: 'base', anios: 2, semilla: 3 };
    const i = calcular(generarHechos(op), fechaFinal(op));
    expect(verificarInvariantes(i)).toEqual([]);
  });

  it('con el grupo de pagos sembrado no repite el grupo ni la vigencia', () => {
    const grupoPagos = '0000aaaa-0000-4000-8000-000000000001' as never;
    const h = generarHechos({ ...BASE_3, grupoPagos });
    expect(h.vigencias_ciclo).toHaveLength(0);
    expect(h.grupos.some((g) => g.claveSistema !== null)).toBe(false);
    const pagos = h.categorias.filter((c) => c.clase === 'pago');
    expect(pagos).toHaveLength(2);
    expect(pagos.every((c) => c.grupoId === grupoPagos)).toBe(true);
  });
});
