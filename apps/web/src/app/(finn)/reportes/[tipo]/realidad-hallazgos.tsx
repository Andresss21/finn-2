'use client';
// Los hallazgos de «Presupuesto contra la realidad» con su acción (FT-63; 06 §3.5.6, 3.6): «Ajustar a {sugerido}» es OP-14 de un
// toque sobre el período activo, o OP-18 (editar) si la categoría tiene meta mensual o semanal. Los valores (`montoNuevo`,
// `esperado`) son texto de lo que dijo el motor (PF-3); con `ok: true` ofrece «Deshacer» con los dos valores intercambiados. La
// revalidación hace desaparecer el hallazgo, así que la salida queda en su lugar (05 §4.14, regla 4).
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { useCallback, useEffect, useRef } from 'react';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Boton } from '../../../../componentes/base/boton';
import { centavosATextoDecimal, formatearMonto } from '../../../../formato';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { useUnToque } from '../../../../formularios/use-un-toque';
import { inicio as ti } from '../../../../textos/inicio';
import { reportes as t } from '../../../../textos/reportes';

export type HallazgoRealidad = Extract<
  ReporteDe<'realidad'>['hallazgos'][number],
  { tipo: 'realidad' }
>;

/** Lo vigente que la pantalla vio, en texto decimal, para el `esperado` de OP-14 y OP-18 (lo pone el lector). */
export interface EsperadosRealidad {
  readonly asignado: Readonly<Record<string, string>>;
  readonly meta: Readonly<Record<string, string>>;
}

export interface AccionesRealidad {
  readonly asignar: AccionEscritura;
  readonly meta: AccionEscritura;
  readonly esperados: EsperadosRealidad;
}

type Entrada = { readonly esperado: { readonly monto: string } } & (
  | { readonly categoriaId: string; readonly montoNuevo: string }
  | { readonly accion: 'editar'; readonly metaId: string; readonly monto: string }
);

/** La misma operación con los valores intercambiados (la salida de 06 §3.6). */
function invertida(e: Entrada): Entrada {
  return 'montoNuevo' in e
    ? { ...e, montoNuevo: e.esperado.monto, esperado: { monto: e.montoNuevo } }
    : { ...e, monto: e.esperado.monto, esperado: { monto: e.monto } };
}

export function HallazgosRealidad({
  hallazgos,
  periodoInicio,
  acciones,
}: {
  readonly hallazgos: readonly HallazgoRealidad[];
  readonly periodoInicio: string;
  readonly acciones?: AccionesRealidad;
}) {
  const tocado = useRef<HallazgoRealidad | null>(null);
  // Tras revalidar, las Server Actions llegan con otra identidad; una función estable que llama a la última evita que
  // `useUnToque` rearme su salida y «Deshacer» reaparezca después de usarlo.
  const ultimas = useRef(acciones);
  useEffect(() => {
    ultimas.current = acciones;
  }, [acciones]);
  const accion = useCallback<AccionEscritura>((entrada) => {
    const a = ultimas.current;
    if (a === undefined) return Promise.reject(new Error('Sin acción de ajustar'));
    return 'metaId' in (entrada as object) ? a.meta(entrada) : a.asignar(entrada);
  }, []);
  const un = useUnToque({
    accion,
    accionInversa: accion,
    inversa: (entrada) => {
      const h = tocado.current;
      if (h === null) return null;
      const sugerido = formatearMonto(h.sugerido);
      return {
        descripcion:
          h.accion.tipo === 'meta'
            ? t.realidad.metaAjustada(sugerido, h.categoria.nombre)
            : t.realidad.ajustado(sugerido, h.categoria.nombre),
        etiqueta: ti.deshacer,
        entrada: invertida(entrada as Entrada),
      };
    },
  });
  const ocupado = un.estado === 'enviando' || un.revertir.estado === 'enviando';
  const fallo = un.error ?? un.revertir.error;
  const tocar = (h: HallazgoRealidad) => {
    if (acciones === undefined) return;
    const { esperados } = acciones;
    const nuevo = centavosATextoDecimal(h.sugerido);
    const a = h.accion;
    tocado.current = h;
    void un.tocar(
      a.tipo === 'meta'
        ? {
            accion: 'editar',
            metaId: a.metaId,
            monto: nuevo,
            esperado: { monto: esperados.meta[a.metaId] ?? '' },
          }
        : {
            categoriaId: h.categoria.id,
            periodoInicio,
            montoNuevo: nuevo,
            esperado: { monto: esperados.asignado[h.categoria.id] ?? '' },
          },
    );
  };
  return (
    <div className="flex flex-col gap-2.5">
      {hallazgos.map((h) => {
        const sugerido = formatearMonto(h.sugerido);
        return (
          <div key={h.clave} data-hallazgo-realidad={h.clave}>
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
                        textoEnviando={t.realidad.ajustando}
                        onClick={() => {
                          tocar(h);
                        }}
                      >
                        {h.accion.tipo === 'meta'
                          ? t.realidad.ajustarMeta(sugerido)
                          : t.realidad.ajustar(sugerido)}
                      </Boton>
                    ),
                  })}
            >
              {h.causa === 'pasas'
                ? t.realidad.pasas(
                    formatearMonto(h.promedioGastado),
                    h.categoria.nombre,
                    formatearMonto(h.asignadoPromedio),
                    sugerido,
                  )
                : t.realidad.sobra(formatearMonto(h.promedioGastado), h.categoria.nombre, sugerido)}
            </AvisoEnLinea>
          </div>
        );
      })}
      {un.salida === null ? null : (
        <div data-realidad-ajustado>
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
