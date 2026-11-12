// La tarjeta K4 «Antes de confirmar» (E4-1, E4-25) de los flujos largos del presupuesto que empiezan por el impacto (Archivar y
// Fusionar): va en la misma pantalla, debajo de las decisiones, y el pie de la pantalla confirma con su verbo. Dibuja lo que
// armó el llamador con lo que devolvió el servidor; no suma ni compara montos (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { AvisoEnLinea } from '../componentes/base/aviso';
import { IndicadorEstado, type EstadoFinanciero } from '../componentes/dominio/indicador-estado';
import { formatearMonto } from '../formato';
import { glosario } from '../textos/glosario';

export interface PropsFilaImpacto {
  readonly nombre: string;
  /** El valor ya formateado, con el signo que dijo el servidor. */
  readonly valor: ReactNode;
  /** E4-25: el estado de un valor nuevo negativo (05 §10.3), debajo del nombre, con su color y su glifo. */
  readonly estado?: { readonly estado: EstadoFinanciero; readonly etiqueta: string };
}

/** Una fila de la tarjeta: nombre a la izquierda (con el indicador de estado debajo, si lo hay) y el valor a la derecha. */
export function FilaImpacto({ nombre, valor, estado }: PropsFilaImpacto) {
  return (
    <div data-fila-impacto className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-semibold">{nombre}</p>
        {estado === undefined ? null : (
          <IndicadorEstado estado={estado.estado} etiqueta={estado.etiqueta} />
        )}
      </div>
      <span className="shrink-0 font-bold tabular-nums">{valor}</span>
    </div>
  );
}

export interface PropsFilaAntesDespues {
  readonly nombre: string;
  /** [CH-246] Lo que dice el servidor: el valor de hoy y el que va a quedar. La interfaz no los suma ni los resta (PF-3). */
  readonly antes: Centavos;
  readonly despues: Centavos;
  /** E4-25: con `false` la fila no lleva indicador (Listo para asignar no es un sobregiro). */
  readonly conEstado?: boolean;
}

/** E4-25, E6-13: «valor actual → nuevo»; un valor nuevo negativo (comparación de signo) lleva su indicador de estado. */
export function FilaAntesDespues({
  nombre,
  antes,
  despues,
  conEstado = true,
}: PropsFilaAntesDespues) {
  return (
    <FilaImpacto
      nombre={nombre}
      valor={`${formatearMonto(antes)} → ${formatearMonto(despues)}`}
      {...(conEstado && despues < 0
        ? {
            estado: { estado: 'problema', etiqueta: glosario.sobregiroConDebitoOEfectivo } as const,
          }
        : {})}
    />
  );
}

export interface PropsTarjetaImpacto {
  readonly rotulo: string;
  /** «El impacto cambió» (05 §4.4 paso 2). */
  readonly nota?: string;
  readonly avisos?: readonly string[];
  readonly filas: readonly ReactNode[];
}

export function TarjetaImpacto({ rotulo, nota, avisos = [], filas }: PropsTarjetaImpacto) {
  return (
    <section data-impacto-k4 aria-label={rotulo} className="flex flex-col gap-3">
      <h2 className="text-rotulo text-texto-secundario">{rotulo}</h2>
      {nota === undefined ? null : (
        <AvisoEnLinea estado="informacion" aparecioDespues>
          {nota}
        </AvisoEnLinea>
      )}
      {avisos.map((aviso) => (
        <AvisoEnLinea key={aviso} estado="advertencia">
          {aviso}
        </AvisoEnLinea>
      ))}
      <ul className="divide-y divide-borde-sutil rounded-contenedor bg-superficie px-4 py-1 shadow-elevacion-1 empty:hidden">
        {filas.map((fila, i) => (
          <li key={i} className="min-w-0 py-2.5 [&_[data-centavos]]:whitespace-nowrap">
            {fila}
          </li>
        ))}
      </ul>
    </section>
  );
}
