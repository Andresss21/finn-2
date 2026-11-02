// Movimientos del detalle de cuenta (FT-52, CA-52.5): cada fila con el saldo corrido que trae el DTO (`saldoDespues`, 04 §6.0.5),
// el filtro por tipo y estado, y el enlace a la página anterior en el tiempo (`?cursor=`). Dibuja lo que trae el DTO: no suma (PF-3).
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { Vacio } from '../../../../componentes/base/vacio';
import { FilaTransaccion } from '../../../../componentes/dominio/fila-transaccion';
import { Monto } from '../../../../componentes/dominio/monto';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { cuentaDetalle } from '../../../../textos/cuenta-detalle';

const t = cuentaDetalle.movimientos;
const f = cuentaDetalle.filtros;
const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline ${FOCO}`;
const BOTON = `inline-flex min-h-11 items-center rounded-control bg-superficie-hundida px-4 font-semibold text-texto ${FOCO}`;
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
      <h2 className="text-titulo-seccion">{t.titulo}</h2>
      <Filtros cuentaId={id} filtros={filtros} />
      {dto.movimientos.length === 0 ? (
        <Vacio
          titulo={filtrado || filtros.periodo !== undefined ? t.sinResultados : t.vacio}
          texto={filtrado || filtros.periodo !== undefined ? t.sinResultadosTexto : t.vacioTexto}
          icono="cero"
        />
      ) : (
        <ul className="flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie">
          {dto.movimientos.map((m) => (
            <li key={m.id} data-movimiento={m.id}>
              <FilaTransaccion
                fila={m}
                hrefDetalle={`/actividad/${m.id}?volver=${encodeURIComponent(`/cuentas/${id}`)}`}
              />
              <p className="flex flex-wrap items-center justify-between gap-2 px-3.5 pb-2 text-cuerpo-pequeno text-texto-secundario">
                <span>
                  {t.efecto} <Monto centavos={m.efectoEnCuenta} rol="cuerpo" />
                </span>
                <span data-saldo-despues={m.saldoDespues}>
                  {t.saldoDespues} <Monto centavos={m.saldoDespues} rol="cuerpo" />
                </span>
              </p>
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
