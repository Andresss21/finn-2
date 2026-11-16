'use client';
// «¿En qué se fue?» y los consumos del detalle de categoría (FT-14, CA-14.4 y CA-14.8; C-52 §2, §3 y §7,
// `docs/anexos/finn-detalle-de-categoria/`). En el teléfono, una tarjeta con dos vistas («Este período»: el calendario;
// «Últimos {n}»: el historial); en computadora, desde 1180 px de contenedor (donde cada día sigue midiendo 44 × 44), van lado a
// lado. El calendario es el índice de la lista: tocar un día la filtra por esa fecha (una precisión, no un cálculo, CF-25),
// muestra la píldora del día y baja hasta la lista. El punto mide lo que da `intensidadBp`. Dibuja lo que trae el DTO: no suma
// ni calcula montos (PF-3).
import type { DetalleCategoria } from '@finn/dominio/selectores';
import { useRef, useState, type ReactNode } from 'react';
import { SelectorSegmentado } from '../../../../../componentes/base/selector-segmentado';
import { indice } from '../../../../../componentes/movimiento/indice';
import { Monto } from '../../../../../componentes/dominio/monto';
import { formatearFecha, formatearMontoAccesible } from '../../../../../formato';
import { diasDelCalendario } from '../../../../../formato/calendario';
import { diaDeMes, nombreDelDia } from '../../../../../formato/consumos-por-semana';
import { categoriaDetalle } from '../../../../../textos/categoria-detalle';
import { useAnunciar } from './anuncios';
import { Consumos } from './consumos';

const c = categoriaDetalle.calendario;
const v = categoriaDetalle.enQueSeFue;
const a = categoriaDetalle.anuncios;
const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
// L13: clases literales. Hoy lleva el anillo `--enlace`; los días futuros, `--texto-terciario`; el elegido se invierte (§7).
const DIA_BASE = `flex h-11 flex-col items-center justify-center gap-0.5 rounded-control text-cuerpo-pequeno transition-colors duration-(--duracion-rapida) ease-(--curva-estandar) disabled:cursor-default ${FOCO}`;
const DIA = {
  elegido: `${DIA_BASE} bg-texto text-fondo`,
  futuro: `${DIA_BASE} text-texto-terciario`,
  otro: `${DIA_BASE} text-texto`,
};
const HOY = 'ring-2 ring-enlace';
const PUNTO_BASE =
  'rounded-pastilla transition-transform duration-(--duracion-normal) ease-(--curva-enfasis)';
const PUNTO = { elegido: `${PUNTO_BASE} scale-[1.15] bg-fondo`, otro: `${PUNTO_BASE} bg-texto` };
// Cambiar de vista: el contenido sube 8 px y aparece (§8). En computadora conviven las dos y no hay control.
const PANEL =
  'flex min-w-0 flex-col gap-2.5 animate-[fz-item_var(--duracion-normal)_var(--curva-entrada)]';
const PANEL_OCULTO = 'hidden min-w-0 flex-col gap-2.5 @[1180px]:flex';
const SUBTITULO = 'hidden text-titulo-seccion @[1180px]:block';

interface Props {
  readonly consumos: DetalleCategoria['consumos'];
  readonly calendario: DetalleCategoria['calendario'];
  readonly periodo: { readonly inicio: string; readonly fin: string; readonly dias: number };
  readonly hoy: string;
  /** La ruta de esta pantalla, para el `?volver=` del detalle de cada transacción (05 §3.3). */
  readonly volver: string;
  /** El historial ya dibujado y cuántos períodos trae; sin él (D9), solo el calendario. */
  readonly historial: ReactNode;
  readonly periodosHistorial: number;
}

const mayuscula = (s: string): string => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

