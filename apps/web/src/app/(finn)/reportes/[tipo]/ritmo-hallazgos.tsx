'use client';
// Los hallazgos del reporte `ritmo` con su acción (FT-62; 06 §3.5.4, 3.6): «Asignar» es OP-14 de un toque con `montoNuevo` y
// `esperado` que armó el selector (acá solo se escriben como texto, PF-3); con `ok: true` ofrece «Deshacer» (OP-14 con los dos
// valores intercambiados). Como la revalidación hace desaparecer el hallazgo, la salida queda en su lugar (05 §4.14, regla 4).
// «Mover» y «Revisar» abren el flujo y la categoría, como en Inicio.
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { useCallback, useEffect, useRef } from 'react';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Boton } from '../../../../componentes/base/boton';
import { COLOR_TEXTO } from '../../../../componentes/dominio/indicador-estado';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { centavosATextoDecimal, formatearFecha, formatearMonto } from '../../../../formato';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { ConfirmacionUnToque } from '../../../../formularios/confirmacion-un-toque';
import { useUnToque } from '../../../../formularios/use-un-toque';
import { inicio as ti } from '../../../../textos/inicio';
import { reportes as t } from '../../../../textos/reportes';

export type Hallazgo = ReporteDe<'ritmo'>['hallazgos'][number];
type Asignar = Extract<Hallazgo['accion'], { tipo: 'asignar' }>;

interface Entrada {
  readonly categoriaId: string;
  readonly periodoInicio: string;
  readonly montoNuevo: string;
  readonly esperado: { readonly monto: string };
}

const ENLACE =
  'inline-flex min-h-11 items-center gap-1.5 text-etiqueta font-bold no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

function textoDe(h: Hallazgo): string {
  const exceso = formatearMonto(h.exceso);
  const fin = formatearFecha(h.fin).slice(0, 5);
  return h.sobregiroActual === 0
    ? ti.hallazgo.camino(exceso, h.categoria.nombre, fin)
    : ti.hallazgo.ya(formatearMonto(h.sobregiroActual), h.categoria.nombre, exceso, fin);
}

function hrefDe(h: Hallazgo): string {
  const a = h.accion;
  if (a.tipo === 'mover') return '/presupuesto/mover';
  return a.tipo === 'asignar'
    ? `/presupuesto/asignar/${h.categoria.id}`
    : `/presupuesto/categorias/${a.categoriaId}`;
}

function etiquetaDe(h: Hallazgo): string {
  const a = h.accion;
  const exceso = formatearMonto(h.exceso);
  if (a.tipo === 'mover') return ti.hallazgo.mover(exceso, a.origen.nombre);
  return a.tipo === 'asignar'
    ? ti.hallazgo.asignar(exceso)
    : ti.hallazgo.revisar(h.categoria.nombre);
}

export function HallazgosRitmo({
  hallazgos,
  periodoInicio,
  asignar,
}: {
  readonly hallazgos: readonly Hallazgo[];
  readonly periodoInicio: string;
  /** `asignarEnCategoria` (OP-14): la pone el lector, así la pantalla se prueba sin servidor. */
  readonly asignar?: AccionEscritura;
}) {
  const tocada = useRef<Hallazgo | null>(null);
  // Tras revalidar, la Server Action llega con otra identidad; una función estable que llama a la última evita que
  // `useUnToque` rearme su salida y «Deshacer» reaparezca después de usarlo.
  const ultima = useRef(asignar);
  useEffect(() => {
    ultima.current = asignar;
  }, [asignar]);
  const accion = useCallback<AccionEscritura>(
    (entrada) =>
      ultima.current === undefined
        ? Promise.reject(new Error('Sin acción de asignar'))
        : ultima.current(entrada),
    [],
  );
  const un = useUnToque({
    accion,
    accionInversa: accion,
    inversa: (entrada) => {
      const e = entrada as Entrada;
      const h = tocada.current;
      if (h === null) return null;
      return {
        descripcion: t.ritmo.asignado(formatearMonto(h.exceso), h.categoria.nombre),
        etiqueta: ti.deshacer,
        entrada: { ...e, montoNuevo: e.esperado.monto, esperado: { monto: e.montoNuevo } },
      };
    },
  });
  const ocupado = un.estado === 'enviando' || un.revertir.estado === 'enviando';
  const fallo = un.error ?? un.revertir.error;
  const tocar = (h: Hallazgo, a: Asignar) => {
    tocada.current = h;
    const entrada: Entrada = {
      categoriaId: h.categoria.id,
      periodoInicio,
      montoNuevo: centavosATextoDecimal(a.montoNuevo),
      esperado: { monto: centavosATextoDecimal(a.esperado) },
    };
    void un.tocar(entrada);
  };
  return (
    <div className="flex flex-col gap-2.5">
      {hallazgos.map((h) => {
        const a = h.accion;
        return (
          <div key={h.clave} data-hallazgo={h.clave}>
            <AvisoEnLinea
              estado={h.estado}
              accion={
                a.tipo === 'asignar' && asignar !== undefined ? (
                  <Boton
                    variante="secundaria"
                    enviando={un.estado === 'enviando'}
                    deshabilitado={ocupado}
                    textoEnviando={t.ritmo.asignando}
                    onClick={() => {
                      tocar(h, a);
                    }}
                  >
                    {etiquetaDe(h)}
                  </Boton>
                ) : (
                  <EnlaceFinn
                    href={hrefDe(h)}
                    className={[ENLACE, COLOR_TEXTO[h.estado]].join(' ')}
                  >
                    {etiquetaDe(h)}
                  </EnlaceFinn>
                )
              }
            >
              {textoDe(h)}
            </AvisoEnLinea>
          </div>
        );
      })}
      <ConfirmacionUnToque un={un} />
      {un.salida === null ? null : (
        <div data-ritmo-asignado>
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
