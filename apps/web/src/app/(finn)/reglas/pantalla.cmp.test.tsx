// FT-39 Reglas de comercio (07 §17: un texto o un estado de un componente es una CMP). La pantalla solo dibuja lo que trae el DTO de
// `reglas()` (04 §6.12.2): qué regla se aplica y cuál no lo prueban el dominio y las E2E (PF-3).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ReglasDto } from '@finn/aplicacion/consultas/reglas';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import { reglas as t } from '../../../textos/reglas';
import { PantallaReglas } from './pantalla';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene: se simula `next/link`, nunca
// `enlace-finn`, que otras suites importan de verdad (`vitest list` no limpia los mocks de cada sesión del navegador).
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
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

const dto = (reglas: ReglasDto['reglas']): ReglasDto =>
  ({
    revision: 'r1',
    hoy: '2027-02-21',
    periodoActivo: {
      inicio: '2027-02-21',
      fin: '2027-03-20',
      dias: 28,
      estado: 'activo',
      transicion: false,
      diasTranscurridos: 10,
      diasRestantes: 18,
    },
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    reglas,
  }) as unknown as ReglasDto;
const regla = (id: string, patron: string, categoria: string, archivada = false) =>
  ({
    id,
    patron,
    categoria: { id: `c-${id}`, nombre: categoria, ...(archivada ? { archivada: true } : {}) },
    categoriaArchivada: archivada,
  }) as ReglasDto['reglas'][number];

const mostrar = (arbol: ReactNode): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(arbol);
  });
  montados.push({ raiz, nodo });
  return nodo;
};

describe('PRU-CMP-BAND-150 reglas', () => {
  it('PRU-CMP-BAND-150 [FT-39] sin reglas explica cómo se crean y ofrece «Nueva regla» hacia /reglas/nueva', () => {
    const raiz = mostrar(<PantallaReglas dto={dto([])} />);
    expect(raiz.querySelector('h1')?.textContent).toBe(t.titulo);
    expect(raiz.textContent).toContain(t.vacioTitulo);
    expect(raiz.textContent).toContain(t.vacioTexto);
    expect(raiz.querySelectorAll('[data-regla]')).toHaveLength(0);
    const enlace = [...raiz.querySelectorAll('a')].find((a) => a.textContent === t.nuevaRegla);
    expect(enlace?.getAttribute('href')).toBe('/reglas/nueva');
  });

  it('PRU-CMP-BAND-151 [CA-39.3] cada regla muestra su patrón y su categoría y enlaza a su pantalla; la que apunta a una archivada dice «No se aplica: la categoría está archivada»', () => {
    const raiz = mostrar(
      <PantallaReglas
        dto={dto([
          regla('r1', 'SUPER SELECTOS', 'Supermercado'),
          regla('r2', 'STARBUCKS', 'Café', true),
        ])}
      />,
    );
    const filas = raiz.querySelectorAll('[data-regla]');
    expect(filas).toHaveLength(2);
    expect(filas[0]?.textContent).toContain('SUPER SELECTOS');
    expect(filas[0]?.textContent).toContain(t.hacia('Supermercado'));
    expect(filas[0]?.textContent).not.toContain(t.noSeAplica);
    expect(filas[0]?.getAttribute('data-archivada')).toBe('no');
    expect(filas[0]?.querySelector('a')?.getAttribute('href')).toBe('/reglas/r1');
    expect(filas[1]?.textContent).toContain(t.hacia('Café'));
    expect(filas[1]?.textContent).toContain(t.noSeAplica);
    expect(filas[1]?.getAttribute('data-archivada')).toBe('si');
  });

  it('PRU-CMP-BAND-152 [FT-39] el estado vacío no tiene violaciones de accesibilidad', async () => {
    const raiz = mostrar(<PantallaReglas dto={dto([])} />);
    const resultado = await axe.run(raiz, { rules: { 'color-contrast': { enabled: false } } });
    expect(resultado.violations.map((v) => v.id)).toEqual([]);
  });

  it('PRU-CMP-BAND-153 [CA-39.3] la lista con una regla hacia una categoría archivada no tiene violaciones de accesibilidad', async () => {
    const raiz = mostrar(
      <PantallaReglas
        dto={dto([regla('r1', 'PUMA', 'Gasolina'), regla('r2', 'STARBUCKS', 'Café', true)])}
      />,
    );
    const resultado = await axe.run(raiz, { rules: { 'color-contrast': { enabled: false } } });
    expect(resultado.violations.map((v) => v.id)).toEqual([]);
  });
});

describe('PRU-CMP-BAND buscador de reglas', () => {
  it('PRU-CMP-BAND-312 [CA-39.3] el buscador relleno envía ?q= a /reglas, conserva el texto y sin coincidencias dice «Ninguna regla para {búsqueda}.» con «Quitar la búsqueda» y «Nueva regla» a la vista', () => {
    const raiz = mostrar(<PantallaReglas dto={dto([])} q="zzz" total={2} />);
    const form = raiz.querySelector('form[role="search"]') as HTMLFormElement;
    expect(form.getAttribute('action')).toBe('/reglas');
    expect(form.getAttribute('method')).toBe('get');
    const campo = form.querySelector('input[name="q"]') as HTMLInputElement;
    expect(campo.value).toBe('zzz');
    const vacio = raiz.querySelector('[data-sin-coincidencias]');
    expect(vacio?.querySelector('p')?.textContent).toBe(t.ningunaPara('zzz'));
    expect(vacio?.querySelector('a')?.textContent).toBe(t.quitarBusqueda);
    expect(vacio?.querySelector('a')?.getAttribute('href')).toBe('/reglas');
    expect(raiz.textContent).not.toContain(t.vacioTitulo);
    expect([...raiz.querySelectorAll('a')].some((a) => a.textContent.includes(t.nuevaRegla))).toBe(
      true,
    );
    const sonda = document.createElement('span');
    sonda.style.backgroundColor = 'var(--superficie)';
    document.body.append(sonda);
    expect(getComputedStyle(campo).backgroundColor).toBe(getComputedStyle(sonda).backgroundColor);
    sonda.remove();
    // Con coincidencias, las filas tocables miden 60 px de alto como mínimo y llevan chevR.
    const lista = mostrar(
      <PantallaReglas
        dto={dto([regla('r1', 'SUPER SELECTOS', 'Supermercado')])}
        q="super"
        total={2}
      />,
    );
    const fila = lista.querySelector('[data-regla] a') as HTMLElement;
    expect(fila.getBoundingClientRect().height).toBeGreaterThanOrEqual(60);
    expect(fila.querySelector('[data-icono="chevR"]')).not.toBeNull();
  });
});
