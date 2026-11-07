'use client';
// La acción con que termina «Flujo de efectivo» (FT-68; 06 §3.3): «Reservar {S} para {tarjeta}» es OP-14 de un toque sobre la categoría
// de pago de la tarjeta en el período activo, con `montoNuevo` que armó el selector (Asig + S) y `esperado` lo asignado que vio la
// pantalla; acá solo se escriben como texto (PF-3). Con `ok: true` ofrece «Deshacer» (los dos valores intercambiados). Sin hallazgo
// la salida es el enlace a «Lo que te quedó del período». La salida queda en su lugar aunque la revalidación cambie el hallazgo.
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { useCallback, useEffect, useRef } from 'react';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Boton } from '../../../../componentes/base/boton';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { centavosATextoDecimal, formatearMonto } from '../../../../formato';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { ConfirmacionUnToque } from '../../../../formularios/confirmacion-un-toque';
import { useUnToque } from '../../../../formularios/use-un-toque';
import { inicio as ti } from '../../../../textos/inicio';
import { reportes as t } from '../../../../textos/reportes';
import type { AccionesTarjetas } from './tarjetas-hallazgos';

type Dto = ReporteDe<'flujo_efectivo'>;
type Hallazgo = Dto['hallazgos'][number];

interface Entrada {
  readonly categoriaId: string;
  readonly periodoInicio: string;
  readonly montoNuevo: string;
  readonly esperado: { readonly monto: string };
}

const ENLACE =
  'inline-flex min-h-11 items-center gap-1.5 text-etiqueta font-bold text-accion no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function AccionFlujo({
  dto,
  periodoInicio,
  acciones,
}: {
  readonly dto: Dto;
  readonly periodoInicio: string;
  readonly acciones?: AccionesTarjetas;
}) {
  const tocado = useRef<Hallazgo | null>(null);
  // Tras revalidar, la Server Action llega con otra identidad; una función estable que llama a la última evita que `useUnToque`
  // rearme su salida y «Deshacer» reaparezca después de usarlo.
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
        descripcion: t.flujo.reservado(formatearMonto(h.accion.monto), h.tarjeta.nombre),
        etiqueta: ti.deshacer,
        entrada: { ...e, montoNuevo: e.esperado.monto, esperado: { monto: e.montoNuevo } },
      };
    },
  });
  const ocupado = un.estado === 'enviando' || un.revertir.estado === 'enviando';
  const fallo = un.error ?? un.revertir.error;
  const reservar = (h: Hallazgo) => {
    if (acciones === undefined) return;
    tocado.current = h;
    const entrada: Entrada = {
      categoriaId: h.accion.categoriaId,
      periodoInicio,
      montoNuevo: centavosATextoDecimal(h.accion.montoNuevo),
      esperado: { monto: acciones.esperados.asignado[h.accion.categoriaId] ?? '' },
    };
    void un.tocar(entrada);
  };
  const h = dto.hallazgos[0];
  return (
    <div data-flujo-accion className="flex flex-col gap-2.5">
      {h === undefined ? (
        <EnlaceFinn href="/reportes/remanente" className={ENLACE}>
          {t.flujo.verRemanente}
        </EnlaceFinn>
      ) : (
        <div data-hallazgo-flujo={h.clave}>
          <AvisoEnLinea
            estado={h.estado}
            {...(acciones === undefined
              ? {}
              : {
                  accion: (
                    <Boton
                      variante="secundaria"
                      enviando={un.estado === 'enviando'}
                      deshabilitado={ocupado}
                      textoEnviando={t.flujo.reservando}
                      onClick={() => {
                        reservar(h);
                      }}
                    >
                      {t.flujo.reservar(formatearMonto(h.accion.monto), h.tarjeta.nombre)}
                    </Boton>
                  ),
                })}
          >
            {t.flujo.hallazgo(
              formatearMonto(h.comprasConTarjeta),
              formatearMonto(h.pagosTarjeta),
              h.tarjeta.nombre,
              formatearMonto(h.accion.monto),
            )}
          </AvisoEnLinea>
        </div>
      )}
      <ConfirmacionUnToque un={un} />
      {un.salida === null ? null : (
        <div data-flujo-reservado>
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
