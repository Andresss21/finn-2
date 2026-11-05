// FT-41 Próximos pagos, registro de un toque y omitir (07 §17: un texto o un estado de un componente es una CMP). El formulario dibuja
// lo que trae `formulario({ operacion: 'programada', fechaEsperada })` y arma la entrada de OP-43 y OP-44 con ello: el servidor decide
// la suma, el cuadre y los rechazos (PF-3), y lo prueban la integración y las E2E.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { programadas } from '../../textos/programadas';
import { FormularioOcurrencia, type PropsFormularioOcurrencia } from './formulario';

const t = programadas.ocurrencia;
// `next/link` y `next/navigation` necesitan `process` y el enrutador de Next: se simulan (el enrutado se prueba en E2E).
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace, back: vi.fn() }),
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

const PROGRAMADA = '11111111-1111-4111-8111-111111111111';
const TRANSACCION = '22222222-2222-4222-8222-222222222222';
const MENSAJE_RESUELTA = 'Ese pago programado ya está registrado.';
const ok = () => Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false, avisos: [] });
const base: PropsFormularioOcurrencia = {
  programadaId: PROGRAMADA,
  fechaEsperada: '2027-02-17',
  comercio: 'Cuota del préstamo',
  cuenta: 'Ahorro',
  estado: 'pendiente',
  transaccionId: null,
  textoYaResuelta: MENSAJE_RESUELTA,
  edicion: 'cuota',
  monto: '350.00',
  partes: [{ categoriaId: '33333333-3333-4333-8333-333333333333', categoria: 'Cuota préstamo' }],
  montosDePartes: ['350.00'],
  desglose: { capital: '250.00', interes: '90.00', seguro: '10.00' },
  superpuesto: false,
  accionRegistrar: ok,
  accionOmitir: ok,
};

const campo = (nodo: HTMLElement, nombre: string): HTMLInputElement => {
  const i = nodo.querySelector<HTMLInputElement>(`input[name="${nombre}"]`);
  if (i === null) throw new Error(`no hay el campo ${nombre}`);
  return i;
};
const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent === texto);
  if (b === undefined) throw new Error(`no hay un botón «${texto}»`);
  return b;
};

describe('PRU-CMP-PROG', () => {
  it('PRU-CMP-PROG-120 [CA-41.6] una cuota de préstamo con modelo abre con el desglose propuesto, lo deja editar y registra con el desglose escrito', async () => {
    const accion = vi.fn(ok);
    const nodo = montar(<FormularioOcurrencia {...base} accionRegistrar={accion} />);
    expect(nodo.textContent).toContain(t.desgloseDelModelo);
    expect(campo(nodo, 'capital').value).toBe('250.00');
    expect(campo(nodo, 'interes').value).toBe('90.00');
    expect(campo(nodo, 'seguro').value).toBe('10.00');

    await userEvent.fill(campo(nodo, 'capital'), '255');
    await userEvent.click(boton(nodo, t.registrarMonto('$350.00')));
    expect(accion).toHaveBeenCalledTimes(1);
    expect(accion).toHaveBeenLastCalledWith({
      programadaId: PROGRAMADA,
      fechaEsperada: '2027-02-17',
      monto: '350.00',
      desglose: { capital: '255', interes: '90.00', seguro: '10.00' },
      modo: 'confirmar',
      id: expect.any(String) as string,
    });
  });

  it('PRU-CMP-PROG-121 [CA-41.3] una ocurrencia ya registrada dice que ya está registrada y enlaza a su transacción, sin ofrecer registrarla otra vez', () => {
    const nodo = montar(
      <FormularioOcurrencia {...base} estado="registrada" transaccionId={TRANSACCION} />,
    );
    expect(nodo.textContent).toContain(MENSAJE_RESUELTA);
    const enlace = [...nodo.querySelectorAll('a')].find((a) => a.textContent === t.verTransaccion);
    expect(enlace?.getAttribute('href')).toBe(`/actividad/${TRANSACCION}`);
    expect(nodo.textContent).not.toContain(t.omitir);
    expect(nodo.textContent).not.toContain(t.registrar);
  });

  it('PRU-CMP-PROG-122 [] una ocurrencia omitida lo dice y no enlaza a ninguna transacción', () => {
    const nodo = montar(<FormularioOcurrencia {...base} estado="omitida" />);
    expect(nodo.textContent).toContain(t.omitida);
    expect([...nodo.querySelectorAll('a')]).toHaveLength(0);
  });

  it('PRU-CMP-PROG-123 [] un gasto de varias partes edita el monto de cada una y envía las líneas con su categoría', async () => {
    const accion = vi.fn(ok);
    const A = '44444444-4444-4444-8444-444444444444';
    const B = '55555555-5555-4555-8555-555555555555';
    const nodo = montar(
      <FormularioOcurrencia
        {...base}
        edicion="partes"
        desglose={null}
        partes={[
          { categoriaId: A, categoria: 'Super' },
          { categoriaId: B, categoria: 'Farmacia' },
        ]}
        montosDePartes={['20.00', '5.00']}
        accionRegistrar={accion}
      />,
    );
    await userEvent.fill(campo(nodo, 'partes.1'), '7');
    await userEvent.click(boton(nodo, t.registrar));
    expect(accion).toHaveBeenLastCalledWith({
      programadaId: PROGRAMADA,
      fechaEsperada: '2027-02-17',
      lineas: [
        { categoriaId: A, monto: '20.00' },
        { categoriaId: B, monto: '7' },
      ],
      modo: 'confirmar',
      id: expect.any(String) as string,
    });
  });

  it('PRU-CMP-PROG-124 [] «Omitir» envía solo la programada y la fecha y deja «Omitido» con «Cerrar»', async () => {
    const omitir = vi.fn(ok);
    const nodo = montar(<FormularioOcurrencia {...base} accionOmitir={omitir} />);
    await userEvent.click(boton(nodo, t.omitir));
    expect(omitir).toHaveBeenLastCalledWith({
      programadaId: PROGRAMADA,
      fechaEsperada: '2027-02-17',
      modo: 'confirmar',
    });
    expect(nodo.textContent).toContain(t.omitido('Cuota del préstamo', '17 feb'));
  });
});
