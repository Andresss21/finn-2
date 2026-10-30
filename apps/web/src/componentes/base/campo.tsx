// Campo con etiqueta, descripción y error (05 §10.7, 11.10). Genera los ids y asocia todo al control.
import { cloneElement, useId, type InputHTMLAttributes, type ReactElement } from 'react';
import { Input } from '../../components/ui/input';
import { base } from '../../textos/base';
import { Icono } from './icono';
import './base.css';

export interface PropsCampo {
  readonly etiqueta: string;
  readonly descripcion?: string;
  readonly error?: string;
  readonly requerido?: boolean;
  /** El control: recibe `id`, `aria-describedby`, `aria-invalid` y `aria-required`. */
  readonly children: ReactElement<Record<string, unknown>>;
}

export function Campo({ etiqueta, descripcion, error, requerido = false, children }: PropsCampo) {
  const id = useId();
  const idDescripcion = `${id}-d`;
  const idError = `${id}-e`;
  const descritoPor =
    [descripcion === undefined ? '' : idDescripcion, error === undefined ? '' : idError]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className="f-campo">
      <div className="f-etiqueta-fila">
        <label className="f-etiqueta" htmlFor={id}>
          {etiqueta}
        </label>
        {requerido ? null : <span className="f-opcional">{base.opcional}</span>}
      </div>
      {cloneElement(children, {
        id,
        'aria-describedby': descritoPor,
        'aria-invalid': error === undefined ? undefined : true,
        'aria-required': requerido ? true : undefined,
      })}
      {descripcion === undefined ? null : (
        <p id={idDescripcion} className="f-descripcion">
          {descripcion}
        </p>
      )}
      {error === undefined ? null : (
        <p id={idError} className="f-error">
          <Icono nombre="problema" tamano={16} />
          {error}
        </p>
      )}
    </div>
  );
}

export type PropsEntradaTexto = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'required'> &
  Omit<PropsCampo, 'children'>;

/** Entrada de texto con su `Campo`. La etiqueta nunca es el `placeholder`. */
export function EntradaTexto({
  etiqueta,
  descripcion,
  error,
  requerido,
  ...entrada
}: PropsEntradaTexto) {
  return (
    <Campo
      etiqueta={etiqueta}
      {...(descripcion === undefined ? {} : { descripcion })}
      {...(error === undefined ? {} : { error })}
      {...(requerido === undefined ? {} : { requerido })}
    >
      <Input {...entrada} />
    </Campo>
  );
}
