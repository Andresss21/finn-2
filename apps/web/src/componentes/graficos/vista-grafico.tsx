'use client';
// Contenedor de gráfico del diseño (A.6 §2.18) con el selector Gráfico / Tabla (05 §10.8.1 `SelectorVista`): estado local, no
// cambia la URL. Recibe el gráfico y la tabla ya dibujados en el servidor (no importa d3). La vista oculta queda a la vista de
// nadie pero dentro del árbol de accesibilidad (`sr-only`, 11.3), así que la tabla equivalente siempre está disponible para un
// lector de pantalla. Orden: encabezado (título y selector a la derecha), cifra grande, gráfico con su leyenda y la tabla; con
// `tablaAlLado`, en computadora las dos vistas conviven y el selector se oculta (CH-112).
import { useState, type ReactNode } from 'react';
import { cuentas } from '../../textos/cuentas';
import { SelectorSegmentado } from '../base/selector-segmentado';

const t = cuentas.grafico;

export function VistaGrafico({
  grafico,
  tabla,
  vistaInicial = 'grafico',
  titulo,
  cifra,
  nota,
  aparte,
  leyenda,
  tablaAlLado = false,
}: {
  readonly grafico: ReactNode;
  readonly tabla: ReactNode;
  readonly vistaInicial?: 'grafico' | 'tabla';
  /** Título de la sección: va a la izquierda del selector. Sin él, el selector queda solo, a la derecha. */
  readonly titulo?: string;
  /** La cifra grande que da el DTO (nunca calculada acá, PF-3). */
  readonly cifra?: ReactNode;
  /** Texto bajo la cifra. */
  readonly nota?: string;
  /** Dato corto a la derecha de la cifra. */
  readonly aparte?: ReactNode;
  readonly leyenda?: ReactNode;
  /** En computadora (`md`), la tabla va al lado del gráfico y el selector se oculta. */
  readonly tablaAlLado?: boolean;
}) {
  const [vista, setVista] = useState<string>(vistaInicial);
  // Con la tabla al lado, la vista oculta solo se oculta en teléfono; en computadora conviven.
  const oculto = tablaAlLado ? 'max-md:sr-only' : 'sr-only';
  const visible = (propia: string) => (vista === propia ? '' : oculto);
  return (
    <div
      data-vista-grafico={vista}
      className="flex flex-col gap-3 rounded-contenedor bg-superficie p-4"
    >
      <div data-grafico-encabezado className="flex items-center justify-between gap-3">
        {titulo === undefined ? null : <h2 className="text-titulo-seccion">{titulo}</h2>}
        <div className={['ml-auto', tablaAlLado ? 'md:hidden' : ''].join(' ')}>
          <SelectorSegmentado
            etiqueta={t.vista}
            opciones={[
              { valor: 'grafico', etiqueta: t.grafico },
              { valor: 'tabla', etiqueta: t.tabla },
            ]}
            valor={vista}
            alCambiar={setVista}
          />
        </div>
      </div>
      {cifra === undefined ? null : (
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <div data-grafico-cifra>{cifra}</div>
            {nota === undefined ? null : (
              <p data-grafico-nota className="text-cuerpo-pequeno text-texto-secundario">
                {nota}
              </p>
            )}
          </div>
          {aparte === undefined ? null : (
            <div className="pb-0.5 text-cuerpo-pequeno font-semibold">{aparte}</div>
          )}
        </div>
      )}
      <div
        className={
          tablaAlLado
            ? 'flex flex-col gap-3 md:grid md:grid-cols-2 md:items-start md:gap-6'
            : 'flex flex-col gap-3'
        }
      >
        <div className={['flex flex-col gap-3', visible('grafico')].join(' ')}>
          {grafico}
          {leyenda}
        </div>
        <div className={visible('tabla')}>{tabla}</div>
      </div>
    </div>
  );
}
