// [CH-281] C-50b en la Bandeja (`docs/anexos/finn-aviso-de-resultado/AVISO-DE-RESULTADO.md` §3, §7 y §8): aprobar con un
// toque y descartar dejan la etiqueta de resultado pegada arriba de la fila, la fila se queda los ms de `--duracion-aviso` y se
// recoge. Las Server Actions se simulan en el límite (`servidor/acciones/bandeja`); el reloj es simulado (07 §7.1). Soltar sobre
// una categoría usa el mismo camino con «Soltaste …» antes de la frase y lo recorre la E2E. Los CA-A-n van en el título.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import type { MovimientoDto } from '../../../componentes/dominio/movimiento-bandeja';
import { aprobarMovimiento, descartarMovimiento } from '../../../servidor/acciones/bandeja';
import { ListaBandeja } from './lista';

vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../../servidor/acciones/bandeja', () => ({
  aprobarMovimiento: vi.fn(),
  descartarMovimiento: vi.fn(),
  resolverCoincidencia: vi.fn(),
  reprocesarSms: vi.fn(),
  aprobarTodos: vi.fn(),
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
  vi.mocked(aprobarMovimiento).mockReset();
  vi.mocked(descartarMovimiento).mockReset();
});

const movimiento = (id: string, comercio: string, monto: number): MovimientoDto => ({
  id,
  estado: 'pendiente',
  sms: { texto: `Compra ${comercio}` },
  cuenta: { nombre: 'Visa Oro' },
  fecha: '2027-02-20',
  monto: monto as MovimientoDto['monto'],
  tipoPropuesto: 'gasto',
  comercio,
  categoriaSugerida: { nombre: 'Supermercado', porRegla: false },
  aprobacion: { posible: true, faltantes: [] },
});
const SUPER = movimiento('m1', 'SUPER SELECTOS ESCALON', 3500);
const FARMACIA = movimiento('m2', 'FARMACIA SAN NICOLAS', 1250);
const CONTADORES = {
  pendientes: 2,
  conCoincidencia: 0,
  posiblesDuplicados: 0,
  noReconocidos: 0,
  errores: 0,
};
const ok = (valor: unknown) => Promise.resolve({ ok: true, valor, yaAplicada: false, avisos: [] });

function montar(movimientos: readonly MovimientoDto[]): { nodo: HTMLElement; raiz: Root } {
  const nodo = document.createElement('main');
  nodo.style.cssText = 'width: 600px; padding-top: 40px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <ListaBandeja
        contadores={CONTADORES}
        elegibles={movimientos.map((m) => m.id)}
        movimientos={movimientos}
      />,
    );
  });
  montados.push({ raiz, nodo });
  return { nodo, raiz };
}
/** La revalidación: la lista ya no trae los que se resolvieron. */
function revalidar(raiz: Root, movimientos: readonly MovimientoDto[]): void {
  act(() => {
    raiz.render(
      <ListaBandeja
        contadores={CONTADORES}
        elegibles={movimientos.map((m) => m.id)}
        movimientos={movimientos}
      />,
    );
  });
}
const q = (s: string) => document.querySelector(s) as HTMLElement;
const boton = (nombre: string) =>
  [...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === nombre) ??
  null;
