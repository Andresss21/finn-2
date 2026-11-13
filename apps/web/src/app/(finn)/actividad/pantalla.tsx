// `/actividad` (FT-24; 05 §2.6, §7.2): las transacciones de todas las cuentas por día, de la más reciente a la más antigua, con la
// búsqueda y los filtros de la URL. Dibuja lo que trae el DTO: no suma ni cambia signos (PF-3). «Cargar más» sigue el cursor de
// 04 §6.0.6; cada fila lleva `?volver=` a esta misma lista con sus filtros (05 §3.3).
import type { ActividadDto } from '@finn/aplicacion/consultas/actividad';
import { Vacio } from '../../../componentes/base/vacio';
import { FilaTransaccion } from '../../../componentes/dominio/fila-transaccion';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { VacioSinResultados } from '../../../componentes/navegacion/vacios';
import { formatearMonto } from '../../../formato';
import { rotuloDeDia } from '../../../formato/rotulo-de-dia';
import { actividad as t } from '../../../textos/actividad';
import { Buscador } from './buscador';
import { CargarMas } from './cargar-mas';
import { FichasDeFiltros } from './chips';
import { detalleDeFila } from './detalle-de-fila';
import { BotonFiltros, FormularioFiltros, type GrupoDeFiltro, type RefDeFiltro } from './filtros';

/** Los parámetros de 05 §2.2 que lee esta pantalla, con el nombre que llevan en la URL. */
export const CLAVES_FILTRO = [
  'texto',
  'cuenta',
  'categoria',
  'tipo',
  'estado',
  'origen',
  'desde',
  'hasta',
  'monto-desde',
  'monto-hasta',
  'cursor',
] as const;
export type FiltrosActividad = Readonly<
  Partial<Record<(typeof CLAVES_FILTRO)[number], string | undefined>>
>;

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const BOTON = `inline-flex min-h-11 items-center justify-center rounded-control bg-superficie-hundida px-4 font-semibold text-texto ${FOCO}`;
const TONAL = `inline-flex min-h-11 items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion ${FOCO}`;

/** Los filtros sin el parámetro `clave`. */
const sin = (f: FiltrosActividad, clave: string): FiltrosActividad =>
  Object.fromEntries(Object.entries(f).filter(([k]) => k !== clave));

/** La URL de la lista con `cambios` sobre los filtros de ahora (un valor `undefined` lo quita). */
function hrefDe(filtros: FiltrosActividad, cambios: FiltrosActividad): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...filtros, ...cambios }))
    if (v !== undefined && v !== '') q.set(k, v);
  const s = q.toString();
  return s === '' ? '/actividad' : `/actividad?${s}`;
}

export function PantallaActividad({
  dto,
  filtros,
  cuentas,
  grupos,
}: {
  readonly dto: ActividadDto;
  readonly filtros: FiltrosActividad;
  readonly cuentas: readonly RefDeFiltro[];
  readonly grupos: readonly GrupoDeFiltro[];
}) {
  const sinCursor = sin(filtros, 'cursor');
  const sinTexto = sin(sinCursor, 'texto');
  const texto = filtros.texto;
  const filtrado = Object.keys(sinCursor).length > 0;
  const actual = hrefDe(filtros, {});
  return (
    // A14/B8: en computadora, la columna fija de filtros de 320 px a la izquierda (D-8, CH-241 e) y la lista hasta 760 px; en teléfono, una columna
    // (título, búsqueda, filtros, fichas y lista).
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-4 @[996px]:grid @[996px]:max-w-[1116px] @[996px]:grid-cols-[320px_minmax(0,760px)] @[996px]:items-start @[996px]:gap-x-9 @[996px]:gap-y-4">
      <PublicarEncabezado encabezado={dto} />
      {/* ACT-01: un solo «Registrar» por viewport (el de la barra superior o el de la lateral); el título va solo. */}
      <div className="order-1 flex items-center justify-between gap-3 @[996px]:col-span-2 @[996px]:row-start-1">
        <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      </div>
      <aside
        aria-label={t.filtros}
        data-columna-filtros
        className="order-3 hidden @[996px]:sticky @[996px]:block @[996px]:top-4 @[996px]:col-start-1 @[996px]:row-start-2"
      >
        <FormularioFiltros filtros={sinCursor} cuentas={cuentas} grupos={grupos} />
      </aside>
      <div
        data-columna-lista
        className="contents @[996px]:order-4 @[996px]:col-start-2 @[996px]:row-start-2 @[996px]:flex @[996px]:flex-col @[996px]:gap-4"
      >
        {/* ACT-02: el buscador y «Filtros» en una fila (el botón se oculta en computadora, donde la columna ya está) */}
        <div className="order-2 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Buscador texto={texto ?? ''} resto={sinTexto} />
          </div>
          <BotonFiltros filtros={sinCursor} cuentas={cuentas} grupos={grupos} conteo={dto.conteo} />
        </div>
        <div className="order-4 flex flex-col gap-4">
          <FichasDeFiltros
            filtros={sinTexto}
            cuentas={cuentas}
            grupos={grupos}
            hrefSin={(claves) =>
              hrefDe(sinCursor, Object.fromEntries(claves.map((k) => [k, undefined])))
            }
          />
          {filtrado && dto.conteo > 0 ? (
            // ACT-04, ACT-08 [CH-250]: el conteo y el total de todas las coincidencias, tal como los da el servidor.
            <div className="flex items-center justify-between gap-3" data-resumen-filtros>
              <p className="min-w-0 text-cuerpo-pequeno text-texto-secundario">
                {texto === undefined
                  ? t.resumen(dto.conteo, formatearMonto(dto.total))
                  : t.resultadosPara(dto.conteo, texto)}
              </p>
              <EnlaceFinn
                href={texto === undefined ? '/actividad' : hrefDe({}, { texto })}
                className={TONAL}
              >
                {t.quitarFiltros}
              </EnlaceFinn>
            </div>
          ) : null}
          {dto.dias.length === 0 ? (
            filtrado ? (
              <VacioSinResultados rutaSinFiltros="/actividad" />
            ) : (
              <Vacio titulo={t.vacioTitulo} texto={t.vacioTexto} icono="cero" />
            )
          ) : (
            dto.dias.map((dia) => (
              <section key={dia.fecha} data-dia={dia.fecha} className="flex flex-col gap-2">
                <h2 className="px-1 text-rotulo text-texto-secundario">
                  {rotuloDeDia(dia.fecha, dto.hoy)}
                </h2>
                <ul className="flex flex-col divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1">
                  {dia.transacciones.map((fila) => (
                    <li key={fila.id}>
                      <FilaTransaccion
                        fila={fila}
                        detalle={detalleDeFila(fila)}
                        hrefDetalle={`/actividad/${fila.id}?volver=${encodeURIComponent(actual)}`}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
          {/* A14: «Cargar más» tonal y centrado, con el cursor del DTO */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {filtros.cursor === undefined ? null : (
              <EnlaceFinn href={hrefDe(filtros, { cursor: undefined })} className={BOTON}>
                {t.alInicio}
              </EnlaceFinn>
            )}
            {dto.siguienteCursor === undefined ? null : (
              <CargarMas
                href={hrefDe(filtros, { cursor: dto.siguienteCursor })}
                className={TONAL}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
