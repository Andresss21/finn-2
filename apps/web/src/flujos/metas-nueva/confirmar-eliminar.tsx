'use client';
// Confirmar una baja dentro del flujo (E4-17; 05 §4.14): caja `--problema-fondo` con `trash`, la pregunta, «Cancelar» y el botón
// que elimina en `--peligro`. El foco va a la pregunta al aparecer. Solo presenta: la baja la ejecuta quien lo usa. Lo comparten
// las metas, las programadas y las reglas.
import { useEffect, useRef, type ReactNode } from 'react';
import { Boton } from '../../componentes/base/boton';
import { Icono } from '../../componentes/base/icono';

export function ConfirmarEliminar({
  pregunta,
  cancelar,
  eliminar,
  eliminando,
  enviando,
  deshabilitado = false,
  alCancelar,
  alEliminar,
  extra,
}: {
  readonly pregunta: string;
  readonly cancelar: string;
  readonly eliminar: string;
  readonly eliminando: string;
  readonly enviando: boolean;
  readonly deshabilitado?: boolean;
  readonly alCancelar: () => void;
  readonly alEliminar: () => void;
  readonly extra?: ReactNode;
}) {
  const texto = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    texto.current?.focus();
  }, []);
  return (
    <section
      data-confirmar-eliminar
      className="flex flex-col gap-3 rounded-contenedor bg-problema-fondo p-4 text-problema-texto"
    >
      <div className="flex items-start gap-2.5">
        <span aria-hidden="true" className="mt-0.5 shrink-0">
          <Icono nombre="trash" tamano={20} />
        </span>
        <p ref={texto} tabIndex={-1} className="text-cuerpo font-semibold outline-none">
          {pregunta}
        </p>
      </div>
      {extra}
      <div className="flex flex-wrap gap-3">
        <Boton variante="secundaria" deshabilitado={enviando} onClick={alCancelar}>
          {cancelar}
        </Boton>
        <Boton
          variante="peligro"
          enviando={enviando}
          textoEnviando={eliminando}
          deshabilitado={deshabilitado}
          onClick={alEliminar}
        >
          {eliminar}
        </Boton>
      </div>
    </section>
  );
}
