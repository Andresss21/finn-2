import axe from 'axe-core';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import type { Centavos } from '@finn/dominio/valores';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { Cabecera } from '../../app/(finn)/cuentas/[cuentaId]/cabecera';
import { CamposDeTipo } from '../../flujos/cuentas-nueva/campos-de-tipo';
import { ElegirTipo } from '../../flujos/cuentas-nueva/elegir-tipo';
import { VistaBilletera } from '../../flujos/cuentas-nueva/vista-billetera';
import { ColorTarjeta } from '../../flujos/cuentas-nueva/color-tarjeta';
import { aEntradaDeAccion, valoresIniciales, type Campos } from '../../flujos/cuentas-nueva/campos';
import { BilleteraTarjetas, CaraConSaldo, type TarjetaDto } from './billetera';
import { COLORES_TARJETA } from './colores-tarjeta';
import { IdentidadCuenta } from './identidad-cuenta';
import { PosicionNeta, type PosicionNetaDto } from './posicion-neta';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene: se simula `next/link`, nunca
// `enlace-finn`, que otras suites importan de verdad.
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
  delete document.documentElement.dataset['theme'];
  document.body.removeAttribute('style');
});

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

function textoAccesible(n: Node): string {
  if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? '';
  if (!(n instanceof Element) || n.getAttribute('aria-hidden') === 'true') return '';
  return [...n.childNodes].map(textoAccesible).join('');
}

const c = (n: number): Centavos => n as Centavos;
const temas = ['claro', 'oscuro'] as const;

const visa: TarjetaDto = {
  cuenta: { id: 'visa', nombre: 'Visa Oro' },
  institucion: 'BAC',
  ultimos4: '4821',
  red: 'Visa',
  color: '#7E6638',
  deuda: c(60718),
  saldoConfirmado: c(60718),
  saldoAFavor: c(0),
  limite: c(250000),
  usoLimite: 2569,
  faltaReservar: c(1875),
  reservaExcedente: c(0),
  proximoCorte: '2026-10-25',
  proximoPago: '2026-11-15',
  paraNoGenerarIntereses: c(37063),
  usoSinReservarBp: 300,
};
const master: TarjetaDto = {
  ...visa,
  cuenta: { id: 'master', nombre: 'Mastercard Clásica' },
  institucion: 'Davivienda',
  ultimos4: '1102',
  red: 'Mastercard',
  color: '#5C6670',
  deuda: c(0),
  faltaReservar: c(0),
  limite: c(100000),
  usoLimite: 0,
  usoSinReservarBp: null,
  paraNoGenerarIntereses: c(0),
};

const posicion: PosicionNetaDto = {
  activos: {
    efectivo: c(150000),
    saldosAFavor: c(2500),
    inversiones: c(80000),
    porCobrar: c(5000),
    total: c(237500),
  },
  deudas: { tarjetas: c(60718), prestamos: c(110000), total: c(170718) },
  neto: c(66782),
  barras: { activosBp: 10000, deudasBp: 7188 },
};

