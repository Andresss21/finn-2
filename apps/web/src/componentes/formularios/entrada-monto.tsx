'use client';
// Entrada de montos (05 §5.2, FE-17): texto con teclado decimal, no `type="number"`. Normaliza al escribir y al
// pegar, maneja el signo aparte y muestra la vista previa. No calcula nada (PF-3) y no evalúa expresiones (P5-12).
import type { ChangeEvent, ClipboardEvent } from 'react';
import { formatearMontoTexto } from '../../formato';
import {
  aplicarSigno,
  filtrarTecleo,
  limpiarPegado,
  normalizarMontoEscrito,
  type MotivoInvalido,
  type Signo,
} from '../../formularios/normalizar-monto';
import { base } from '../../textos/base';
import { EntradaTexto } from '../base/campo';
import { SelectorSegmentado } from '../base/selector-segmentado';

export interface PropsEntradaMonto {
  readonly nombre: string;
  readonly etiqueta: string;
  /** Texto tal como lo escribió el usuario (estado del formulario). */
  readonly valor: string;
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
}

const MENSAJE: Record<MotivoInvalido, string> = {
  max_dos_decimales: base.montoSeparador,
  mas_de_un_separador: base.montoSeparador,
  demasiado_grande: base.montoMaximo,
};

export function EntradaMonto({
  nombre,
  etiqueta,
  valor,
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
}: PropsEntradaMonto) {
  const resultado = normalizarMontoEscrito(valor);
  const errorLocal =
    resultado.estado === 'incompleto'
      ? base.montoIncompleto
      : resultado.estado === 'invalido'
        ? MENSAJE[resultado.motivo]
        : undefined;
  const mensaje = errorLocal ?? error;
  const vista =
    resultado.estado === 'valido'
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
        name={nombre}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint={enterKeyHint}
        value={valor}
        disabled={deshabilitado}
        className="tabular-nums"
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
