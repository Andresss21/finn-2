'use client';
// La región de estado del detalle de categoría (C-52 §9): «Detalle de {categoría}» al entrar, el período al cambiarlo con ‹ ›, y
// lo que anuncian el calendario y los filtros. Una sola región `role="status"` para toda la pantalla.
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import { categoriaDetalle } from '../../../../../textos/categoria-detalle';

const t = categoriaDetalle.anuncios;
const Contexto = createContext<(texto: string) => void>(() => undefined);

/** Lo que el calendario, los filtros y las semanas usan para anunciar. */
export function useAnunciar(): (texto: string) => void {
  return use(Contexto);
}

export function AnunciosDelDetalle({
  nombre,
  periodoInicio,
  fechas,
  cerrado,
  children,
}: {
  readonly nombre: string;
  readonly periodoInicio: string;
  /** Las fechas del período ya formateadas (`formatearPeriodoNumerico`). */
  readonly fechas: string;
  readonly cerrado: boolean;
  readonly children: ReactNode;
}) {
  const [texto, setTexto] = useState('');
  const anterior = useRef<string | null>(null);
  useEffect(() => {
    // Al montar, la entrada; si cambia el período con la pantalla montada (‹ ›), el período nuevo.
    setTexto(
      anterior.current === null
        ? t.entrada(nombre)
        : cerrado
          ? t.periodoCerrado(fechas)
          : t.periodoActual(fechas),
    );
    anterior.current = periodoInicio;
  }, [nombre, periodoInicio, fechas, cerrado]);
  return (
    <Contexto value={setTexto}>
      {/* Primero: en computadora el primer hijo de `main` deja lugar a «Más acciones» (globals.css) y este no ocupa lugar. */}
      <p role="status" data-anuncio-detalle className="sr-only">
        {texto}
      </p>
      {children}
    </Contexto>
  );
}