describe('PRU-CMP-CTA-101 cuentas', () => {
  it('PRU-CMP-CTA-101 billetera: la cara de atrás es un botón de 44 px que la trae al frente, sin arrastrar', () => {
    const raiz = montar(<BilleteraTarjetas tarjetas={[visa, master]} />);
    expect(raiz.querySelector('[data-detalle-tarjeta]')?.textContent).toContain(
      'Te falta reservar',
    );
    expect(textoAccesible(raiz)).toContain('$18.75');
    const traer = raiz.querySelector<HTMLButtonElement>('[data-billetera] button');
    expect(traer).not.toBeNull();
    expect(traer?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(traer?.textContent).toContain('Traer al frente. Mastercard Clásica');
    expect(raiz.querySelectorAll('[data-billetera] button').length).toBe(1);
    act(() => {
      traer?.click();
    });
    expect(raiz.querySelector('[data-detalle-tarjeta]')?.textContent).toContain('Sin deuda');
    expect(raiz.querySelector('[data-billetera] button')?.textContent).toContain('Visa Oro');
  });

  it('PRU-CMP-CTA-101 tarjeta: uso del límite con la parte sin reservar rayada y fechas del DTO', () => {
    const raiz = montar(<BilleteraTarjetas tarjetas={[visa]} />);
    const barra = raiz.querySelector('[role="progressbar"]');
    expect(barra?.getAttribute('aria-valuenow')).toBe('25.69');
    expect(barra?.getAttribute('aria-valuetext')).toBe('25.69%');
    expect(raiz.querySelector('[data-segmento="sin-reservar"]')).not.toBeNull();
    const texto = textoAccesible(raiz);
    expect(texto).toContain('Uso del límite de $2,500.00');
    expect(texto).toContain('25/10/2026');
    expect(texto).toContain('15/11/2026');
    expect(texto).toContain('$370.63');
    expect(raiz.textContent).not.toContain('Tocá la tarjeta');
  });

  it('PRU-CMP-CTA-101 tarjeta: saldo a favor, deuda reservada y sin límite', () => {
    const aFavor = montar(
      <BilleteraTarjetas tarjetas={[{ ...master, saldoAFavor: c(2500), limite: c(0) }]} />,
    );
    expect(aFavor.textContent).toContain('Saldo a favor');
    expect(aFavor.querySelector('[role="progressbar"]')).toBeNull();
    const reservada = montar(
      <BilleteraTarjetas tarjetas={[{ ...visa, faltaReservar: c(0), usoSinReservarBp: null }]} />,
    );
    expect(reservada.querySelector('[data-detalle-tarjeta]')?.textContent).toContain(
      'Deuda de tarjeta',
    );
    expect(reservada.querySelector('[data-segmento="sin-reservar"]')).toBeNull();
  });

  it('PRU-CMP-CTA-101 identidad de cuenta: efectivo con diferencia, préstamo con talón, inversión y archivada', () => {
    const raiz = montar(
      <>
        <IdentidadCuenta
          tipo="efectivo"
          fila={{
            cuenta: { id: 'a', nombre: 'Cuenta corriente' },
            institucion: 'BAC',
            ultimos4: '0042',
            saldo: c(150000),
            saldoConfirmado: c(148000),
            ultimaConciliacion: { diferenciaActual: c(500) },
          }}
        />
        <IdentidadCuenta
          tipo="prestamo"
          fila={{
            cuenta: { id: 'p', nombre: 'Préstamo auto' },
            contraparte: 'Banco',
            capitalPendiente: c(900000),
            proximaCuota: { fecha: '2026-10-20', monto: c(21000), numero: 7 },
          }}
        />
        <IdentidadCuenta
          tipo="prestamo"
          fila={{
            cuenta: { id: 'q', nombre: 'Préstamo amigo' },
            contraparte: 'Ana',
            capitalPendiente: c(10000),
          }}
        />
        <IdentidadCuenta
          tipo="inversion"
          fila={{ cuenta: { id: 'i', nombre: 'Fondo' }, valor: c(80000) }}
        />
        <IdentidadCuenta tipo="archivada" fila={{ id: 'z', nombre: 'Vieja' }} />
      </>,
    );
    const [efectivo, prestamo, sinModelo, inversion, archivada] = [
      ...raiz.querySelectorAll('[data-identidad]'),
    ].map(textoAccesible);
    expect(efectivo).toContain('$1,500.00');
    expect(efectivo).toContain('Confirmado $1,480.00');
    expect(efectivo).toContain('Diferencia con el estado de cuenta');
    expect(prestamo).toContain('Cuota7');
    expect(prestamo).toContain('20/10/2026');
    expect(sinModelo).toContain('Sin modelo');
    expect(inversion).toContain('Fondo$800.00');
    expect(archivada).toContain('Archivada');
    expect(
      [...raiz.querySelectorAll('[data-identidad]')].map((e) => e.getAttribute('data-identidad')),
    ).toEqual(['efectivo', 'prestamo', 'prestamo', 'inversion', 'archivada']);
  });

  it('PRU-CMP-CTA-101 posición neta: la mayor al 100 %, deudas rayadas y desglose del DTO', () => {
    const raiz = montar(<PosicionNeta posicion={posicion} />);
    const [a, d] = [...raiz.querySelectorAll('[data-barra-bp]')];
    expect(a?.getAttribute('data-barra-bp')).toBe('10000');
    expect((a as HTMLElement).style.width).toBe('100%');
    expect((d as HTMLElement).style.width).toBe('71.88%');
    expect(d?.className).toContain('repeating-linear-gradient');
    expect(textoAccesible(raiz)).toContain('Posición neta$667.82');
    expect(textoAccesible(raiz)).toContain('Tarjetas $607.18');
  });

  it('PRU-CMP-CTA-230 [CA-51.8] la cara lleva chip, ícono sin contacto, guilloché, red y banco a la derecha; el detalle va en su contenedor con Confirmado, porcentaje y barra en acción', () => {
    const raiz = montar(<BilleteraTarjetas tarjetas={[visa]} />);
    const cara = raiz.querySelector<HTMLElement>('[data-tarjeta="visa"]') as HTMLElement;
    expect(cara.querySelector('[data-chip]')).not.toBeNull();
    expect(cara.querySelectorAll('svg[aria-hidden="true"] path').length).toBe(3);
    expect(getComputedStyle(cara).backgroundImage).toContain('repeating-radial-gradient');
    const [nombre, banco] = [...(cara.children[1]?.children ?? [])];
    expect(nombre?.textContent).toBe('Visa Oro');
    expect(banco?.textContent).toBe('BAC');
    expect(cara.textContent).toContain('Visa · crédito');
    const detalle = raiz.querySelector<HTMLElement>('[data-detalle-tarjeta]') as HTMLElement;
    expect(getComputedStyle(detalle).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(detalle).boxShadow).not.toBe('none');
    expect(textoAccesible(detalle)).toContain('Confirmado $607.18');
    expect(textoAccesible(detalle)).toContain('25.69%');
    const uso = detalle.querySelector('[role="progressbar"] > span') as HTMLElement;
    expect(uso.className).toContain('bg-accion');
    expect(
      (detalle.querySelector('[data-segmento="sin-reservar"]') as HTMLElement).className,
    ).toContain('patron-sin-reservar');
  });

  it('PRU-CMP-CTA-231 con enlazar, la cara del frente es el único enlace al detalle (nombre «Ver detalle de …»); sin enlazar no hay enlaces', () => {
    const con = montar(<BilleteraTarjetas tarjetas={[visa, master]} enlazar />);
    const enlaces = [...con.querySelectorAll('a')];
    expect(enlaces.map((a) => a.getAttribute('href'))).toEqual(['/cuentas/visa']);
    expect(enlaces[0]?.getAttribute('aria-label')).toBe('Ver detalle de Visa Oro');
    expect(enlaces[0]?.querySelector('[data-tarjeta="visa"]')).not.toBeNull();
    act(() => {
      con.querySelector<HTMLButtonElement>('[data-billetera] button')?.click();
    });
    expect(con.querySelector('a')?.getAttribute('href')).toBe('/cuentas/master');
    expect(montar(<BilleteraTarjetas tarjetas={[visa]} />).querySelector('a')).toBeNull();
  });

  it('PRU-CMP-CTA-232 [CA-51.5] la identidad no lleva rótulos SALDO ni CONFIRMADO: nombre en 700, banco · dígitos y el saldo; la diferencia y el confirmado siguen a la vista', () => {
    const raiz = montar(
      <IdentidadCuenta
        tipo="efectivo"
        fila={{
          cuenta: { id: 'a', nombre: 'Cuenta corriente' },
          institucion: 'BAC',
          ultimos4: '0042',
          saldo: c(150000),
          saldoConfirmado: c(148000),
          ultimaConciliacion: { diferenciaActual: c(500) },
        }}
      />,
    );
    const art = raiz.querySelector('[data-identidad="efectivo"]') as HTMLElement;
    expect(art.querySelector('.text-rotulo')).toBeNull();
    const [nombre, detalle] = [...art.querySelectorAll('p')];
    expect(nombre?.textContent).toBe('Cuenta corriente');
    expect(getComputedStyle(nombre as Element).fontWeight).toBe('700');
    expect(detalle?.textContent).toBe('BAC · •••• 0042');
    expect(textoAccesible(art)).not.toMatch(/Saldo/i);
    expect(textoAccesible(art)).toContain('Confirmado $1,480.00');
    expect(textoAccesible(art)).toContain('Diferencia con el estado de cuenta');
  });

  it('PRU-CMP-CTA-232 el préstamo lleva el talón a la derecha con muescas, la inversión sus seis barras y la archivada el candado, sin saldo', () => {
    const raiz = montar(
      <>
        <IdentidadCuenta
          tipo="prestamo"
          fila={{
            cuenta: { id: 'p', nombre: 'Préstamo auto' },
            contraparte: 'Banco',
            capitalPendiente: c(900000),
            proximaCuota: { fecha: '2026-10-20', monto: c(21000), numero: 7 },
          }}
        />
        <IdentidadCuenta
          tipo="inversion"
          fila={{ cuenta: { id: 'i', nombre: 'Fondo' }, valor: c(80000) }}
        />
        <IdentidadCuenta tipo="archivada" fila={{ id: 'z', nombre: 'Vieja' }} />
      </>,
    );
    const [prestamo, inversion, archivada] = [
      ...raiz.querySelectorAll<HTMLElement>('[data-identidad]'),
    ];
    expect(textoAccesible(prestamo as Node)).toContain('Banco · capital pendiente');
    const talon = prestamo?.querySelector('[data-talon]') as HTMLElement;
    expect(getComputedStyle(talon).borderLeftStyle).toBe('dashed');
    expect(Math.round(talon.getBoundingClientRect().width)).toBe(103);
    expect(prestamo?.querySelectorAll('span.rounded-full[aria-hidden="true"]').length).toBe(2);
    expect(inversion?.querySelectorAll('svg rect').length).toBe(6);
    expect(textoAccesible(archivada as Node)).toBe('ViejaArchivada');
    expect(archivada?.querySelector('[data-centavos]')).toBeNull();
  });

  it('PRU-CMP-CTA-233 [CA-51.5] «En camino» va dentro del contenedor de la posición neta y no se dibuja si es cero', () => {
    const con = montar(<PosicionNeta posicion={posicion} enCamino={c(4000)} />);
    const dentro = con.querySelector('[data-posicion-neta] [data-en-camino]');
    expect(dentro?.textContent).toContain('En camino');
    expect(dentro?.textContent).toContain('$40.00');
    expect(
      montar(<PosicionNeta posicion={posicion} />).querySelector('[data-en-camino]'),
    ).toBeNull();
  });

  it.each(temas)('PRU-CMP-CTA-101 axe sin violaciones en el tema %s', async (tema) => {
    document.documentElement.dataset['theme'] = tema;
    const raiz = montar(
      <>
        <BilleteraTarjetas tarjetas={[visa, master]} />
        <IdentidadCuenta
          tipo="efectivo"
          fila={{
            cuenta: { id: 'a', nombre: 'Cuenta corriente' },
            saldo: c(150000),
            saldoConfirmado: c(148000),
            ultimaConciliacion: { diferenciaActual: c(500) },
          }}
        />
        <IdentidadCuenta
          tipo="prestamo"
          fila={{
            cuenta: { id: 'p', nombre: 'Préstamo auto' },
            contraparte: 'Banco',
            capitalPendiente: c(900000),
            proximaCuota: { fecha: '2026-10-20', monto: c(21000), numero: 7 },
          }}
        />
        <IdentidadCuenta
          tipo="inversion"
          fila={{ cuenta: { id: 'i', nombre: 'Fondo' }, valor: c(80000) }}
        />
        <IdentidadCuenta tipo="archivada" fila={{ id: 'z', nombre: 'Vieja' }} />
        <PosicionNeta posicion={posicion} />
      </>,
    );
    const { violations } = await axe.run(raiz, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    });
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });
});

