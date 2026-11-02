import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { plantilla as t } from '../../textos/plantilla';
import { PanelPlantilla } from './plantilla';

// `next/link` necesita `process`, que el navegador del proyecto no trae: el enlace se simula con un ancla (lo que prueba esta
// suite son los destinos y lo que dibuja la pantalla, no la navegación).
vi.mock('../../componentes/navegacion/enlace-finn', () => ({
  EnlaceFinn: ({
    href,
    children,
    className,
  }: {
    href: string;
    children?: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// `next/navigation` también necesita `process`: el enrutador se simula para ver adónde manda el marco del flujo.
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  window.sessionStorage.clear();
  replace.mockClear();
});

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

interface Elemento {
  id: string;
  tipo: 'grupo' | 'categoria';
  nombre: string;
  grupoId?: string;
}

const boton = (nodo: HTMLElement, nombre: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find(
    (x) => (x.getAttribute('aria-label') ?? x.textContent) === nombre,
  );
  if (b === undefined) throw new Error(`no hay un botón «${nombre}»`);
  return b;
};

/** Deja correr las tandas, vaciando las actualizaciones de la pantalla en cada vuelta, hasta que aparezca el texto. */
async function esperarTexto(nodo: HTMLElement, texto: string): Promise<void> {
  for (let i = 0; i < 200 && !(nodo.textContent ?? '').includes(texto); i += 1)
    await act(async () => {
      await Promise.resolve();
    });
  expect(nodo.textContent).toContain(texto);
}

describe('PRU-CMP-INICIO', () => {
  it('PRU-CMP-INICIO-101 con todo quitado, "Crear" queda deshabilitado con el motivo a la vista y sin llamar a la acción', async () => {
    const crearLote = vi.fn();
    const nodo = montar(<PanelPlantilla hayNormales={false} crearLote={crearLote} />);
    expect(boton(nodo, t.crear(36)).disabled).toBe(false);
    for (const g of t.grupos) {
      await act(() => {
        boton(nodo, t.quitarGrupo(g.nombre)).click();
        return Promise.resolve();
      });
    }
    const crear = boton(nodo, t.crear(0));
    expect(crear.disabled).toBe(true);
    expect(nodo.textContent).toContain(t.elegirUna);
    expect(crearLote).not.toHaveBeenCalled();
  });

  it('PRU-CMP-INICIO-104 la lista editable de la plantilla no tiene violaciones de axe', async () => {
    const nodo = montar(<PanelPlantilla hayNormales={false} crearLote={vi.fn()} />);
    const r = await axe.run(nodo);
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  it('PRU-CMP-INICIO-102 con categorías normales y sin una aplicación a medias, la plantilla manda a la estructura; con una a medias, ofrece seguir', () => {
    montar(<PanelPlantilla hayNormales crearLote={vi.fn()} />);
    expect(replace).toHaveBeenCalledWith('/presupuesto/estructura');

    const aMedias = {
      elementos: [
        { id: 'a', tipo: 'grupo', nombre: 'Casa' },
        { id: 'b', tipo: 'categoria', nombre: 'Luz', grupoId: 'a' },
      ],
      resultados: { a: null },
    };
    window.sessionStorage.setItem(
      'finn:borrador:v1:/presupuesto/estructura/plantilla:',
      JSON.stringify({ version: 1, campos: aMedias }),
    );
    replace.mockClear();
    const nodo = montar(<PanelPlantilla hayNormales crearLote={vi.fn()} />);
    expect(replace).not.toHaveBeenCalled();
    expect(boton(nodo, t.seguir(1, 2))).toBeTruthy();
  });

  it('PRU-CMP-INICIO-105 [CA-04.8] la plantilla completa se aplica en 4 llamadas de hasta 15 elementos, con cada grupo antes que sus categorías y el avance creciendo entre tandas', async () => {
    const avances: (string | null | undefined)[] = [];
    const llamadas: Elemento[][] = [];
    const crearLote = vi.fn(async (entrada: { elementos: Elemento[] }) => {
      await act(async () => {
        await Promise.resolve(); // deja que la pantalla dibuje el avance de la tanda anterior
      });
      avances.push(document.querySelector('[role=status]')?.textContent);
      llamadas.push(entrada.elementos);
      return {
        ok: true,
        valor: { elementos: entrada.elementos.map((e) => ({ id: e.id, resultado: 'creado' })) },
      };
    });
    const nodo = montar(<PanelPlantilla hayNormales={false} crearLote={crearLote as never} />);
    await act(() => {
      boton(nodo, t.crear(36)).click();
      return Promise.resolve();
    });
    await esperarTexto(nodo, t.creadas(47));
    expect(llamadas.map((l) => l.length)).toEqual([12, 12, 12, 11]);
    expect(Math.max(...llamadas.map((l) => l.length))).toBeLessThanOrEqual(15);
    const vistos = new Set<string>();
    for (const e of llamadas.flat()) {
      if (e.tipo === 'grupo') vistos.add(e.id);
      else expect(vistos.has(e.grupoId ?? '')).toBe(true);
    }
    expect(avances).toEqual([0, 12, 24, 36].map((k) => t.creando(k, 47)));
  });

  it('PRU-CMP-INICIO-106 [CA-04.10] sin borrador y con 12 elementos ya creados, ofrece seguir con 12 de 47 y envía solo los 35 restantes, colgados de los grupos que ya existen', async () => {
    const existentes = [
      {
        id: 'g-vivienda',
        nombre: 'Vivienda',
        categorias: t.grupos[0].categorias.map((nombre, i) => ({ id: 'cv' + String(i), nombre })),
      },
      {
        id: 'g-vida',
        nombre: 'vida DIARIA',
        categorias: t.grupos[1].categorias.slice(0, 4).map((nombre, i) => ({
          id: 'cd' + String(i),
          nombre,
        })),
      },
    ];
    const enviados: Elemento[] = [];
    const crearLote = vi.fn((entrada: { elementos: Elemento[] }) => {
      enviados.push(...entrada.elementos);
      return Promise.resolve({
        ok: true,
        valor: { elementos: entrada.elementos.map((e) => ({ id: e.id, resultado: 'creado' })) },
      });
    });
    const nodo = montar(
      <PanelPlantilla hayNormales existentes={existentes} crearLote={crearLote as never} />,
    );
    expect(replace).not.toHaveBeenCalled();
    await act(() => {
      boton(nodo, t.seguir(12, 47)).click();
      return Promise.resolve();
    });
    await esperarTexto(nodo, t.creadas(47));
    expect(enviados).toHaveLength(35);
    const ropa = enviados.find((e) => e.nombre === 'Ropa y calzado');
    expect(ropa?.grupoId).toBe('g-vida');
    expect(enviados.map((e) => e.nombre)).not.toContain('Vivienda');
    expect(enviados.map((e) => e.nombre)).not.toContain('Farmacia');
    expect(nodo.textContent).not.toContain(t.noSeCrearon(1));
  });

  it('PRU-CMP-INICIO-107 [CA-04.13] si falla un grupo, sus categorías llevan el motivo del grupo en el resumen, aunque estén en otra tanda, y las de los demás grupos se crean', async () => {
    const motivo = 'Ya existe un grupo con ese nombre.';
    const fallido = new Set<string>();
    const enviados: Elemento[] = [];
    const crearLote = vi.fn((entrada: { elementos: Elemento[] }) => {
      enviados.push(...entrada.elementos);
      return Promise.resolve({
        ok: true,
        valor: {
          elementos: entrada.elementos.map((e) => {
            if (e.tipo === 'grupo' && e.nombre === 'Vida diaria') fallido.add(e.id);
            const malo = e.tipo === 'grupo' ? fallido.has(e.id) : fallido.has(e.grupoId ?? '');
            return { id: e.id, resultado: malo ? { mensaje: motivo } : 'creado' };
          }),
        },
      });
    });
    const nodo = montar(<PanelPlantilla hayNormales={false} crearLote={crearLote as never} />);
    await act(() => {
      boton(nodo, t.crear(36)).click();
      return Promise.resolve();
    });
    await esperarTexto(nodo, t.noSeCrearon(6));
    expect(nodo.textContent).toContain(t.creadas(41));
    for (const nombre of ['Vida diaria', ...t.grupos[1].categorias])
      expect(nodo.textContent).toContain(t.noSeCreo(nombre, motivo));
    expect(enviados.map((e) => e.nombre)).not.toContain('Ropa y calzado');
    expect(enviados.map((e) => e.nombre)).toContain('Transporte');
  });
});
