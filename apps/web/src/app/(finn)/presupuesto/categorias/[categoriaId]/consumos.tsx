// Consumos del detalle de categoría (FT-14, CA-14.1 a CA-14.3; 06-identidad-visual §6): salen del DTO en el orden D2, cada uno con
// su medio, lo cubierto y lo no cubierto. La cobertura va en texto: el DTO no trae proporciones para una barrita (CF-25) y
// calcularlas violaría PF-3. Dibuja lo que trae el DTO: no suma ni calcula montos.
import type { DetalleCategoria } from '@finn/dominio/selectores';
import type { ReactNode } from 'react';
import { Vacio } from '../../../../../componentes/base/vacio';
import { Monto } from '../../../../../componentes/dominio/monto';
import { EnlaceFinn } from '../../../../../componentes/navegacion/enlace-finn';
import { formatearFechaTexto } from '../../../../../formato';
import { categoriaDetalle } from '../../../../../textos/categoria-detalle';

const t = categoriaDetalle.consumos;
const ENLACE =
  'inline-flex min-h-11 items-center px-2 font-semibold underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function Consumos({
  consumos,
  volver,
  nota = null,
}: {
  readonly consumos: DetalleCategoria['consumos'];
  /** La ruta de esta pantalla, para el `?volver=` del detalle de cada transacción (05 §3.3). */
  readonly volver: string;
  /** Un aviso entre el título y la lista (el filtro por día del calendario). */
  readonly nota?: ReactNode;
}) {
  return (
    <section data-seccion="consumos" className="flex flex-col gap-2">
      <h2 className="flex items-baseline justify-between gap-3">
        <span className="text-titulo-seccion">{t.titulo}</span>
        <span className="text-cuerpo-pequeno text-texto-secundario">{consumos.length}</span>
      </h2>
      {nota}
      {consumos.length === 0 ? (
        <Vacio titulo={t.vacio} texto={t.vacioTexto} icono="cero" />
      ) : (
        <ul className="flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie">
          {consumos.map((x, k) => {
            const transaccionId = 'transaccionId' in x.origen ? x.origen.transaccionId : null;
            const nombre = x.comercio ?? (transaccionId === null ? t.condonacion : x.cuenta.nombre);
            return (
              <li key={k} data-consumo={x.fecha} className="flex items-start gap-3 px-3.5 py-3">
                <span
                  data-insignia-fecha
                  className="flex w-12 shrink-0 flex-col items-center leading-none"
                >
                  <span className="text-rotulo text-texto-secundario">
                    {formatearFechaTexto(x.fecha).split(' ')[1]}
                  </span>
                  <span className="text-cifra">{x.fecha.slice(8)}</span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  {transaccionId === null ? (
                    <span className="font-semibold">{nombre}</span>
                  ) : (
                    <EnlaceFinn
                      href={`/actividad/${transaccionId}?volver=${encodeURIComponent(volver)}`}
                      className={ENLACE}
                    >
                      {nombre}
                    </EnlaceFinn>
                  )}
                  <span className="text-cuerpo-pequeno text-texto-secundario">
                    {x.medio === 'tarjeta' ? t.tarjeta : t.debito} · {x.cuenta.nombre}
                  </span>
                  <span className="text-cuerpo-pequeno">
                    {t.cubierto} <Monto centavos={x.cubierto} />
                    {x.noCubierto === 0 ? null : (
                      <span className="text-problema-texto">
                        {' · '}
                        {t.noCubierto} <Monto centavos={x.noCubierto} estado="problema" />
                      </span>
                    )}
                  </span>
                </span>
                <Monto centavos={x.montoNeto} rol="cifra" presentacion="salida" />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
