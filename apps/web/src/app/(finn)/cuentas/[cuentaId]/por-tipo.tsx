// Bloque propio de cada tipo de cuenta en el detalle (FT-52 paso 3): tarjeta (deuda, reservado, te falta reservar, ciclo y desglose
// al pagar), préstamo (condiciones, capital pendiente, amortización, costo financiero; FT-55 lo completa) e inversión (aportes,
// retiros y ajustes). Todo sale del DTO tal cual: nada se calcula acá (PF-3). La cara de la tarjeta y su acento no se dibujan acá.
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import type { Centavos } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { IndicadorEstado } from '../../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../../componentes/dominio/monto';
import { formatearFecha, formatearPorcentaje } from '../../../../formato';
import { cuentaDetalle } from '../../../../textos/cuenta-detalle';

function Bloque({ titulo, children }: { readonly titulo: string; readonly children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-contenedor bg-superficie p-3.5">
      <h2 className="text-titulo-seccion">{titulo}</h2>
      {children}
    </section>
  );
}

function Datos({ filas }: { readonly filas: readonly (readonly [string, ReactNode])[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-cuerpo-pequeno">
      {filas.map(([rotulo, valor]) => (
        <div key={rotulo}>
          <dt className="text-rotulo text-texto-secundario">{rotulo}</dt>
          <dd className="font-bold">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

const m = (c: Centavos) => <Monto centavos={c} rol="cuerpo" />;

export function BloqueTarjeta({
  tarjeta,
}: {
  readonly tarjeta: NonNullable<DetalleCuentaDto['tarjeta']>;
}) {
  const t = cuentaDetalle.tarjeta;
  const d = tarjeta.desgloseAlPagar;
  return (
    <Bloque titulo={t.titulo}>
      <div data-bloque="tarjeta" className="flex flex-col gap-3">
        {tarjeta.faltaReservar > 0 ? (
          <p className="flex flex-wrap items-center gap-2">
            <IndicadorEstado estado="deuda-sin-respaldo" etiqueta={t.faltaReservar} />
            <Monto centavos={tarjeta.faltaReservar} estado="deuda-sin-respaldo" rol="cifra" />
          </p>
        ) : null}
        {tarjeta.reservaExcedente > 0 ? (
          <IndicadorEstado estado="informacion" etiqueta={t.reservaExcedente} />
        ) : null}
        <Datos
          filas={[
            [t.deuda, m(tarjeta.deuda)],
            [t.saldoAFavor, m(tarjeta.saldoAFavor)],
            [t.reservado, m(tarjeta.reservado)],
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
          ]}
        />
        <h3 className="text-etiqueta font-bold">{t.alPagar}</h3>
        <Datos
          filas={[
            [t.deudaAnterior, m(d.deudaAnterior)],
            [t.cargosDelCiclo, m(d.cargosDelCiclo)],
            [t.yaPagado, m(d.yaPagado)],
            [t.sinIntereses, m(d.paraNoGenerarIntereses)],
          ]}
        />
      </div>
    </Bloque>
  );
}

export function BloquePrestamo({
  prestamo,
}: {
  readonly prestamo: NonNullable<DetalleCuentaDto['prestamo']>;
}) {
  const t = cuentaDetalle.prestamo;
  const c = prestamo.condiciones;
  return (
    <Bloque titulo={t.titulo}>
      <div data-bloque="prestamo" className="flex flex-col gap-3">
        <Datos
          filas={[
            [t.contraparte, c.contraparte],
            [t.capitalPendiente, m(prestamo.capitalPendiente)],
            [t.cuotaPactada, m(c.cuotaPactada)],
            [t.plazo, t.plazoValor(c.plazoCuotas)],
            [t.interesPagado, m(prestamo.costoFinanciero.interes)],
            [t.seguroPagado, m(prestamo.costoFinanciero.seguro)],
          ]}
        />
        {prestamo.comparacion === null ? null : (
          <Datos
            filas={[
              [t.proyectadoHastaHoy, m(prestamo.comparacion.proyectadoHastaHoy)],
              [t.pagadoHastaHoy, m(prestamo.comparacion.pagadoHastaHoy)],
            ]}
          />
        )}
        {prestamo.amortizacion === null ? (
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.sinModelo}</p>
        ) : (
          <div className="overflow-x-auto">
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
              <tbody>
                {prestamo.amortizacion.map((q) => (
                  <tr key={q.numero}>
                    <td className="px-1 py-1">{q.numero}</td>
                    <td className="px-1 py-1">{formatearFecha(q.fecha)}</td>
                    <td className="px-1 py-1">{m(q.capital)}</td>
                    <td className="px-1 py-1">{m(q.interes)}</td>
                    <td className="px-1 py-1">{m(q.seguro)}</td>
                    <td className="px-1 py-1">{m(q.saldo)}</td>
                    <td className="px-1 py-1">{m(q.pagado)}</td>
                    <td className="px-1 py-1">{t.estados[q.estado]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Bloque>
  );
}

export function BloqueInversion({
  inversion,
}: {
  readonly inversion: NonNullable<DetalleCuentaDto['inversion']>;
}) {
  const t = cuentaDetalle.inversion;
  return (
    <Bloque titulo={t.titulo}>
      <div data-bloque="inversion">
        <Datos
          filas={[
            [t.valor, m(inversion.valor)],
            [t.aportes, m(inversion.aportes)],
            [t.retiros, m(inversion.retiros)],
            [t.ajustes, m(inversion.ajustes)],
          ]}
        />
      </div>
    </Bloque>
  );
}
