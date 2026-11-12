// C12 (CH-220; 07 §17: un estado de un componente es una CMP): al cambiar de período con las flechas, el contenido entra desde el
// lado que corresponde. Todo pasa en el cliente; la navegación de verdad la prueban las E2E.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { direccionDeEntrada } from './direccion-entrada';
import { EntradaDePeriodo } from './direccion-periodo';
import { SelectorPeriodo, type PeriodoDto } from './selector-periodo';

// `next/link` necesita el enrutador de Next, que el navegador de prueba no tiene: se simula con un `<a>` que no navega.
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({
    href,
    children,
    onClick,
    ...resto
  }: {
    href: string;
    children?: ReactNode;
    onClick?: (e: MouseEvent) => void;
  }) =>
    createElement(
      'a',
      {
        href,
        ...resto,
        onClick: (e: MouseEvent) => {
          onClick?.(e);
          e.preventDefault();
        },
      },
      children,
    );
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

const periodo = (inicio: string, estado: PeriodoDto['estado']): PeriodoDto => ({
  inicio,
  fin: inicio,
  dias: 28,
  estado,
  transicion: false,
});
const ACTIVO = periodo('2027-02-21', 'activo');

/** La pantalla de un período: el selector y el contenido que entra. */
function Pantalla({ inicio }: { readonly inicio: string }) {
  return (
    <>
      <SelectorPeriodo
        periodo={periodo(inicio, inicio === ACTIVO.inicio ? 'activo' : 'cerrado')}
        periodoActivo={ACTIVO}
        anterior="2027-01-21"
        siguiente="2027-03-21"
        ruta="/presupuesto"
        parametros={{}}
      />
      <EntradaDePeriodo key={inicio} inicio={inicio} objetivo="contenido-c12" />
      <div id="contenido-c12">Categorías</div>
    </>
  );
}

function montar(): { nodo: HTMLElement; ir: (inicio: string) => void } {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  const ir = (inicio: string) => {
    act(() => {
      raiz.render(<Pantalla inicio={inicio} />);
    });
  };
  ir(ACTIVO.inicio);
  montados.push({ raiz, nodo });
  return { nodo, ir };
}

const flecha = (nodo: HTMLElement, etiqueta: string) =>
  nodo.querySelector<HTMLAnchorElement>(`a[aria-label="${etiqueta}"]`) as HTMLAnchorElement;

describe('PRU-CMP-PWA-400 entrada lateral al cambiar de período', () => {
  it('PRU-CMP-PWA-400 [] la flecha siguiente hace entrar el contenido desde la derecha y la anterior desde la izquierda, en 340 ms; sin flecha, sin entrada', () => {
    const { nodo, ir } = montar();
    const contenido = () => nodo.querySelector('#contenido-c12') as HTMLElement;
    expect(contenido().className).toBe('');

    act(() => {
      flecha(nodo, 'Período siguiente').click();
    });
    ir('2027-03-21');
    expect(contenido().className).toBe('fz-periodo-siguiente');
    expect(getComputedStyle(contenido()).animationName).toBe('fz-periodo-siguiente');
    expect(getComputedStyle(contenido()).animationDuration).toBe('0.34s');

    act(() => {
      flecha(nodo, 'Período anterior').click();
    });
    ir('2027-01-21');
    expect(contenido().className).toBe('fz-periodo-anterior');

    // Llegar a un período sin tocar una flecha (un enlace, la URL) no anima.
    ir('2027-02-21');
    expect(contenido().className).toBe('');
  });
});

describe('PRU-CMP-PWA dirección de entrada entre pantallas', () => {
  it('PRU-CMP-PWA-771 [CH-240] la navegación a una pestaña a la derecha, a una hija y de vuelta pone la dirección correcta, y cada dirección tiene su animación (con su token) en globals.css', () => {
    expect(direccionDeEntrada(null, '/presupuesto')).toBeNull();
    expect(direccionDeEntrada('/', '/presupuesto')).toBe('derecha');
    expect(direccionDeEntrada('/cuentas', '/actividad')).toBe('izquierda');
    expect(direccionDeEntrada('/presupuesto', '/presupuesto/categorias/c1')).toBe('hija');
    expect(direccionDeEntrada('/presupuesto/categorias/c1', '/presupuesto')).toBe('volver');
    expect(direccionDeEntrada('/', '/registrar')).toBe('registrar');
    expect(direccionDeEntrada('/registrar/gasto', '/')).toBe('cerrar-registrar');
    // Una hoja interceptada sobre la misma sección no cambia de pantalla.
    expect(direccionDeEntrada('/presupuesto', '/presupuesto/asignar/c1')).toBeNull();

    const casos: [string, string, string, string][] = [
      ['derecha', '<main></main>', 'fz-entra-derecha', '0.22s'],
      ['izquierda', '<main></main>', 'fz-entra-izquierda', '0.22s'],
      ['hija', '<main></main>', 'fz-entra-hija', '0.34s'],
      ['volver', '<main></main>', 'fz-entra-volver', '0.34s'],
      ['registrar', '<main data-pagina-flujo></main>', 'fz-entra-sube', '0.4s'],
    ];
    for (const [direccion, main, nombre, duracion] of casos) {
      const contenido = document.createElement('div');
      contenido.id = 'contenido';
      contenido.setAttribute('data-entrada', direccion);
      contenido.innerHTML = main;
      document.body.append(contenido);
      const e = getComputedStyle(contenido.firstElementChild as Element);
      expect(e.animationName, direccion).toBe(nombre);
      expect(e.animationDuration, direccion).toBe(duracion);
      contenido.remove();
    }
  });
});
