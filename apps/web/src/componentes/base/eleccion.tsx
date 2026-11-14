'use client';
// [CH-274] Elección v3 (C-45, CAMPOS-V3 §9): pocas opciones a la vista. Lo elegido lleva borde 2 px de acción, fondo tonal y
// 700; el foco de teclado, contorno de 2 px en `--foco`. Tarjetas de elección (un `radiogroup` de dos columnas) y chips de
// personas (`role="checkbox"` en un `group`) con «Otra persona» y su fila en línea. Las personas las recibe quien lo usa; la
// regla de los nombres está en `formato/personas`.
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { resolverNombre } from '../../formato/personas';
import { base } from '../../textos/base';
import { Campo, GrupoCampos } from './campo';
import { Icono, type NombreIcono } from './icono';

export interface OpcionTarjeta {
  readonly valor: string;
  readonly titulo: string;
  readonly detalle: string;
  readonly icono: NombreIcono;
}

export function TarjetasEleccion({
  etiqueta,
  opciones,
  valor,
  alCambiar,
}: {
  readonly etiqueta: string;
  readonly opciones: readonly OpcionTarjeta[];
  readonly valor: string;
  readonly alCambiar: (valor: string) => void;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={etiqueta} className="eleccion-tarjetas">
      {opciones.map((o) => (
        <label key={o.valor} className="eleccion-tarjeta">
          <input
            type="radio"
            className="control-nativo"
            name={id}
            value={o.valor}
            checked={o.valor === valor}
            aria-labelledby={`${id}-${o.valor}`}
            aria-describedby={`${id}-${o.valor}-d`}
            onChange={() => {
              alCambiar(o.valor);
            }}
          />
          <Icono nombre={o.icono} tamano={22} />
          <span id={`${id}-${o.valor}`} className="eleccion-titulo">
            {o.titulo}
          </span>
          <span id={`${id}-${o.valor}-d`} className="campo-detalle">
            {o.detalle}
          </span>
        </label>
      ))}
    </div>
  );
}

export interface PersonaChip {
  readonly clave: string;
  readonly nombre: string;
  /** Creada en este registro: lleva la etiqueta «Nueva». */
  readonly nueva?: boolean | undefined;
}

export interface PropsChipsPersonas {
  readonly etiqueta: string;
  /** Las personas que ya existen y las creadas en este registro. */
  readonly personas: readonly PersonaChip[];
  /** Claves de las marcadas. */
  readonly elegidas: readonly string[];
  readonly alCambiar: (elegidas: readonly string[]) => void;
  /** Una persona nueva (clave `nueva:{nombre}`): quien lo usa la suma a `personas`; ya viene marcada. */
  readonly alCrear: (persona: PersonaChip) => void;
}

const CHECK = 'M5 12.5l4.5 4.5L19 7.5';

export function ChipsPersonas({
  etiqueta,
  personas,
  elegidas,
  alCambiar,
  alCrear,
}: PropsChipsPersonas) {
  const otra = useRef<HTMLButtonElement>(null);
  const [agregando, setAgregando] = useState(false);
  const [aviso, setAviso] = useState('');
  const volver = useRef(false);
  // Al cerrar la fila en línea, el foco vuelve a «Otra persona».
  useEffect(() => {
    if (agregando || !volver.current) return;
    volver.current = false;
    otra.current?.focus();
  }, [agregando]);
  const cerrar = () => {
    volver.current = true;
    setAgregando(false);
  };
  const agregar = (escrito: string): string | undefined => {
    const r = resolverNombre(escrito, personas, elegidas);
    if (r.tipo === 'vacio') return base.escribiUnNombre;
    if (r.tipo === 'propio') return base.tuParteYaEsta;
    if (r.tipo === 'maximo') return base.maximoPersonas;
    if (r.tipo === 'existente') {
      if (!elegidas.includes(r.persona.clave)) alCambiar([...elegidas, r.persona.clave]);
      setAviso(base.yaTenias(r.persona.nombre));
    } else {
      const persona = { clave: `nueva:${r.nombre}`, nombre: r.nombre, nueva: true };
      alCrear(persona);
      alCambiar([...elegidas, persona.clave]);
      setAviso('');
    }
    cerrar();
    return undefined;
  };
  return (
    <div className="eleccion-personas">
      <div role="group" aria-label={etiqueta} className="eleccion-chips">
        {personas.map((p) => {
          const marcada = elegidas.includes(p.clave);
          return (
            <button
              key={p.clave}
              type="button"
              role="checkbox"
              aria-checked={marcada}
              className="eleccion-chip"
              onClick={() => {
                alCambiar(marcada ? elegidas.filter((c) => c !== p.clave) : [...elegidas, p.clave]);
              }}
            >
              <span aria-hidden="true" className="eleccion-avatar">
                {marcada ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.4">
                    <path d={CHECK} stroke="currentColor" strokeLinecap="square" />
                  </svg>
                ) : (
                  p.nombre.charAt(0)
                )}
              </span>
              {p.nombre}
              {p.nueva === true ? ' ' : null}
              {p.nueva === true ? <span className="eleccion-nueva">{base.nueva}</span> : null}
            </button>
          );
        })}
        {agregando ? null : (
          <button
            ref={otra}
            type="button"
            className="eleccion-otra"
            onClick={() => {
              setAviso('');
              setAgregando(true);
            }}
          >
            <Icono nombre="plus" tamano={16} />
            {base.otraPersona}
          </button>
        )}
      </div>
      {agregando ? <AgregarPersona alAgregar={agregar} alCancelar={cerrar} /> : null}
      <p role="status" className="eleccion-aviso">
        {aviso === '' ? null : (
          <>
            <Icono nombre="check" tamano={16} />
            {aviso}
          </>
        )}
      </p>
    </div>
  );
}

/** La fila en línea: entra levantada (con el foco), Intro agrega y Escape cancela. */
function AgregarPersona({
  alAgregar,
  alCancelar,
}: {
  readonly alAgregar: (nombre: string) => string | undefined;
  readonly alCancelar: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string>();
  const entrada = useRef<HTMLInputElement>(null);
  // La fila entra levantada: con el foco en el nombre.
  useEffect(() => {
    entrada.current?.focus();
  }, []);
  const enviar = () => {
    setError(alAgregar(nombre));
  };
  const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Dentro de un formulario, Intro agrega a la persona y no envía el formulario.
      e.preventDefault();
      enviar();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      alCancelar();
    }
  };
  return (
    <GrupoCampos>
      <Campo etiqueta={base.nombreDeLaPersona} error={error} requerido>
        {(control) => (
          <div className="eleccion-agregar">
            <input
              {...control}
              ref={entrada}
              type="text"
              className="campo-entrada"
              autoComplete="off"
              autoCapitalize="words"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
              }}
              onKeyDown={alTeclear}
            />
            <span className="eleccion-botones">
              <button type="button" className="eleccion-cancelar" onClick={alCancelar}>
                {base.cancelar}
              </button>
              <button type="button" className="eleccion-agregar-boton" onClick={enviar}>
                {base.agregar}
              </button>
            </span>
          </div>
        )}
      </Campo>
    </GrupoCampos>
  );
}
