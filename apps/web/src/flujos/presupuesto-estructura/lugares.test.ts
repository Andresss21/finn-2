// [CH-272] C-46: lugares, ordinales y textos de la barra «Mover» de la estructura (ESTRUCTURA-Y-COLAPSO §1.4, §1.5 y §5;
// `docs/anexos/finn-estructura/logica/estructura.js` es la especificación). La posición de OP-08 cuenta las archivadas, que la
// lista no muestra: el lugar en pantalla y el `orden` del servidor se prueban juntos.
import { describe, expect, it } from 'vitest';
import { estructura as t } from '../../textos/estructura';
import {
  lugarDeCategoria,
  lugarDeGrupo,
  moverCategoria,
  moverGrupo,
  ordinal,
  vecino,
  vecinoDeGrupo,
  type Arbol,
} from './lugares';

const cat = (id: string, nombre: string, archivada = false) => ({ id, nombre, archivada });
const grupo = (
  id: string,
  nombre: string,
  categorias: ReturnType<typeof cat>[],
  extra: { archivado?: boolean; sistema?: boolean } = {},
) => ({ id, nombre, archivado: false, sistema: false, ...extra, categorias });

/** El ejemplo de la entrega (A.7), con una archivada en Casa, un grupo archivado y Pagos de tarjeta al final. */
const A7: Arbol = [
  grupo('casa', 'Casa', [
    cat('super', 'Supermercado'),
    cat('luz', 'Luz y agua'),
    cat('vieja', 'Vieja', true),
    cat('internet', 'Internet y teléfono'),
    cat('farmacia', 'Farmacia'),
  ]),
  grupo('comida', 'Comida fuera', [cat('rest', 'Restaurantes')]),
  grupo('viejo', 'Viejo', [], { archivado: true }),
  grupo('transporte', 'Transporte', [cat('gas', 'Gasolina')]),
  grupo('ahorro', 'Ahorro', [cat('fondo', 'Fondo de emergencia'), cat('viaje', 'Viaje')]),
  grupo('pagos', 'Pagos de tarjeta', [cat('visa', 'Visa Oro')], { sistema: true }),
];
const nombres = (a: Arbol, g: string) =>
  a.find((x) => x.id === g)?.categorias.map((c) => c.id) ?? [];

