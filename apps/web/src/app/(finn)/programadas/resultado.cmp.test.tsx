// CH-248 (E6-14): eliminar una programada y guardar sus cambios dejan su resultado en la lista de Programadas. Se prueba el contrato de
// la URL que lo lleva y lo que dibuja la pantalla; el recorrido completo (eliminar, volver a la lista) es de la E2E. [CH-281] C-50b:
// eliminar y desactivar son la etiqueta de resultado (AVISO-DE-RESULTADO §8); guardar los cambios sigue como banda.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ProgramadasDto } from '@finn/aplicacion/consultas/programadas';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import {
  leerResultadoProgramada,
  rutaProgramadasConResultado,
} from '../../../flujos/programadas-nueva/resultado';
import { Activar } from './activar';
import { PantallaProgramadas } from './pantalla';
import { ResultadoDeProgramada } from './resultado';

vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
const reemplazar = vi.fn<(ruta: string) => void>();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: reemplazar, back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/programadas',
}));
vi.mock('../../../servidor/acciones/programadas', () => ({
  gestionarProgramada: vi.fn(),
  omitirOcurrencia: vi.fn(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  vi.useRealTimers();
  reemplazar.mockReset();
});

const ID = '3f2b8a1e-0c4d-4e6a-9b7f-1a2b3c4d5e6f';
const programadas = [{ id: ID, comercio: 'Netflix' }];

function montar(ui: ReactNode): HTMLElement {
  const nodo = document.createElement('div');
  nodo.style.cssText = 'padding-top: 40px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('PRU-CMP-PROG-780 el resultado de eliminar, ajustar y desactivar una programada viaja en la URL de la lista', () => {
  it('PRU-CMP-PROG-780 la ruta lleva el resultado y se lee de vuelta; eliminar lleva el nombre, que ya no está en la lista; un valor mal formado no se muestra', () => {
    expect(rutaProgramadasConResultado({ tipo: 'eliminada', nombre: 'Netflix' })).toBe(
      '/programadas?resultado=eliminada&nombre=Netflix',
    );
    expect(rutaProgramadasConResultado({ tipo: 'ajustada', programadaId: ID })).toBe(
      `/programadas?resultado=ajustada%3A${ID}`,
    );
    expect(rutaProgramadasConResultado({ tipo: 'desactivada', programadaId: ID })).toBe(
      `/programadas?resultado=desactivada%3A${ID}`,
    );
    expect(leerResultadoProgramada('eliminada', ' Netflix ')).toEqual({
      tipo: 'eliminada',
      nombre: 'Netflix',
    });
    expect(leerResultadoProgramada(`ajustada:${ID}`)).toEqual({
      tipo: 'ajustada',
      programadaId: ID,
    });
    expect(leerResultadoProgramada(`desactivada:${ID}`)).toEqual({
      tipo: 'desactivada',
      programadaId: ID,
    });
    for (const malo of [
      undefined,
      '',
      'eliminada',
      'ajustada',
      'ajustada:p1',
      `eliminada:${ID}`,
      `ajustada:${ID}:x`,
      'desactivada:p1',
      'otro',
    ]) {
      expect(leerResultadoProgramada(malo)).toBeUndefined();
    }
  });
});

const ENCABEZADO = {
  revision: 'r1',
  hoy: '2027-02-21',
  periodoActivo: {
    inicio: '2027-02-21',
    fin: '2027-03-20',
    dias: 28,
    estado: 'activo',
    transicion: false,
    diasTranscurridos: 0,
    diasRestantes: 28,
  },
  notificacionesNoLeidas: 0,
  bandejaPorRevisar: 0,
};
const fila = (id: string, comercio: string, activa: boolean) => ({
  id,
  comercio,
  activa,
  cuenta: { nombre: 'Visa Oro' },
  monto: 2500,
  atrasadas: [],
  avisoSinModelo: false,
});
const DTO = {
  ...ENCABEZADO,
  programadas: [fila(ID, 'Gimnasio', false), fila('p2', 'Netflix', true)],
  proximosPagos: [],
} as unknown as ProgramadasDto;

describe('PRU-CMP-PROG-781 el resultado en la lista de Programadas', () => {
  it('PRU-CMP-PROG-781 [C-50] CA-A-13: eliminar deja la fila de Netflix con «Eliminada», anuncia «Eliminaste la programada Netflix. No tenía pagos registrados.» y se recoge; guardar los cambios sigue como banda sin salida (CA-E6-17)', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const eliminada = montar(
      <ResultadoDeProgramada
        programadas={programadas}
        resultado={{ tipo: 'eliminada', nombre: 'Netflix' }}
      />,
    );
    expect(eliminada.querySelector('[data-testid="resultado"]')).toBeNull();
    const sale = eliminada.querySelector('[data-fila-sale]') as HTMLElement;
    expect(sale.textContent).toBe('NetflixEliminada');
    expect(eliminada.querySelector('[role="status"]')?.textContent).toBe(
      'Eliminaste la programada Netflix. No tenía pagos registrados.',
    );
    act(() => {
      vi.advanceTimersByTime(3400);
    });
    expect(eliminada.querySelector('[data-fila-sale]')).toBeNull();
    vi.useRealTimers();

    const ajustada = montar(
      <ResultadoDeProgramada
        programadas={programadas}
        resultado={{ tipo: 'ajustada', programadaId: ID }}
      />,
    );
    const a = ajustada.querySelector('[data-testid="resultado"]');
    expect(a?.textContent).toBe('Guardaste los cambios de Netflix.');
    expect(a?.querySelector('button')).toBeNull();
  });

  it('PRU-CMP-PROG-781 sin resultado, o con una programada que no está, no se dibuja nada', () => {
    expect(
      montar(<ResultadoDeProgramada resultado={undefined} programadas={programadas} />)
        .textContent,
    ).toBe('');
    expect(
      montar(
        <ResultadoDeProgramada
          programadas={programadas}
          resultado={{ tipo: 'ajustada', programadaId: '00000000-0000-4000-8000-000000000000' }}
        />,
      ).textContent,
    ).toBe('');
  });

  it('PRU-CMP-PROG-781 [C-50] CA-A-13: desactivar en la hoja de editar vuelve a la lista, donde la fila de Gimnasio, ya en pausa, lleva «Desactivada» sin acción («Reactivar» está en la fila) y anuncia «Desactivaste Gimnasio: ya no se esperan sus pagos.»', async () => {
    const accion = vi.fn(() =>
      Promise.resolve({ ok: true, valor: {}, yaAplicada: false, avisos: [] }),
    );
    const hoja = montar(
      <Activar
        programadaId={ID}
        nombre="Gimnasio"
        activa
        accion={accion as never}
        rutaAlDesactivar={rutaProgramadasConResultado({ tipo: 'desactivada', programadaId: ID })}
      />,
    );
    await act(async () => {
      hoja.querySelector('button')?.click();
      await Promise.resolve();
    });
    expect(accion).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'activar', programadaId: ID, activa: false }),
    );
    expect(reemplazar).toHaveBeenCalledWith(`/programadas?resultado=desactivada%3A${ID}`);
    expect(hoja.querySelector('[data-testid="resultado"]')).toBeNull();

    const lista = montar(
      <PantallaProgramadas
        dto={DTO}
        horizonte={30}
        resultado={{ tipo: 'desactivada', programadaId: ID }}
      />,
    );
    const filaG = lista.querySelector(`[data-programada="${ID}"]`) as HTMLElement;
    expect(filaG.hasAttribute('data-resaltada')).toBe(true);
    expect(filaG.querySelector('[data-insignia-pausa]')).not.toBeNull();
    const et = filaG.querySelector('[data-etiqueta]') as HTMLElement;
    expect(et.textContent).toBe('Desactivada');
    expect(et.dataset['posicion']).toBe('arriba');
    expect(et.querySelector('a, button')).toBeNull();
    expect(filaG.textContent).toContain('Reactivar');
    expect(lista.querySelector('[data-programada="p2"] [data-etiqueta]')).toBeNull();
    const regiones = lista.querySelectorAll('[role="status"]');
    expect(regiones).toHaveLength(1);
    expect(regiones[0]?.textContent).toBe('Desactivaste Gimnasio: ya no se esperan sus pagos.');
    const tarjeta = filaG.parentElement as HTMLElement;
    expect(getComputedStyle(tarjeta).overflow).toBe('visible');
    expect(et.getBoundingClientRect().top).toBeLessThan(tarjeta.getBoundingClientRect().top);
  });
});
