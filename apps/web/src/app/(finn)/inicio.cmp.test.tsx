// FT-08, lo visual de Inicio frente al diseño (S1 del export y la entrega 2, bloque 15; 06-identidad-visual §4). La pantalla dibuja
// lo que trae `inicio()`: las pruebas le dan un DTO armado a mano y miden el resultado en un navegador real, con los estilos de verdad.
// Los montos y las acciones de la E2E (PRU-E2E-INICIO) no se repiten acá.
import type { InicioDto } from '@finn/aplicacion/consultas/inicio';
import type { Centavos } from '@finn/dominio/valores';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../globals.css';
import { ResumenListoParaAsignar } from '../../componentes/dominio/billete';
import { CLAVE_BILLETE_VISTO } from '../../componentes/dominio/cifras-billete';
import { ProveedorEncabezado } from '../../componentes/marco/proveedor-encabezado';
import { inicio as t } from '../../textos/inicio';
import { PantallaInicio } from './pantalla-inicio';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene: se simula `next/link`, nunca `enlace-finn`.
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

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<ProveedorEncabezado>{ui}</ProveedorEncabezado>);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const centavos = (n: number) => n as Centavos;
const vacio = {
  sobregiradas: [],
  faltaReservar: [],
  pagosExcedentes: [],
  reservaExcedente: [],
  proximosPagos: [],
  pagosAtrasados: [],
  metasVencidas: [],
  archivadasConDisponible: [],
  hallazgosRitmo: [],
  pagosTarjetaProximos: [],
  bandeja: {},
  cambiosRetroactivos: [],
};
/** Un DTO de A.7 reducido: los montos son los del diseño (S1) y no se calculan nada entre sí. */
const dto = (cambios: Partial<Omit<InicioDto, 'atencion'>> & { atencion?: object } = {}) =>
  ({
    revision: 'r1',
    hoy: '2027-02-05',
    periodoActivo: { inicio: '2027-01-21', fin: '2027-02-20', diasRestantes: 15 },
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    lpa: centavos(31240),
    enCamino: centavos(4000),
    lpaNegativo: false,
    reduccionProyectadaAlCierre: centavos(0),
    primerosPasos: null,
    patrimonio: {
      activos: centavos(652020),
      deudas: centavos(485218),
      neto: centavos(166802),
    },
    recientes: [],
    ...cambios,
    atencion: { ...vacio, ...cambios.atencion },
  }) as unknown as InicioDto;

const rect = (e: Element | null | undefined) => {
  if (!e) throw new Error('falta el elemento');
  return e.getBoundingClientRect();
};
const color = (e: Element | null | undefined) => getComputedStyle(e as Element).color;
const enlace = (nodo: HTMLElement, texto: string): HTMLAnchorElement => {
  const a = [...nodo.querySelectorAll('a')].find((x) => x.textContent.includes(texto));
  if (a === undefined) throw new Error(`no hay un enlace «${texto}»`);
  return a;
};

