// Conciliaciones del detalle de cuenta (FT-52, CA-52.2; export `06-detalle-de-cuenta`): una fila por conciliación con la diferencia
// aceptada, la diferencia actual (AV-21 si es distinta de cero) y los cambios posteriores, tal como los trae el DTO (DM-8). El
// nombre es "Estado de cuenta" o "Verificación de saldo" según `modo` (CF-01, 3.2.4). No calcula la diferencia (PF-3).
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Monto } from '../../../../componentes/dominio/monto';
import { formatearFecha, formatearInstante, formatearMonto } from '../../../../formato';
import { cuentaDetalle } from '../../../../textos/cuenta-detalle';
import { dominio } from '../../../../textos/dominio';

const t = cuentaDetalle.conciliaciones;
type Conciliacion = DetalleCuentaDto['conciliaciones'][number];
const nombreDe = (c: Conciliacion) =>
  c.modo === 'saldo' ? t.verificacionDeSaldo : t.estadoDeCuenta;
const money = (c: Conciliacion['diferenciaActual']) => formatearMonto(c);

/** El aviso de la cabecera (AV-21): solo si la conciliación más reciente tiene una diferencia hoy. */
export function AvisoDiferencia({
  conciliacion: c,
}: {
  readonly conciliacion: Conciliacion | undefined;
}) {
  if (c === undefined || c.diferenciaActual === 0) return null;
  return (
    <AvisoEnLinea
      estado="advertencia"
      titulo={t.diferenciaConElEstado}
      accion={
        <a href={`#conciliacion-${c.id}`} className="inline-flex min-h-11 items-center">
          {t.verConciliacion}
        </a>
      }
    >
      {t.textoDiferencia(
        formatearFecha(c.fechaEstado),
        money(c.saldoEstado),
        money(c.diferenciaActual),
      )}
    </AvisoEnLinea>
  );
}

export function Conciliaciones({
  conciliaciones,
}: {
  readonly conciliaciones: DetalleCuentaDto['conciliaciones'];
}) {
  if (conciliaciones.length === 0) return null;
  return (
    <section data-conciliaciones className="flex flex-col gap-2.5">
      <h2 className="text-titulo-seccion">{t.titulo}</h2>
      <ul className="flex flex-col divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1">
        {conciliaciones.map((c) => (
          <li
            key={c.id}
            id={`conciliacion-${c.id}`}
            data-conciliacion={c.id}
            className="flex flex-col gap-2 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h3 className="font-semibold">{nombreDe(c)}</h3>
                <p className="text-cuerpo-pequeno text-texto-secundario">
                  {t.resumen(
                    formatearFecha(c.fechaEstado),
                    money(c.diferenciaAceptada),
                    money(c.diferenciaActual),
                  )}
                </p>
              </div>
              <span
                className={[
                  'flex flex-none items-center gap-2 text-etiqueta font-semibold',
                  c.diferenciaActual === 0 ? 'text-positivo-texto' : 'text-advertencia-texto',
                ].join(' ')}
              >
                {c.diferenciaActual === 0 ? t.badgeIgual : t.badgeDiferencia}
              </span>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-cuerpo-pequeno">
              <div>
                <dt className="text-rotulo text-texto-secundario">{t.saldoEstado}</dt>
                <dd className="font-bold">
                  <Monto centavos={c.saldoEstado} rol="cuerpo" />
                </dd>
              </div>
              <div>
                <dt className="text-rotulo text-texto-secundario">{t.diferenciaAceptada}</dt>
                <dd className="font-bold" data-diferencia="aceptada">
                  <Monto centavos={c.diferenciaAceptada} rol="cuerpo" />
                </dd>
              </div>
              <div>
                <dt className="text-rotulo text-texto-secundario">{t.diferenciaActual}</dt>
                <dd className="font-bold" data-diferencia="actual">
                  <Monto centavos={c.diferenciaActual} rol="cuerpo" />
                </dd>
              </div>
            </dl>
            <p className="text-cuerpo-pequeno text-texto-secundario">
              {t.conciliadas(c.transaccionesConciliadas)}
            </p>
            {c.cambiosPosteriores.length === 0 ? null : (
              <div>
                <h4 className="text-etiqueta font-bold">{t.cambiosTitulo}</h4>
                <ul className="flex flex-col gap-1 text-cuerpo-pequeno">
                  {c.cambiosPosteriores.map((p, i) => (
                    <li key={`${p.registradoEn}-${i}`} data-cambio-posterior>
                      <span className="block">
                        {t.cambio(
                          p.motivos.map((m) => t.motivos[m]).join(', '),
                          formatearInstante(p.registradoEn),
                        )}
                      </span>
                      <span className="block text-texto-secundario">
                        {t.comoEra(
                          p.foto.comercio ?? dominio.sinComercio,
                          formatearFecha(p.foto.fecha),
                        )}{' '}
                        <Monto centavos={p.foto.montoEfecto} rol="cuerpo" />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
