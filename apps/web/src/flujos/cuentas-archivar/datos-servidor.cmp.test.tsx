// CH-252 (E2-14, E2-15): lo que el servidor agrega a las previsualizaciones de Cuentas. Archivar una tarjeta dice el monto y los
// períodos que «Devolverlas» vuelve a Listo para asignar, y verificar el saldo de una tarjeta dice la deuda en Finn. La pantalla
// solo formatea lo que trae la propuesta (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { Centavos } from '@finn/dominio/valores';
import '../../app/globals.css';
import { FormularioVerificarSaldo } from '../cuentas-verificar-saldo/formulario';
import { FormularioCuentasArchivar } from './formulario';

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
async function montar(ui: ReactNode): Promise<HTMLElement> {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(ui);
    return Promise.resolve();
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const respuesta = (valor: unknown) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });
const vista = (extra: Record<string, unknown> = {}) => ({
  revisionVista: 'r1',
  huellaImpacto: 'h1',
  impacto: { deltaLpa: 5000 },
  avisos: [],
  rechazos: [],
  ...extra,
});
const DEVUELTAS = '$50.00 de 01/05–31/07 vuelven a Listo para asignar';

describe('PRU-CMP-CTA-792 archivar una tarjeta con asignaciones futuras', () => {
  it('PRU-CMP-CTA-792 [FT-53] «Devolverlas» dice el monto y los períodos de la propuesta y lo sigue diciendo al elegir «Dejarlas», aunque el servidor rechace; sin propuesta no lo dice', async () => {
    const propuesta = {
      asignacionesFuturas: { monto: 5000, desde: '2027-05-01', hasta: '2027-07-31' },
    };
    const accion = vi.fn((e: unknown) =>
      respuesta(
        (e as { devolverAsignacionesFuturas?: boolean }).devolverAsignacionesFuturas === false
          ? vista({
              huellaImpacto: null,
              impacto: null,
              rechazos: [{ codigo: 'reserva_tarjeta_no_cero' }],
              propuesta,
            })
          : vista({ propuesta }),
      ),
    );
    const props = {
      cuentaId: 'c1',
      nombre: 'Visa Oro',
      esTarjeta: true,
      saldo: 0 as Centavos,
      deuda: 0 as Centavos,
      reservado: 0 as Centavos,
      bloqueos: [] as string[],
    };
    const nodo = await montar(<FormularioCuentasArchivar accion={accion} {...props} />);
    expect(nodo.textContent).toContain(DEVUELTAS);
    await userEvent.click(nodo.querySelector('[role="radio"][value="dejar"]') as HTMLElement);
    expect(accion).toHaveBeenCalledTimes(2);
    expect(nodo.textContent).toContain(DEVUELTAS);

    const sin = await montar(
      <FormularioCuentasArchivar accion={vi.fn(() => respuesta(vista()))} {...props} />,
    );
    expect(sin.textContent).toContain('Devolverlas a Listo para asignar');
    expect(sin.textContent).not.toContain('vuelven a Listo para asignar');
  });
});

describe('PRU-CMP-CTA-793 verificar el saldo de una tarjeta', () => {
  const base = {
    cuentaId: 'c1',
    hoy: '2027-03-10' as never,
    fecha: '2027-03-10',
    cantidad: 0,
    candidatas: [],
  };
  const verDiferencia = async (nodo: HTMLElement, rotulo: string) => {
    const etiqueta = [...nodo.querySelectorAll('label')].find((l) =>
      l.textContent.includes(rotulo),
    ) as HTMLLabelElement;
    await userEvent.fill(etiqueta.control as HTMLInputElement, '175');
    await userEvent.click(
      [...nodo.querySelectorAll('button')].find(
        (b) => b.textContent === 'Ver diferencia',
      ) as HTMLElement,
    );
  };

  it('PRU-CMP-CTA-793 [FT-44] una tarjeta dice «Deuda en Finn al 10/03/2027: $170.00» con la deudaFinn de la propuesta; una cuenta de efectivo dice el saldo de Finn', async () => {
    const tarjeta = await montar(
      <FormularioVerificarSaldo
        {...base}
        accion={vi.fn(() =>
          respuesta(
            vista({
              propuesta: { saldoFinn: -17000, diferencia: -500, marcaria: 0, deudaFinn: 17000 },
            }),
          ),
        )}
        cuenta="Visa Oro"
        tarjeta
      />,
    );
    await verDiferencia(tarjeta, 'Deuda que muestra tu banco');
    await vi.waitFor(() => {
      expect(tarjeta.querySelector('[data-saldo-finn]')?.textContent).toBe(
        'Deuda en Finn al 10/03/2027: $170.00',
      );
    });

    const efectivo = await montar(
      <FormularioVerificarSaldo
        {...base}
        accion={vi.fn(() =>
          respuesta(vista({ propuesta: { saldoFinn: 17000, diferencia: 500, marcaria: 0 } })),
        )}
        cuenta="Cuenta corriente"
        tarjeta={false}
      />,
    );
    await verDiferencia(efectivo, 'Saldo que muestra tu banco');
    await vi.waitFor(() => {
      expect(efectivo.querySelector('[data-saldo-finn]')?.textContent).toBe(
        'Saldo de Finn al 10/03/2027: $170.00',
      );
    });
  });
});
