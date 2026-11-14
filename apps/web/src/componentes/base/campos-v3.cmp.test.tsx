// Campos y controles v3 (C-45; docs/anexos/finn-campos-v3/CAMPOS-V3.md §2 a §5 y §12): la fila dentro de `GrupoCampos`, el
// billete del total, las máscaras y los momentos de validación. Los CA-K3-n de PROMPT-CAMPOS.md §5 van en el texto del título.
// El navegador de prueba escribe de verdad; ninguna prueba espera el reloj: las transiciones se terminan con `finish()`.
import axe from 'axe-core';
import type { FechaLocal } from '@finn/dominio/valores';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { CamposDeTipo } from '../../flujos/cuentas-nueva/campos-de-tipo';
import { valoresIniciales, type Campos } from '../../flujos/cuentas-nueva/campos';
import { base } from '../../textos/base';
import { cuentasNuevaTipos } from '../../textos/cuentas-nueva-tipos';
import { DatoFijo } from '../formularios/dato-fijo';
import { EntradaFecha } from '../formularios/entrada-fecha';
import { EntradaMonto } from '../formularios/entrada-monto';
import { EntradaPorcentaje } from '../formularios/entrada-porcentaje';
import { Boton } from './boton';
import { EntradaTexto, GrupoCampos } from './campo';

// Las pruebas operan con el teclado y el puntero reales: las actualizaciones de React llegan fuera de `act`, que solo
// envuelve el montaje y el desmontaje.
const entorno = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
function conAct(accion: () => void): void {
  entorno.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    act(accion);
  } finally {
    entorno.IS_REACT_ACT_ENVIRONMENT = false;
  }
}

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    conAct(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  delete document.documentElement.dataset['theme'];
});

