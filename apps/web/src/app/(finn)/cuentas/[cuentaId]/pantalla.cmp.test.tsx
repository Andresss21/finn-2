import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../../../app/globals.css';
import { menuDe } from './acciones';
import { PantallaDetalleCuenta } from './pantalla';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene: se simula `next/link` (el límite
// externo), nunca `enlace-finn`, que otras suites importan de verdad.
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  // `next/link` es CommonJS: el módulo es la propia función, con `useLinkStatus` como propiedad.
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

const activo = {
  inicio: '2027-02-21',
  fin: '2027-03-20',
  dias: 28,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 3,
  diasRestantes: 25,
};

/** Un DTO de `detalleCuenta()` armado a mano: la pantalla solo dibuja lo que trae. */
const dto = (parcial: Record<string, unknown> = {}): DetalleCuentaDto =>
  ({
    revision: 'r1',
    hoy: '2027-02-23',
    periodoActivo: activo,
    periodo: activo,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    cuenta: {
      id: 'visa',
      nombre: 'Visa',
      tipo: 'efectivo',
      fechaApertura: '2027-01-21',
      archivada: false,
    },
    saldo: 0,
    saldoConfirmado: 0,
    navegacion: { anterior: '2027-01-21', siguiente: '2027-03-21' },
    movimientos: [],
    conciliaciones: [],
    programadas: [],
    acciones: {
      puedeArchivar: true,
      bloqueosArchivo: [],
      puedeEliminar: true,
      bloqueosEliminar: [],
    },
    ...parcial,
  }) as unknown as DetalleCuentaDto;

const mostrar = (d: DetalleCuentaDto, filtros: Record<string, string | undefined> = {}) =>
  montar(
    <PantallaDetalleCuenta
      dto={d}
      filtros={filtros}
      desarchivar={sinAccion}
      archivar={sinAccion}
    />,
  );

const sinAccion = () =>
  Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false, avisos: [] });

const fila = (id: string, saldoDespues: number, efecto = -1000) => ({
  id,
  fecha: '2027-02-10',
  tipo: 'gasto',
  comercio: `Comercio ${id}`,
  montoPresentado: efecto,
  efectoEnCuenta: efecto,
  saldoDespues,
  cuentas: [],
  lineas: [],
  estadoBancario: 'confirmada',
  marcas: {
    porCobrar: false,
    conDevoluciones: false,
    conciliada: false,
    programada: false,
    periodoCerrado: false,
  },
});

