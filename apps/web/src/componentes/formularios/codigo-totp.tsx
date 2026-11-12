'use client';
// Código de verificación en seis casillas (05 §9.4 y §9.5 [CH-241], FE-38; entrega 4, «Código de verificación (TOTP)» y E2-2):
// lo usan Verificar, Inscribir y Agregar factor. Escribir avanza, Retroceso vuelve y pegar el código completo lo reparte en
// las seis. Nunca envía solo (WCAG 3.2.2): el formulario envía con su botón o con Enter. El grupo tiene un solo nombre
// accesible y la primera casilla `autocomplete="one-time-code"`, para que el teléfono ofrezca el código.
// Los dígitos van de corrido (sin huecos): una casilla más allá de la primera vacía le pasa el foco a esa.
import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { CASILLAS, normalizarCodigo } from '../../app/ingresar/codigo';
import { codigoTotp as t } from '../../textos/codigo-totp';
import { MensajeError } from '../base/campo';
import { useMovimientoReducido } from '../movimiento/use-movimiento-reducido';

/** Lo que el formulario le pide al grupo: el foco en una casilla (la primera tras un error, la primera vacía si faltan). */
export interface ControlCodigo {
  enfocar: (indice: number) => void;
}

export interface PropsCodigoTotp {
  /** El nombre del grupo; con `rotuloVisible`, también su rótulo en pantalla (`13-acceso/inscribir`). */
  readonly etiqueta: string;
  readonly rotuloVisible?: boolean;
  /** Los dígitos escritos, de corrido (0 a 6). */
  readonly valor: string;
  readonly alCambiar: (valor: string) => void;
  /** El mensaje en línea bajo las casillas (ACC-03). */
  readonly error?: string | undefined;
  /** Código incorrecto o vencido: las seis toman el borde de problema; si no, solo las vacías («Faltan N dígitos»). */
  readonly todasConProblema?: boolean;
  /** Cuántas veces falló el código: cada error vuelve a hacer temblar el grupo (alterna dos nombres de animación). */
  readonly temblores?: number;
  /** Verificado: las casillas pasan a `--positivo-fondo` en cascada. */
  readonly correcto?: boolean;
  readonly ref?: Ref<ControlCodigo>;
}

// Fuera del JSX (L13): 44 × 52, línea inferior de 2 px; llena, 3 px en `--accion`, sube 2 px y rebota (DECISIONES, TOTP).
const CASILLA =
  't-cifra h-13 w-11 min-w-0 rounded-control border-0 border-b-2 bg-superficie text-center text-texto transition-[background-color,translate] duration-(--duracion-normal) focus:border-foco focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ESTADO = {
  vacia: 'border-borde-control',
  llena: 'fz-rebote -translate-y-0.5 border-b-3 border-accion',
  problema: 'border-problema-borde',
} as const;
const CORRECTA = 'bg-positivo-fondo';
const TEMBLOR = ['fz-sacudida-otra', 'fz-sacudida'] as const;
const CODIGOS_DE_CODIGO = ['codigo_incorrecto', 'codigo_vencido'];

/**
 * El error de la respuesta, si es del código (incorrecto o vencido): cada respuesta es un objeto nuevo y vuelve a hacer
 * temblar el grupo; las casillas quedan vacías y con el foco en la primera (CA-01.3). El envío y la sesión no cambian.
 */
export function useErrorDeCodigo(
  error: { readonly codigo: string; readonly mensaje: string } | undefined,
  vaciar: () => void,
) {
  const control = useRef<ControlCodigo>(null);
  const deCodigo = error !== undefined && CODIGOS_DE_CODIGO.includes(error.codigo);
  const [errorPrevio, setErrorPrevio] = useState(error);
  const [temblores, setTemblores] = useState(0);
  if (error !== errorPrevio) {
    setErrorPrevio(error);
    if (deCodigo) setTemblores(temblores + 1);
  }
  const alVaciar = useRef(vaciar);
  useEffect(() => {
    alVaciar.current = vaciar;
  });
  useEffect(() => {
    if (error === undefined || !CODIGOS_DE_CODIGO.includes(error.codigo)) return;
    alVaciar.current();
    control.current?.enfocar(0);
  }, [error]);
  return {
    control,
    mensaje: deCodigo ? error.mensaje : undefined,
    temblores: deCodigo ? temblores : 0,
  };
}

