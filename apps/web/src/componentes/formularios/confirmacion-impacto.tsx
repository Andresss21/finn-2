'use client';
// `ConfirmacionImpacto` (05 §4.4, §10): la previsualización antes de confirmar. Recibe el foco al aparecer (su título) y
// ofrece "Confirmar" y "Volver a editar". Muestra lo que arma el llamador con los números del servidor; no calcula nada (PF-3).
// Marcado del export (07-flujos-del-presupuesto, CH-180): el impacto en una tarjeta de filas y los botones en dos columnas,
// «Volver» tonal a la izquierda y la acción a la derecha, como `flujos/pie-de-hoja.tsx`. La variante con las líneas de AV-01 vive
// en `confirmacion-impacto-de-vista.tsx`, para que las pantallas que no la usan no carguen esas líneas (05 §13.1, CH-87).
import { useEffect, useRef, type ReactNode } from 'react';
import { AvisoEnLinea } from '../base/aviso';
import { Boton } from '../base/boton';

export interface PropsConfirmacionImpacto {
  readonly titulo: string;
  /** E4-1: una línea con lo que se confirma, debajo del título. */
  readonly descripcion?: string;
  /** E4-1: en eliminar, el verbo va en `--peligro` y «Volver a editar» es «Cancelar». */
  readonly peligro?: boolean;
  /** "El impacto cambió" (4.4 paso 2), cuando se pidió confirmar de nuevo. */
  readonly nota?: string;
  /** El impacto en el período activo, ya formateado: una fila de la tarjeta por elemento. */
  readonly impacto: readonly ReactNode[];
  /** Los avisos "antes", con su texto. */
  readonly avisos: readonly string[];
  readonly textoConfirmar: string;
  readonly textoVolver: string;
  readonly enviando: boolean;
  readonly alConfirmar: () => void;
  readonly alVolver: () => void;
}

export function ConfirmacionImpacto({
  titulo,
  descripcion,
  peligro = false,
  nota,
  impacto,
  avisos,
  textoConfirmar,
  textoVolver,
  enviando,
  alConfirmar,
  alVolver,
}: PropsConfirmacionImpacto) {
  const encabezado = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    encabezado.current?.focus();
  }, []);
  return (
    <section className="flex flex-col gap-4 md:max-w-180" aria-labelledby="confirmacion-titulo">
      <h2 id="confirmacion-titulo" ref={encabezado} tabIndex={-1} className="text-titulo-seccion">
        {titulo}
      </h2>
      {descripcion === undefined ? null : (
        <p className="text-cuerpo-pequeno text-texto-secundario">{descripcion}</p>
      )}
      {nota === undefined ? null : (
        <AvisoEnLinea estado="informacion" aparecioDespues>
          {nota}
        </AvisoEnLinea>
      )}
      <ul className="divide-y divide-borde-sutil rounded-contenedor bg-superficie px-4 py-1 shadow-elevacion-1 empty:hidden">
        {impacto.map((linea, i) => (
          <li key={i} className="min-w-0 py-2.5 [&_[data-centavos]]:whitespace-nowrap">
            {linea}
          </li>
        ))}
      </ul>
      {avisos.map((aviso) => (
        <AvisoEnLinea key={aviso} estado="advertencia">
          {aviso}
        </AvisoEnLinea>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <Boton variante="secundaria" onClick={alVolver}>
          {textoVolver}
        </Boton>
        <Boton
          variante={peligro ? 'peligro' : 'principal'}
          enviando={enviando}
          onClick={alConfirmar}
        >
          {textoConfirmar}
        </Boton>
      </div>
    </section>
  );
}
