// Conciliaciones y programadas del detalle de cuenta (FT-52, CA-52.2): la diferencia aceptada, la diferencia actual (AV-21 si es
// distinta de cero) y los cambios posteriores, tal como los trae el DTO (DM-8). El nombre es "Estado de cuenta" o "Verificación
// de saldo" según `modo` (CF-01, 3.2.4). No calcula la diferencia (PF-3).
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Monto } from '../../../../componentes/dominio/monto';
import { formatearFecha, formatearInstante, formatearMonto } from '../../../../formato';
import { cuentaDetalle } from '../../../../textos/cuenta-detalle';
import { dominio } from '../../../../textos/dominio';

const t = cuentaDetalle.conciliaciones;

function Dato({
  rotulo,
  children,
}: {
  readonly rotulo: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-rotulo text-texto-secundario">{rotulo}</dt>
      <dd className="font-bold">{children}</dd>
    </div>
  );
}

/** El aviso de la cabecera (AV-21): solo si la conciliación más reciente tiene una diferencia hoy. */
export function AvisoDiferencia({
  conciliacion: c,
}: {
  readonly conciliacion: DetalleCuentaDto['conciliaciones'][number] | undefined;
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
        formatearMonto(c.saldoEstado),
        formatearMonto(c.diferenciaActual),
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
    <section data-conciliaciones className="flex flex-col gap-3">
      <h2 className="text-titulo-seccion">{t.titulo}</h2>
      {conciliaciones.map((c) => (
        <article
          key={c.id}
          id={`conciliacion-${c.id}`}
          data-conciliacion={c.id}
          className="flex flex-col gap-3 rounded-contenedor bg-superficie p-3.5"
        >
          <h3 className="font-bold">
            {c.modo === 'saldo' ? t.verificacionDeSaldo : t.estadoDeCuenta}{' '}
            {t.al(formatearFecha(c.fechaEstado))}
          </h3>
          <dl className="grid grid-cols-3 gap-2 text-cuerpo-pequeno">
            <Dato rotulo={t.saldoEstado}>
              <Monto centavos={c.saldoEstado} rol="cuerpo" />
            </Dato>
            <Dato rotulo={t.diferenciaAceptada}>
              <span data-diferencia="aceptada">
                <Monto centavos={c.diferenciaAceptada} rol="cuerpo" />
              </span>
            </Dato>
            <Dato rotulo={t.diferenciaActual}>
              <span data-diferencia="actual">
                <Monto centavos={c.diferenciaActual} rol="cuerpo" />
              </span>
            </Dato>
          </dl>
          <p className="text-cuerpo-pequeno text-texto-secundario">
            {t.conciliadas(c.transaccionesConciliadas)}
          </p>
          {c.diferenciaActual === 0 ? null : (
            <AvisoEnLinea estado="advertencia">{t.avisoDiferencia}</AvisoEnLinea>
          )}
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
        </article>
      ))}
    </section>
  );
}
