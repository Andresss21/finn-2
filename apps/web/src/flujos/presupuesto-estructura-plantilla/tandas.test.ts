// Contenido y reparto en tandas de la plantilla (FT-04; 06 §3.9.1 y §3.9.2). Son datos y un reparto puros: sin red, sin reloj.
import { describe, expect, it } from 'vitest';
import { plantilla } from '../../textos/plantilla';
import { tamanoDeTanda, tandas } from './tandas';

const elementos = plantilla.grupos.flatMap((g) => [g.nombre, ...g.categorias]);

describe('PRU-DOM-INICIO', () => {
  it('PRU-DOM-INICIO-101 [CA-04.2] la plantilla tiene los 11 grupos y las 36 categorías de 3.9.2, sin "Pagos de tarjeta" y sin repetir nombres dentro de un grupo', () => {
    expect(plantilla.grupos.map((g) => g.nombre)).toEqual([
      'Vivienda',
      'Vida diaria',
      'Transporte',
      'Comida fuera',
      'Salud',
      'Suscripciones',
      'Familia y compromisos',
      'Educación',
      'Entretenimiento',
      'Finanzas',
      'Ahorro',
    ]);
    expect(plantilla.grupos.map((g) => g.categorias.length)).toEqual([
      6, 5, 4, 2, 2, 2, 4, 2, 3, 3, 3,
    ]);
    expect(plantilla.grupos.flatMap((g) => g.categorias)).toHaveLength(36);
    expect(elementos).toHaveLength(47);
    expect(elementos.map((n) => n.toLowerCase())).not.toContain('pagos de tarjeta');
    for (const g of plantilla.grupos)
      expect(new Set(g.categorias.map((c) => c.toLowerCase())).size).toBe(g.categorias.length);
  });

  it('PRU-DOM-INICIO-102 [CA-04.4] 47 elementos van en 4 tandas de 12, 12, 12 y 11 en el mismo orden; al seguir, los 35 que faltan van en 3 tandas', () => {
    const todas = tandas(elementos, 47);
    expect(todas.map((t) => t.length)).toEqual([12, 12, 12, 11]);
    expect(todas.flat()).toEqual(elementos);
    const faltan = elementos.slice(12);
    expect(faltan).toHaveLength(35);
    expect(tandas(faltan, 47).map((t) => t.length)).toEqual([12, 12, 11]);
  });

  it('PRU-DOM-INICIO-103 ninguna tanda pasa de 15 elementos y hasta 36 elementos se reparten en 3', () => {
    expect(tamanoDeTanda(47)).toBe(12);
    expect(
      tandas(
        Array.from({ length: 36 }, (_, i) => i),
        36,
      ).map((t) => t.length),
    ).toEqual([12, 12, 12]);
    for (const total of [1, 2, 9, 36, 37, 47, 60, 61, 120])
      expect(
        Math.max(
          ...tandas(
            Array.from({ length: total }, (_, i) => i),
            total,
          ).map((t) => t.length),
        ),
      ).toBeLessThanOrEqual(15);
    expect(tandas([], 47)).toEqual([]);
  });
});
