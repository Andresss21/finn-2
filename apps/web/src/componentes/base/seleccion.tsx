'use client';
// Selección y buscador (05 §10.7). Hasta 7 opciones se ven todas (radio); con más, lista desplegable.
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { base } from '../../textos/base';
import { Campo } from './campo';
import { Icono } from './icono';
import './base.css';

export interface Opcion {
  readonly valor: string;
  readonly etiqueta: string;
  readonly descripcion?: string;
}

const MAXIMO_VISIBLES = 7;

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
  const nombre = useId();
  if (opciones.length > MAXIMO_VISIBLES) {
    return (
      <Campo
        etiqueta={etiqueta}
        requerido
        {...(descripcion === undefined ? {} : { descripcion })}
        {...(error === undefined ? {} : { error })}
      >
        <Select
          value={valor}
          disabled={deshabilitada}
          onChange={(e) => {
            alCambiar(e.target.value);
          }}
        >
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </Select>
      </Campo>
    );
  }
  return (
    <fieldset
      className="f-grupo"
      disabled={deshabilitada}
      aria-invalid={error === undefined ? undefined : true}
    >
      <legend className="f-etiqueta">{etiqueta}</legend>
      {opciones.map((o) => (
        <label key={o.valor} className="f-opcion">
          <input
            type="radio"
            name={nombre}
            value={o.valor}
            checked={o.valor === valor}
            onChange={() => {
              alCambiar(o.valor);
            }}
          />
          <span className="f-opcion-texto">
            {o.etiqueta}
            {o.descripcion === undefined ? null : <small>{o.descripcion}</small>}
          </span>
        </label>
      ))}
      {error === undefined ? null : (
        <p className="f-error">
          <Icono nombre="problema" tamano={16} />
          {error}
        </p>
      )}
    </fieldset>
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
    <div className="f-buscador">
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
        className="f-resultados"
        hidden={!lista}
      >
        {resultados.map((o, i) => (
          // Las teclas las maneja el combobox; el puntero elige con mousedown, que no le quita el foco a la caja.
          <li
            key={o.valor}
            id={`${id}-o${i}`}
            role="option"
            aria-selected={i === activa}
            className="f-resultado"
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
      <p role="status" className={anuncio === '' ? 'f-visualmente-oculto' : 'f-estado-busqueda'}>
        {anuncio}
      </p>
    </div>
  );
}
