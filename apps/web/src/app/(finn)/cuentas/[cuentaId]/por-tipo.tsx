// Bloque propio de cada tipo de cuenta en el detalle (FT-52 paso 3; export `06-detalle-de-cuenta`): tarjeta (te falta reservar, uso
// del límite, ciclo y desglose al pagar) y préstamo (próxima cuota, condiciones y amortización; FT-55 lo completa). La inversión
// va en la cabecera. Todo sale del DTO tal cual: nada se calcula acá (PF-3).
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import type { Centavos } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { IndicadorEstado } from '../../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../../componentes/dominio/monto';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { formatearFecha, formatearPorcentaje } from '../../../../formato';
import { cuentaDetalle } from '../../../../textos/cuenta-detalle';
import { FilasAmortizacion } from './filas-amortizacion';

const TARJETA = 'flex flex-col gap-3.5 rounded-contenedor bg-superficie p-4 shadow-elevacion-1';
const TARJETA_TABLA =
  'flex flex-col gap-3.5 rounded-contenedor bg-superficie p-4 shadow-elevacion-1 overflow-x-auto';
const PAGAR =
  'inline-flex min-h-12 flex-none items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE =
  'inline-flex min-h-11 items-center font-bold text-enlace focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

const m = (c: Centavos) => <Monto centavos={c} rol="cuerpo" />;