export function Recorrido({
  consumos,
  calendario,
  periodo,
  hoy,
  volver,
  historial,
  periodosHistorial,
}: Props) {
  const anunciar = useAnunciar();
  const [dia, setDia] = useState<string | null>(null);
  const [vista, setVista] = useState('periodo');
  // [CH-295] C-52 §8: las barras del historial crecen la primera vez que se ven; al volver a esa vista ya están dibujadas.
  const [historialVisto, setHistorialVisto] = useState(false);
  const cambiarVista = (nueva: string): void => {
    if (vista === 'historial' && nueva !== 'historial') setHistorialVisto(true);
    setVista(nueva);
  };
  const lista = useRef<HTMLElement>(null);
  const porFecha = new Map<string, (typeof calendario)[number]>(
    calendario.map((x) => [x.fecha, x]),
  );
  const dias = diasDelCalendario(periodo.inicio, periodo.dias);
  const relleno = dias[0]?.columna ?? 0;
  const conHistorial = historial !== null;
  const tituloHistorial =
    periodosHistorial === 0
      ? categoriaDetalle.historial.generico
      : categoriaDetalle.historial.titulo(periodosHistorial);

  const elegir = (fecha: string): void => {
    if (dia === fecha) {
      setDia(null);
      anunciar(a.todos);
      return;
    }
    setDia(fecha);
    anunciar(a.dia(diaDeMes(fecha)));
    // La página baja hasta la lista: suave, o de una vez con movimiento reducido (§8).
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lista.current?.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' });
  };

  const grafico = (
    <div className="flex flex-col gap-2.5">
      <div
        role="group"
        aria-label={c.etiqueta}
        data-calendario
        className="grid grid-cols-7 gap-y-1"
      >
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
          <span key={`v${String(k)}`} aria-hidden="true" />
        ))}
        {dias.map(({ fecha }) => {
          const gasto = porFecha.get(fecha);
          const elegido = dia === fecha;
          const clase = elegido ? DIA.elegido : fecha > hoy ? DIA.futuro : DIA.otro;
          const lado = gasto === undefined ? 0 : 6 + (gasto.intensidadBp / 10000) * 12;
          return (
            <button
              key={fecha}
              type="button"
              data-dia={fecha}
              {...(gasto === undefined ? {} : { 'data-intensidad': gasto.intensidadBp })}
              disabled={gasto === undefined}
              aria-pressed={elegido}
              aria-label={
                gasto === undefined
                  ? c.sinGasto(nombreDelDia(fecha))
                  : c.conGasto(nombreDelDia(fecha), formatearMontoAccesible(gasto.gastado))
              }
              onClick={() => {
                elegir(fecha);
              }}
              className={fecha === hoy ? [clase, HOY].join(' ') : clase}
            >
              <span aria-hidden="true">{Number(fecha.slice(8))}</span>
              {gasto === undefined ? null : (
                <span
                  aria-hidden="true"
                  style={{ width: lado, height: lado }}
                  className={elegido ? PUNTO.elegido : PUNTO.otro}
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-cuerpo-pequeno text-texto-secundario">{c.nota}</p>
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
      <section
        data-seccion="en-que-se-fue"
        style={indice(5)}
        className="fz-entra-seccion flex flex-col gap-3.5 rounded-contenedor bg-superficie p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-titulo-seccion @[1180px]:sr-only">{v.titulo}</h2>
          {conHistorial ? (
            <div className="@[1180px]:hidden">
              <SelectorSegmentado
                etiqueta={v.ver}
                opciones={[
                  { valor: 'periodo', etiqueta: v.estePeriodo },
                  {
                    valor: 'historial',
                    etiqueta:
                      periodosHistorial === 0
                        ? categoriaDetalle.historial.generico
                        : v.ultimos(periodosHistorial),
                  },
                ]}
                valor={vista}
                alCambiar={cambiarVista}
              />
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-6 @[1180px]:grid @[1180px]:grid-cols-2 @[1180px]:gap-6">
          <div data-seccion="calendario" className={vista === 'periodo' ? PANEL : PANEL_OCULTO}>
            <h3 className={SUBTITULO}>{c.titulo}</h3>
            {grafico}
            {/* La tabla equivalente (05 §11.3), siempre en el árbol de accesibilidad, como la vista oculta de `VistaGrafico`. */}
            <div className="sr-only">{tabla}</div>
          </div>
          {conHistorial ? (
            <div
              data-seccion="historial"
              data-barras={historialVisto ? 'quietas' : 'crecen'}
              className={vista === 'historial' ? PANEL : PANEL_OCULTO}
            >
              <h3 className={SUBTITULO}>{tituloHistorial}</h3>
              {historial}
            </div>
          ) : null}
        </div>
      </section>
      <Consumos
        consumos={consumos}
        volver={volver}
        periodo={periodo}
        dia={dia}
        diaTexto={dia === null ? '' : mayuscula(nombreDelDia(dia))}
        alQuitarDia={() => {
          setDia(null);
          anunciar(a.todos);
        }}
        anunciar={anunciar}
        lista={lista}
      />
    </>
  );
}
