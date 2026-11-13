'use client';
// Los hallazgos de «Tarjetas en el tiempo» con su acción (FT-66; 06 §3.5.10, 3.6): «Reservar {S}» es OP-14 de un toque sobre la
// categoría de pago de la tarjeta en el período activo, con `montoNuevo` que armó el selector (Asig + S) y `esperado` lo asignado
// que vio la pantalla; acá solo se escriben como texto (PF-3). Con `ok: true` ofrece «Deshacer» (los dos valores intercambiados).
// Si la tarjeta no tiene nada que reservar, la acción es el enlace a pagarla (OP-23). La salida queda en su lugar aunque la
// revalidación cambie el hallazgo (05 §4.14, regla 4).
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { useCallback, useEffect, useRef } from 'react';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Boton } from '../../../../componentes/base/boton';
import { COLOR_TEXTO } from '../../../../componentes/dominio/indicador-estado';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { centavosATextoDecimal, formatearMonto } from '../../../../formato';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { ConfirmacionUnToque } from '../../../../formularios/confirmacion-un-toque';
import { useUnToque } from '../../../../formularios/use-un-toque';
import { inicio as ti } from '../../../../textos/inicio';
import { reportes as t } from '../../../../textos/reportes';
import type { AccionesRealidad } from './realidad-hallazgos';

export type HallazgoTarjeta = ReporteDe<'tarjetas'>['hallazgos'][number];
/** Del lector: la acción de OP-14 y lo asignado vigente de cada categoría (incluidas las de pago). */
export type AccionesTarjetas = Pick<AccionesRealidad, 'asignar' | 'esperados'>;

interface Entrada {
  readonly categoriaId: string;
  readonly periodoInicio: string;
  readonly montoNuevo: string;
  readonly esperado: { readonly monto: string };
}

const ENLACE =
  'inline-flex min-h-11 items-center gap-1.5 text-etiqueta font-bold no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function HallazgosTarjetas({
  hallazgos,
  periodoInicio,
  acciones,
}: {
  readonly hallazgos: readonly HallazgoTarjeta[];
  readonly periodoInicio: string;
  readonly acciones?: AccionesTarjetas;
}) {
  const tocado = useRef<HallazgoTarjeta | null>(null);
  // Tras revalidar, la Server Action llega con otra identidad; una función estable que llama a la última evita que
  // `useUnToque` rearme su salida y «Deshacer» reaparezca después de usarlo.
  const ultima = useRef(acciones);
  useEffect(() => {
    ultima.current = acciones;
  }, [acciones]);
  const accion = useCallback<AccionEscritura>(
    (entrada) =>
      ultima.current === undefined
        ? Promise.reject(new Error('Sin acción de reservar'))
        : ultima.current.asignar(entrada),
    [],
  );
  const un = useUnToque({
    accion,
    accionInversa: accion,
    inversa: (entrada) => {
      const e = entrada as Entrada;
      const h = tocado.current;
      if (h === null) return null;
      return {
        descripcion: t.tarjetas.reservado(formatearMonto(h.sinRespaldo), h.tarjeta.nombre),
        etiqueta: ti.deshacer,
        entrada: { ...e, montoNuevo: e.esperado.monto, esperado: { monto: e.montoNuevo } },
      };
    },
  });
  const ocupado = un.estado === 'enviando' || un.revertir.estado === 'enviando';
  const fallo = un.error ?? un.revertir.error;
  const reservar = (h: HallazgoTarjeta, categoriaId: string, montoNuevo: string) => {
    if (acciones === undefined) return;
    tocado.current = h;
    const entrada: Entrada = {
      categoriaId,
      periodoInicio,
      montoNuevo,
      esperado: { monto: acciones.esperados.asignado[categoriaId] ?? '' },
    };
    void un.tocar(entrada);
  };
  return (
    <div className="flex flex-col gap-2.5">
      {hallazgos.map((h) => {
        const a = h.accion;
        return (
          <div key={h.clave} data-hallazgo-tarjeta={h.clave}>
            <AvisoEnLinea
              estado={h.estado}
              {...(a.tipo === 'reservar' && acciones === undefined
                ? {}
                : {
                    accion:
                      a.tipo === 'reservar' ? (
                        <Boton
                          variante="secundaria"
                          enviando={un.estado === 'enviando'}
                          deshabilitado={ocupado}
                          textoEnviando={t.tarjetas.reservando}
                          onClick={() => {
                            reservar(h, a.categoriaId, centavosATextoDecimal(a.montoNuevo));
                          }}
                        >
                          {t.tarjetas.reservar(formatearMonto(h.sinRespaldo))}
                        </Boton>
                      ) : (
                        <EnlaceFinn
                          href={`/cuentas/${a.tarjetaId}/pagar`}
                          className={[ENLACE, COLOR_TEXTO[h.estado]].join(' ')}
                        >
                          {t.tarjetas.pagar(h.tarjeta.nombre)}
                        </EnlaceFinn>
                      ),
                  })}
            >
              {h.texto}
            </AvisoEnLinea>
          </div>
        );
      })}
      <ConfirmacionUnToque un={un} />
      {un.salida === null ? null : (
        <div data-tarjetas-reservado>
          <AvisoEnLinea
            estado="positivo"
            aparecioDespues
            accion={
              <Boton variante="discreta" deshabilitado={ocupado} onClick={() => void un.deshacer()}>
                {un.salida.etiqueta}
              </Boton>
            }
          >
            {un.salida.descripcion}
          </AvisoEnLinea>
        </div>
      )}
      {fallo === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {fallo.mensaje}
        </AvisoEnLinea>
      )}
    </div>
  );
}