async function tocar(b: HTMLElement | null): Promise<void> {
  await act(async () => {
    b?.focus();
    b?.click();
    await vi.advanceTimersByTimeAsync(0);
  });
}
const avanzar = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe('PRU-CMP-BAND-890 la etiqueta de resultado en la Bandeja', () => {
  it('PRU-CMP-BAND-890 [C-50] CA-A-10 y CA-A-11: aprobar SUPER SELECTOS ESCALON con un toque deja la fila 3000 ms resaltada con «Aprobado» y «Ver transacción» pegada al borde de arriba, la mitad afuera y entera, con −$35.00 a la vista; anuncia la frase; después se recoge y el foco pasa a la fila siguiente', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.mocked(aprobarMovimiento).mockReturnValue(
      ok({
        transaccionId: 't1',
        aprobado: {
          total: 3500,
          comercio: 'SUPER SELECTOS ESCALON',
          cuenta: { nombre: 'Visa Oro' },
          destino: { categoria: { nombre: 'Supermercado' } },
        },
      }) as never,
    );
    const { raiz } = montar([SUPER, FARMACIA]);
    await tocar(boton('Aprobar SUPER SELECTOS ESCALON −$35.00'));
    revalidar(raiz, [FARMACIA]);

    const fila = q('[data-fila-sale="m1"]');
    expect(fila.querySelector('[data-resaltada]')).not.toBeNull();
    const et = q('[data-etiqueta="m1"]');
    expect(et.dataset['posicion']).toBe('arriba');
    expect(et.textContent).toBe('AprobadoVer transacción');
    expect(et.querySelector('a')?.getAttribute('href')).toBe('/actividad/t1');
    expect(et.querySelector('a')?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    const r = et.getBoundingClientRect();
    const tarjeta = q('ul[aria-label]');
    expect(fila).toBe(tarjeta.firstElementChild);
    expect(getComputedStyle(tarjeta).overflow).toBe('visible');
    expect(r.top).toBeLessThan(tarjeta.getBoundingClientRect().top);
    expect(r.bottom).toBeGreaterThan(fila.getBoundingClientRect().top);
    expect(getComputedStyle(fila).borderTopLeftRadius).toBe(
      getComputedStyle(tarjeta).borderTopLeftRadius,
    );
    const monto = q('[data-movimiento="m1"] [data-centavos]');
    expect(monto.textContent).toContain('$35.00');
    const m = monto.getBoundingClientRect();
    expect(r.bottom <= m.top || r.right <= m.left || r.left >= m.right).toBe(true);
    expect(q('[data-anuncio="bandeja"]').textContent).toBe(
      'Aprobado: SUPER SELECTOS ESCALON · $35.00 · Visa Oro · Supermercado',
    );
    expect(document.querySelectorAll('[aria-live], [role="status"]')).toHaveLength(1);

    avanzar(2999);
    expect(fila.hasAttribute('data-recogiendo')).toBe(false);
    avanzar(1);
    expect(fila.hasAttribute('data-recogiendo')).toBe(true);
    avanzar(400);
    expect(document.querySelector('[data-fila-sale="m1"]')).toBeNull();
    expect(document.activeElement?.closest('[data-fila-sale="m2"]')).not.toBeNull();
  });

  it('PRU-CMP-BAND-890 [C-50] CA-A-12: descartar deja «Descartado» con «Restaurar» y anuncia «Descartado: FARMACIA SAN NICOLAS · $12.50»; «Restaurar» manda OP-39 y la etiqueta se quita; si no, la fila se recoge a los 3000 ms', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.mocked(descartarMovimiento).mockReturnValue(
      ok({ movimientoId: 'm2', estado: 'descartado' }) as never,
    );
    const { raiz } = montar([SUPER, FARMACIA]);
    await tocar(boton('Descartar FARMACIA SAN NICOLAS −$12.50'));
    revalidar(raiz, [SUPER]);
    const et = q('[data-etiqueta="m2"]');
    expect(et.textContent).toBe('DescartadoRestaurar');
    expect(q('[data-anuncio="bandeja"]').textContent).toBe(
      'Descartado: FARMACIA SAN NICOLAS · $12.50',
    );
    await tocar(et.querySelector('button'));
    expect(descartarMovimiento).toHaveBeenLastCalledWith(
      expect.objectContaining({ movimientoId: 'm2', accion: 'restaurar' }),
    );
    expect(document.querySelector('[data-etiqueta]')).toBeNull();

    await tocar(boton('Descartar SUPER SELECTOS ESCALON −$35.00'));
    revalidar(raiz, []);
    expect(q('[data-etiqueta="m1"]').textContent).toBe('DescartadoRestaurar');
    avanzar(3400);
    expect(document.querySelector('[data-fila-sale="m1"]')).toBeNull();
  });
});
