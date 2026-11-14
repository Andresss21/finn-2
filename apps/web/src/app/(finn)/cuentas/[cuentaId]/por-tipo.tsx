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
// CTA-27: «Reservar $X» es un enlace en `--enlace` 700 a la derecha del indicador, no una pastilla en su propia fila.
const RESERVAR =
  'inline-flex min-h-11 items-center justify-center font-bold text-enlace focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE =
  'inline-flex min-h-11 items-center font-bold text-enlace focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

const m = (c: Centavos) => <Monto centavos={c} rol="cuerpo" />;
/** «25/10» de una fecha `AAAA-MM-DD` del DTO. */
const diaMes = (fecha: string): string => `${fecha.slice(8)}/${fecha.slice(5, 7)}`;

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
        {/* [CH-222 A17, D11] La cabecera del contenedor: el estado a la izquierda y «Reservar $X» a la derecha, que abre Asignar
            en la categoría de pago (`categoriaPago`) con la variante `reservar_falta`; el monto es el del DTO (PF-3). */}
        <div data-cabecera-tarjeta className="flex flex-wrap items-center justify-between gap-2.5">
          {tarjeta.faltaReservar > 0 ? (
            <p className="flex flex-wrap items-center gap-2">
              <IndicadorEstado estado="deuda-sin-respaldo" etiqueta={t.faltaReservar} />
              <Monto centavos={tarjeta.faltaReservar} estado="deuda-sin-respaldo" rol="cifra" />
            </p>
          ) : tarjeta.deuda > 0 ? (
            <IndicadorEstado estado="positivo" etiqueta={t.pagoReservado} />
          ) : (
            <p className="font-semibold">{t.sinDeuda}</p>
          )}
          {tarjeta.faltaReservar > 0 ? (
            <EnlaceFinn
              href={`/presupuesto/asignar/${tarjeta.categoriaPago.id}`}
              data-variante="reservar_falta"
              className={RESERVAR}
            >
              {t.reservar}&nbsp;
              <Monto centavos={tarjeta.faltaReservar} />
            </EnlaceFinn>
          ) : null}
        </div>
        {tarjeta.reservaExcedente > 0 ? (
          <IndicadorEstado estado="informacion" etiqueta={t.reservaExcedente} />
        ) : null}
        {typeof tarjeta.reservadoBp !== 'number' ? (
          <p className="flex flex-wrap justify-between gap-2 text-cuerpo-pequeno">
            <span>
              {t.reservado} {m(tarjeta.reservado)}
            </span>
            <span className="text-texto-secundario">
              {t.deuda} {m(tarjeta.deuda)}
            </span>
          </p>
        ) : (
          // [CH-252] CTA-26: «Reservado $X de $Y» con la proporción del servidor; lo sin reservar, con el patrón.
          <div data-barra-reservado className="flex flex-col gap-1.5">
            <p className="flex flex-wrap justify-between gap-2 text-cuerpo-pequeno">
              <span>
                {t.reservado} {m(tarjeta.reservado)} {t.de} {m(tarjeta.deuda)}
              </span>
              <span className="font-semibold tabular-nums">
                {formatearPorcentaje(tarjeta.reservadoBp)}
              </span>
            </p>
            <div
              role="progressbar"
              aria-label={`${t.reservado} ${formatearPorcentaje(tarjeta.reservadoBp)}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={tarjeta.reservadoBp / 100}
              aria-valuetext={formatearPorcentaje(tarjeta.reservadoBp)}
              style={{ borderRadius: 2 }}
              className="relative h-2 overflow-hidden bg-[image:var(--patron-sin-reservar)]"
            >
              <span
                style={{ width: `${tarjeta.reservadoBp / 100}%` }}
                className="absolute inset-y-0 left-0 bg-accion"
              />
            </div>
          </div>
        )}
        {/* CTA-26: la rejilla del diseño es «Corte · Pago · Límite»; las fechas son las del DTO, sin calcular (PF-3). El saldo a favor
            solo aparece cuando existe. */}
        <dl className="grid grid-cols-3 gap-x-3 gap-y-3 text-cuerpo-pequeno">
          {(
            [
              [t.corte, diaMes(tarjeta.cicloFacturacion.hasta)],
              [t.pago, diaMes(d.proximoPago)],
              [t.limite, m(tarjeta.limite)],
              ...(tarjeta.saldoAFavor > 0
                ? ([[t.saldoAFavor, m(tarjeta.saldoAFavor)]] as const)
                : []),
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
        {/* [CH-234 A17] La fecha de pago del DTO, tal cual, a la derecha del título */}
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="al-pagar" className="text-rotulo whitespace-nowrap text-texto-secundario">
            {t.alPagar}
          </h2>
          <span
            data-proximo-pago={d.proximoPago}
            className="text-cuerpo-pequeno font-semibold whitespace-nowrap"
          >
            {t.pagaAntesDel(d.proximoPago.slice(8), d.proximoPago.slice(5, 7))}
          </span>
        </div>
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
  const proxima = prestamo.proximaCuota; // [CH-252] con modelo o sin él (E2-11)
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
          {t.cuotasPagadas(
            // [CH-261] las pagadas antes de Finn (P13) no están en la tabla: arranca en la siguiente
            c.cuotasPagadasAlCrear + tabla.filter((q) => q.estado === 'pagada').length,
            c.plazoCuotas,
          )}
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
