// Campo con etiqueta, descripción y error (05 §10.7, 11.10). Genera los ids y asocia todo al control.
// [CH-268] Dentro de `GrupoCampos` el campo es una fila de la familia v3 (C-45, CAMPOS-V3 §2 y §3, clases en globals.css);
// fuera de él se ve como hasta ahora, para que ninguna pantalla quede a medio vestir mientras se migran (PR 2 a 6).
import {
  cloneElement,
  createContext,
  useContext,
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { cn } from '../../components/ui/utils';
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
  readonly error?: string | undefined;
  readonly requerido?: boolean;
  /** Sin el «Opcional» junto a la etiqueta: donde todo es opcional (los filtros). */
  readonly sinOpcional?: boolean;
  /** La etiqueta solo para lectores de pantalla: filas compactas donde el contexto ya dice qué es (export S5). */
  readonly etiquetaOculta?: boolean;
  /** [CH-268] Fila apagada (CAMPOS-V3 §3): rótulo, valor e ícono en texto deshabilitado. */
  readonly deshabilitado?: boolean;
  /** El control, o una función que lo arma con las props del campo (cuando el control va dentro de otro componente). */
  readonly children:
    ReactElement<Record<string, unknown>> | ((props: PropsControl) => ReactElement);
}

const EnGrupo = createContext(false);

/** [CH-268] ¿El campo es una fila de un `GrupoCampos`? Las entradas cambian de forma y de máscara dentro del grupo. */
export const useEnGrupo = (): boolean => useContext(EnGrupo);

/** [CH-268] Un grupo de filas por bloque de datos (CAMPOS-V3 §2): superficie, radio 16 y elevación 1. */
export function GrupoCampos({
  etiqueta,
  children,
}: {
  readonly etiqueta?: string;
  readonly children: ReactNode;
}) {
  return (
    <div
      className="grupo-campos"
      {...(etiqueta === undefined ? {} : { role: 'group', 'aria-label': etiqueta })}
    >
      <EnGrupo.Provider value>{children}</EnGrupo.Provider>
    </div>
  );
}

export function MensajeError({ children }: { readonly children: string }) {
  return (
    <p className="flex items-center gap-1 text-sm text-problema-texto">
      <Icono nombre="problema" tamano={16} />
      {children}
    </p>
  );
}

export function Campo({
  etiqueta,
  descripcion,
  error,
  requerido = false,
  sinOpcional = false,
  etiquetaOculta = false,
  deshabilitado = false,
  children,
}: PropsCampo) {
  const id = useId();
  const enGrupo = useEnGrupo();
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
  const opcional =
    requerido || sinOpcional ? null : (
      <span className={enGrupo ? 'campo-nota' : 'text-sm text-texto-terciario'}>
        {base.opcional}
      </span>
    );
  const control =
    typeof children === 'function' ? children(props) : cloneElement(children, { ...props });
  const mensaje =
    error === undefined ? null : (
      <div id={idError} className={enGrupo ? 'campo-error' : undefined}>
        <MensajeError>{error}</MensajeError>
      </div>
    );
  if (enGrupo)
    // CAMPOS-V3 §3: «Opcional» va dentro del `<label>` (05 §10.7); ayuda y error, dentro de la fila. [CH-271] El `<label>` lleva
    // el id `{id}-l`: la selección se nombra con el rótulo más el valor (CAMPOS-V3 §6).
    return (
      <div
        className="campo-fila"
        {...(error === undefined ? {} : { 'data-error': '' })}
        {...(deshabilitado ? { 'data-apagado': '' } : {})}
      >
        <label htmlFor={id} id={`${id}-l`} className={etiquetaOculta ? 'sr-only' : 'campo-rotulo'}>
          <span>{etiqueta}</span>
          {opcional}
        </label>
        {control}
        {descripcion === undefined ? null : (
          <p id={idDescripcion} className="campo-ayuda">
            {descripcion}
          </p>
        )}
        {mensaje}
      </div>
    );
  return (
    <div className="flex flex-col gap-1">
      <div className={etiquetaOculta ? 'sr-only' : 'flex justify-between gap-2'}>
        <Label htmlFor={id}>{etiqueta}</Label>
        {opcional}
      </div>
      {control}
      {descripcion === undefined ? null : (
        <p id={idDescripcion} className="text-sm text-texto-secundario">
          {descripcion}
        </p>
      )}
      {mensaje}
    </div>
  );
}