describe('PRU-CMP-INICIO', () => {
  it('PRU-CMP-INICIO-220 [CA-08.11] el billete lleva debajo el botón principal de 52 px con el monto del DTO, y con Listo para asignar negativo "Quitar" a Presupuesto', () => {
    const nodo = montar(
      <ResumenListoParaAsignar
        variante="billete"
        lpa={centavos(31240)}
        enCamino={centavos(0)}
        lpaNegativo={false}
        accion={{ href: '/presupuesto?filtro=sin-fondos', texto: t.asignar('$312.40') }}
      />,
    );
    const billete = nodo.querySelector('[data-resumen-lpa="billete"]');
    const boton = enlace(nodo, t.asignar('$312.40'));
    expect(rect(boton).height).toBeCloseTo(52, 0);
    expect(rect(boton).width).toBeCloseTo(rect(billete).width, 0);
    expect(rect(boton).top).toBeGreaterThanOrEqual(rect(billete?.firstElementChild).bottom);
    expect(boton.getAttribute('href')).toBe('/presupuesto?filtro=sin-fondos');
    const negativo = montar(
      <ResumenListoParaAsignar
        variante="billete"
        lpa={centavos(-8615)}
        enCamino={centavos(0)}
        lpaNegativo
        accion={{ href: '/presupuesto', texto: t.quitar('$86.15') }}
      />,
    );
    expect(enlace(negativo, t.quitar('$86.15')).getAttribute('href')).toBe('/presupuesto');
  });

  it('PRU-CMP-INICIO-221 [CA-08.12] "En camino" va sin el nombre del deudor y el resplandor azul queda debajo de la tarjeta, no sobre su guilloché', () => {
    const nodo = montar(
      <ResumenListoParaAsignar
        variante="billete"
        lpa={centavos(31240)}
        enCamino={centavos(4000)}
        lpaNegativo={false}
      />,
    );
    const enCamino = nodo.querySelector('[data-en-camino]')?.textContent ?? '';
    expect(enCamino).toContain('En camino $40.00');
    expect(enCamino).not.toMatch(/·|debe/);
    const billete = nodo.querySelector('[data-resumen-lpa="billete"]');
    const resplandor = billete?.querySelector('[data-resplandor]');
    expect(resplandor).not.toBeNull();
    const tarjeta = billete?.querySelector('[data-tarjeta-billete]');
    expect(tarjeta).not.toBeNull();
    expect(tarjeta?.contains(resplandor ?? null)).toBe(false);
    expect(rect(resplandor).bottom).toBeGreaterThan(rect(tarjeta).bottom);
  });

  it('PRU-CMP-INICIO-222 [CA-08.1] cada fila de atención es de 68 px: círculo de 36 px con el glifo, el nombre del estado en su color, el monto del mismo color a la derecha y el chevrón; el sobregiro sigue sin monto a la vista (PF-2)', () => {
    const nodo = montar(
      <PantallaInicio
        dto={dto({
          atencion: {
            faltaReservar: [{ tarjeta: { id: 't-1', nombre: 'Visa Oro' }, monto: centavos(1875) }],
            sobregiradas: [
              {
                categoria: { id: 'c-1', nombre: 'Restaurantes' },
                grupo: { id: 'g-1', nombre: 'Gastos' },
                sobregiro: {
                  tipo: 'debito',
                  total: centavos(2630),
                  parteDebito: centavos(2630),
                  parteTarjeta: centavos(0),
                },
              },
            ],
            hallazgosRitmo: [
              {
                clave: 'h-1',
                categoria: { id: 'c-2', nombre: 'Gama' },
                estado: 'advertencia',
                exceso: centavos(10500),
                sobregiroActual: centavos(0),
                fin: '2027-02-20',
                accion: { tipo: 'asignar' },
              },
            ],
          },
        })}
      />,
    );
    const fila = nodo.querySelector('a[href="/cuentas/t-1"]');
    expect(rect(fila).height).toBeGreaterThanOrEqual(68);
    const circulo = fila?.querySelector('svg')?.parentElement;
    expect([rect(circulo).width, rect(circulo).height]).toEqual([36, 36]);
    const estado = fila?.querySelector('[data-estado]');
    const monto = fila?.querySelector('[data-centavos]');
    expect(estado?.textContent).toBe('Te falta reservar');
    expect(color(monto)).toBe(color(estado));
    expect(rect(monto).left).toBeGreaterThan(rect(estado).right);
    const chevron = [...(fila?.querySelectorAll('svg') ?? [])].at(-1);
    expect(rect(chevron).left).toBeGreaterThan(rect(monto).right);
    // Sobregiro: sin monto en el resumen y, al tocar, el monto.
    const sobregiro = nodo.querySelector<HTMLDetailsElement>('details[data-sobregiro="c-1"]');
    expect(sobregiro?.querySelector('summary [data-centavos]')).toBeNull();
    expect(rect(sobregiro?.querySelector('summary svg')?.parentElement).width).toBe(36);
    act(() => {
      if (sobregiro) sobregiro.open = true;
    });
    expect(sobregiro?.querySelector('[data-centavos]')).not.toBeNull();
    // La acción del hallazgo es un enlace sin subrayado, como en la entrega 2.
    const accion = nodo.querySelector('[data-hallazgo] a');
    expect(getComputedStyle(accion as Element).textDecorationLine).toBe('none');
  });

  it('PRU-CMP-INICIO-223 [CA-08.8] con los Primeros pasos a la vista y nada que atender sigue "Todo al día"; sin "Quedan N días" y con "Ver cómo se compone" a la derecha y sin subrayado', () => {
    const nodo = montar(
      <PantallaInicio
        dto={dto({ primerosPasos: { cuenta: true, categorias: false, sms: false } })}
      />,
    );
    expect(nodo.querySelector('[data-todo-al-dia]')).not.toBeNull();
    expect(nodo.textContent).not.toMatch(/Quedan? \d+ d[ií]as?/);
    const ver = enlace(nodo, t.verDetalle);
    expect(ver.getAttribute('href')).toBe('/presupuesto/listo-para-asignar');
    expect(getComputedStyle(ver).textDecorationLine).toBe('none');
    expect(rect(ver).height).toBeGreaterThanOrEqual(44);
    const main = nodo.querySelector('main');
    expect(rect(main).right - rect(ver).right).toBeLessThan(24);
    const conAtraso = montar(
      <PantallaInicio
        dto={dto({
          atencion: {
            pagosAtrasados: [
              {
                programada: { id: 'p-1', nombre: 'Renta' },
                fechaEsperada: '2027-02-01',
                monto: centavos(5000),
                cuenta: { id: 'a-1', nombre: 'Corriente' },
                tipo: 'gasto',
                registroAutomatico: false,
                atrasada: true,
              },
            ],
          },
        })}
      />,
    );
    expect(conAtraso.querySelector('[data-todo-al-dia]')).toBeNull();
    expect(conAtraso.querySelector('[data-pago-atrasado]')?.textContent).toContain('Renta');
  });

  it('PRU-CMP-INICIO-224 [CA-08.4] Patrimonio es una fila de al menos 64 px al estilo del diseño: el desglose a la izquierda, el monto del DTO a la derecha y el chevrón, enlazada a Cuentas', () => {
    const nodo = montar(<PantallaInicio dto={dto()} />);
    const fila = nodo.querySelector('a[href="/cuentas"]');
    expect(rect(fila).height).toBeGreaterThanOrEqual(64);
    expect(getComputedStyle(fila as Element).textDecorationLine).toBe('none');
    const desglose = [...(fila?.querySelectorAll('span') ?? [])].find((s) =>
      s.textContent.startsWith(t.patrimonio.activos),
    );
    const neto = fila?.querySelector('[data-patrimonio]');
    expect(neto?.textContent).toContain('$1,668.02');
    expect(rect(neto).left).toBeGreaterThan(rect(desglose).right);
    const chevron = [...(fila?.querySelectorAll('svg') ?? [])].at(-1);
    expect(rect(chevron).left).toBeGreaterThanOrEqual(rect(neto).right);
  });

  it('PRU-CMP-INICIO-226 [CA-08.6, CA-62.3] con la acción del lector, "Asignar" del hallazgo de ritmo es un botón que manda OP-14 con el monto nuevo y lo asignado del DTO, y después ofrece "Deshacer"', async () => {
    const accion = vi.fn(() =>
      Promise.resolve({ ok: true as const, valor: {}, avisos: [], yaAplicada: false }),
    );
    const nodo = montar(
      <PantallaInicio
        asignar={accion}
        dto={dto({
          atencion: {
            hallazgosRitmo: [
              {
                clave: 'h-1',
                categoria: { id: 'c-2', nombre: 'Gama' },
                estado: 'advertencia',
                exceso: centavos(10500),
                sobregiroActual: centavos(0),
                fin: '2027-02-20',
                accion: { tipo: 'asignar', montoNuevo: centavos(25500), esperado: centavos(15000) },
              },
            ],
          },
        })}
      />,
    );
    const boton = (texto: string) => {
      const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent.includes(texto));
      if (b === undefined) throw new Error(`no hay botón «${texto}»`);
      return b;
    };
    expect(nodo.querySelector('[data-hallazgo] a[href^="/presupuesto/asignar"]')).toBeNull();
    await act(async () => {
      boton(t.hallazgo.asignar('$105.00')).click();
      await Promise.resolve();
    });
    expect(accion).toHaveBeenLastCalledWith(
      expect.objectContaining({
        categoriaId: 'c-2',
        periodoInicio: '2027-01-21',
        montoNuevo: '255.00',
        esperado: { monto: '150.00' },
      }),
    );
    await act(async () => {
      boton(t.deshacer).click();
      await Promise.resolve();
    });
    expect(accion).toHaveBeenLastCalledWith(
      expect.objectContaining({
        categoriaId: 'c-2',
        periodoInicio: '2027-01-21',
        montoNuevo: '150.00',
        esperado: { monto: '255.00' },
      }),
    );
  });
});