describe('PRU-CMP-CTA-330 cara por el color guardado', () => {
  const cara = (color: string | undefined) => {
    const nodo = montar(
      <CaraConSaldo tarjeta={{ ...visa, ...(color === undefined ? {} : { color }) }} />,
    );
    return nodo.querySelector('[data-tarjeta]') as HTMLElement;
  };

  it('PRU-CMP-CTA-330 [FT-51] la cara de cada uno de los 8 hex usa su token; nulo y un hex desconocido salen oro', () => {
    for (const { nombre, hex } of COLORES_TARJETA) {
      const el = cara(hex);
      expect(el.getAttribute('style')).toContain(`var(--tarjeta-${nombre})`);
      expect(el.getAttribute('style')).toContain(`var(--tarjeta-${nombre}-texto)`);
      expect(el.dataset['color']).toBe(nombre);
    }
    expect(cara(undefined).dataset['color']).toBe('oro');
    expect(cara('#123456').dataset['color']).toBe('oro');
    expect(cara('plata').dataset['color']).toBe('oro');
  });

  it('PRU-CMP-CTA-330 [FT-51, FT-52] el detalle de la tarjeta pinta la cara con el color guardado, y la lista no la reparte por orden', () => {
    const dto = {
      cuenta: { id: 'visa', nombre: 'Visa', tipo: 'tarjeta', archivada: false },
      saldo: c(0),
      tarjeta: { color: '#24509A', deuda: c(100), saldoAFavor: c(0) },
    } as unknown as DetalleCuentaDto;
    const detalle = montar(<Cabecera dto={dto} />);
    expect(detalle.querySelector('[data-tarjeta]')?.getAttribute('data-color')).toBe('zafiro');
    const lista = montar(
      <BilleteraTarjetas
        tarjetas={[
          { ...visa, color: '#2E3138' },
          { ...master, color: '#2E3138' },
        ]}
      />,
    );
    expect(
      [...lista.querySelectorAll('[data-tarjeta]')].map((e) => e.getAttribute('data-color')),
    ).toEqual(['grafito', 'grafito']);
  });
});