export type PropsEntradaTexto = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'required'> &
  Omit<PropsCampo, 'children' | 'deshabilitado'> & {
    /** Texto fijo antes de lo escrito, en color secundario (el «$» de un monto). */
    readonly prefijo?: string;
    /** [CH-268] Texto fijo después de lo escrito, fuera del input (el «%» de un porcentaje). */
    readonly sufijo?: string;
    /** Lo que va dentro del campo, sobre su borde derecho: el botón del calendario de `EntradaFecha`. */
    readonly acciones?: ReactNode;
    /** [CH-268] Con `inputMode="numeric"` solo quedan dígitos (C-41); `false` cuando el campo tiene su propia máscara. */
    readonly soloDigitos?: boolean;
  };

/** Entrada de texto con su `Campo`. La etiqueta nunca es el `placeholder`. */
export function EntradaTexto({
  etiqueta,
  descripcion,
  error,
  requerido,
  sinOpcional,
  etiquetaOculta,
  prefijo,
  sufijo,
  acciones,
  soloDigitos = true,
  className,
  onChange,
  ...entrada
}: PropsEntradaTexto) {
  const enGrupo = useEnGrupo();
  // C-41: un entero o los dígitos de largo fijo («Últimos 4») no aceptan letras, también donde el campo no está en un grupo.
  const filtrar = soloDigitos && entrada.inputMode === 'numeric';
  const alCambiar = (e: ChangeEvent<HTMLInputElement>) => {
    if (filtrar && /\D/.test(e.target.value)) e.target.value = e.target.value.replace(/\D/g, '');
    onChange?.(e);
  };
  const afijo = (texto: string | undefined) =>
    texto === undefined ? null : (
      <span aria-hidden="true" className="campo-afijo">
        {texto}
      </span>
    );
  return (
    <Campo
      etiqueta={etiqueta}
      {...(descripcion === undefined ? {} : { descripcion })}
      {...(error === undefined ? {} : { error })}
      {...(requerido === undefined ? {} : { requerido })}
      {...(sinOpcional === undefined ? {} : { sinOpcional })}
      {...(etiquetaOculta === undefined ? {} : { etiquetaOculta })}
      deshabilitado={entrada.disabled === true}
    >
      {(control) =>
        enGrupo ? (
          <div className="campo-valor">
            {afijo(prefijo)}
            <input
              {...control}
              className={cn('campo-entrada', className)}
              {...entrada}
              onChange={alCambiar}
            />
            {afijo(sufijo)}
            {acciones}
          </div>
        ) : prefijo === undefined && sufijo === undefined && acciones === undefined ? (
          <Input {...control} className={className} {...entrada} onChange={alCambiar} />
        ) : (
          <div className="relative">
            {prefijo === undefined ? null : (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-texto-secundario"
              >
                {prefijo}
              </span>
            )}
            <Input
              {...control}
              className={cn(
                prefijo === undefined ? '' : 'pl-7',
                sufijo === undefined ? '' : 'pr-8',
                className,
              )}
              {...entrada}
              onChange={alCambiar}
            />
            {sufijo === undefined ? null : (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-texto-secundario"
              >
                {sufijo}
              </span>
            )}
            {acciones}
          </div>
        )
      }
    </Campo>
  );
}

/** Entrada sin etiqueta visible, para listas donde cada fila ya dice qué es: el nombre accesible va en `aria-label`. */
export function EntradaSinEtiqueta(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-label'> & { 'aria-label': string },
) {
  return <Input {...props} />;
}
