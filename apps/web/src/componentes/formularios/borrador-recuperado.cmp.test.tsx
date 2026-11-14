// [CH-286] Borrador recuperado (C-51, enmienda E3-17; `docs/anexos/finn-avisos-en-linea/AVISOS-EN-LINEA.md` §4): en «Nueva
// programada», el aviso momentáneo sale una sola vez por borrador, sin acción y con su descripción; se va a los ms de
// `--duracion-aviso` con temporizadores simulados (07 §7.1), espera con el puntero y se quita al escribir; «Descartar borrador»
// vive al pie, a la izquierda del botón de guardar. El borrador ya guardado en el formato de antes (sin `avisoVisto`) se lee
// igual. Los CA-L-n de PROMPT-AVISOS.md §4 van en el texto del título.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import type { Campos } from '../../flujos/programadas-nueva/campos';
import { FormularioProgramada } from '../../flujos/programadas-nueva/formulario';
import { formularios } from '../../textos/formularios';
import { programadas as tp } from '../../textos/programadas';

vi.mock('next/navigation', () => ({
  usePathname: () => '/programadas/nueva',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CLAVE = 'finn:borrador:v1:/programadas/nueva:';
const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  desmontar();
  sessionStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
function desmontar(): void {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
}

const VACIA: Campos = {
  tipo: 'gasto',
  cuentaId: '',
  cuentaDestinoId: '',
  comercio: '',
  monto: '',
  tolerancia: '',
  frecuencia: 'mensual',
  frecuenciaDias: '',
  primeraFecha: '2027-02-05',
  fechaFin: '',
  registroAutomatico: false,
  lineas: [{ monto: '', categoriaId: '' }],
};
const ok = () => Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false, avisos: [] });

/** El borrador como lo guardaba la versión anterior (05 §4.11): sin `avisoVisto`. */
function guardarViejo(): void {
  sessionStorage.setItem(
    CLAVE,
    JSON.stringify({
      version: 1,
      guardadoEn: '2027-02-05T10:00:00Z',
      campos: { ...VACIA, comercio: 'Netflix', monto: '15.49' },
      id: null,
      esperado: null,
      revisionAlAbrir: null,
    }),
  );
}

/** Monta «Nueva programada» y deja que cargue el borrador (el módulo diferido y el efecto que lee). */
async function abrir(): Promise<HTMLElement> {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  montados.push({ raiz, nodo });
  await act(async () => {
    raiz.render(
      <FormularioProgramada
        inicial={VACIA}
        origenes={{ gasto: [{ id: 'o1', nombre: 'Visa Oro' }], otros: [] }}
        destinos={{ pago_tarjeta: [], cuota_prestamo: [], aporte_inversion: [] }}
        categorias={[{ id: 'c1', nombre: 'Suscripciones' }]}
        calendarioEditable
        motivoCalendario=""
        puedeEliminar={false}
        accion={vi.fn(ok)}
        accionEliminar={vi.fn(ok)}
      />,
    );
    await import('./borrador-recuperado');
    await import('../../flujos/programadas-nueva/borrador');
  });
  for (let i = 0; i < 5; i += 1)
    await act(async () => {
      await Promise.resolve();
    });
  return nodo;
}

const fakes = (): void => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
};
function avanzar(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}
const aviso = (n: ParentNode) => n.querySelector<HTMLElement>('[data-aviso-borrador]');
const descartar = (n: ParentNode) =>
  [...n.querySelectorAll('button')].find((b) => b.textContent === formularios.descartarBorrador) ??
  null;
const crear = (n: ParentNode) =>
  [...n.querySelectorAll('button')].find((b) => b.textContent.trim() === tp.crear) ?? null;
const comercio = (n: ParentNode): HTMLInputElement =>
  [...n.querySelectorAll('label')]
    .filter((l) => l.textContent.trim().startsWith(tp.comercio))
    .map((l) => l.control)
    .find((c): c is HTMLInputElement => c instanceof HTMLInputElement) as HTMLInputElement;
const guardado = () =>
  JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null') as {
    avisoVisto?: boolean;
    campos: Campos;
  } | null;
const anuncio = (n: ParentNode) => n.querySelector('[role=status][data-anuncio-borrador]');