describe('PRU-CMP-CTA-331 selector de color de la tarjeta', () => {
  it('PRU-CMP-CTA-331 [FT-50] el selector cambia la vista previa en vivo, empieza en oro y envía el hex canónico', () => {
    let elegido = '';
    function Prueba() {
      const [valor, poner] = useState(valoresIniciales('2027-01-01', 'tarjeta').color);
      elegido = valor;
      return (
        <ColorTarjeta valor={valor} alCambiar={poner} vista={{ nombre: 'Mi Visa', red: 'Visa' }} />
      );
    }
    const nodo = montar(<Prueba />);
    const previa = () =>
      nodo.querySelector('[data-vista-previa] [data-color]')?.getAttribute('data-color');
    expect(previa()).toBe('oro');
    expect(nodo.querySelectorAll('input[type="radio"]')).toHaveLength(8);
    for (const { nombre, hex } of COLORES_TARJETA) {
      const radio = nodo.querySelector(`input[value="${hex}"]`) as HTMLInputElement;
      act(() => {
        radio.click();
      });
      expect(previa()).toBe(nombre);
      expect(radio.checked).toBe(true);
      expect(elegido).toBe(hex);
    }
    const zafiro = '#24509A';
    act(() => {
      (nodo.querySelector(`input[value="${zafiro}"]`) as HTMLInputElement).click();
    });
    const campos: Campos = {
      ...valoresIniciales('2027-01-01', 'tarjeta'),
      nombre: 'Mi Visa',
      saldo: '0',
      limiteCredito: '1500',
      diaCorte: '15',
      diaPago: '5',
      color: elegido,
    };
    expect(aEntradaDeAccion({ ...campos, modo: 'crear', id: 'x' })).toMatchObject({
      color: zafiro,
    });
    expect(nodo.textContent).toContain('Mi Visa');
  });
});