describe('PRU-DOM-CATEG-801 lugares y ordinales de la estructura', () => {
  it('PRU-DOM-CATEG-801 [C-46] ordinales femeninos y masculinos: primera a décima, «{n}.ª» y «{n}.º» después, «la última» con más de dos y «la única»', () => {
    expect(ordinal(0, 4, true)).toBe('la primera');
    expect(ordinal(2, 4, true)).toBe('la tercera');
    expect(ordinal(3, 4, true)).toBe('la última');
    expect(ordinal(1, 2, true)).toBe('la segunda');
    expect(ordinal(0, 1, true)).toBe('la única');
    expect(ordinal(0, 1, false)).toBe('el único');
    expect(ordinal(4, 6, false)).toBe('el quinto');
    expect(ordinal(10, 12, true)).toBe('la 11.ª');
    expect(ordinal(10, 12, false)).toBe('el 11.º');
    expect(ordinal(11, 12, false)).toBe('el último');
  });

  it('PRU-DOM-CATEG-801 [C-46] el resumen de un grupo colapsado: «A», «A y B», «A, B y C», «A, B y {n − 2} más» y sin categorías', () => {
    expect(t.resumen(['Gasolina'])).toBe('Gasolina');
    expect(t.resumen(['Fondo de emergencia', 'Viaje'])).toBe('Fondo de emergencia y Viaje');
    expect(t.resumen(['A', 'B', 'C'])).toBe('A, B y C');
    expect(t.resumen(['Supermercado', 'Luz y agua', 'Internet y teléfono', 'Farmacia'])).toBe(
      'Supermercado, Luz y agua y 2 más',
    );
    expect(t.resumen([])).toBe('Todavía no tiene categorías.');
    expect([t.categorias(1), t.categorias(4)]).toEqual(['1 categoría', '4 categorías']);
  });

  it('PRU-DOM-CATEG-801 [C-46] CA-E-12: el lugar de Farmacia sin contar la archivada; «Subir» la deja tercera con un OP-08 cuyo `orden` cuenta la archivada, y la inversa vuelve al orden anterior', () => {
    expect(lugarDeCategoria(A7, 'farmacia')).toMatchObject({ idx: 3, n: 4 });
    const destino = vecino(A7, 'farmacia', -1);
    expect(destino).toEqual({ grupoId: 'casa', idx: 2 });
    const m = moverCategoria(A7, 'farmacia', destino ?? { grupoId: '', idx: 0 });
    expect(m?.entrada).toEqual({
      tipo: 'categoria',
      id: 'farmacia',
      orden: 4,
      esperado: { orden: 5 },
    });
    expect(m?.inversa).toEqual({
      tipo: 'categoria',
      id: 'farmacia',
      orden: 5,
      esperado: { orden: 4 },
    });
    expect(nombres(m?.despues ?? [], 'casa')).toEqual([
      'super',
      'luz',
      'vieja',
      'farmacia',
      'internet',
    ]);
    expect(m?.texto).toBe(t.movidaEnGrupo('Farmacia', 'la tercera', 'Casa'));
    expect(m?.volvio).toBe(t.volvio('Farmacia', 'la última', 'Casa'));
    expect(m?.estadoBarra).toBe(t.esDe('Farmacia', 'la tercera', 'Casa'));
  });

  it('PRU-DOM-CATEG-801 [C-46] CA-E-13: «Subir» la primera de Comida fuera la lleva al final de Casa (con `grupoId`); «Bajar» la última de Casa la lleva a la primera de Comida fuera; el primer y el último lugar no tienen vecino', () => {
    expect(vecino(A7, 'rest', -1)).toEqual({ grupoId: 'casa', idx: 4 });
    const m = moverCategoria(A7, 'rest', { grupoId: 'casa', idx: 4 });
    expect(m?.entrada).toEqual({
      tipo: 'categoria',
      id: 'rest',
      grupoId: 'casa',
      orden: 6,
      esperado: { grupoId: 'comida', orden: 1 },
    });
    expect(m?.inversa).toEqual({
      tipo: 'categoria',
      id: 'rest',
      grupoId: 'comida',
      orden: 1,
      esperado: { grupoId: 'casa', orden: 6 },
    });
    expect(m?.texto).toBe(t.movidaAGrupo('Restaurantes', 'Casa', 'la última'));
    expect(m?.volvio).toBe(t.volvio('Restaurantes', 'la única', 'Comida fuera'));
    expect(vecino(A7, 'farmacia', 1)).toEqual({ grupoId: 'comida', idx: 0 });
    // Saltea el grupo archivado y nunca llega a Pagos de tarjeta.
    expect(vecino(A7, 'rest', 1)).toEqual({ grupoId: 'transporte', idx: 0 });
    expect(vecino(A7, 'super', -1)).toBeUndefined();
    expect(vecino(A7, 'viaje', 1)).toBeUndefined();
  });

  it('PRU-DOM-CATEG-801 [C-46] CA-E-14: «Otro grupo» la deja al final del grupo elegido; el mismo lugar no es un movimiento', () => {
    const m = moverCategoria(A7, 'farmacia', { grupoId: 'ahorro', idx: 2 });
    expect(m?.entrada).toMatchObject({ grupoId: 'ahorro', orden: 3 });
    expect(nombres(m?.despues ?? [], 'ahorro')).toEqual(['fondo', 'viaje', 'farmacia']);
    expect(m?.texto).toBe(t.movidaAGrupo('Farmacia', 'Ahorro', 'la última'));
    expect(moverCategoria(A7, 'farmacia', { grupoId: 'casa', idx: 3 })).toBeUndefined();
  });

  it('PRU-DOM-CATEG-801 [C-46] un grupo sube y baja entre los grupos de usuario: el `orden` cuenta el archivado y Pagos de tarjeta, y el texto usa el ordinal masculino', () => {
    expect(lugarDeGrupo(A7, 'transporte')).toEqual({ idx: 2, n: 4 });
    expect(vecinoDeGrupo(A7, 'transporte', -1)).toBe(1);
    const m = moverGrupo(A7, 'transporte', 1);
    expect(m?.entrada).toEqual({ tipo: 'grupo', id: 'transporte', orden: 2, esperado: { orden: 4 } });
    expect(m?.inversa).toEqual({ tipo: 'grupo', id: 'transporte', orden: 4, esperado: { orden: 2 } });
    expect(m?.despues.map((g) => g.id)).toEqual([
      'casa',
      'transporte',
      'comida',
      'viejo',
      'ahorro',
      'pagos',
    ]);
    expect(m?.texto).toBe(t.grupoMovido('Transporte', 'el segundo'));
    expect(m?.volvio).toBe(t.grupoVolvio('Transporte'));
    expect(m?.estadoBarra).toBe(t.esGrupo('Transporte', 'el segundo'));
    // «Bajar» el último grupo de usuario no existe: Pagos de tarjeta queda fijo.
    expect(vecinoDeGrupo(A7, 'ahorro', 1)).toBeUndefined();
    expect(moverGrupo(A7, 'ahorro', 3)).toBeUndefined();
    expect(moverGrupo(A7, 'casa', 3)?.entrada).toMatchObject({ orden: 5 });
  });
});
