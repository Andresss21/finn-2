'use client';
// Entrada de montos (05 §5.2, FE-17): texto con teclado decimal, no `type="number"`. Normaliza al escribir y al
// pegar, maneja el signo aparte y muestra la vista previa. No calcula nada (PF-3) y no evalúa expresiones (P5-12).
// [CH-268] En un `GrupoCampos` o como billete (`variante="total"`) sigue la máscara v3 (C-41, C-45; CAMPOS-V3 §4 y §5): comas
// de miles al escribir, 2 decimales, completa al salir y el máximo en el momento. El valor del formulario va sin comas.
import { useId, useLayoutEffect, useRef, type ChangeEvent, type ClipboardEvent } from 'react';
import { completarDecimales, conMiles, enmascararMonto, formatearMontoTexto } from '../../formato';
import {
  aplicarSigno,
  filtrarTecleo,
  limpiarPegado,
  normalizarMontoEscrito,
  type MotivoInvalido,
  type Signo,
} from '../../formularios/normalizar-monto';
import { base } from '../../textos/base';
import { EntradaTexto, MensajeError, useEnGrupo } from '../base/campo';
import { SelectorSegmentado } from '../base/selector-segmentado';

export interface PropsEntradaMonto {
  readonly nombre: string;
  readonly etiqueta: string;
  /** Texto tal como lo escribió el usuario (estado del formulario); sin valor, se trata como vacío. */
  readonly valor: string | undefined;
  readonly alCambiar: (texto: string) => void;
  readonly conSigno?: boolean;
  readonly signo?: Signo;
  readonly alCambiarSigno?: (signo: Signo) => void;
  readonly etiquetasSigno?: { readonly positivo: string; readonly negativo: string };
  readonly error?: string | undefined;
  readonly descripcion?: string | undefined;
  readonly requerido?: boolean;
  readonly deshabilitado?: boolean;
  readonly enterKeyHint?: 'next' | 'done' | 'go' | 'send' | 'enter';
  /** Texto fijo antes del monto, en color secundario (el «$» del Total en el export S5). */
  readonly prefijo?: string;
  /** Sin la línea «Se entiende como…» (S5 no la tiene). */
  readonly sinVistaPrevia?: boolean;
  /** Fila compacta de una línea de gasto: etiqueta solo para lectores de pantalla y monto a la derecha (K4). */
  readonly compacto?: boolean;
  /** [CH-268] El total del movimiento como billete (CAMPOS-V3 §4): uno por pantalla. */
  readonly variante?: 'fila' | 'total';
}

const MENSAJE: Record<MotivoInvalido, string> = {
  max_dos_decimales: base.montoSeparador,
  mas_de_un_separador: base.montoSeparador,
  demasiado_grande: base.montoMaximo,
};

export function EntradaMonto(props: PropsEntradaMonto) {
  const enGrupo = useEnGrupo();
  return enGrupo || props.variante === 'total' ? (
    <EntradaMontoV3 {...props} />
  ) : (
    <EntradaMontoCaja {...props} />
  );
}

/** Cuántos caracteres que no son comas hay antes de `hasta`: el cursor se conserva al reponer las comas. */
const sinComas = (texto: string, hasta: number): number =>
  texto.slice(0, hasta).replace(/,/g, '').length;