describe('PRU-CMP-CTA-401 identidad de efectivo por el subtipo', () => {
  const fila = (subtipoEfectivo: 'corriente' | 'ahorro' | 'billetera') => ({
    // El nombre dice «Ahorro» a propósito: la identidad nunca sale del nombre (CH-224).
    cuenta: { id: `k-${subtipoEfectivo}`, nombre: 'Ahorro' },
    subtipoEfectivo,
    saldo: c(1000),
    saldoConfirmado: c(1000),
  });
  const detalle = (subtipoEfectivo: 'corriente' | 'ahorro' | 'billetera') =>
    ({
      cuenta: { id: 'k', nombre: 'Ahorro', tipo: 'efectivo', archivada: false, subtipoEfectivo },
      saldo: c(1000),
      saldoConfirmado: c(1000),
    }) as unknown as DetalleCuentaDto;
  const esperado = {
    corriente: { fondo: 'bg-cuenta-banco', icono: 'bank', motivo: 'libreta' },
    ahorro: { fondo: 'bg-cuenta-ahorro', icono: 'coins', motivo: 'anillos' },
    billetera: { fondo: 'bg-cuenta-banco', icono: 'wallet', motivo: 'costura' },
  } as const;

  it('PRU-CMP-CTA-401 [FT-51, FT-52] corriente con libreta, ahorro con anillos y billetera con `wallet` y costura punteada (E2-12), en la lista y en el detalle, por el subtipo del DTO', () => {
    for (const s of ['corriente', 'ahorro', 'billetera'] as const) {
      const lista = montar(<IdentidadCuenta tipo="efectivo" fila={fila(s)} />);
      const cabecera = montar(<Cabecera dto={detalle(s)} />);
      for (const nodo of [lista, cabecera]) {
        const id = nodo.querySelector<HTMLElement>('[data-identidad="efectivo"]');
        expect(id?.dataset['subtipo']).toBe(s);
        expect(id?.className).toContain(esperado[s].fondo);
        expect(id?.querySelector('[data-icono]')?.getAttribute('data-icono')).toBe(
          esperado[s].icono,
        );
        expect(id?.querySelector('[data-motivo]')?.getAttribute('data-motivo') ?? null).toBe(
          esperado[s].motivo,
        );
      }
    }
    // Sin subtipo (una fila de antes de CH-224), corriente.
    const { cuenta, saldo, saldoConfirmado } = fila('ahorro');
    const vieja = montar(
      <IdentidadCuenta tipo="efectivo" fila={{ cuenta, saldo, saldoConfirmado }} />,
    );
    expect(vieja.querySelector('[data-motivo]')?.getAttribute('data-motivo')).toBe('libreta');
  });
});

