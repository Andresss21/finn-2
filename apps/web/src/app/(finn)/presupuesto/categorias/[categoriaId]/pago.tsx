// Detalle de la categoría de pago de tarjeta (FT-29; 05 §7.7; 06-identidad-visual §6, estado «Categoría de pago de tarjeta»).
// El número principal es «Te falta reservar» (F4) y solo existe en el período activo (inv. 2). Dibuja lo que trae el DTO:
// no suma ni resta montos (PF-3). Sin metas, fusión ni archivo propio (05 §7.7).
import type { DetalleCategoriaDto } from '@finn/aplicacion/consultas/detalle-categoria';
import type { Centavos } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { AvisoEnLinea } from '../../../../../componentes/base/aviso';
import { Monto } from '../../../../../componentes/dominio/monto';
import { PublicarEncabezado } from '../../../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../../../componentes/navegacion/enlace-finn';
import { SelectorPeriodo } from '../../../../../componentes/navegacion/selector-periodo';
import { formatearFecha } from '../../../../../formato';
import { categoriaDetalle } from '../../../../../textos/categoria-detalle';
import { categoriaPago as t } from '../../../../../textos/categoria-pago';

type DetallePago = Extract<DetalleCategoriaDto, { readonly clase: 'pago' }>;

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline ${FOCO}`;
const PRINCIPAL = `inline-flex min-h-12 items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion ${FOCO}`;
const TONAL = `inline-flex min-h-12 items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion ${FOCO}`;
const CONTENEDOR = 'flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie';

function Seccion({
  titulo,
  atributo,
  children,
}: {
  readonly titulo: string;
  readonly atributo: string;
  readonly children: ReactNode;
}) {
  return (
    <section data-seccion={atributo} className="flex flex-col gap-2">
      <h2 className="text-titulo-seccion">{titulo}</h2>
      {children}
    </section>
  );
}

function Numeros({
  atributo,
  filas,
}: {
  readonly atributo: string;
  readonly filas: readonly (readonly [string, string, Centavos])[];
}) {
  return (
    <dl
      data-numeros={atributo}
      className="grid grid-cols-2 gap-3 rounded-contenedor bg-superficie p-3.5"
    >
      {filas.map(([clave, rotulo, centavos]) => (
        <div key={clave} data-numero={clave} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-rotulo text-texto-secundario">{rotulo}</dt>
          <dd className="font-semibold">
            <Monto centavos={centavos} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Movimientos({
  titulo,
  atributo,
  filas,
  volver,
}: {
  readonly titulo: string;
  readonly atributo: string;
  readonly filas: readonly {
    readonly transaccionId: string;
    readonly fecha: string;
    readonly monto: Centavos;
    readonly nota?: string;
  }[];
  readonly volver: string;
}) {
  if (filas.length === 0) return null;
  return (
    <Seccion titulo={titulo} atributo={atributo}>
      <ul className={CONTENEDOR}>
        {filas.map((f) => (
          <li
            key={`${f.transaccionId}-${f.fecha}`}
            className="flex items-center justify-between gap-3 px-3.5 py-3"
          >
            <span className="flex min-w-0 flex-col">
              <EnlaceFinn
                href={`/actividad/${f.transaccionId}?volver=${encodeURIComponent(volver)}`}
                className={ENLACE}
              >
                {formatearFecha(f.fecha)}
              </EnlaceFinn>
              {f.nota === undefined ? null : (
                <span className="px-2 text-cuerpo-pequeno text-texto-secundario">{f.nota}</span>
              )}
            </span>
            <Monto centavos={f.monto} />
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

/** Un aviso de pago excedente por causa (AV-04, AV-05, AV-06): la causa y el monto vienen del DTO. */
function Excedentes({ dto }: { readonly dto: DetallePago }) {
  const { pagoExcedente, tarjetaHoy } = dto;
  if (pagoExcedente === null) return null;
  const aviso = (clave: string, par: readonly [string, string], monto: Centavos) => (
    <AvisoEnLinea key={clave} estado="problema">
      <span data-aviso={clave}>
        {par[0]} <Monto centavos={monto} /> {par[1]}
      </span>
    </AvisoEnLinea>
  );
  if (pagoExcedente.causas.length === 0)
    return (
      <div data-excedente className="flex flex-col gap-2">
        {aviso('excedente', t.avisos.excedente, pagoExcedente.total)}
      </div>
    );
  return (
    <div data-excedente className="flex flex-col gap-2">
      {pagoExcedente.causas.map((c) => {
        if (c.causa === 'pago') return aviso('AV-04', t.avisos['AV-04'], c.monto);
        if (c.causa === 'cobro') return aviso('AV-05', t.avisos['AV-05'], c.monto);
        return aviso(
          'AV-06',
          tarjetaHoy.saldoAFavor > 0 ? t.avisos['AV-06-saldo'] : t.avisos['AV-06-deuda'],
          c.monto,
        );
      })}
    </div>
  );
}

export function PantallaPagoTarjeta({ dto }: { readonly dto: DetallePago }) {
  const { categoria, tarjeta, periodo, periodoActivo, tarjetaHoy, desgloseAlPagar: corte } = dto;
  const activo = periodo.estado === 'activo';
  const cerrado = periodo.estado === 'cerrado';
  const raiz = `/presupuesto/categorias/${categoria.id}`;
  const conPeriodo = (ruta: string): string =>
    periodo.inicio === periodoActivo.inicio ? ruta : `${ruta}?periodo=${periodo.inicio}`;
  const hrefAsignar = conPeriodo(`/presupuesto/asignar/${categoria.id}`);
  const faltaReservar = tarjetaHoy.faltaReservar > 0;
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <div className="flex flex-col gap-3">
        <EnlaceFinn href={conPeriodo('/presupuesto')} className={ENLACE}>
          {categoriaDetalle.volver}
        </EnlaceFinn>
        <SelectorPeriodo
          periodo={periodo}
          periodoActivo={periodoActivo}
          {...(dto.navegacion.anterior === undefined ? {} : { anterior: dto.navegacion.anterior })}
          {...(dto.navegacion.siguiente === undefined
            ? {}
            : { siguiente: dto.navegacion.siguiente })}
          ruta={raiz}
          parametros={{}}
        />
        {cerrado ? <AvisoEnLinea estado="informacion">{t.cerrado}</AvisoEnLinea> : null}
        {periodo.estado === 'futuro' ? (
          <AvisoEnLinea estado="informacion">{t.futuro}</AvisoEnLinea>
        ) : null}
      </div>

      <header className="flex flex-col gap-2">
        <p className="text-rotulo text-texto-secundario">{t.titulo}</p>
        <h1 className="text-titulo-pantalla">{categoria.nombre}</h1>
        <EnlaceFinn href={`/cuentas/${tarjeta.id}`} className={ENLACE}>
          {t.deLaTarjeta(tarjeta.nombre)}
        </EnlaceFinn>
        {activo ? (
          <div data-falta-reservar={tarjetaHoy.faltaReservar}>
            <p className="text-cuerpo-pequeno">{t.principal.teFaltaReservar}</p>
            <p>
              <Monto
                centavos={tarjetaHoy.faltaReservar}
                rol="cifra-principal"
                {...(faltaReservar ? { estado: 'deuda-sin-respaldo' as const } : {})}
              />
            </p>
            {faltaReservar ? null : (
              <p className="text-cuerpo-pequeno text-texto-secundario">{t.principal.alDiaTexto}</p>
            )}
          </div>
        ) : null}
      </header>

      {activo ? (
        <>
          <Excedentes dto={dto} />
          {tarjetaHoy.reservaExcedente > 0 ? (
            <AvisoEnLinea estado="informacion">
              <span data-aviso="AV-08">
                {t.avisos['AV-08'][0]} <Monto centavos={tarjetaHoy.reservaExcedente} />{' '}
                {t.avisos['AV-08'][1]}
              </span>
            </AvisoEnLinea>
          ) : null}
        </>
      ) : (
        <Excedentes dto={dto} />
      )}

      <nav aria-label={t.acciones.etiqueta} className="grid grid-cols-2 gap-2">
        {!cerrado ? (
          <EnlaceFinn href={hrefAsignar} className={PRINCIPAL}>
            {faltaReservar ? (
              <>
                {t.acciones.reservar} <Monto centavos={tarjetaHoy.faltaReservar} />
              </>
            ) : (
              t.acciones.asignar
            )}
          </EnlaceFinn>
        ) : null}
        {activo ? (
          <EnlaceFinn href={`/cuentas/${tarjeta.id}/pagar`} className={TONAL}>
            {t.acciones.pagar}
          </EnlaceFinn>
        ) : null}
      </nav>

      <Seccion titulo={t.numeros.titulo} atributo="numeros-periodo">
        <Numeros
          atributo="periodo"
          filas={[
            ['asignado', t.numeros.asignado, dto.numeros.asignado],
            ['actividad', t.numeros.actividad, dto.numeros.actividad],
            ['arrastre', t.numeros.arrastre, dto.numeros.arrastre],
            ['disponible', t.numeros.disponible, dto.numeros.disponible],
          ]}
        />
      </Seccion>

      {activo ? (
        <Seccion titulo={t.hoy.titulo} atributo="tarjeta-hoy">
          <Numeros
            atributo="tarjeta-hoy"
            filas={[
              ['deuda', t.hoy.deuda, tarjetaHoy.deuda],
              ['saldo-a-favor', t.hoy.saldoAFavor, tarjetaHoy.saldoAFavor],
              ['reservado', t.hoy.reservado, tarjetaHoy.reservado],
              ['falta-reservar', t.hoy.faltaReservar, tarjetaHoy.faltaReservar],
              ['reserva-excedente', t.hoy.reservaExcedente, tarjetaHoy.reservaExcedente],
            ]}
          />
        </Seccion>
      ) : null}

      <Seccion titulo={t.traslados.titulo} atributo="traslados">
        {dto.traslados.length === 0 ? (
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.traslados.vacio}</p>
        ) : (
          <>
            <p className="text-cuerpo-pequeno text-texto-secundario">{t.traslados.nota}</p>
            <ul className={CONTENEDOR}>
              {dto.traslados.map((x) => (
                <li
                  key={x.categoria.id}
                  data-traslado={x.categoria.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-3"
                >
                  <EnlaceFinn
                    href={conPeriodo(`/presupuesto/categorias/${x.categoria.id}`)}
                    className={ENLACE}
                  >
                    {x.categoria.nombre}
                  </EnlaceFinn>
                  <Monto centavos={x.monto} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Seccion>

      <Movimientos
        titulo={t.movimientos.pagos}
        atributo="pagos"
        filas={dto.pagos}
        volver={conPeriodo(raiz)}
      />
      <Movimientos
        titulo={t.movimientos.pagosImplicitos}
        atributo="pagos-implicitos"
        filas={dto.pagosImplicitos}
        volver={conPeriodo(raiz)}
      />
      <Movimientos
        titulo={t.movimientos.devoluciones}
        atributo="devoluciones"
        filas={dto.devoluciones.map((d) => ({ ...d, nota: t.movimientos.caso[d.caso] }))}
        volver={conPeriodo(raiz)}
      />

      {activo ? (
        <Seccion titulo={t.alPagar.titulo} atributo="al-pagar">
          <Numeros
            atributo="al-pagar"
            filas={[
              ['deuda-anterior', t.alPagar.deudaAnterior, corte.deudaAnterior],
              ['cargos-del-ciclo', t.alPagar.cargosDelCiclo, corte.cargosDelCiclo],
              ['ya-pagado', t.alPagar.yaPagado, corte.yaPagado],
              ['sin-intereses', t.alPagar.sinIntereses, corte.paraNoGenerarIntereses],
            ]}
          />
          <p data-proximo-pago={corte.proximoPago} className="font-semibold">
            {t.alPagar.pagaAntesDel(corte.proximoPago.slice(8), corte.proximoPago.slice(5, 7))}
          </p>
        </Seccion>
      ) : null}

      {dto.historial.length === 0 ? null : (
        <Seccion titulo={t.historial.titulo} atributo="historial">
          <table className="w-full text-cuerpo-pequeno">
            <caption className="sr-only">{t.historial.titulo}</caption>
            <thead>
              <tr className="text-left text-rotulo text-texto-secundario">
                <th scope="col">{t.historial.periodo}</th>
                {t.historial.columnas.map((c) => (
                  <th key={c} scope="col" className="text-right">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dto.historial.map((h) => (
                <tr key={h.periodo.inicio} data-historial-periodo={h.periodo.inicio}>
                  <th scope="row" className="py-1 text-left font-normal">
                    {formatearFecha(h.periodo.inicio)}
                  </th>
                  <td className="text-right">
                    <Monto centavos={h.asignado} />
                  </td>
                  <td className="text-right">
                    <Monto centavos={h.disponible} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Seccion>
      )}
    </main>
  );
}
