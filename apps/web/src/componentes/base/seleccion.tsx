'use client';
// Selección y buscador (05 §10.7). Hasta 7 opciones se ven todas (radio); con más, lista desplegable.
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { base } from '../../textos/base';
import { Campo, MensajeError } from './campo';

export interface Opcion {
  readonly valor: string;
  readonly etiqueta: string;
  readonly descripcion?: string;
}

const MAXIMO_VISIBLES = 7;

// Fuera del JSX por L15: el estado deshabilitado lo da `has-disabled:` del radio que la etiqueta contiene.
const CLASES_OPCION =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-control bg-superficie px-3 text-base has-data-[state=checked]:font-semibold has-disabled:cursor-not-allowed has-disabled:bg-superficie-hundida has-disabled:text-texto-deshabilitado';

export interface PropsSeleccion {
  readonly etiqueta: string;
  readonly opciones: readonly Opcion[];
  readonly valor: string;
  readonly alCambiar: (valor: string) => void;
  readonly descripcion?: string;
  readonly error?: string;
  readonly deshabilitada?: boolean;
}

export function Seleccion({
  etiqueta,
  opciones,
  valor,
  alCambiar,
  descripcion,
  error,
  deshabilitada = false,
}: PropsSeleccion) {
  const idEtiqueta = useId();
  if (opciones.length > MAXIMO_VISIBLES) {
    return (
      <Campo
        etiqueta={etiqueta}
        requerido
        {...(descripcion === undefined ? {} : { descripcion })}
        {...(error === undefined ? {} : { error })}
      >
        {(control) => (
          <Select value={valor} disabled={deshabilitada} onValueChange={alCambiar}>
            <SelectTrigger {...control}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opciones.map((o) => (
                <SelectItem key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Campo>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <Label id={idEtiqueta}>{etiqueta}</Label>
      <RadioGroup
        aria-labelledby={idEtiqueta}
        value={valor}
        disabled={deshabilitada}
        onValueChange={alCambiar}
      >
        {opciones.map((o) => (
          <Label key={o.valor} className={CLASES_OPCION}>
            <RadioGroupItem value={o.valor} />
            <span>
              {o.etiqueta}
              {o.descripcion === undefined ? null : (
                <small className="block text-sm font-normal text-texto-secundario">
                  {o.descripcion}
                </small>
              )}
            </span>
          </Label>
        ))}
      </RadioGroup>
      {error === undefined ? null : <MensajeError>{error}</MensajeError>}
    </div>
  );
}

type EstadoBusqueda = 'vacio' | 'buscando' | 'resultados' | 'error';

export interface PropsBuscador {
  readonly etiqueta: string;
  /** Lectura interactiva (4.12). */
  readonly buscar: (texto: string) => Promise<readonly Opcion[]>;
  readonly valor: Opcion | null;
  readonly alCambiar: (opcion: Opcion) => void;
}

/** Combobox de ARIA con anuncio de la cantidad de resultados en una región `status`. */
export function Buscador({ etiqueta, buscar, valor, alCambiar }: PropsBuscador) {
  const id = useId();
  const pedido = useRef(0);
  const [texto, setTexto] = useState(valor?.etiqueta ?? '');
  const [estado, setEstado] = useState<EstadoBusqueda>('vacio');
  const [abierto, setAbierto] = useState(false);
  const [resultados, setResultados] = useState<readonly Opcion[]>([]);
  const [activa, setActiva] = useState(-1);

  const escribir = (nuevo: string) => {
    setTexto(nuevo);
    const este = ++pedido.current;
    setAbierto(nuevo !== '');
    setActiva(-1);
    if (nuevo === '') {
      setEstado('vacio');
      return;
    }
    setEstado('buscando');
    buscar(nuevo).then(
      (r) => {
        if (este !== pedido.current) return; // llegó tarde: ya hay una búsqueda más nueva
        setResultados(r);
        setEstado('resultados');
      },
      () => {
        if (este === pedido.current) setEstado('error');
      },
    );
  };
  const elegir = (o: Opcion) => {
    setTexto(o.etiqueta);
    setAbierto(false);
    alCambiar(o);
  };
  const teclas = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setAbierto(false);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setAbierto(true);
      const n = resultados.length;
      if (n > 0) setActiva((a) => (e.key === 'ArrowDown' ? (a + 1) % n : (a - 1 + n) % n));
    } else if (e.key === 'Enter' && abierto && resultados[activa] !== undefined) {
      e.preventDefault();
      elegir(resultados[activa]);
    }
  };
  const lista = abierto && estado === 'resultados' && resultados.length > 0;
  const anuncio =
    estado === 'buscando'
      ? base.buscando
      : estado === 'error'
        ? base.errorBusqueda
        : estado === 'resultados'
          ? resultados.length === 0
            ? base.sinResultados
            : base.resultados(String(resultados.length))
          : '';
  return (
    <div className="relative">
      <Campo etiqueta={etiqueta} requerido>
        <Input
          role="combobox"
          aria-expanded={lista}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={lista && activa >= 0 ? `${id}-o${activa}` : undefined}
          autoComplete="off"
          value={texto}
          onChange={(e) => {
            escribir(e.target.value);
          }}
          onKeyDown={teclas}
        />
      </Campo>
      <ul
        id={`${id}-lista`}
        role="listbox"
        aria-label={etiqueta}
        className="absolute inset-x-0 z-40 mt-1 rounded-contenedor bg-superficie-elevada shadow-elevacion-2"
        hidden={!lista}
      >
        {resultados.map((o, i) => (
          // Las teclas las maneja el combobox; el puntero elige con mousedown, que no le quita el foco a la caja.
          <li
            key={o.valor}
            id={`${id}-o${i}`}
            role="option"
            aria-selected={i === activa}
            className="flex min-h-11 cursor-pointer items-center gap-2 px-3 aria-selected:bg-superficie-hundida aria-selected:font-semibold"
            onMouseDown={(e) => {
              e.preventDefault();
              elegir(o);
            }}
          >
            {o.etiqueta}
            {o.descripcion === undefined ? null : <small>{o.descripcion}</small>}
          </li>
        ))}
      </ul>
      <p role="status" className={anuncio === '' ? 'sr-only' : 'p-3 text-sm text-texto-secundario'}>
        {anuncio}
      </p>
    </div>
  );
}
