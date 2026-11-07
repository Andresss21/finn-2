// FT-67 Hallazgos accionables, CA-67.1 (06 §3.5.11): de 8 hallazgos posibles en 6 claves quedan 5, uno por clave, por impacto descendente.
import { describe, expect, it } from 'vitest';
import { Centavos } from '../../valores/centavos';
import { type Hallazgo, ordenarHallazgos } from './hallazgos';

const c = Centavos.desdeEntero;
const h = (tipo: Hallazgo['tipo'], clave: string, impacto: number) => ({
  tipo,
  clave,
  impacto: c(impacto),
});

describe('PRU-DOM-REP', () => {
  it('PRU-DOM-REP-230 [FT-67, CA-67.1] con 8 hallazgos en 6 claves queda uno por clave (el de mayor impacto; el promedio cede), por impacto descendente y solo 5', () => {
    const o = ordenarHallazgos([
      h('promedio', 'categoria:rest', 9000),
      h('ritmo', 'categoria:rest', 5556),
      h('realidad', 'categoria:gas', 4000),
      h('hormiga', 'categoria:cafe', 3000),
      h('tarjeta', 'tarjeta:visa', 7000),
      h('suscripcion', 'comercio:netflix', 1549),
      h('hormiga', 'comercio:uber', 2000),
      h('realidad', 'categoria:ocio', 100),
    ]);
    expect(o.map((x) => [x.tipo, x.clave])).toEqual([
      ['tarjeta', 'tarjeta:visa'],
      ['ritmo', 'categoria:rest'],
      ['realidad', 'categoria:gas'],
      ['hormiga', 'categoria:cafe'],
      ['hormiga', 'comercio:uber'],
    ]);
    expect(o.map((x) => x.impacto)).toEqual([7000, 5556, 4000, 3000, 2000].map(c));
  });

  it('PRU-DOM-REP-231 [FT-67] a igual clave e impacto queda el de menor orden de tipo: el de ritmo gana al de promedio', () => {
    const o = ordenarHallazgos([
      h('promedio', 'categoria:rest', 5556),
      h('ritmo', 'categoria:rest', 5556),
    ]);
    expect(o.map((x) => x.tipo)).toEqual(['ritmo']);
  });

  it('PRU-DOM-REP-232 [FT-67, CA-67.2] con A.7, Restaurantes con ritmo de $55.56 y promedio de $63.61 queda con el de ritmo', () => {
    const o = ordenarHallazgos([
      h('promedio', 'categoria:rest', 6361),
      h('ritmo', 'categoria:rest', 5556),
    ]);
    expect(o.map((x) => [x.tipo, x.impacto])).toEqual([['ritmo', c(5556)]]);
  });
});