describe('PRU-CMP-CTA-711 alta de préstamo por secciones', () => {
  function AltaPrestamo(): ReactNode {
    const { register, watch } = useForm<Campos>({
      defaultValues: valoresIniciales('2027-02-05', 'prestamo', ''),
    });
    return (
      <CamposDeTipo
        c={watch()}
        poner={() => () => undefined}
        error={() => undefined}
        register={register}
        institucion={undefined}
      />
    );
  }

  it('PRU-CMP-CTA-711 el préstamo se divide en «El préstamo», «Cuotas» y «Condiciones · opcional» plegada, con el aviso de que no hay modelo', () => {
    const raiz = montar(<AltaPrestamo />);
    const titulos = [...raiz.querySelectorAll('h2, summary')].map((x) => x.textContent);
    expect(titulos).toEqual(['El préstamo', 'Cuotas', 'Condiciones · opcional']);
    const condiciones = raiz.querySelector<HTMLDetailsElement>(
      'details[data-seccion="condiciones"]',
    );
    expect(condiciones?.open).toBe(false);
    expect(condiciones?.textContent).toContain('no tiene un modelo de cálculo');
    expect(raiz.querySelector('[data-seccion="Cuotas"]')?.textContent).toContain('Cuota pactada');
    expect(raiz.querySelector('[data-seccion="El préstamo"]')?.textContent).toContain(
      'Quién te prestó',
    );
  });

  it('PRU-CMP-CTA-711 el monto original queda donde OP-01 lo exige (en «El préstamo») y no en la sección plegada', () => {
    const raiz = montar(<AltaPrestamo />);
    expect(raiz.querySelector('[data-seccion="El préstamo"]')?.textContent).toContain(
      'Monto original',
    );
    expect(raiz.querySelector('details[data-seccion="condiciones"]')?.textContent).not.toContain(
      'Monto original',
    );
  });

  it('PRU-CMP-CTA-711 la inversión pide el rendimiento como opcional e informativo', () => {
    function AltaInversion(): ReactNode {
      const { register, watch } = useForm<Campos>({
        defaultValues: valoresIniciales('2027-02-05', 'inversion', ''),
      });
      return (
        <CamposDeTipo
          c={watch()}
          poner={() => () => undefined}
          error={() => undefined}
          register={register}
          institucion={undefined}
        />
      );
    }
    const raiz = montar(<AltaInversion />);
    const campo = raiz.querySelector('input');
    expect(campo?.getAttribute('aria-describedby')).not.toBeNull();
    expect(raiz.textContent).toContain('Rendimiento anual esperado (%)');
    expect(raiz.textContent).toContain('Opcional');
    expect(raiz.textContent).toContain('Solo informativo: Finn no proyecta el valor.');
  });

  it('PRU-CMP-CTA-711 [CA-E6-18] el tipo se elige en cuatro tarjetas con ícono de 44 px o más y elegir una avisa el tipo', () => {
    const elegidos: string[] = [];
    const raiz = montar(
      <ElegirTipo
        valor="efectivo"
        alCambiar={(t) => {
          elegidos.push(t);
        }}
      />,
    );
    const grupo = raiz.querySelector('[role="radiogroup"]');
    expect(grupo?.getAttribute('aria-label')).toBe('Tipo de cuenta');
    const tarjetas = [...raiz.querySelectorAll<HTMLElement>('[data-tipo-cuenta]')];
    expect(tarjetas.map((x) => x.dataset['tipoCuenta'])).toEqual([
      'efectivo',
      'tarjeta',
      'prestamo',
      'inversion',
    ]);
    for (const x of tarjetas) {
      expect(x.querySelector('[data-icono]')).not.toBeNull();
      expect(x.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    }
    expect(raiz.querySelector<HTMLInputElement>('input[value="efectivo"]')?.checked).toBe(true);
    act(() => {
      raiz.querySelector<HTMLInputElement>('input[value="prestamo"]')?.click();
    });
    expect(elegidos).toEqual(['prestamo']);
  });

  it('PRU-CMP-CTA-711 «Así se va a ver» dibuja la billetera con su costura y el monto escrito, y sin nombre no inventa uno', () => {
    const raiz = montar(<VistaBilletera nombre="Billetera" saldo="40" />);
    const vista = raiz.querySelector('[data-vista-billetera]');
    expect(vista?.textContent).toContain('Así se va a ver');
    expect(vista?.textContent).toContain('Billetera');
    expect(vista?.textContent).toContain('$40.00');
    expect(vista?.querySelector('[data-motivo="costura"]')).not.toBeNull();
    expect(vista?.querySelector('[data-icono="wallet"]')).not.toBeNull();
    const vacia = montar(<VistaBilletera nombre="  " saldo="" />);
    expect(vacia.textContent).not.toContain('$');
  });
});