describe('PRU-CMP-CTA-104 pantalla de detalle de cuenta', () => {
  it('PRU-CMP-CTA-104 [Q-detalleCuenta, AV-07] una tarjeta dibuja deuda, te falta reservar, uso del límite, ciclo y desglose al pagar tal como vienen', () => {
    const raiz = mostrar(
      dto({
        cuenta: {
          id: 'visa',
          nombre: 'T',
          tipo: 'tarjeta',
          fechaApertura: '2027-01-21',
          archivada: false,
        },
        tarjeta: {
          deuda: 7700,
          saldoAFavor: 0,
          reservado: 7000,
          faltaReservar: 700,
          reservaExcedente: 0,
          limite: 250000,
          usoLimite: 308,
          cicloFacturacion: { desde: '2027-02-16', hasta: '2027-03-15' },
          desgloseAlPagar: {
            deudaAnterior: 5000,
            cargosDelCiclo: 2700,
            yaPagado: 0,
            paraNoGenerarIntereses: 7700,
          },
        },
      }),
    );
    const b = raiz.querySelector('[data-bloque="tarjeta"]');
    expect(b?.textContent).toContain('Te falta reservar');
    const montos = [...(b?.querySelectorAll('[data-centavos]') ?? [])].map((m) =>
      m.getAttribute('data-centavos'),
    );
    expect(montos).toEqual(['700', '7000', '7700', '0', '250000', '5000', '2700', '0', '7700']);
    expect(b?.textContent).toContain('16/02/2027 al 15/03/2027');
    expect(b?.textContent).toContain('3.08%');
  });

  it('PRU-CMP-CTA-104 [Q-detalleCuenta] un préstamo sin modelo dice que no hay amortización y con modelo dibuja la tabla del DTO', () => {
    const base = {
      condiciones: {
        contraparte: 'Banco',
        cuotaPactada: 10000,
        plazoCuotas: 60,
      },
      capitalPendiente: 500000,
      comparacion: null,
      costoFinanciero: { interes: 1200, seguro: 300 },
    };
    const sin = mostrar(
      dto({
        cuenta: {
          id: 'p',
          nombre: 'P',
          tipo: 'prestamo',
          fechaApertura: '2027-01-21',
          archivada: false,
        },
        prestamo: { ...base, amortizacion: null },
      }),
    );
    expect(sin.querySelector('[data-bloque="prestamo"]')?.textContent).toContain(
      'Este préstamo no tiene un modelo de cálculo',
    );
    expect(sin.querySelector('table')).toBeNull();

    const con = mostrar(
      dto({
        cuenta: {
          id: 'p',
          nombre: 'P',
          tipo: 'prestamo',
          fechaApertura: '2027-01-21',
          archivada: false,
        },
        prestamo: {
          ...base,
          amortizacion: [
            {
              numero: 1,
              fecha: '2027-02-10',
              interes: 500,
              seguro: 100,
              capital: 9400,
              saldo: 490600,
              estado: 'pagada',
              pagado: 10000,
            },
          ],
        },
      }),
    );
    const fila = con.querySelector('tbody tr');
    expect(fila?.textContent).toContain('Pagada');
    expect(fila?.querySelectorAll('[data-centavos]')).toHaveLength(5);
  });

  it('PRU-CMP-CTA-104 [Q-detalleCuenta] una inversión dibuja valor, aportes, retiros y ajustes del DTO', () => {
    const raiz = mostrar(
      dto({
        cuenta: {
          id: 'i',
          nombre: 'I',
          tipo: 'inversion',
          fechaApertura: '2027-01-21',
          archivada: false,
        },
        inversion: { valor: 300000, aportes: 100000, retiros: 50000, ajustes: -2000 },
      }),
    );
    const montos = [
      ...(raiz.querySelector('[data-bloque="inversion"]')?.querySelectorAll('[data-centavos]') ??
        []),
    ].map((m) => m.getAttribute('data-centavos'));
    expect(montos).toEqual(['100000', '50000', '-2000']);
    const cabecera = raiz.querySelector('[data-identidad="inversion"]');
    expect(cabecera?.querySelector('dt')?.textContent).toBe('Valor');
    expect(cabecera?.querySelector('dd [data-centavos]')?.getAttribute('data-centavos')).toBe(
      '300000',
    );
  });

  it('PRU-CMP-CTA-402 [FT-57] una inversión ofrece Aporte (principal), Retiro y Ajuste a sus flujos, y su lista se llama «Aportes, retiros y ajustes»', () => {
    const raiz = mostrar(
      dto({
        cuenta: {
          id: 'i',
          nombre: 'I',
          tipo: 'inversion',
          fechaApertura: '2027-01-21',
          archivada: false,
        },
        inversion: { valor: 207560, aportes: 200000, retiros: 0, ajustes: 7560 },
      }),
    );
    const accion = (n: string) => raiz.querySelector(`[data-accion="${n}"] a`);
    expect(accion('aporte')?.textContent).toBe('Aporte');
    expect(accion('aporte')?.getAttribute('href')).toBe('/registrar/aporte-inversion?cuenta=i');
    expect(accion('aporte')?.className).toContain('bg-accion ');
    for (const [n, texto] of [
      ['retiro', 'Retiro'],
      ['ajuste', 'Ajuste'],
    ] as const) {
      expect(accion(n)?.textContent).toBe(texto);
      expect(accion(n)?.getAttribute('href')).toBe(`/registrar/${n}-inversion?cuenta=i`);
      expect(accion(n)?.className).toContain('bg-accion-tonal');
    }
    expect(raiz.querySelector('[data-movimientos] h2')?.textContent).toBe(
      'Aportes, retiros y ajustes',
    );
    expect(raiz.querySelector('[data-bloque="inversion"]')?.textContent).toContain('Aportado');
    // Archivada, sin acciones que escriben
    const archivada = mostrar(
      dto({
        cuenta: {
          id: 'i',
          nombre: 'I',
          tipo: 'inversion',
          fechaApertura: '2027-01-21',
          archivada: true,
        },
        inversion: { valor: 0, aportes: 0, retiros: 0, ajustes: 0 },
      }),
    );
    expect(archivada.querySelector('[data-accion="aporte"]')).toBeNull();
  });

  it('PRU-CMP-CTA-104 [CA-52.2, ESC-47] la conciliación de la tarjeta muestra la diferencia aceptada $2.00, la diferencia actual $5.00 con su aviso y el cambio posterior de A', () => {
    const raiz = mostrar(
      dto({
        cuenta: {
          id: 'visa',
          nombre: 'T',
          tipo: 'tarjeta',
          fechaApertura: '2027-01-21',
          archivada: false,
        },
        conciliaciones: [
          {
            id: 'c1',
            fechaEstado: '2027-02-15',
            saldoEstado: -7500,
            terminadaEn: '2027-02-16T16:00:00.000Z',
            diferenciaAceptada: 200,
            diferenciaActual: 500,
            modo: 'estado_cuenta',
            transaccionesConciliadas: 2,
            cambiosPosteriores: [
              {
                registradoEn: '2027-02-16T17:00:00.000Z',
                motivos: ['monto'],
                foto: { fecha: '2027-02-03', montoEfecto: -4000, comercio: 'A' },
              },
            ],
          },
        ],
      }),
    );
    const c = raiz.querySelector('[data-conciliacion="c1"]');
    expect(c?.querySelector('h3')?.textContent).toContain('Estado de cuenta');
    expect(
      c
        ?.querySelector('[data-diferencia="aceptada"] [data-centavos]')
        ?.getAttribute('data-centavos'),
    ).toBe('200');
    expect(
      c?.querySelector('[data-diferencia="actual"] [data-centavos]')?.getAttribute('data-centavos'),
    ).toBe('500');
    const aviso = raiz.querySelector('[data-estado="advertencia"]');
    expect(aviso?.textContent).toContain('Diferencia con el estado de cuenta');
    expect(aviso?.textContent).toContain('15/02/2027');
    expect(aviso?.querySelector('a')?.getAttribute('href')).toBe('#conciliacion-c1');
    expect(c?.textContent).toContain('Diferencia');
    const cambio = c?.querySelector('[data-cambio-posterior]');
    expect(cambio?.textContent).toContain('Cambió el monto');
    expect(cambio?.textContent).toContain('Era: A');
  });

  it('PRU-CMP-CTA-104 [CA-52.2] una verificación de saldo se nombra así y, con la diferencia actual en cero, no muestra el aviso', () => {
    const raiz = mostrar(
      dto({
        conciliaciones: [
          {
            id: 'c2',
            fechaEstado: '2027-02-15',
            saldoEstado: 0,
            terminadaEn: '2027-02-16T16:00:00.000Z',
            diferenciaAceptada: 0,
            diferenciaActual: 0,
            modo: 'saldo',
            transaccionesConciliadas: 1,
            cambiosPosteriores: [],
          },
        ],
      }),
    );
    expect(raiz.querySelector('[data-conciliacion="c2"] h3')?.textContent).toContain(
      'Verificación de saldo',
    );
    expect(raiz.querySelector('[data-estado="advertencia"]')).toBeNull();
    expect(raiz.querySelector('[data-conciliacion="c2"]')?.textContent).toContain('Igual');
  });

  it('PRU-CMP-CTA-104 [CA-52.4] una cuenta archivada deshabilita Pagar, Cuota, Conciliar y Registrar con el motivo en texto y ofrece Desarchivar', () => {
    const raiz = mostrar(
      dto({
        cuenta: {
          id: 'vieja',
          nombre: 'Vieja',
          tipo: 'tarjeta',
          fechaApertura: '2027-01-21',
          archivada: true,
        },
      }),
    );
    for (const nombre of ['Pagar', 'Cuota', 'Conciliar', 'Registrar']) {
      const li = raiz.querySelector(
        `li[data-accion="${nombre === 'Cuota' ? 'cuota' : nombre.toLowerCase()}"]`,
      );
      const boton = li?.querySelector('button');
      expect(boton?.textContent, nombre).toBe(nombre);
      expect(boton?.disabled, nombre).toBe(true);
      expect(li?.textContent, nombre).toContain('La cuenta está archivada');
      expect(li?.querySelector('a'), nombre).toBeNull();
    }
    expect(raiz.querySelector('li[data-accion="desarchivar"] button')?.textContent).toBe(
      'Desarchivar',
    );
    expect(raiz.querySelector('li[data-accion="archivar"]')).toBeNull();
  });

  it('PRU-CMP-CTA-104 [CA-52.4] una cuenta activa enlaza Pagar tarjeta y Registrar y no ofrece Desarchivar', () => {
    const raiz = mostrar(
      dto({
        cuenta: {
          id: 'visa',
          nombre: 'Visa',
          tipo: 'tarjeta',
          fechaApertura: '2027-01-21',
          archivada: false,
        },
      }),
    );
    const hrefs = [...raiz.querySelectorAll('li[data-accion] a')].map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(['/cuentas/visa/pagar', '/registrar/gasto?cuenta=visa']);
    expect(raiz.querySelector('li[data-accion="desarchivar"]')).toBeNull();
  });

  it('PRU-CMP-CTA-104 [CA-52.3] con ?periodo= de un período cerrado el selector ofrece los períodos vecinos y volver al actual, y sin él usa el selector del período activo', () => {
    const cerrado = mostrar(
      dto({
        periodo: {
          inicio: '2027-01-21',
          fin: '2027-02-20',
          dias: 31,
          estado: 'cerrado',
          transicion: false,
        },
        navegacion: { anterior: '2026-12-21', siguiente: '2027-02-21' },
      }),
      { periodo: '2027-01-21' },
    );
    expect(cerrado.querySelector('[data-selector-periodo="cerrado"]')).not.toBeNull();
    // El siguiente es el período activo: su enlace no lleva `?periodo=` (05 §3.4)
    const enlaces = [...cerrado.querySelectorAll('nav a')].map((a) => [
      a.textContent || a.getAttribute('aria-label'),
      a.getAttribute('href'),
    ]);
    expect(enlaces).toEqual([
      ['Período anterior', '/cuentas/visa?periodo=2026-12-21'],
      ['Período siguiente', '/cuentas/visa'],
      ['Ir al período actual', '/cuentas/visa'],
    ]);

    const actual = mostrar(dto());
    expect(actual.querySelector('[data-selector-periodo="activo"]')).not.toBeNull();
    expect(actual.querySelector('a[aria-label="Período anterior"]')?.getAttribute('href')).toBe(
      '/cuentas/visa?periodo=2027-01-21',
    );
  });

  it('PRU-CMP-CTA-104 [CA-52.5] la segunda página sigue el saldo corrido de la primera y conserva los filtros en los enlaces de más y de volver', () => {
    const pagina2 = mostrar(
      dto({
        movimientos: [fila('b', 3000, -1000), fila('a', 4000, -1000)],
        siguienteCursor: 'cursor-3',
      }),
      { tipo: 'gasto', cursor: 'cursor-2' },
    );
    const saldos = [...pagina2.querySelectorAll('[data-saldo-despues]')].map((s) =>
      s.getAttribute('data-saldo-despues'),
    );
    expect(saldos).toEqual(['3000', '4000']);
    const enlaces = [...pagina2.querySelectorAll('[data-movimientos] a')]
      .filter((a) => a.getAttribute('href')?.includes('/cuentas/'))
      .map((a) => [a.textContent, a.getAttribute('href')]);
    expect(enlaces).toEqual([
      ['Quitar filtros', '/cuentas/visa'],
      ['Volver a los más recientes', '/cuentas/visa?tipo=gasto'],
      ['Movimientos anteriores', '/cuentas/visa?tipo=gasto&cursor=cursor-3'],
    ]);
  });

  it('PRU-CMP-CTA-104 [Q-detalleCuenta] cada fila dibuja el efecto y el saldo después que trae el DTO, sin recalcularlos', () => {
    const raiz = mostrar(dto({ movimientos: [fila('a', 12345, -500)] }));
    const li = raiz.querySelector('[data-movimiento="a"]');
    expect(
      li?.querySelector('[data-saldo-despues] [data-centavos]')?.getAttribute('data-centavos'),
    ).toBe('12345');
    expect(li?.querySelector('p [data-centavos]')?.getAttribute('data-centavos')).toBe('-500');
    expect(li?.textContent).toContain('Saldo');
  });

  it('PRU-CMP-CTA-104 sin movimientos dice "Esta cuenta todavía no tiene movimientos"', () => {
    const raiz = mostrar(dto());
    expect(raiz.textContent).toContain('Esta cuenta todavía no tiene movimientos');
  });
});