/** Filas «rótulo … valor» con una línea entre cada una, como las del diseño. */
function Filas({ filas }: { readonly filas: readonly (readonly [string, ReactNode])[] }) {
  return (
    <dl className="flex flex-col divide-y divide-borde-sutil">
      {filas.map(([rotulo, valor]) => (
        <div key={rotulo} className="flex min-h-11 items-center justify-between gap-3 py-2">
          <dt className="text-cuerpo-pequeno text-texto-secundario">{rotulo}</dt>
          <dd className="font-bold">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BloqueTarjeta({
  tarjeta,
}: {
  readonly tarjeta: NonNullable<DetalleCuentaDto['tarjeta']>;
}) {
  const t = cuentaDetalle.tarjeta;
  const d = tarjeta.desgloseAlPagar;
  return (
    <div data-bloque="tarjeta" className="flex flex-col gap-4">
      <section aria-label={t.titulo} className={TARJETA}>
        {tarjeta.faltaReservar > 0 ? (
          <p className="flex flex-wrap items-center gap-2">
            <IndicadorEstado estado="deuda-sin-respaldo" etiqueta={t.faltaReservar} />
            <Monto centavos={tarjeta.faltaReservar} estado="deuda-sin-respaldo" rol="cifra" />
          </p>
        ) : null}
        {tarjeta.reservaExcedente > 0 ? (
          <IndicadorEstado estado="informacion" etiqueta={t.reservaExcedente} />
        ) : null}
        <p className="flex flex-wrap justify-between gap-2 text-cuerpo-pequeno">
          <span>
            {t.reservado} {m(tarjeta.reservado)}
          </span>
          <span className="text-texto-secundario">
            {t.deuda} {m(tarjeta.deuda)}
          </span>
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-cuerpo-pequeno">
          {(
            [
              [t.saldoAFavor, m(tarjeta.saldoAFavor)],
              [t.limite, m(tarjeta.limite)],
              ...(tarjeta.limite > 0
                ? ([[t.usoLimite, formatearPorcentaje(tarjeta.usoLimite)]] as const)
                : []),
              [
                t.ciclo,
                t.cicloValor(
                  formatearFecha(tarjeta.cicloFacturacion.desde),
                  formatearFecha(tarjeta.cicloFacturacion.hasta),
                ),
              ],
            ] as const
          ).map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt className="text-rotulo text-texto-secundario">{rotulo}</dt>
              <dd className="font-bold">{valor}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="al-pagar" className={TARJETA}>
        <h2 id="al-pagar" className="text-rotulo text-texto-secundario">
          {t.alPagar}
        </h2>
        <Filas
          filas={[
            [t.deudaAnterior, m(d.deudaAnterior)],
            [t.cargosDelCiclo, m(d.cargosDelCiclo)],
            [t.yaPagado, m(d.yaPagado)],
            [t.sinIntereses, m(d.paraNoGenerarIntereses)],
          ]}
        />
      </section>
    </div>
  );
}

/** La próxima cuota y el avance: el DTO trae la tabla con el estado de cada cuota, acá solo se elige y se cuenta. */
export function ProximaCuota({
  cuentaId,
  prestamo,
}: {
  readonly cuentaId: string;
  readonly prestamo: NonNullable<DetalleCuentaDto['prestamo']>;
}) {
  const t = cuentaDetalle.prestamo;
  const c = prestamo.condiciones;
  const tabla = prestamo.amortizacion;
  const proxima = tabla?.find((q) => q.estado !== 'pagada');
  return (
    <section data-bloque="proxima-cuota" className={TARJETA}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-rotulo text-texto-secundario">
            {proxima === undefined ? t.cuotaPactada : t.proximaCuota(proxima.numero, c.plazoCuotas)}
          </h2>
          <p>
            <Monto centavos={c.cuotaPactada} rol="cifra" />
          </p>
          {proxima === undefined ? null : (
            <p className="text-cuerpo-pequeno text-texto-secundario">
              {formatearFecha(proxima.fecha)}
            </p>
          )}
        </div>
        <EnlaceFinn href={`/cuentas/${cuentaId}/cuota`} className={PAGAR}>
          {cuentaDetalle.acciones.pagar}
        </EnlaceFinn>
      </div>
      {tabla === null ? null : (
        <p className="text-cuerpo-pequeno">
          {t.cuotasPagadas(tabla.filter((q) => q.estado === 'pagada').length, c.plazoCuotas)}
        </p>
      )}
    </section>
  );
}

export function BloquePrestamo({
  prestamo,
  cuentaId,
}: {
  readonly prestamo: NonNullable<DetalleCuentaDto['prestamo']>;
  readonly cuentaId: string;
}) {
  const t = cuentaDetalle.prestamo;
  const c = prestamo.condiciones;
  const proxima = prestamo.amortizacion?.find((q) => q.estado !== 'pagada')?.numero;
  return (
    <div data-bloque="prestamo" className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 className="text-titulo-seccion">{t.condiciones}</h2>
          <EnlaceFinn href={`/cuentas/${cuentaId}/condiciones`} className={ENLACE}>
            {cuentaDetalle.acciones.editar}
          </EnlaceFinn>
        </div>
        <div className={TARJETA}>
          <Filas
            filas={[
              [t.contraparte, c.contraparte],
              [t.montoOriginal, m(c.montoOriginal)],
              [t.capitalPendiente, m(prestamo.capitalPendiente)],
              [t.cuotaPactada, m(c.cuotaPactada)],
              [t.plazo, t.plazoValor(c.plazoCuotas)],
              [t.interesPagado, m(prestamo.costoFinanciero.interes)],
              [t.seguroPagado, m(prestamo.costoFinanciero.seguro)],
              ...(prestamo.comparacion === null
                ? []
                : ([
                    [t.proyectadoHastaHoy, m(prestamo.comparacion.proyectadoHastaHoy)],
                    [t.pagadoHastaHoy, m(prestamo.comparacion.pagadoHastaHoy)],
                  ] as const)),
            ]}
          />
        </div>
      </section>
      <section className="flex flex-col gap-2.5">
        <h2 className="flex min-h-11 items-center text-titulo-seccion">{t.amortizacion}</h2>
        {prestamo.amortizacion === null ? (
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.sinModelo}</p>
        ) : (
          <div className={TARJETA_TABLA}>
            <table className="w-full text-cuerpo-pequeno">
              <caption className="sr-only">{t.amortizacion}</caption>
              <thead>
                <tr className="text-left text-rotulo text-texto-secundario">
                  {[t.numero, t.fecha, t.capital, t.interes, t.seguro, t.saldo, t.pagado].map(
                    (h) => (
                      <th key={h} scope="col" className="px-1 py-1 font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                  <th scope="col" className="px-1 py-1 font-semibold">
                    {cuentaDetalle.filtros.estado}
                  </th>
                </tr>
              </thead>
              <FilasAmortizacion
                columnas={8}
                actual={Math.max(
                  0,
                  prestamo.amortizacion.findIndex((q) => q.numero === proxima),
                )}
                filas={prestamo.amortizacion.map((q) => (
                  <tr
                    key={q.numero}
                    {...(q.numero === proxima ? { 'aria-current': 'step' as const } : {})}
                    className={q.numero === proxima ? 'rounded-control bg-superficie-hundida' : ''}
                  >
                    <td className="px-1 py-2">{q.numero}</td>
                    <td className="px-1 py-2">{formatearFecha(q.fecha)}</td>
                    <td className="px-1 py-2">{m(q.capital)}</td>
                    <td className="px-1 py-2">{m(q.interes)}</td>
                    <td className="px-1 py-2">{m(q.seguro)}</td>
                    <td className="px-1 py-2">{m(q.saldo)}</td>
                    <td className="px-1 py-2">{m(q.pagado)}</td>
                    <td className="px-1 py-2">{t.estados[q.estado]}</td>
                  </tr>
                ))}
              />
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