export function CodigoTotp({
  etiqueta,
  rotuloVisible = false,
  valor,
  alCambiar,
  error,
  todasConProblema = false,
  temblores = 0,
  correcto = false,
  ref,
}: PropsCodigoTotp) {
  const id = useId();
  const reducido = useMovimientoReducido();
  const casillas = useRef<(HTMLInputElement | null)[]>([]);
  // El valor de esta pulsación: el foco pasa a la casilla siguiente antes de que el formulario vuelva a pintar.
  const actual = useRef(valor);
  useEffect(() => {
    actual.current = valor;
  }, [valor]);

  const enfocar = (indice: number): void => {
    const casilla = casillas.current[Math.max(0, Math.min(indice, CASILLAS - 1))];
    casilla?.focus();
    casilla?.select();
  };
  useImperativeHandle(ref, () => ({ enfocar }));

  const cambiar = (nuevo: string, siguiente: number): void => {
    actual.current = nuevo;
    alCambiar(nuevo);
    enfocar(siguiente);
  };

  /** Escribe en la casilla `i`: un dígito la reemplaza y avanza; el código completo se reparte en las seis. */
  const escribir = (i: number, texto: string): void => {
    const digitos = normalizarCodigo(texto);
    if (digitos === '') return;
    const previo = actual.current;
    if (digitos.length >= CASILLAS) {
      cambiar(digitos.slice(0, CASILLAS), CASILLAS - 1);
      return;
    }
    const nuevo = (previo.slice(0, i) + digitos + previo.slice(i + digitos.length)).slice(
      0,
      CASILLAS,
    );
    cambiar(nuevo, i + digitos.length);
  };

  /** Retroceso: la casilla llena pierde su dígito (los siguientes se corren); en una vacía, vuelve a la anterior y la vacía. */
  const borrar = (i: number): void => {
    const previo = actual.current;
    if (i < previo.length) cambiar(previo.slice(0, i) + previo.slice(i + 1), i);
    else if (i > 0) cambiar(previo.slice(0, i - 1), i - 1);
  };

  const alTeclear = (i: number, e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      borrar(i);
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      enfocar(i - 1);
    } else if (e.key === 'ArrowRight' && i < actual.current.length) {
      e.preventDefault();
      enfocar(i + 1);
    }
  };

  const alPegar = (i: number, e: ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    escribir(i, e.clipboardData.getData('text'));
  };

  const idRotulo = `${id}-rotulo`;
  const idError = `${id}-error`;
  const temblando = temblores > 0 && error !== undefined;
  return (
    <div className="flex flex-col gap-2">
      {rotuloVisible ? (
        <span id={idRotulo} className="text-sm font-medium text-texto">
          {etiqueta}
        </span>
      ) : null}
      <div
        role="group"
        {...(rotuloVisible ? { 'aria-labelledby': idRotulo } : { 'aria-label': etiqueta })}
        {...(error === undefined ? {} : { 'aria-describedby': idError })}
        data-temblor={temblando ? temblores : undefined}
        className={[
          'flex justify-between gap-2',
          temblando && !reducido ? TEMBLOR[temblores % 2] : '',
        ].join(' ')}
      >
        {Array.from({ length: CASILLAS }, (_, i) => {
          const digito = valor[i] ?? '';
          const problema = error !== undefined && (todasConProblema || digito === '');
          return (
            <input
              key={i}
              ref={(nodo) => {
                casillas.current[i] = nodo;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={t.casilla(i + 1)}
              aria-invalid={problema ? true : undefined}
              value={digito}
              className={[
                CASILLA,
                problema ? ESTADO.problema : digito === '' ? ESTADO.vacia : ESTADO.llena,
                correcto ? CORRECTA : '',
              ].join(' ')}
              style={
                correcto && !reducido
                  ? { transitionDelay: `calc(var(--retardo-cascada) * ${String(i)})` }
                  : undefined
              }
              onFocus={(e) => {
                if (i > actual.current.length) enfocar(actual.current.length);
                else e.currentTarget.select();
              }}
              onKeyDown={(e) => {
                alTeclear(i, e);
              }}
              onPaste={(e) => {
                alPegar(i, e);
              }}
              onChange={(e) => {
                // Un dígito tecleado llega en `data`; el autocompletado del teléfono y un pegado sin evento, en el valor.
                const dato = (e.nativeEvent as Partial<InputEvent>).data;
                const texto = typeof dato === 'string' && dato !== '' ? dato : e.target.value;
                if (e.target.value === '') borrar(i);
                else escribir(i, texto);
              }}
            />
          );
        })}
      </div>
      {error === undefined ? null : (
        <div id={idError} role="alert">
          <MensajeError>{error}</MensajeError>
        </div>
      )}
    </div>
  );
}