const cuentaDe = (tipo: string, extra: Record<string, unknown> = {}) => ({
  id: 'k',
  nombre: 'Cuenta corriente',
  tipo,
  institucion: 'Banco Agrícola',
  ultimos4: '3310',
  fechaApertura: '2027-01-21',
  archivada: false,
  ...extra,
});

describe('PRU-CMP-CTA-260 detalle de cuenta portado del export (CH-142)', () => {
  it('PRU-CMP-CTA-260 [CA-52.4, CA-53.2] «Más acciones» de una cuenta de efectivo lista editar, verificar, conciliar, ordenar, archivar y eliminar, y archivar y eliminar bloqueados dicen el motivo del DTO', () => {
    const libre = menuDe(dto({ cuenta: cuentaDe('efectivo') }));
    expect(libre.map((a) => a.etiqueta)).toEqual([
      'Editar',
      'Verificar saldo',
      'Conciliar con estado de cuenta',
      'Ordenar cuentas',
      'Archivar',
      'Eliminar',
    ]);
    expect(libre.map((a) => a.ruta)).toEqual([
      '/cuentas/k/editar',
      '/cuentas/k/verificar-saldo',
      '/cuentas/k/conciliar',
      '/cuentas/ordenar',
      '/cuentas/k/archivar',
      '/cuentas/k/eliminar',
    ]);
    const bloqueada = menuDe(
      dto({
        cuenta: cuentaDe('efectivo'),
        saldo: 128460,
        acciones: {
          puedeArchivar: false,
          bloqueosArchivo: ['cuenta_con_saldo'],
          puedeEliminar: false,
          bloqueosEliminar: ['cuenta_con_movimientos'],
        },
      }),
    );
    const archivar = bloqueada.find((a) => a.etiqueta === 'Archivar');
    expect(archivar?.ruta).toBeUndefined();
    expect(archivar?.motivo).toContain('su saldo debe ser $0.00');
    expect(archivar?.motivo).toContain('$1,284.60');
    const eliminar = bloqueada.find((a) => a.etiqueta === 'Eliminar');
    expect(eliminar?.motivo).toContain('Podés archivarla en lugar de eliminarla');
    expect(eliminar?.peligro).toBe(true);
  });

  it('PRU-CMP-CTA-260 [CA-52.4] en una tarjeta el menú suma Condiciones y en un préstamo no ofrece verificar ni conciliar; archivada, verificar y conciliar quedan deshabilitadas con el motivo', () => {
    const tarjeta = menuDe(dto({ cuenta: cuentaDe('tarjeta') })).map((a) => a.etiqueta);
    expect(tarjeta).toContain('Condiciones');
    const prestamo = menuDe(dto({ cuenta: cuentaDe('prestamo') })).map((a) => a.etiqueta);
    expect(prestamo).toContain('Condiciones');
    expect(prestamo).not.toContain('Verificar saldo');
    const vieja = menuDe(dto({ cuenta: cuentaDe('efectivo', { archivada: true }) }));
    for (const nombre of ['Verificar saldo', 'Conciliar con estado de cuenta']) {
      const a = vieja.find((x) => x.etiqueta === nombre);
      expect(a?.ruta, nombre).toBeUndefined();
      expect(a?.motivo, nombre).toContain('La cuenta está archivada');
    }
    expect(vieja.map((a) => a.etiqueta)).not.toContain('Archivar');
  });

  it('PRU-CMP-CTA-261 [Q-detalleCuenta] la cuenta de efectivo muestra su identidad con rótulo, banco y últimos dígitos, Verificar saldo y Registrar como botones y la diferencia con el estado de cuenta', () => {
    const raiz = mostrar(
      dto({
        cuenta: cuentaDe('efectivo'),
        saldo: 128460,
        saldoConfirmado: 128460,
        conciliaciones: [
          {
            id: 'c1',
            fechaEstado: '2027-02-15',
            saldoEstado: 127220,
            terminadaEn: '2027-02-16T16:00:00.000Z',
            diferenciaAceptada: 0,
            diferenciaActual: 1240,
            modo: 'estado_cuenta',
            transaccionesConciliadas: 2,
            cambiosPosteriores: [],
          },
        ],
      }),
    );
    const cabecera = raiz.querySelector('[data-identidad="efectivo"]');
    expect(cabecera?.textContent).toContain('Banco Agrícola · •••• 3310');
    expect(cabecera?.querySelector('dt')?.textContent).toBe('Saldo');
    expect(cabecera?.querySelector('dd [data-centavos]')?.getAttribute('data-centavos')).toBe(
      '128460',
    );
    expect(
      [...raiz.querySelectorAll('li[data-accion] a')].map((a) => [
        a.textContent,
        a.getAttribute('href'),
      ]),
    ).toEqual([
      ['Verificar saldo', '/cuentas/k/verificar-saldo'],
      ['Registrar', '/registrar/gasto?cuenta=k'],
    ]);
    const aviso = raiz.querySelector('[data-estado="advertencia"]');
    expect(aviso?.textContent).toContain('El estado de cuenta del 15/02/2027 decía $1,272.20');
    expect(aviso?.textContent).toContain('la diferencia es de $12.40');
  });

  it('PRU-CMP-CTA-261 [Q-detalleCuenta] la tarjeta dibuja su cara con la deuda y no lleva el aviso de diferencia de una cuenta sin conciliaciones', () => {
    const raiz = mostrar(
      dto({
        cuenta: cuentaDe('tarjeta', { nombre: 'Visa Oro', ultimos4: '4821' }),
        saldo: -64218,
        tarjeta: {
          deuda: 64218,
          saldoAFavor: 0,
          reservado: 62343,
          faltaReservar: 1875,
          reservaExcedente: 0,
          limite: 250000,
          usoLimite: 2569,
          cicloFacturacion: { desde: '2027-02-16', hasta: '2027-03-15' },
          desgloseAlPagar: {
            deudaAnterior: 51240,
            cargosDelCiclo: 42978,
            yaPagado: -30000,
            paraNoGenerarIntereses: 51240,
          },
        },
      }),
    );
    const cara = raiz.querySelector('[data-identidad="tarjeta"] [data-tarjeta="k"]');
    expect(cara?.textContent).toContain('Visa Oro');
    expect(cara?.textContent).toContain('•••• 4821');
    expect(cara?.querySelector('[data-chip]')).not.toBeNull();
    expect(cara?.querySelector('[data-centavos]')?.getAttribute('data-centavos')).toBe('64218');
    expect(raiz.querySelector('[data-estado="advertencia"]')).toBeNull();
  });

  it('PRU-CMP-CTA-263 [Q-detalleCuenta] el préstamo muestra la próxima cuota con Pagar, cuántas lleva pagadas y las condiciones, y archivado no ofrece pagar la cuota', () => {
    const prestamo = {
      condiciones: {
        contraparte: 'Banco',
        montoOriginal: 600000,
        cuotaPactada: 21000,
        plazoCuotas: 36,
      },
      capitalPendiente: 421000,
      comparacion: null,
      costoFinanciero: { interes: 1200, seguro: 300 },
      amortizacion: [1, 2, 3].map((n) => ({
        numero: n,
        fecha: `2027-0${n}-20`,
        interes: 5000,
        seguro: 350,
        capital: 15650,
        saldo: 400000 - n * 1000,
        estado: n < 3 ? 'pagada' : 'pendiente',
        pagado: n < 3 ? 21000 : 0,
      })),
    };
    const activo = mostrar(dto({ cuenta: cuentaDe('prestamo'), prestamo }));
    const proxima = activo.querySelector('[data-bloque="proxima-cuota"]');
    expect(proxima?.textContent).toContain('Próxima cuota · 3 de 36');
    expect(proxima?.textContent).toContain('Cuotas pagadas 2 de 36');
    expect(proxima?.querySelector('a')?.getAttribute('href')).toBe('/cuentas/k/cuota');
    expect(
      activo.querySelector('[data-bloque="prestamo"]')?.querySelector('a')?.getAttribute('href'),
    ).toBe('/cuentas/k/condiciones');
    expect(activo.querySelector('tbody tr[aria-current="step"]')?.textContent).toContain(
      'Pendiente',
    );
    const vieja = mostrar(dto({ cuenta: cuentaDe('prestamo', { archivada: true }), prestamo }));
    expect(vieja.querySelector('[data-bloque="proxima-cuota"]')).toBeNull();
  });

  it('PRU-CMP-CTA-262 [CA-52.5] la fila de un movimiento dice la fecha, con qué se relaciona y su estado, y una cuenta sin movimientos ofrece Registrar con esta cuenta', () => {
    const raiz = mostrar(
      dto({
        cuenta: cuentaDe('efectivo'),
        movimientos: [
          {
            ...fila('a', 100000, -1235),
            comercio: 'FARMACIA',
            estadoBancario: 'conciliada',
            lineas: [{ destino: { id: 'f', nombre: 'Farmacia', tipo: 'categoria' }, monto: 1235 }],
          },
          {
            ...fila('b', 101235, -30000),
            comercio: 'Pago Visa Oro',
            tipo: 'pago_tarjeta',
            cuentas: [
              { cuenta: { id: 'k', nombre: 'Cuenta corriente' }, monto: -30000 },
              { cuenta: { id: 'v', nombre: 'Visa Oro' }, monto: 30000 },
            ],
          },
          {
            ...fila('c', 131235, -14860),
            lineas: [1, 2, 3].map((n) => ({
              destino: { id: `x${n}`, nombre: `C${n}`, tipo: 'categoria' },
              monto: 100,
            })),
          },
        ],
      }),
    );
    const sub = (id: string) =>
      raiz.querySelector(`[data-movimiento="${id}"] a > span:first-child > span:last-child`)
        ?.textContent;
    expect(sub('a')).toBe('10/02/2027 · Farmacia · conciliada');
    expect(sub('b')).toBe('10/02/2027 · a Visa Oro');
    expect(sub('c')).toBe('10/02/2027 · 3 partes');
    expect(
      [...raiz.querySelectorAll('[data-movimientos] a')]
        .find((a) => a.textContent === 'Ver en Actividad')
        ?.getAttribute('href'),
    ).toBe('/actividad?cuenta=k');

    const vacia = mostrar(dto({ cuenta: cuentaDe('efectivo') }));
    const registrar = [...vacia.querySelectorAll('a')].find(
      (a) => a.textContent === 'Registrar con esta cuenta',
    );
    expect(registrar?.getAttribute('href')).toBe('/registrar/gasto?cuenta=k');
  });
});