describe('PRU-CMP-INICIO billete que rueda una vez por sesión', () => {
  const billete = () => (
    <ResumenListoParaAsignar
      lpa={centavos(31240)}
      enCamino={centavos(0)}
      lpaNegativo={false}
      variante="billete"
    />
  );
  const digitos = (nodo: HTMLElement) => [
    ...nodo.querySelectorAll<HTMLElement>('[data-centavos] [aria-hidden="true"] > span'),
  ];

  it('PRU-CMP-INICIO-300 [] el billete rueda en la primera entrada de la sesión y no en la segunda', () => {
    sessionStorage.removeItem(CLAVE_BILLETE_VISTO);
    const primera = montar(billete());
    expect(primera.querySelector('[data-rueda]')).not.toBeNull();
    expect(
      digitos(primera)
        .slice(0, 3)
        .map((d) => d.style.animationDelay),
    ).toEqual(['0ms', '90ms', '180ms']);
    expect(getComputedStyle(digitos(primera)[1] as HTMLElement).animationName).toBe(
      'finn-cifra-rueda',
    );
    expect(sessionStorage.getItem(CLAVE_BILLETE_VISTO)).not.toBeNull();
    const segunda = montar(billete());
    expect(segunda.querySelector('[data-rueda]')).toBeNull();
    expect(getComputedStyle(digitos(segunda)[1] as HTMLElement).animationName).toBe('none');
    expect(segunda.querySelector('.sr-only')?.textContent).toBe('$312.40');
    sessionStorage.removeItem(CLAVE_BILLETE_VISTO);
  });

  it('PRU-CMP-INICIO-300 [] sin sessionStorage el billete se dibuja entero y sin error', () => {
    const lectura = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });
    const nodo = montar(billete());
    expect(nodo.querySelector('[data-rueda]')).toBeNull();
    expect(
      digitos(nodo)
        .map((d) => d.textContent)
        .join(''),
    ).toBe('$312.40');
    lectura.mockRestore();
  });
});

