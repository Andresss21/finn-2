// FT-61 Gasto semanal (06 FT-61; 04 §6.9.3; 07 §17: un texto, un estado o el foco de un componente es una CMP). La pantalla dibuja
// lo que trae el DTO de `reporte({ tipo: 'gasto_semanal' })`: la referencia, el porcentaje y la diferencia salen del motor (PF-3).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ReporteDto } from '@finn/aplicacion/consultas/reporte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { PantallaReporte, type Nombres, type Parametros } from './pantalla';

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
  document.documentElement.removeAttribute('data-theme');
});

const c = (n: number) => Math.round(n * 100);
const desde = ['2027-04-21', '2027-04-28', '2027-05-05', '2027-05-12', '2027-05-19'];
const hasta = ['2027-04-27', '2027-05-04', '2027-05-11', '2027-05-18', '2027-05-20'];
const dias = [7, 7, 7, 7, 2];
const REF = [81.67, 81.66, 81.67, 81.67, 23.33];
const REF_ACUM = [81.67, 163.33, 245, 326.67, 350];
const GASTO = [92.4, 71.15, 88.6, 35, 0];
const ACUM = [92.4, 163.55, 252.15, 287.15, 287.15];

/** Supermercado de A.7 (04 §6.9.3): 5 semanas, la 4 en curso y la 5 futura. */
const supermercado = {
  categoria: 'k-super',
  asignado: c(350),
  nueva: false,
  semanas: desde.map((d, i) => ({
    k: i + 1,
    desde: d,
    hasta: hasta[i],
    dias: dias[i],
    futura: i === 4,
    gasto: c(GASTO[i] ?? 0),
    referencia: c(REF[i] ?? 0),
    gastoAcumulado: c(ACUM[i] ?? 0),
    referenciaAcumulada: c(REF_ACUM[i] ?? 0),
    anteriores: i === 4 ? [] : [{ periodo: '2027-03-21', gasto: c(70) }],
  })),
  semanaActual: { k: 4, porcentajeReferenciaBp: 4286 },
  diferenciaReferencia: c(39.52),
};
const negativa = {
  categoria: 'k-ajuste',
  asignado: c(-20),
  nueva: true,
  semanas: desde.map((d, i) => ({
    k: i + 1,
    desde: d,
    hasta: hasta[i],
    dias: dias[i],
    futura: i === 4,
    gasto: c(i === 3 ? 10 : 0),
    referencia: 0,
    gastoAcumulado: c(i >= 3 ? 10 : 0),
    referenciaAcumulada: 0,
    anteriores: [],
  })),
  semanaActual: { k: 4, porcentajeReferenciaBp: null },
  diferenciaReferencia: c(-10),
};
const periodo = (inicio: string, fin: string, estado: string) => ({
  inicio,
  fin,
  dias: 30,
  estado,
  transicion: false,
  ...(estado === 'activo' ? { diasTranscurridos: 25, diasRestantes: 5 } : {}),
});
const dto = (categorias: unknown[], navegacion: object = { anterior: '2027-03-21' }) =>
  ({
    revision: 'r1',
    hoy: '2027-05-15',
    periodoActivo: periodo('2027-04-21', '2027-05-20', 'activo'),
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    periodo: periodo('2027-04-21', '2027-05-20', 'activo'),
    navegacion,
    categorias,
  }) as unknown as ReporteDto;
const NOMBRES = {
  cuentas: [],
  grupos: [],
  categorias: [
    { id: 'k-super', nombre: 'Supermercado' },
    { id: 'k-ajuste', nombre: 'Ajuste' },
    { id: 'k-otra', nombre: 'Gasolina' },
  ],
} as unknown as Nombres;

const mostrar = (datos: ReporteDto, parametros: Parametros = {}): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <PantallaReporte url="gasto-semanal" dto={datos} nombres={NOMBRES} parametros={parametros} />,
    );
  });
  montados.push({ raiz, nodo });
  return nodo;
};
// `Monto` repite el texto para lectores de pantalla: se lee el visible (`aria-hidden`).
const textoDe = (nodo: Element | null | undefined): string =>
  nodo?.querySelector('[data-centavos] [aria-hidden="true"]')?.textContent ??
  nodo?.textContent ??
  '';
const celda = (raiz: HTMLElement, k: number, col: string): string =>
  textoDe(raiz.querySelector(`[data-fila="${k}"] [data-col="${col}"]`));

