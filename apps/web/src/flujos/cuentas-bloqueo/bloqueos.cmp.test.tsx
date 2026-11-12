// CTA-05 y CTA-06 (auditoría de diseño): archivar y eliminar bloqueados ofrecen botones, no enlaces subrayados (07 §17: un texto
// o un estado es una CMP). La navegación a la transferencia y al archivado la prueban las E2E de cuentas.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Centavos } from '@finn/dominio/valores';
import '../../app/globals.css';
import { FormularioCuentasArchivar } from '../cuentas-archivar/formulario';
import { FormularioCuentasEliminar } from '../cuentas-eliminar/formulario';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
}));
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
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const accion = () => Promise.resolve({ ok: true } as never);
const botones = (raiz: HTMLElement) =>
  [...raiz.querySelectorAll<HTMLAnchorElement>('[data-acciones-bloqueo] a')].map((a) => ({
    texto: a.textContent,
    href: a.getAttribute('href'),
    alto: a.getBoundingClientRect().height,
  }));

describe('PRU-CMP-CTA-731 bloqueos de archivar y eliminar con botones', () => {
  it('PRU-CMP-CTA-731 archivar con saldo dice «No se puede archivar», guía a transferir y ofrece «Cerrar» y «Transferir el saldo» con el saldo', () => {
    const raiz = montar(
      <FormularioCuentasArchivar
        accion={accion}
        cuentaId="c1"
        nombre="Corriente"
        esTarjeta={false}
        saldo={128460 as Centavos}
        deuda={undefined}
        reservado={undefined}
        bloqueos={['cuenta_con_saldo']}
      />,
    );
    expect(raiz.textContent).toContain('No se puede archivar');
    expect(raiz.textContent).toContain('Pasá el saldo a otra cuenta con una transferencia');
    const b = botones(raiz);
    expect(b.map((x) => x.texto)).toEqual(['Cerrar', 'Transferir el saldo']);
    expect(b[0]?.href).toBe('/cuentas/c1');
    expect(b[1]?.href).toBe('/registrar/transferencia?cuenta=c1&total=1284.60');
    for (const x of b) expect(x.alto).toBeGreaterThanOrEqual(44);
  });

  it('PRU-CMP-CTA-731 eliminar con movimientos ofrece «Cerrar» y «Archivar»; archivada, solo «Cerrar»', () => {
    const props = {
      accion,
      cuentaId: 'c2',
      nombre: 'Ahorro',
      programadas: 0,
      bloqueos: ['cuenta_con_movimientos'],
    };
    const raiz = montar(<FormularioCuentasEliminar {...props} archivada={false} />);
    expect(raiz.textContent).toContain('No se puede eliminar');
    expect(botones(raiz).map((x) => [x.texto, x.href])).toEqual([
      ['Cerrar', '/cuentas/c2'],
      ['Archivar', '/cuentas/c2/archivar'],
    ]);
    const archivada = montar(<FormularioCuentasEliminar {...props} archivada />);
    expect(botones(archivada).map((x) => x.texto)).toEqual(['Cerrar']);
  });
});
