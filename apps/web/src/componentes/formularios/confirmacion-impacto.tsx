'use client';
// `ConfirmacionImpacto` (05 §4.4, §10): la previsualización antes de confirmar. Recibe el foco al aparecer (su título) y
// ofrece "Confirmar" y "Volver a editar". Muestra lo que arma el llamador con los números del servidor; no calcula nada (PF-3).
import { useEffect, useRef } from 'react';
import { AvisoEnLinea } from '../base/aviso';
import { Boton } from '../base/boton';

export interface PropsConfirmacionImpacto {
  readonly titulo: string;
  /** "El impacto cambió" (4.4 paso 2), cuando se pidió confirmar de nuevo. */
  readonly nota?: string;
  /** El impacto en el período activo, ya formateado. */
  readonly impacto: readonly string[];
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
    <section className="flex flex-col gap-4" aria-labelledby="confirmacion-titulo">
      <h2 id="confirmacion-titulo" ref={encabezado} tabIndex={-1} className="text-titulo-seccion">
        {titulo}
      </h2>
      {nota === undefined ? null : (
        <AvisoEnLinea estado="informacion" aparecioDespues>
          {nota}
        </AvisoEnLinea>
      )}
      <ul className="flex flex-col gap-1">
        {impacto.map((linea) => (
          <li key={linea}>{linea}</li>
        ))}
      </ul>
      {avisos.map((aviso) => (
        <AvisoEnLinea key={aviso} estado="advertencia">
          {aviso}
        </AvisoEnLinea>
      ))}
      <div className="flex gap-3">
        <Boton enviando={enviando} onClick={alConfirmar}>
          {textoConfirmar}
        </Boton>
        <Boton variante="secundaria" onClick={alVolver}>
          {textoVolver}
        </Boton>
      </div>
    </section>
  );
}