function escribir(input: HTMLInputElement, texto: string): void {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, texto);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('PRU-CMP-VAL-901 el borrador recuperado', () => {
  it('PRU-CMP-VAL-901 [C-51] CA-L-6: al volver a «Nueva programada» los campos traen lo escrito, sale «Recuperamos lo que estabas escribiendo» con su descripción y sin acción, se anuncia una vez y «Descartar borrador» está al pie, a la izquierda de guardar; el borrador viejo queda marcado como visto', async () => {
    fakes();
    guardarViejo();
    const nodo = await abrir();
    expect(comercio(nodo).value).toBe('Netflix');
    const a = aviso(nodo) as HTMLElement;
    expect(a.getAttribute('role')).toBe('status');
    expect(a.querySelector('.fz-aviso-titulo')?.textContent).toBe(
      `Información: ${formularios.borradorRecuperado}`,
    );
    expect(a.querySelector('.fz-aviso-descripcion')?.textContent).toBe(formularios.borradorCuerpo);
    expect(a.querySelector('[data-icono="undo"]')).not.toBeNull();
    expect(a.querySelector('button, a')).toBeNull();
    expect(nodo.querySelectorAll('[data-aviso-borrador]')).toHaveLength(1);
    const d = descartar(nodo) as HTMLButtonElement;
    const g = crear(nodo) as HTMLButtonElement;
    expect(a.contains(d)).toBe(false);
    expect(d.getBoundingClientRect().right).toBeLessThanOrEqual(g.getBoundingClientRect().left);
    expect(Math.abs(d.getBoundingClientRect().top - g.getBoundingClientRect().top)).toBeLessThan(
      g.getBoundingClientRect().height,
    );
    expect(getComputedStyle(d).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(d.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(guardado()?.avisoVisto).toBe(true);
    expect(guardado()?.campos.comercio).toBe('Netflix');
  });

  it('PRU-CMP-VAL-901 [C-51] CA-L-7 y CA-L-13: a los 3000 ms sale con opacidad en --duracion-normal y se va; con el puntero encima espera y al salir cuenta los 3000 ms otra vez; con movimiento reducido se quita sin salida, a los mismos ms', async () => {
    fakes();
    guardarViejo();
    const nodo = await abrir();
    const a = aviso(nodo) as HTMLElement;
    act(() => {
      a.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    });
    avanzar(10_000);
    expect(aviso(nodo)?.dataset['fase']).toBe('visible');
    act(() => {
      a.dispatchEvent(
        new PointerEvent('pointerout', { bubbles: true, relatedTarget: document.body }),
      );
    });
    avanzar(2999);
    expect(aviso(nodo)?.dataset['fase']).toBe('visible');
    avanzar(1);
    expect(aviso(nodo)?.dataset['fase']).toBe('saliendo');
    expect(getComputedStyle(a).transitionProperty).toContain('opacity');
    expect(getComputedStyle(a).transitionDuration).toBe('0.22s');
    avanzar(220);
    expect(aviso(nodo)).toBeNull();
    expect(descartar(nodo)).not.toBeNull();

    desmontar();
    guardarViejo();
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (m: string) => ({ matches: m.includes('reduce'), media: m }) as MediaQueryList,
    );
    const otro = await abrir();
    avanzar(2999);
    expect(aviso(otro)).not.toBeNull();
    avanzar(1);
    avanzar(1);
    expect(aviso(otro)).toBeNull();
  });

  it('PRU-CMP-VAL-901 [C-51] CA-L-8: al escribir en cualquier campo el aviso se quita en ese momento', async () => {
    fakes();
    guardarViejo();
    const nodo = await abrir();
    expect(aviso(nodo)).not.toBeNull();
    escribir(comercio(nodo), 'Netflix Premium');
    expect(aviso(nodo)).toBeNull();
    expect(descartar(nodo)).not.toBeNull();
  });

  it('PRU-CMP-VAL-901 [C-51] CA-L-9: cerrar y volver a abrir, una o varias veces, trae lo escrito sin el aviso y con «Descartar borrador» al pie', async () => {
    fakes();
    guardarViejo();
    await abrir();
    for (let vez = 0; vez < 2; vez += 1) {
      desmontar();
      const nodo = await abrir();
      expect(comercio(nodo).value).toBe('Netflix');
      expect(aviso(nodo)).toBeNull();
      expect(descartar(nodo)).not.toBeNull();
    }
  });

  it('PRU-CMP-VAL-901 [C-51] CA-L-10: «Descartar borrador» vacía los campos, desaparece y anuncia «Descartaste el borrador.»; un borrador nuevo vuelve a avisar una vez', async () => {
    fakes();
    guardarViejo();
    const nodo = await abrir();
    act(() => {
      descartar(nodo)?.click();
    });
    expect(comercio(nodo).value).toBe('');
    expect(descartar(nodo)).toBeNull();
    expect(aviso(nodo)).toBeNull();
    expect(anuncio(nodo)?.textContent).toBe(formularios.descartasteBorrador);
    expect(formularios.descartasteBorrador).toBe('Descartaste el borrador.');
    avanzar(600);
    expect(sessionStorage.getItem(CLAVE)).toBeNull();
    escribir(comercio(nodo), 'Gimnasio');
    avanzar(600);
    expect(guardado()?.campos.comercio).toBe('Gimnasio');
    expect(guardado()?.avisoVisto).not.toBe(true);
    desmontar();
    const otra = await abrir();
    expect(comercio(otra).value).toBe('Gimnasio');
    expect(aviso(otra)).not.toBeNull();
    desmontar();
    const tercera = await abrir();
    expect(aviso(tercera)).toBeNull();
  });
});
