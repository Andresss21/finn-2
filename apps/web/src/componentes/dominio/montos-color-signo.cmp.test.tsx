import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Centavos } from '@finn/dominio/valores';
import type { DetalleCategoria } from '@finn/dominio/selectores';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { Consumos } from '../../app/(finn)/presupuesto/categorias/[categoriaId]/consumos';
import { BarraGastado } from './barra-gastado';
import { FilaCategoria, type FilaCategoriaDto } from './fila-categoria';
import { MontoDestello } from './monto-destello';
import { MovimientoBandeja, type MovimientoDto } from './movimiento-bandeja';

// `EnlaceFinn` envuelve `next/link`, el límite externo: acá es un `<a>`.
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
  document.body.removeAttribute('style');
  vi.restoreAllMocks();
});

/** «Reducir movimiento» encendido: `matchMedia` de la preferencia responde `true`. */
function conMovimientoReducido(): void {
  const original = window.matchMedia.bind(window);
  vi.spyOn(window, 'matchMedia').mockImplementation((consulta: string) =>
    consulta === '(prefers-reduced-motion: reduce)'
      ? ({
          matches: true,
          media: consulta,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        } as unknown as MediaQueryList)
      : original(consulta),
  );
}

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText =
    'background: var(--fondo); color: var(--texto); font-family: var(--fuente-cuerpo); width: 390px';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

/** El color que el navegador resuelve para un token (`--positivo-texto`…), sin repetir el valor hexadecimal. */
function colorDe(token: string): string {
  const sonda = document.createElement('span');
  sonda.style.color = `var(${token})`;
  document.body.append(sonda);
  const color = getComputedStyle(sonda).color;
  sonda.remove();
  return color;
}
const fondoDe = (token: string) => colorDe(token);
const estilo = (n: Element | null | undefined) => getComputedStyle(n as Element);

const c = (n: number): Centavos => n as Centavos;
const fila = (p: Partial<FilaCategoriaDto>): FilaCategoriaDto => ({
  categoria: { id: 'c1', nombre: 'Supermercado' },
  asignado: c(35000),
  gastado: c(28715),
  disponible: c(6285),
  sobregiro: null,
  meta: null,
  barra: { cubiertoBp: 8200, excedenteBp: 0, tipoExcedente: null },
  ...p,
});
const disponibleDe = (raiz: HTMLElement, id: string) =>
  raiz.querySelector(`[data-fila-categoria="${id}"] [data-centavos]`);

describe('PRU-CMP-PRES-200 color de los montos de una fila de categoría [FE-45]', () => {
  it('PRU-CMP-PRES-200 el Disponible positivo va en --positivo-texto; el cero en --texto; el sobregiro en el color de su tipo', () => {
    const raiz = montar(
      <>
        <FilaCategoria hrefDetalle="/d/1" fila={fila({})} />
        <FilaCategoria
          hrefDetalle="/d/2"
          fila={fila({ categoria: { id: 'c2', nombre: 'Luz' }, disponible: c(0) })}
        />
        <FilaCategoria
          hrefDetalle="/d/3"
          fila={fila({
            categoria: { id: 'c3', nombre: 'Restaurantes' },
            disponible: c(-2630),
            sobregiro: { tipo: 'debito' },
          })}
        />
        <FilaCategoria
          hrefDetalle="/d/4"
          fila={fila({
            categoria: { id: 'c4', nombre: 'Gasolina' },
            disponible: c(-1000),
            sobregiro: { tipo: 'tarjeta' },
          })}
        />
      </>,
    );
    expect(estilo(disponibleDe(raiz, 'c1')).color).toBe(colorDe('--positivo-texto'));
    expect(estilo(disponibleDe(raiz, 'c2')).color).toBe(colorDe('--texto'));
    expect(estilo(disponibleDe(raiz, 'c3')).color).toBe(colorDe('--problema-texto'));
    expect(estilo(disponibleDe(raiz, 'c4')).color).toBe(colorDe('--deuda-sin-respaldo-texto'));
    // Los montos neutros de la misma fila (Asignado y Gastado) siguen en --texto (06 §1)
    const neutros = raiz.querySelectorAll('[data-fila-categoria="c1"] [data-centavos]');
    expect(estilo(neutros[1]).color).not.toBe(colorDe('--positivo-texto'));
  });
});