function EntradaMontoV3({
  nombre,
  etiqueta,
  valor: valorRecibido,
  alCambiar,
  error,
  descripcion,
  requerido = false,
  deshabilitado = false,
  enterKeyHint = 'next',
  variante = 'fila',
}: PropsEntradaMonto) {
  const valor = enmascararMonto(valorRecibido ?? '');
  const vista = conMiles(valor);
  const entrada = useRef<HTMLInputElement | null>(null);
  const cursor = useRef<number | undefined>(undefined);
  const id = useId();
  // En el momento: lo que no se arregla escribiendo más (CAMPOS-V3 §5). Lo vacío y el cero los marca quien guarda.
  const mensaje = normalizarMontoEscrito(valor).estado === 'invalido' ? base.montoMaximoV3 : error;

  useLayoutEffect(() => {
    const el = entrada.current;
    if (el === null || cursor.current === undefined || document.activeElement !== el) return;
    let i = 0;
    for (let cuenta = 0; i < vista.length && cuenta < cursor.current; i += 1)
      if (vista[i] !== ',') cuenta += 1;
    el.setSelectionRange(i, i);
    cursor.current = undefined;
  }, [vista]);

  function alEscribir(e: ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    let texto = el.value;
    const posicion = el.selectionStart ?? texto.length;
    // El teclado decimal en coma (Android) escribe el punto: la coma de miles nunca se escribe a mano.
    if ((e.nativeEvent as InputEvent).data === ',' && !texto.includes('.'))
      texto = `${texto.slice(0, posicion - 1)}.${texto.slice(posicion)}`;
    cursor.current = sinComas(texto, posicion);
    alCambiar(enmascararMonto(texto));
  }

  function alPegar(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const { texto } = limpiarPegado(e.clipboardData.getData('text'), false);
    const { selectionStart, selectionEnd } = e.currentTarget;
    const desde = sinComas(vista, selectionStart ?? vista.length);
    const hasta = sinComas(vista, selectionEnd ?? vista.length);
    alCambiar(enmascararMonto(`${valor.slice(0, desde)}${texto}${valor.slice(hasta)}`));
  }

  const comunes = {
    name: nombre,
    type: 'text',
    inputMode: 'decimal',
    autoComplete: 'off',
    enterKeyHint,
    value: vista,
    disabled: deshabilitado,
    ref: entrada,
    onChange: alEscribir,
    onPaste: alPegar,
    onBlur: () => {
      if (valor !== '' && completarDecimales(valor) !== valor) alCambiar(completarDecimales(valor));
    },
  } as const;

  if (variante === 'fila')
    return (
      <EntradaTexto
        etiqueta={etiqueta}
        {...(descripcion === undefined ? {} : { descripcion })}
        {...(mensaje === undefined ? {} : { error: mensaje })}
        requerido={requerido}
        prefijo={base.moneda}
        {...comunes}
      />
    );
  const idAyuda = `${id}-d`;
  const idError = `${id}-e`;
  return (
    <div className="flex flex-col gap-2">
      <div className="campo-billete" {...(mensaje === undefined ? {} : { 'data-error': '' })}>
        <label htmlFor={id} className="campo-billete-rotulo">
          {etiqueta}
        </label>
        <div className="campo-billete-linea">
          <span aria-hidden="true" className="campo-billete-signo">
            {base.moneda}
          </span>
          <input
            id={id}
            className="campo-billete-cifra text-cifra-principal"
            aria-describedby={mensaje === undefined ? idAyuda : `${idAyuda} ${idError}`}
            aria-invalid={mensaje === undefined ? undefined : true}
            aria-required={requerido ? true : undefined}
            {...comunes}
          />
        </div>
        <p id={idAyuda} className="campo-billete-ayuda">
          {descripcion ?? base.comasSolas}
        </p>
      </div>
      {mensaje === undefined ? null : (
        <div id={idError} className="campo-error">
          <MensajeError>{mensaje}</MensajeError>
        </div>
      )}
    </div>
  );
}

function EntradaMontoCaja({
  nombre,
  etiqueta,
  valor: valorRecibido,
  alCambiar,
  conSigno = false,
  signo = 'positivo',
  alCambiarSigno,
  etiquetasSigno = { positivo: '+', negativo: '−' },
  error,
  descripcion,
  requerido = false,
  deshabilitado = false,
  enterKeyHint = 'next',
  prefijo,
  sinVistaPrevia = false,
  compacto = false,
}: PropsEntradaMonto) {
  const valor = valorRecibido ?? '';
  const resultado = normalizarMontoEscrito(valor);
  const errorLocal =
    resultado.estado === 'incompleto'
      ? base.montoIncompleto
      : resultado.estado === 'invalido'
        ? MENSAJE[resultado.motivo]
        : undefined;
  const mensaje = errorLocal ?? error;
  const vista =
    resultado.estado === 'valido' && !sinVistaPrevia && !compacto
      ? formatearMontoTexto(conSigno ? aplicarSigno(resultado.texto, signo) : resultado.texto)
      : undefined;

  function alEscribir(e: ChangeEvent<HTMLInputElement>) {
    alCambiar(filtrarTecleo(e.target.value));
  }

  function alPegar(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const { texto, negativo } = limpiarPegado(e.clipboardData.getData('text'), conSigno);
    const { selectionStart, selectionEnd } = e.currentTarget;
    const desde = selectionStart ?? valor.length;
    const hasta = selectionEnd ?? valor.length;
    alCambiar(filtrarTecleo(`${valor.slice(0, desde)}${texto}${valor.slice(hasta)}`));
    if (negativo && alCambiarSigno !== undefined) alCambiarSigno('negativo');
  }

  // La vista previa viaja en la descripción del campo: queda asociada con aria-describedby (05 §5.2).
  const ayuda = [descripcion, vista === undefined ? undefined : base.montoVistaPrevia(vista)]
    .filter((t) => t !== undefined)
    .join(' ');

  return (
    <div className="flex flex-col gap-2">
      <EntradaTexto
        etiqueta={etiqueta}
        {...(ayuda === '' ? {} : { descripcion: ayuda })}
        {...(mensaje === undefined ? {} : { error: mensaje })}
        requerido={requerido}
        etiquetaOculta={compacto}
        {...(prefijo === undefined ? {} : { prefijo })}
        name={nombre}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint={enterKeyHint}
        value={valor}
        disabled={deshabilitado}
        className={compacto ? 'tabular-nums text-right' : 'tabular-nums'}
        onChange={alEscribir}
        onPaste={alPegar}
      />
      {conSigno && alCambiarSigno !== undefined ? (
        <SelectorSegmentado
          etiqueta={base.signoDelMonto}
          opciones={[
            { valor: 'positivo', etiqueta: etiquetasSigno.positivo },
            { valor: 'negativo', etiqueta: etiquetasSigno.negativo },
          ]}
          valor={signo}
          alCambiar={(v) => {
            alCambiarSigno(v === 'negativo' ? 'negativo' : 'positivo');
          }}
        />
      ) : null}
    </div>
  );
}