describe('PRU-CMP-CTA tabla de amortización', () => {
  it('PRU-CMP-CTA-350 [] el préstamo muestra las cuotas alrededor de la actual, marcada sobre la superficie hundida, y «Ver tabla completa» las muestra todas', async () => {
    const prestamo = {
      condiciones: {
        contraparte: 'Banco',
        montoOriginal: 600000,
        cuotaPactada: 21000,
        plazoCuotas: 12,
      },
      capitalPendiente: 421000,
      comparacion: null,
      costoFinanciero: { interes: 1200, seguro: 300 },
      amortizacion: Array.from({ length: 12 }, (_, i) => ({
        numero: i + 1,
        fecha: '2027-01-20',
        interes: 5000,
        seguro: 350,
        capital: 15650,
        saldo: 400000 - i * 1000,
        estado: i < 5 ? 'pagada' : 'pendiente',
        pagado: i < 5 ? 21000 : 0,
      })),
    };
    const raiz = mostrar(dto({ cuenta: cuentaDe('prestamo'), prestamo }));
    const filas = () => [...raiz.querySelectorAll('[data-bloque="prestamo"] tbody tr')];
    // Seis cuotas (de la 5 a la 10) y la fila del botón.
    expect(filas()).toHaveLength(7);
    expect(filas()[0]?.querySelector('td')?.textContent).toBe('5');
    const actual = raiz.querySelector('tbody tr[aria-current="step"]') as HTMLElement;
    expect(actual.querySelector('td')?.textContent).toBe('6');
    const sonda = document.createElement('span');
    sonda.style.backgroundColor = 'var(--superficie-hundida)';
    document.body.append(sonda);
    expect(getComputedStyle(actual).backgroundColor).toBe(getComputedStyle(sonda).backgroundColor);
    sonda.remove();
    const ver = [...raiz.querySelectorAll('button')].find((b) =>
      b.textContent.startsWith('Ver tabla completa'),
    ) as HTMLButtonElement;
    expect(ver.textContent).toBe('Ver tabla completa (12 cuotas)');
    await act(async () => {
      await userEvent.click(ver);
    });
    expect(filas()).toHaveLength(12);
  });
});
