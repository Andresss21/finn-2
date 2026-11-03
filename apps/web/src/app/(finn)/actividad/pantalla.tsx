// `/actividad` (FT-24; 05 §2.6, §7.2): las transacciones de todas las cuentas por día, de la más reciente a la más antigua, con la
// búsqueda y los filtros de la URL. Dibuja lo que trae el DTO: no suma ni cambia signos (PF-3). «Cargar más» sigue el cursor de
// 04 §6.0.6; cada fila lleva `?volver=` a esta misma lista con sus filtros (05 §3.3).
import type { ActividadDto } from '@finn/aplicacion/consultas/actividad';
import { Vacio } from '../../../componentes/base/vacio';
import { FilaTransaccion } from '../../../componentes/dominio/fila-transaccion';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { VacioSinResultados } from '../../../componentes/navegacion/vacios';
import { formatearFecha } from '../../../formato';
import { actividad as t } from '../../../textos/actividad';
import { Buscador } from './buscador';
import { FormularioFiltros, type GrupoDeFiltro, type RefDeFiltro } from './filtros';

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
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-titulo-pantalla">{t.titulo}</h1>
        <EnlaceFinn href="/registrar" className={BOTON}>
          {t.registrar}
        </EnlaceFinn>
      </div>
      <Buscador texto={texto ?? ''} resto={sinTexto} />
      <FormularioFiltros filtros={sinCursor} cuentas={cuentas} grupos={grupos} />
      {dto.dias.length === 0 ? (
        filtrado ? (
          <VacioSinResultados rutaSinFiltros="/actividad" />
        ) : (
          <Vacio titulo={t.vacioTitulo} texto={t.vacioTexto} icono="cero" />
        )
      ) : (
        dto.dias.map((dia) => (
          <section key={dia.fecha} data-dia={dia.fecha} className="flex flex-col gap-2">
            <h2 className="text-rotulo text-texto-secundario">{formatearFecha(dia.fecha)}</h2>
            <ul className="flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie">
              {dia.transacciones.map((fila) => (
                <li key={fila.id}>
                  <FilaTransaccion
                    fila={fila}
                    hrefDetalle={`/actividad/${fila.id}?volver=${encodeURIComponent(actual)}`}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      <div className="flex flex-wrap items-center gap-2">
        {filtros.cursor === undefined ? null : (
          <EnlaceFinn href={hrefDe(filtros, { cursor: undefined })} className={BOTON}>
            {t.alInicio}
          </EnlaceFinn>
        )}
        {dto.siguienteCursor === undefined ? null : (
          <EnlaceFinn href={hrefDe(filtros, { cursor: dto.siguienteCursor })} className={BOTON}>
            {t.cargarMas}
          </EnlaceFinn>
        )}
      </div>
    </main>
  );
}
