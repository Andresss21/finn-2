// [CH-278] C-50 (AVISO-DE-RESULTADO §4 y §5; `docs/anexos/finn-aviso-de-resultado/logica/aviso.js`): el reloj de la etiqueta de
// resultado, con un reloj simulado que avanza a mano (07 §7.1). La duración llega de afuera, como la lee la interfaz del token.
import { describe, expect, it } from 'vitest';
import { crearEtiquetaReloj, deshacerEnFila, type EstadoReloj } from './etiqueta-tiempo';

interface R {
  readonly id: string;
}

/** Un reloj que solo avanza con `avanzar(ms)`. */
function relojSimulado() {
  let ahora = 0;
  let sig = 1;
  const pendientes = new Map<number, { en: number; f: () => void }>();
  return {
    poner: (f: () => void, ms: number) => {
      const i = sig++;
      pendientes.set(i, { en: ahora + ms, f });
      return i;
    },
    quitar: (i: number) => {
      pendientes.delete(i);
    },
    avanzar(ms: number) {
      const fin = ahora + ms;
      for (;;) {
        const proximo = [...pendientes.entries()]
          .filter(([, p]) => p.en <= fin)
          .sort((a, b) => a[1].en - b[1].en)[0];
        if (proximo === undefined) break;
        pendientes.delete(proximo[0]);
        ahora = proximo[1].en;
        proximo[1].f();
      }
      ahora = fin;
    },
  };
}

function armar(duracion: () => number | undefined = () => 3000, salida = 220) {
  const reloj = relojSimulado();
  const idos: string[] = [];
  let visto: EstadoReloj<R> | null = null;
  const e = crearEtiquetaReloj<R>({
    duracion,
    salida: () => salida,
    reloj,
    alCambiar: (x) => {
      visto = x;
    },
    alIrse: (r) => idos.push(r.id),
  });
  return { e, reloj, idos, visto: () => visto };
}

describe('PRU-DOM-VAL-880 el reloj de la etiqueta de resultado', () => {
  it('PRU-DOM-VAL-880 [C-50] CA-A-2: visible 3000 ms, después sale en lo que dura la salida y se va; con inverso queda ↶ en su fila, también mientras se va', () => {
    const { e, reloj, idos, visto } = armar();
    e.mostrar({ id: 'farmacia' }, true);
    expect(e.estado()).toMatchObject({ fase: 'visible', actual: { id: 'farmacia' } });
    expect(deshacerEnFila(e.estado(), 'farmacia')).toBe(false);
    reloj.avanzar(2999);
    expect(e.estado().fase).toBe('visible');
    reloj.avanzar(1);
    expect(e.estado().fase).toBe('saliendo');
    expect(deshacerEnFila(e.estado(), 'farmacia')).toBe(true);
    reloj.avanzar(220);
    expect(e.estado()).toMatchObject({ fase: 'nada', actual: null, ultimo: { id: 'farmacia' } });
    expect(visto()).toBe(e.estado());
    expect(idos).toEqual(['farmacia']);
    expect(deshacerEnFila(e.estado(), 'farmacia')).toBe(true);
    expect(deshacerEnFila(e.estado(), 'otra')).toBe(false);
  });

  it('PRU-DOM-VAL-880 [C-50] CA-A-3 y CA-A-4: el puntero, el foco o un arrastre la detienen; cuando se va el último motivo cuenta los 3000 ms completos otra vez; si llega mientras sale, vuelve a verse entera', () => {
    const { e, reloj } = armar();
    e.mostrar({ id: 'farmacia' }, true);
    reloj.avanzar(2000);
    e.pausar('puntero');
    e.pausar('foco');
    reloj.avanzar(10_000);
    expect(e.estado()).toMatchObject({ fase: 'visible', pausado: true });
    e.reanudar('puntero');
    reloj.avanzar(10_000);
    expect(e.estado().fase).toBe('visible');
    e.reanudar('foco');
    reloj.avanzar(2999);
    expect(e.estado()).toMatchObject({ fase: 'visible', pausado: false });
    reloj.avanzar(1);
    expect(e.estado().fase).toBe('saliendo');
    e.pausar('arrastre');
    expect(e.estado().fase).toBe('visible');
    reloj.avanzar(10_000);
    expect(e.estado().fase).toBe('visible');
    e.reanudar('arrastre');
    reloj.avanzar(3000);
    expect(e.estado().fase).toBe('saliendo');
  });

  it('PRU-DOM-VAL-880 [C-50] CA-A-5: la siguiente acción la reemplaza y se lleva el ↶ anterior; Escape la quita sin que cuente como irse; otra acción sin resultado quita el ↶', () => {
    const { e, reloj, idos } = armar();
    e.mostrar({ id: 'farmacia' }, true);
    reloj.avanzar(3220);
    expect(deshacerEnFila(e.estado(), 'farmacia')).toBe(true);
    e.mostrar({ id: 'gasolina' }, true);
    expect(e.estado().actual).toEqual({ id: 'gasolina' });
    expect(deshacerEnFila(e.estado(), 'farmacia')).toBe(false);
    e.cerrar();
    expect(e.estado()).toMatchObject({ actual: null, fase: 'nada' });
    reloj.avanzar(10_000);
    expect(idos).toEqual(['farmacia']);
    expect(deshacerEnFila(e.estado(), 'gasolina')).toBe(true);
    e.otraAccion();
    expect(deshacerEnFila(e.estado(), 'gasolina')).toBe(false);
    e.mostrar({ id: 'creada' }, false);
    expect(e.estado().ultimo).toBeNull();
  });

  it('PRU-DOM-VAL-880 [C-50] CA-A-16 y CA-A-17: la duración se lee en cada cuenta (5000 si el token cambia), la salida puede ser 0 (movimiento reducido) y sin duración legible la etiqueta no se va', () => {
    let ms: number | undefined = 5000;
    const { e, reloj, idos } = armar(() => ms, 0);
    e.mostrar({ id: 'a' }, false);
    reloj.avanzar(4999);
    expect(e.estado().fase).toBe('visible');
    reloj.avanzar(1);
    expect(e.estado()).toMatchObject({ fase: 'nada', actual: null });
    expect(idos).toEqual(['a']);
    ms = undefined;
    e.mostrar({ id: 'b' }, false);
    reloj.avanzar(60_000);
    expect(e.estado()).toMatchObject({ fase: 'visible', actual: { id: 'b' } });
  });
});