function montar(ui: ReactNode): HTMLElement {
  const nodo = document.createElement('main');
  nodo.style.cssText = 'background: var(--fondo); color: var(--texto); padding: 24px; width: 420px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  conAct(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

/** El valor calculado de un token en el tema actual, leído con la misma propiedad que se compara. */
function token(propiedad: 'color' | 'backgroundColor' | 'boxShadow', nombre: string): string {
  const sonda = document.createElement('div');
  sonda.style[propiedad] = `var(${nombre})`;
  document.body.append(sonda);
  const valor = getComputedStyle(sonda)[propiedad];
  sonda.remove();
  return valor;
}

/** Termina las transiciones en curso: el estado final es el que dice el diseño. */
function terminar(): void {
  for (const a of document.getAnimations()) a.finish();
}

const fila = (el: Element): HTMLElement => el.closest<HTMLElement>('.campo-fila') as HTMLElement;
const rotulo = (el: Element): HTMLElement =>
  fila(el).querySelector<HTMLElement>('.campo-rotulo') as HTMLElement;
const entrada = (raiz: HTMLElement, nombre: string): HTMLInputElement =>
  raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`) as HTMLInputElement;
const descrito = (el: Element): string =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');

function Formulario({ errorNombre }: { readonly errorNombre?: string }) {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('' as FechaLocal);
  const [pct, setPct] = useState('');
  return (
    <GrupoCampos>
      <EntradaTexto
        name="nombre"
        etiqueta="Nombre"
        requerido
        {...(errorNombre === undefined ? {} : { error: errorNombre })}
      />
      <EntradaMonto nombre="monto" etiqueta="Monto" valor={monto} alCambiar={setMonto} requerido />
      <EntradaFecha nombre="fecha" etiqueta="Fecha" valor={fecha} alCambiar={setFecha} requerido />
      <EntradaPorcentaje nombre="tasa" etiqueta="Tasa" valor={pct} alCambiar={setPct} />
      <EntradaTexto name="nota" etiqueta="Nota" descripcion="Hasta 500 caracteres" />
    </GrupoCampos>
  );
}

function Total() {
  const [total, setTotal] = useState('');
  return (
    <EntradaMonto
      nombre="total"
      etiqueta="Total"
      variante="total"
      valor={total}
      alCambiar={setTotal}
      requerido
    />
  );
}

/** Contraste WCAG entre dos colores calculados `rgb(…)`. */
function contraste(a: string, b: string): number {
  const lum = (c: string) => {
    const [r = 0, g = 0, bl = 0] = (c.match(/[\d.]+/g) ?? []).map(Number).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

/** Reglas de las hojas cargadas, con la condición de medios que las envuelve. */
function reglas(): { selector: string; condicion: string; estilo: CSSStyleDeclaration }[] {
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

describe('PRU-CMP-VAL campos v3', () => {
  it('PRU-CMP-VAL-820 [C-45] CA-K3-1: con foco, la fila se levanta (superficie elevada, radio 12, 6 px afuera, relleno 22, elevación 3, rótulo en acción) y ninguna otra fila se mueve', () => {
    const raiz = montar(<Formulario />);
    const filas = [...raiz.querySelectorAll<HTMLElement>('.campo-fila')];
    expect(filas).toHaveLength(5);
    const antes = filas.map((f) => f.getBoundingClientRect().top);
    const monto = entrada(raiz, 'monto');
    const normal = getComputedStyle(fila(monto));
    expect(normal.backgroundColor).toBe(token('backgroundColor', '--superficie'));
    expect(normal.minHeight).toBe('64px');
    expect(normal.paddingLeft).toBe('16px');
    expect(normal.borderBottomWidth).toBe('1px');
    expect(getComputedStyle(rotulo(monto)).color).toBe(token('color', '--texto-secundario'));
    expect(getComputedStyle(rotulo(monto)).fontSize).toBe('12px');
    expect(getComputedStyle(monto).fontSize).toBe('17px');
    conAct(() => {
      monto.focus();
    });
    terminar();
    const e = getComputedStyle(fila(monto));
    expect(e.backgroundColor).toBe(token('backgroundColor', '--superficie-elevada'));
    expect([e.borderTopLeftRadius, e.borderBottomRightRadius]).toEqual(['12px', '12px']);
    expect([e.marginLeft, e.marginRight]).toEqual(['-6px', '-6px']);
    expect([e.paddingLeft, e.paddingRight]).toEqual(['22px', '22px']);
    expect(e.boxShadow).toBe(token('boxShadow', '--elevacion-3'));
    expect(Number(e.zIndex)).toBe(2);
    expect(getComputedStyle(rotulo(monto)).color).toBe(token('color', '--accion'));
    expect(e.outlineStyle).toBe('none');
    expect(filas.map((f) => f.getBoundingClientRect().top)).toEqual(antes);
    for (const otra of filas.filter((f) => f !== fila(monto)))
      expect(getComputedStyle(otra).marginLeft).toBe('0px');
  });

  it('PRU-CMP-VAL-821 [C-45] CA-K3-2: con error, la fila va en problema con el mensaje y su ícono adentro, aria-invalid y aria-describedby; con foco suma el anillo de 2 px', () => {
    const raiz = montar(<Formulario errorNombre="Escribí un nombre." />);
    const nombre = entrada(raiz, 'nombre');
    const f = fila(nombre);
    expect(getComputedStyle(f).backgroundColor).toBe(token('backgroundColor', '--problema-fondo'));
    expect(getComputedStyle(rotulo(nombre)).color).toBe(token('color', '--problema-texto'));
    expect(nombre.getAttribute('aria-invalid')).toBe('true');
    const mensaje = f.querySelector('.campo-error');
    expect(mensaje?.textContent).toBe('Escribí un nombre.');
    expect(mensaje?.querySelector('svg[data-icono="problema"]')).not.toBeNull();
    expect((nombre.getAttribute('aria-describedby') ?? '').split(' ')).toContain(mensaje?.id);
    conAct(() => {
      nombre.focus();
    });
    terminar();
    const e = getComputedStyle(f);
    expect(e.backgroundColor).toBe(token('backgroundColor', '--superficie-elevada'));
    const anillo = token('color', '--problema-borde');
    expect(e.boxShadow.startsWith(`${anillo} 0px 0px 0px 2px`)).toBe(true);
    expect(e.boxShadow).toContain(token('boxShadow', '--elevacion-2'));
    expect(f.querySelector('.campo-error')?.textContent).toBe('Escribí un nombre.');
  });

  it('PRU-CMP-VAL-822 [C-45, C-41] CA-K3-3: el total pone las comas al escribir, corta en 2 decimales, completa al salir y marca en el momento el máximo; el «$» va fuera del input', async () => {
    const raiz = montar(
      <>
        <Total />
        <Formulario />
      </>,
    );
    const total = entrada(raiz, 'total');
    await userEvent.type(total, '1236.456');
    expect(total.value).toBe('1,236.45');
    expect(total.getAttribute('inputmode')).toBe('decimal');
    await userEvent.clear(total);
    await userEvent.type(total, '1236.4');
    await userEvent.tab();
    await expect.poll(() => total.value).toBe('1,236.40');
    await userEvent.clear(total);
    await userEvent.type(total, '25000000');
    expect(total.value).toBe('25,000,000');
    const billete = total.closest('.campo-billete') as HTMLElement;
    expect(billete.textContent).toContain(base.comasSolas);
    expect(document.activeElement).toBe(total);
    expect(total.getAttribute('aria-invalid')).toBe('true');
    expect(descrito(total)).toContain(base.montoMaximoV3);
    // El error va debajo de la caja, fuera de ella.
    expect(billete.querySelector('.campo-error')).toBeNull();
    // En fila, la misma máscara y el «$» fuera del input, en texto terciario.
    const monto = entrada(raiz, 'monto');
    await userEvent.type(monto, '0012345.6');
    expect(monto.value).toBe('12,345.6');
    const prefijo = fila(monto).querySelector('.campo-afijo') as HTMLElement;
    expect(prefijo.textContent).toBe('$');
    expect(getComputedStyle(prefijo).color).toBe(token('color', '--texto-terciario'));
    // La coma del teclado decimal de Android es el punto: no se pierde.
    await userEvent.clear(monto);
    await userEvent.type(monto, '15,5');
    expect(monto.value).toBe('15.5');
  });

  it('PRU-CMP-VAL-823 [C-45, C-41, C-38] CA-K3-4: la fecha pone las barras, marca lo incompleto al salir y la fecha que no existe en el momento; el calendario sigue a la derecha de la fila', async () => {
    const raiz = montar(<Formulario />);
    const fecha = entrada(raiz, 'fecha');
    expect(fecha.getAttribute('inputmode')).toBe('numeric');
    await userEvent.type(fecha, '15102026');
    expect(fecha.value).toBe('15/10/2026');
    await userEvent.clear(fecha);
    await userEvent.type(fecha, '1510');
    expect(descrito(fecha)).not.toContain(base.fechaIncompleta);
    await userEvent.tab();
    await expect.poll(() => descrito(fecha)).toContain(base.fechaIncompleta);
    expect(fila(fecha).dataset['error']).toBe('');
    await userEvent.clear(fecha);
    await userEvent.type(fecha, '31022026');
    expect(document.activeElement).toBe(fecha);
    expect(descrito(fecha)).toContain(base.fechaNoExiste);
    const calendario = fila(fecha).querySelector<HTMLButtonElement>(
      `button[aria-label="${base.abrirCalendario}"]`,
    );
    expect(calendario).not.toBeNull();
    const r = (calendario as HTMLButtonElement).getBoundingClientRect();
    expect([r.width >= 44, r.height >= 44]).toEqual([true, true]);
  });

  it('PRU-CMP-VAL-824 [C-45] CA-K3-15: con forced-colors el foco de la fila agrega un contorno de 2 px; con movimiento reducido no hay transición; si no, 120 ms en sombra, fondo, margen y relleno', () => {
    const raiz = montar(<Formulario />);
    const e = getComputedStyle(fila(entrada(raiz, 'nombre')));
    expect(e.transitionDuration.split(', ').every((d) => d === '0.12s')).toBe(true);
    expect(e.transitionProperty.split(', ')).toEqual([
      'box-shadow',
      'background-color',
      'margin',
      'padding',
    ]);
    const todas = reglas();
    const forzado = todas.find(
      (r) =>
        r.condicion.includes('forced-colors: active') &&
        r.selector.includes('.campo-fila:focus-within'),
    );
    expect(forzado?.estilo.getPropertyValue('outline-width')).toBe('2px');
    expect(forzado?.estilo.getPropertyValue('outline-style')).toBe('solid');
    expect(forzado?.estilo.getPropertyValue('outline-color').toLowerCase()).toBe('canvastext');
    const reducido = todas.find(
      (r) => r.condicion.includes('prefers-reduced-motion: reduce') && r.selector === '.campo-fila',
    );
    expect(reducido?.estilo.getPropertyValue('transition-property')).toBe('none');
  });

  it.each(['claro', 'oscuro'] as const)(
    'PRU-CMP-VAL-825 [C-45] CA-K3-14: en el tema %s el billete usa la marca, los pares de §12 cumplen el contraste y axe no reporta violaciones',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const raiz = montar(
        <>
          <Total />
          <Formulario errorNombre="Escribí un nombre." />
        </>,
      );
      const billete = raiz.querySelector('.campo-billete') as HTMLElement;
      const fondo = getComputedStyle(billete).backgroundColor;
      expect(fondo).toBe(token('backgroundColor', '--marca'));
      // De noche la marca está invertida: el billete es claro.
      const blanco = 'rgb(255, 255, 255)';
      expect(contraste(fondo, blanco) < 2).toBe(tema === 'oscuro');
      expect(contraste(getComputedStyle(billete).color, fondo)).toBeGreaterThanOrEqual(4.5);
      const t = (n: string) => token('color', n);
      const pares: [string, string, number][] = [
        ['--accion', '--superficie-elevada', 4.5],
        ['--problema-texto', '--problema-fondo', 4.5],
        ['--texto-terciario', '--superficie', 4.5],
        ['--accion', '--accion-tonal', 4.5],
        ['--borde-control', '--superficie', 3],
        ['--problema-borde', '--superficie-elevada', 3],
      ];
      for (const [a, b, minimo] of pares)
        expect(contraste(t(a), t(b)), `${a} sobre ${b}`).toBeGreaterThanOrEqual(minimo);
      const { violations } = await axe.run(raiz, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    },
  );

  it('PRU-CMP-VAL-826 [C-45, C-41] un campo de entero no acepta letras, también fuera del grupo y en los de /cuentas/nueva; el porcentaje lleva «%» fijo y su máscara', async () => {
    function Entero() {
      const { register, watch } = useForm({ defaultValues: { diaCorte: '' } });
      return (
        <>
          <EntradaTexto etiqueta="Día de corte" inputMode="numeric" {...register('diaCorte')} />
          <output>{watch('diaCorte')}</output>
        </>
      );
    }
    function Tarjeta() {
      const c: Campos = valoresIniciales('2026-10-15', 'tarjeta');
      const { register } = useForm<Campos>({ defaultValues: c });
      return (
        <CamposDeTipo
          c={c}
          poner={() => () => undefined}
          error={() => undefined}
          register={register}
          institucion={undefined}
        />
      );
    }
    const raiz = montar(
      <>
        <Entero />
        <Tarjeta />
        <Formulario />
      </>,
    );
    const suelto = raiz.querySelector<HTMLInputElement>('input[name="diaCorte"]');
    await userEvent.type(suelto as HTMLInputElement, '1a5e');
    expect(suelto?.value).toBe('15');
    expect(raiz.querySelector('output')?.textContent).toBe('15');
    const diaPago = [...raiz.querySelectorAll<HTMLInputElement>('input')].find(
      (i) => i.labels?.[0]?.textContent.startsWith(cuentasNuevaTipos.diaPago) === true,
    ) as HTMLInputElement;
    await userEvent.type(diaPago, 'x2b8');
    expect(diaPago.value).toBe('28');
    const tasa = entrada(raiz, 'tasa');
    await userEvent.type(tasa, '1005.555');
    expect(tasa.value).toBe('100.55');
    expect(tasa.getAttribute('inputmode')).toBe('decimal');
    const sufijo = fila(tasa).querySelector('.campo-afijo:last-of-type');
    expect(sufijo?.textContent).toBe('%');
    expect(tasa.contains(sufijo)).toBe(false);
  });

  it('PRU-CMP-VAL-827 [C-45] estados de la fila: ayuda y «Opcional» en la etiqueta, solo lectura sin input, deshabilitado apagado; fuera de GrupoCampos el campo se ve como hoy', () => {
    const raiz = montar(
      <>
        <Formulario />
        <GrupoCampos>
          <DatoFijo
            rotulo="Cuenta"
            valor="Visa Oro"
            motivo="La cuenta viene del SMS y no se puede cambiar aquí."
          />
          <EntradaTexto name="apagado" etiqueta="Comercio" requerido disabled />
        </GrupoCampos>
        <EntradaTexto name="suelto" etiqueta="Suelto" requerido />
      </>,
    );
    const nota = entrada(raiz, 'nota');
    expect(nota.labels?.[0]?.textContent).toBe(`Nota${base.opcional}`);
    expect(descrito(nota)).toBe('Hasta 500 caracteres');
    expect(getComputedStyle(fila(nota).querySelector('.campo-ayuda') as Element).fontSize).toBe(
      '13px',
    );
    const fija = raiz.querySelector('[data-dato-fijo="Cuenta"]') as HTMLElement;
    expect(fija.classList.contains('campo-fila')).toBe(true);
    expect(fija.querySelector('input')).toBeNull();
    expect(fija.textContent).toContain(base.soloLectura);
    expect(fija.textContent).toContain('La cuenta viene del SMS y no se puede cambiar aquí.');
    expect(fija.querySelector('svg[data-icono="lock"]')).not.toBeNull();
    const apagado = entrada(raiz, 'apagado');
    expect(fila(apagado).dataset['apagado']).toBe('');
    expect(getComputedStyle(fila(apagado)).cursor).toBe('not-allowed');
    expect(getComputedStyle(rotulo(apagado)).color).toBe(token('color', '--texto-deshabilitado'));
    expect(getComputedStyle(apagado).color).toBe(token('color', '--texto-deshabilitado'));
    // Fuera del grupo, la caja de siempre (06-identidad-visual §2.2): la transición no deja pantallas a medio vestir.
    const suelto = entrada(raiz, 'suelto');
    expect(suelto.closest('.campo-fila')).toBeNull();
    expect(getComputedStyle(suelto).borderBottomWidth).toBe('2px');
    expect(getComputedStyle(suelto).minHeight).toBe('48px');
  });

  it('PRU-CMP-VAL-828 [C-45] CA-K3-13 (base): Guardar apagado sigue siendo tocable con aria-disabled y su motivo; al tocarlo marca los errores y el foco va al primero', async () => {
    const enviar = vi.fn();
    function Guardar() {
      const {
        register,
        handleSubmit,
        formState: { errors },
      } = useForm({ defaultValues: { nombre: '', dia: '' } });
      const n = Object.keys(errors).length;
      return (
        <form noValidate onSubmit={(e) => void handleSubmit(enviar)(e)}>
          <GrupoCampos>
            <EntradaTexto
              etiqueta="Nombre"
              requerido
              {...(errors.nombre?.message === undefined ? {} : { error: errors.nombre.message })}
              {...register('nombre', { required: 'Escribí un nombre.' })}
            />
            <EntradaTexto
              etiqueta="Día"
              inputMode="numeric"
              requerido
              {...(errors.dia?.message === undefined ? {} : { error: errors.dia.message })}
              {...register('dia', { required: 'Escribí el día.' })}
            />
          </GrupoCampos>
          <Boton
            tipo="submit"
            apagado
            motivoDeshabilitado={n > 0 ? base.corregirCampos(n) : 'Escribí el nombre para guardar.'}
          >
            Guardar
          </Boton>
        </form>
      );
    }
    const raiz = montar(<Guardar />);
    const boton = raiz.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(boton.disabled).toBe(false);
    expect(boton.getAttribute('aria-disabled')).toBe('true');
    expect(descrito(boton)).toBe('Escribí el nombre para guardar.');
    // Playwright no toca un `aria-disabled` con el puntero; la persona sí puede, y con el teclado también.
    boton.focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => raiz.querySelectorAll('.campo-fila[data-error]').length).toBe(2);
    expect(enviar).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(entrada(raiz, 'nombre'));
    expect(descrito(boton)).toBe('Corregí 2 campos para guardar.');
    expect(base.corregirCampos(1)).toBe('Corregí 1 campo para guardar.');
  });
});