describe('PRU-CMP-REP-170 gasto semanal', () => {
  it('PRU-CMP-REP-170 [CA-61.1, CA-61.6] Supermercado de A.7: cinco semanas con sus referencias, «43 % de la referencia», «Vas $39.52 por debajo» y la referencia a esta semana $326.67', () => {
    const raiz = mostrar(dto([supermercado]));
    expect(raiz.querySelectorAll('[data-fila]')).toHaveLength(5);
    expect([1, 2, 3, 4, 5].map((k) => celda(raiz, k, 'referencia'))).toEqual([
      '$81.67',
      '$81.66',
      '$81.67',
      '$81.67',
      '$23.33',
    ]);
    expect(raiz.querySelector('[data-porcentaje]')?.textContent).toBe('43 % de la referencia');
    expect(raiz.querySelector('[data-diferencia]')?.textContent).toBe('Vas $39.52 por debajo');
    expect(raiz.querySelector('[data-resumen]')?.textContent).toContain(
      'Referencia a esta semana$326.67',
    );
    expect(raiz.querySelector('[data-resumen]')?.textContent).toContain('$287.15');
  });

  it('PRU-CMP-REP-171 [CA-61.4] la semana futura figura sin barra, con «faltan 2 días» y marcada como futura en la tabla', () => {
    const raiz = mostrar(dto([supermercado]));
    const futura = raiz.querySelector('[data-grafico="barras"] [data-punto="5"]');
    expect(futura?.querySelectorAll('rect')).toHaveLength(1);
    expect(futura?.getAttribute('data-punto')).toBe('5');
    expect(celda(raiz, 5, 'semana')).toContain('futura');
    expect(celda(raiz, 4, 'semana')).toContain('en curso');
  });

  it('PRU-CMP-REP-172 [CA-61.2, CA-61.7] con asignado negativo las referencias son $0.00, hay aviso y no se muestra el porcentaje', () => {
    const raiz = mostrar(dto([negativa]));
    expect([1, 2, 3, 4, 5].map((k) => celda(raiz, k, 'referencia'))).toEqual(
      Array(5).fill('$0.00'),
    );
    expect(raiz.textContent).toContain('Lo asignado es negativo: la referencia queda en $0.00.');
    expect(raiz.querySelector('[data-porcentaje]')).toBeNull();
    expect(raiz.querySelector('[data-diferencia]')?.textContent).toBe('Vas $10.00 por encima');
  });

  it('PRU-CMP-REP-173 [CA-61.3] una categoría nueva dice «Categoría nueva» y no compara; las demás muestran las semanas anteriores del DTO', () => {
    const raiz = mostrar(dto([supermercado, negativa]));
    const nueva = raiz.querySelector('[data-categoria="k-ajuste"]');
    expect(nueva?.textContent).toContain('Categoría nueva');
    expect(nueva?.querySelector('[data-fila="1"] [data-col="anteriores"]')?.textContent).toBe('—');
    const conAnteriores = raiz.querySelector('[data-categoria="k-super"]');
    expect(conAnteriores?.textContent).not.toContain('Categoría nueva');
    expect(textoDe(conAnteriores?.querySelector('[data-fila="1"] [data-col="anteriores"]'))).toBe(
      '$70.00',
    );
  });

  it('PRU-CMP-REP-174 [CA-61.1] el selector de período y las categorías son enlaces: la flecha lleva al período anterior y cada categoría agrega o quita la suya', () => {
    const raiz = mostrar(dto([supermercado]), { categorias: 'k-super' });
    const anterior = raiz.querySelector('a[aria-label="Período anterior"]');
    expect(anterior?.getAttribute('href')).toBe(
      '/reportes/gasto-semanal?categorias=k-super&periodo=2027-03-21',
    );
    const enlaces = [...raiz.querySelectorAll('nav[aria-label="Categorías"] a')];
    const super_ = enlaces.find((a) => a.textContent === 'Supermercado');
    const otra = enlaces.find((a) => a.textContent === 'Gasolina');
    expect(super_?.getAttribute('aria-current')).toBe('true');
    expect(super_?.getAttribute('href')).toBe('/reportes/gasto-semanal');
    expect(otra?.getAttribute('href')).toBe('/reportes/gasto-semanal?categorias=k-super%2Ck-otra');
  });

  it('PRU-CMP-REP-175 [CA-61.1] la pantalla no tiene violaciones de axe en claro ni en oscuro', async () => {
    for (const tema of ['claro', 'oscuro']) {
      document.documentElement.setAttribute('data-theme', tema);
      const raiz = mostrar(dto([supermercado, negativa]));
      const resultado = await axe.run(raiz);
      expect(
        resultado.violations.map((v) => `${tema}: ${v.id} ${v.nodes[0]?.html.slice(0, 120)}`),
      ).toEqual([]);
      act(() => {
        montados[0]?.raiz.unmount();
      });
      montados.shift()?.nodo.remove();
    }
  });
});