describe('PRU-CMP-PRES-201 barra de gastado: meta cubierta y excedente con tarjeta [CF-25]', () => {
  it('PRU-CMP-PRES-201 la meta cubierta pinta lo gastado en --positivo-borde y el excedente con tarjeta es sólido en --deuda-sin-respaldo-borde', () => {
    const cubierta = fila({
      meta: { falta: c(0), estado: 'activa' },
      barra: { cubiertoBp: 10000, excedenteBp: 0, tipoExcedente: null },
    });
    const conTarjeta = fila({
      categoria: { id: 'c2', nombre: 'Gasolina' },
      disponible: c(-1000),
      sobregiro: { tipo: 'tarjeta' },
      barra: { cubiertoBp: 8000, excedenteBp: 2000, tipoExcedente: 'tarjeta' },
    });
    const raiz = montar(
      <>
        <FilaCategoria hrefDetalle="/d/1" fila={cubierta} />
        <FilaCategoria hrefDetalle="/d/2" fila={conTarjeta} />
        <FilaCategoria
          hrefDetalle="/d/3"
          fila={fila({ categoria: { id: 'c3', nombre: 'Internet' } })}
        />
        <BarraGastado barra={{ cubiertoBp: 5000, excedenteBp: 5000, tipoExcedente: 'mixto' }} />
      </>,
    );
    const segmento = (id: string, cual: string) =>
      raiz.querySelector(`[data-fila-categoria="${id}"] [data-segmento="${cual}"]`);
    expect(estilo(segmento('c1', 'cubierto')).backgroundColor).toBe(fondoDe('--positivo-borde'));
    // Una categoría sin meta cubierta conserva el gris de lo gastado
    expect(estilo(segmento('c3', 'cubierto')).backgroundColor).toBe(fondoDe('--texto-secundario'));
    const excedente = estilo(segmento('c2', 'excedente'));
    expect(excedente.backgroundColor).toBe(fondoDe('--deuda-sin-respaldo-borde'));
    expect(excedente.backgroundImage).toBe('none');
    // Mixto: la franja inferior también es sólida (la mitad de arriba es del débito)
    const mixto = raiz.querySelector('[data-barra="mixto"] [data-segmento="excedente"]');
    expect(estilo(mixto).backgroundImage).not.toContain('repeating');
  });
});

describe('PRU-CMP-BAND-200 signo de los montos de la Bandeja [FE-44]', () => {
  const movimiento = (monto: number, tipoPropuesto: string | null): MovimientoDto => ({
    id: 'm1',
    estado: 'pendiente',
    sms: { texto: 'BAC: compra por $12.35' },
    cuenta: { nombre: 'Visa Oro' },
    fecha: '2026-10-15',
    monto: c(monto),
    tipoPropuesto,
    comercio: 'Pizza Hut',
    categoriaSugerida: null,
    aprobacion: { posible: true, faltantes: [] },
  });
  const visible = (m: MovimientoDto) => {
    const raiz = montar(<MovimientoBandeja movimiento={m} hrefRevisar="/b/1" />);
    const valor = raiz.querySelector('[data-centavos]') as HTMLElement;
    return [
      valor.querySelector('[aria-hidden="true"]')?.textContent,
      valor.querySelector('.sr-only')?.textContent,
      valor,
    ] as const;
  };

  it.each([
    [1235, 'gasto'],
    [-1235, 'gasto'],
    [1235, 'pago_tarjeta'],
  ])(
    'PRU-CMP-BAND-200 el monto %i de un %s sale como −$12.35 (U+2212); el lector oye "menos $12.35"',
    (monto, tipo) => {
      const [texto, lector, valor] = visible(movimiento(monto, tipo));
      expect(texto).toBe('−$12.35');
      expect(lector).toBe('menos $12.35');
      expect(valor.getAttribute('data-centavos')).toBe(String(monto));
      expect(estilo(valor).fontVariantNumeric).toContain('tabular-nums');
    },
  );

  it.each(['ingreso', 'devolucion', 'transferencia', null])(
    'PRU-CMP-BAND-201 un movimiento de tipo %s va sin signo: no es un gasto ni un pago que sale',
    (tipo) => {
      const [texto, lector] = visible(movimiento(1235, tipo));
      expect(texto).toBe('$12.35');
      expect(lector).toBe('$12.35');
    },
  );
});

