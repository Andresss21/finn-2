// Movimientos del detalle de cuenta (FT-52, CA-52.5): cada fila con el saldo corrido que trae el DTO (`saldoDespues`, 04 §6.0.5),
// el filtro por tipo y estado, y el enlace a la página anterior en el tiempo (`?cursor=`). Dibuja lo que trae el DTO: no suma (PF-3).
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { Vacio } from '../../../../componentes/base/vacio';
import { Monto } from '../../../../componentes/dominio/monto';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { formatearFecha } from '../../../../formato';
import { cuentaDetalle } from '../../../../textos/cuenta-detalle';
import { dominio } from '../../../../textos/dominio';

const t = cuentaDetalle.movimientos;
const f = cuentaDetalle.filtros;
const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline ${FOCO}`;
const BOTON = `inline-flex min-h-11 items-center rounded-control bg-superficie-hundida px-4 font-semibold text-texto ${FOCO}`;
const ENLACE_ACTIVIDAD = `inline-flex min-h-11 items-center font-bold text-enlace ${FOCO}`;
const TONAL = `inline-flex min-h-12 items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion ${FOCO}`;
const FILA = `grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 ${FOCO}`;
const CAMPO = `min-h-11 rounded-control border border-borde-control bg-superficie px-2 text-texto ${FOCO}`;

export interface FiltrosDetalle {
  readonly periodo?: string | undefined;
  readonly tipo?: string | undefined;
  readonly estado?: string | undefined;
  readonly cursor?: string | undefined;
}

/** La URL de la misma cuenta con `cambios` aplicados sobre los filtros de ahora (un valor `undefined` lo quita). */
export function hrefDe(cuentaId: string, filtros: FiltrosDetalle, cambios: FiltrosDetalle): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...filtros, ...cambios }))
    if (v !== undefined && v !== '') q.set(k, v);
  const s = q.toString();
  return s === '' ? `/cuentas/${cuentaId}` : `/cuentas/${cuentaId}?${s}`;
}

function Filtros({
  cuentaId,
  filtros,
}: {
  readonly cuentaId: string;
  readonly filtros: FiltrosDetalle;
}) {
  const hay = filtros.tipo !== undefined || filtros.estado !== undefined;
  return (
    <form
      method="get"
      action={`/cuentas/${cuentaId}`}
      aria-label={f.titulo}
      className="flex flex-wrap items-end gap-3"
    >
      {filtros.periodo === undefined ? null : (
        <input type="hidden" name="periodo" value={filtros.periodo} />
      )}
      <label className="flex flex-col gap-1 text-cuerpo-pequeno">
        {f.tipo}
        <select name="tipo" defaultValue={filtros.tipo ?? ''} className={CAMPO}>
          <option value="">{f.todos}</option>
          {Object.entries(f.tipos).map(([valor, nombre]) => (
            <option key={valor} value={valor.replaceAll('_', '-')}>
              {nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-cuerpo-pequeno">
        {f.estado}
        <select name="estado" defaultValue={filtros.estado ?? ''} className={CAMPO}>
          <option value="">{f.todos}</option>
          {Object.entries(f.estados).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className={BOTON}>
        {f.aplicar}
      </button>
      {hay ? (
        <EnlaceFinn
          href={hrefDe(cuentaId, filtros, {
            tipo: undefined,
            estado: undefined,
            cursor: undefined,
          })}
          className={ENLACE}
        >
          {f.quitar}
        </EnlaceFinn>
      ) : null}
    </form>
  );
}

type Fila = DetalleCuentaDto['movimientos'][number];

/** «14/10/2026 · Farmacia · conciliada»: la fecha, con qué se relaciona y su estado, tal como vienen en la fila (PF-3). */
function subtitulo(m: Fila, cuentaId: string): string {
  const otra = m.cuentas.find((c) => c.cuenta.id !== cuentaId);
  const con =
    m.lineas.length > 1
      ? t.partes(m.lineas.length)
      : (m.lineas[0]?.destino.nombre ??
        (otra === undefined
          ? f.tipos[m.tipo].toLowerCase()
          : m.efectoEnCuenta < 0
            ? t.a(otra.cuenta.nombre)
            : t.desde(otra.cuenta.nombre)));
  return [
    formatearFecha(m.fecha),
    con,
    m.estadoBancario === 'conciliada' ? dominio.estadoBancario.conciliada.toLowerCase() : undefined,
  ]
    .filter((x) => x !== undefined)
    .join(' · ');
}

export function Movimientos({
  dto,
  filtros,
}: {
  readonly dto: DetalleCuentaDto;
  readonly filtros: FiltrosDetalle;
}) {
  const id = dto.cuenta.id;
  const filtrado = filtros.tipo !== undefined || filtros.estado !== undefined;
  return (
    <section data-movimientos className="flex flex-col gap-3">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 className="text-titulo-seccion">{t.titulo}</h2>
        <EnlaceFinn href={`/actividad?cuenta=${id}`} className={ENLACE_ACTIVIDAD}>
          {cuentaDetalle.acciones.verEnActividad}
        </EnlaceFinn>
      </div>
      <Filtros cuentaId={id} filtros={filtros} />
      {dto.movimientos.length === 0 ? (
        <Vacio
          titulo={filtrado || filtros.periodo !== undefined ? t.sinResultados : t.vacio}
          texto={filtrado || filtros.periodo !== undefined ? t.sinResultadosTexto : t.vacioTexto}
          icono="cero"
          {...(filtrado || filtros.periodo !== undefined || dto.cuenta.archivada
            ? {}
            : {
                accion: (
                  <EnlaceFinn href={`/registrar/gasto?cuenta=${id}`} className={TONAL}>
                    {cuentaDetalle.acciones.registrarConEstaCuenta}
                  </EnlaceFinn>
                ),
              })}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1">
          {dto.movimientos.map((m) => (
            <li key={m.id} data-movimiento={m.id}>
              <a
                href={`/actividad/${m.id}?volver=${encodeURIComponent(`/cuentas/${id}`)}`}
                data-fila-transaccion={m.id}
                className={FILA}
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-semibold">
                    {m.comercio ?? dominio.sinComercio}
                  </span>
                  <span className="text-cuerpo-pequeno text-texto-secundario">
                    {subtitulo(m, id)}
                  </span>
                </span>
                <p className="flex flex-col items-end gap-0.5">
                  <Monto
                    centavos={m.efectoEnCuenta}
                    rol="cifra"
                    {...(m.efectoEnCuenta > 0 ? { estado: 'positivo' as const } : {})}
                  />
                  <span
                    data-saldo-despues={m.saldoDespues}
                    className="text-cuerpo-pequeno text-texto-secundario"
                  >
                    {t.saldoCorto} <Monto centavos={m.saldoDespues} rol="cuerpo" />
                  </span>
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {filtros.cursor === undefined ? null : (
          <EnlaceFinn href={hrefDe(id, filtros, { cursor: undefined })} className={ENLACE}>
            {t.alInicio}
          </EnlaceFinn>
        )}
        {dto.siguienteCursor === undefined ? null : (
          <EnlaceFinn
            href={hrefDe(id, filtros, { cursor: dto.siguienteCursor })}
            className={ENLACE}
          >
            {t.mas}
          </EnlaceFinn>
        )}
      </div>
    </section>
  );
}
