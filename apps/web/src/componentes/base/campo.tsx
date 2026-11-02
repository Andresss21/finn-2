// Campo con etiqueta, descripción y error (05 §10.7, 11.10). Genera los ids y asocia todo al control.
import { cloneElement, useId, type InputHTMLAttributes, type ReactElement } from 'react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { base } from '../../textos/base';
import { Icono } from './icono';

/** Lo que el campo le pasa al control. */
export interface PropsControl {
  readonly id: string;
  readonly 'aria-describedby': string | undefined;
  readonly 'aria-invalid': true | undefined;
  readonly 'aria-required': true | undefined;
}

export interface PropsCampo {
  readonly etiqueta: string;
  readonly descripcion?: string;
  readonly error?: string;
  readonly requerido?: boolean;
  /** El control, o una función que lo arma con las props del campo (cuando el control va dentro de otro componente). */
  readonly children:
    ReactElement<Record<string, unknown>> | ((props: PropsControl) => ReactElement);
}

export function MensajeError({ children }: { readonly children: string }) {
  return (
    <p className="flex items-center gap-1 text-sm text-problema-texto">
      <Icono nombre="problema" tamano={16} />
      {children}
    </p>
  );
}

export function Campo({ etiqueta, descripcion, error, requerido = false, children }: PropsCampo) {
  const id = useId();
  const idDescripcion = `${id}-d`;
  const idError = `${id}-e`;
  const props: PropsControl = {
    id,
    'aria-describedby':
      [descripcion === undefined ? '' : idDescripcion, error === undefined ? '' : idError]
        .filter(Boolean)
        .join(' ') || undefined,
    'aria-invalid': error === undefined ? undefined : true,
    'aria-required': requerido ? true : undefined,
  };
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-2">
        <Label htmlFor={id}>{etiqueta}</Label>
        {requerido ? null : <span className="text-sm text-texto-terciario">{base.opcional}</span>}
      </div>
      {typeof children === 'function' ? children(props) : cloneElement(children, { ...props })}
      {descripcion === undefined ? null : (
        <p id={idDescripcion} className="text-sm text-texto-secundario">
          {descripcion}
        </p>
      )}
      {error === undefined ? null : (
        <div id={idError}>
          <MensajeError>{error}</MensajeError>
        </div>
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

/** Entrada sin etiqueta visible, para listas donde cada fila ya dice qué es: el nombre accesible va en `aria-label`. */
export function EntradaSinEtiqueta(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-label'> & { 'aria-label': string },
) {
  return <Input {...props} />;
}