describe('PRU-CMP-PRES-202 signo de los consumos del detalle de categoría [CA-14.1]', () => {
  it('PRU-CMP-PRES-202 el monto de cada consumo lleva el signo menos y lo cubierto no cambia', () => {
    const consumos = [
      {
        origen: { transaccionId: 't1' },
        fecha: '2026-09-23',
        comercio: 'Super Selectos',
        cuenta: { id: 'u1', nombre: 'Visa Oro' },
        medio: 'tarjeta',
        montoNeto: 4210,
        cubierto: 4210,
        noCubierto: 0,
      },
    ] as unknown as DetalleCategoria['consumos'];
    const raiz = montar(<Consumos consumos={consumos} volver="/presupuesto" />);
    const fila1 = raiz.querySelector('[data-consumo]') as HTMLElement;
    const montos = fila1.querySelectorAll('[data-centavos]');
    const principal = montos[montos.length - 1] as HTMLElement;
    expect(principal.querySelector('[aria-hidden="true"]')?.textContent).toBe('−$42.10');
    expect(principal.querySelector('.sr-only')?.textContent).toBe('menos $42.10');
    // "cubierto $42.10" es una cifra de apoyo, sin signo
    expect(montos[0]?.querySelector('[aria-hidden="true"]')?.textContent).toBe('$42.10');
  });
});

describe('PRU-CMP-PWA destello de montos', () => {
  /** Monta un monto con destello y devuelve cómo volver a dibujarlo con otro valor (lo que trae el servidor). */
  function conMonto(inicial: number): { nodo: HTMLElement; dibujar: (n: number) => void } {
    const nodo = document.createElement('main');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    const dibujar = (n: number) => {
      act(() => {
        raiz.render(<MontoDestello centavos={c(n)} rol="cifra" estado="positivo" />);
      });
    };
    dibujar(inicial);
    montados.push({ raiz, nodo });
    return { nodo, dibujar };
  }
  const destello = (nodo: HTMLElement) => nodo.querySelector('[data-destello]');

  it('PRU-CMP-PWA-330 [] un monto que sube destella en --positivo-texto, uno que baja en --problema-texto y uno igual no destella', () => {
    const { nodo, dibujar } = conMonto(6285);
    expect(destello(nodo)).toBeNull();
    dibujar(6285);
    expect(destello(nodo)).toBeNull();
    dibujar(9000);
    expect(destello(nodo)?.getAttribute('data-destello')).toBe('sube');
    expect(estilo(destello(nodo)).animationName).toBe('fz-destello-sube');
    expect(estilo(destello(nodo)).animationDuration).toBe('0.6s');
    const monto = destello(nodo)?.querySelector('[data-centavos]');
    expect(estilo(monto).animationName).toBe('fz-tinte-sube');
    // El tinte arranca en el color del token, aunque el monto tenga el suyo.
    const reglaSube = [...document.styleSheets]
      .flatMap((h) => [...h.cssRules])
      .find((r) => r instanceof CSSKeyframesRule && r.name === 'fz-tinte-sube') as CSSKeyframesRule;
    expect(reglaSube.cssRules[0]?.cssText).toContain('var(--positivo-texto)');
    dibujar(100);
    expect(destello(nodo)?.getAttribute('data-destello')).toBe('baja');
    expect(estilo(destello(nodo)?.querySelector('[data-centavos]')).animationName).toBe(
      'fz-tinte-baja',
    );
    const reglaBaja = [...document.styleSheets]
      .flatMap((h) => [...h.cssRules])
      .find((r) => r instanceof CSSKeyframesRule && r.name === 'fz-tinte-baja') as CSSKeyframesRule;
    expect(reglaBaja.cssRules[0]?.cssText).toContain('var(--problema-texto)');
    // El texto accesible no cambia por el destello.
    expect(destello(nodo)?.querySelector('.sr-only')?.textContent).toBe('$1.00');
  });

  it('PRU-CMP-PWA-330 [] con movimiento reducido ningún monto destella', () => {
    conMovimientoReducido();
    const { nodo, dibujar } = conMonto(6285);
    dibujar(9000);
    expect(destello(nodo)).toBeNull();
    dibujar(100);
    expect(destello(nodo)).toBeNull();
    expect(nodo.querySelector('[data-centavos]')?.getAttribute('data-centavos')).toBe('100');
  });
});
