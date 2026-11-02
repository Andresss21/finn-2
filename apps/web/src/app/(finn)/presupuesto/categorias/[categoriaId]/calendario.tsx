'use client';
// Calendario del detalle de categoría (FT-14, CA-14.4 y CA-14.8; 06-identidad-visual §6): dibuja un punto por día con gasto, del tamaño que
// da `intensidadBp` (CF-25), con su tabla equivalente (05 §11.3). Tocar un día filtra la lista ya cargada por fecha: es una
// precisión, no un cálculo (CF-25). Dibuja lo que trae el DTO: no suma ni calcula montos (PF-3).
import type { DetalleCategoria } from '@finn/dominio/selectores';
import { useState } from 'react';
import { VistaGrafico } from './vista';
import { Monto } from '../../../../../componentes/dominio/monto';
import { formatearFecha, formatearMontoAccesible } from '../../../../../formato';
import { diasDelCalendario } from '../../../../../formato/calendario';
import { categoriaDetalle } from '../../../../../textos/categoria-detalle';
import { Consumos } from './consumos';

const t = categoriaDetalle.consumos;
const c = categoriaDetalle.calendario;
const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DIA = 'flex h-11 flex-col items-center justify-center rounded-control text-cuerpo-pequeno';
const ENLACE = `inline-flex min-h-11 items-center px-2 font-semibold underline ${FOCO}`;

interface Props {
  readonly consumos: DetalleCategoria['consumos'];
  readonly calendario: DetalleCategoria['calendario'];
  readonly periodo: { readonly inicio: string; readonly dias: number };
  readonly hoy: string;
  /** La ruta de esta pantalla, para el `?volver=` del detalle de cada transacción (05 §3.3). */
  readonly volver: string;
}

export function ConsumosYCalendario({ consumos, calendario, periodo, hoy, volver }: Props) {
  const [dia, setDia] = useState<string | null>(null);
  const visibles = dia === null ? consumos : consumos.filter((x) => x.fecha === dia);
  const porFecha = new Map<string, (typeof calendario)[number]>(
    calendario.map((x) => [x.fecha, x]),
  );
  const dias = diasDelCalendario(periodo.inicio, periodo.dias);
  const relleno = dias[0]?.columna ?? 0;

  const grafico = (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label={c.etiqueta} data-calendario className="grid grid-cols-7 gap-1">
        {DIAS.map((l, k) => (
          <span
            key={k}
            aria-hidden="true"
            className="text-center text-rotulo text-texto-secundario"
          >
            {l}
          </span>
        ))}
        {Array.from({ length: relleno }, (_, k) => (
          <span key={`v${k}`} aria-hidden="true" />
        ))}
        {dias.map(({ fecha }) => {
          const gasto = porFecha.get(fecha);
          const numero = Number(fecha.slice(8));
          const base = [
            DIA,
            fecha > hoy ? 'text-texto-terciario' : 'text-texto',
            fecha === hoy ? 'ring-2 ring-foco' : '',
          ].join(' ');
          if (gasto === undefined)
            return (
              <span key={fecha} data-dia={fecha} className={base}>
                {numero}
              </span>
            );
          const lado = 6 + (gasto.intensidadBp / 10000) * 12;
          return (
            <button
              key={fecha}
              type="button"
              data-dia={fecha}
              data-intensidad={gasto.intensidadBp}
              aria-pressed={dia === fecha}
              aria-label={`${formatearFecha(fecha)}, ${c.gastado} ${formatearMontoAccesible(gasto.gastado)}`}
              onClick={() => {
                setDia(dia === fecha ? null : fecha);
              }}
              className={[base, FOCO, dia === fecha ? 'bg-superficie-hundida' : ''].join(' ')}
            >
              <span aria-hidden="true">{numero}</span>
              <span
                aria-hidden="true"
                style={{ width: lado, height: lado }}
                className="rounded-pastilla bg-texto"
              />
            </button>
          );
        })}
      </div>
      <p className="text-cuerpo-pequeno text-texto-terciario">{c.nota}</p>
    </div>
  );
  const tabla = (
    <table data-tabla-equivalente className="w-full text-cuerpo-pequeno">
      <caption className="sr-only">{c.titulo}</caption>
      <thead>
        <tr className="text-left text-rotulo text-texto-secundario">
          <th scope="col" className="py-2 font-normal">
            {c.dia}
          </th>
          <th scope="col" className="py-2 text-right font-normal">
            {c.gastado}
          </th>
        </tr>
      </thead>
      <tbody>
        {calendario.map((x) => (
          <tr key={x.fecha} className="border-t border-borde-sutil">
            <th scope="row" className="py-2.5 text-left font-semibold">
              {formatearFecha(x.fecha)}
            </th>
            <td className="py-2.5 text-right">
              <Monto centavos={x.gastado} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <Consumos
        consumos={visibles}
        volver={volver}
        nota={
          dia === null ? null : (
            <p className="flex flex-wrap items-center gap-2 text-cuerpo-pequeno">
              {t.delDia(formatearFecha(dia))}
              <button
                type="button"
                onClick={() => {
                  setDia(null);
                }}
                className={ENLACE}
              >
                {t.todosLosDias}
              </button>
            </p>
          )
        }
      />
      <section data-seccion="calendario" className="flex flex-col gap-2">
        <h2 className="text-titulo-seccion">{c.titulo}</h2>
        <VistaGrafico grafico={grafico} tabla={tabla} />
      </section>
    </>
  );
}