/** Reglas de las hojas de estilo cargadas, aplanadas dentro de `@media`, con su condición. */
function reglasCss(): { selector: string; condicion: string; estilo: CSSStyleDeclaration }[] {
  const salida: { selector: string; condicion: string; estilo: CSSStyleDeclaration }[] = [];
  const recorrer = (lista: CSSRuleList, condicion: string) => {
    for (const r of Array.from(lista)) {
      if (r instanceof CSSStyleRule)
        salida.push({ selector: r.selectorText, condicion, estilo: r.style });
      else if (r instanceof CSSMediaRule) recorrer(r.cssRules, r.conditionText);
      else if ('cssRules' in r) recorrer((r as CSSGroupingRule).cssRules, condicion);
    }
  };
  for (const hoja of Array.from(document.styleSheets)) recorrer(hoja.cssRules, '');
  return salida;
}

describe('PRU-CMP-INICIO enlaces de encabezado', () => {
  it('PRU-CMP-INICIO-310 [] los enlaces de encabezado «Programadas» y «Actividad» llevan arrowR, que se mueve 4 px al pasar el puntero', () => {
    const nodo = montar(
      <PantallaInicio
        dto={dto({
          atencion: {
            proximosPagos: [
              {
                programada: { id: 'p-1', nombre: 'Internet' },
                fechaEsperada: '2027-02-10',
                cuenta: { id: 'c-1', nombre: 'Ahorro' },
                monto: centavos(3500),
                registroAutomatico: false,
              },
            ],
          },
        })}
      />,
    );
    const a = enlace(nodo, t.programadas);
    expect(a.querySelector('[data-icono="arrowR"]')).not.toBeNull();
    const hover = reglasCss().find(
      (r) => r.selector.includes(':hover') && r.selector.includes('[data-icono="arrowR"]'),
    );
    expect(hover?.estilo.transform).toBe('translateX(4px)');
    expect(hover?.condicion).toContain('hover: hover');
    // Las flechas de los círculos del selector de período (con su propio nombre accesible) no se mueven.
    expect(hover?.selector).toContain(':not([aria-label])');
  });
});
