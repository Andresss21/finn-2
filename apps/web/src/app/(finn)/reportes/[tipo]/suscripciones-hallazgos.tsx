'use client';
// Los hallazgos de «Suscripciones detectadas» con su acción (FT-65; 06 §3.5.9, 3.6). «Programarla» es OP-42 `crear` de un toque con los
// valores que armó el selector (acá solo se escriben como texto, PF-3); su salida para revertir es OP-51 con el id creado. «Reactivarla»
// es OP-42 `activar` y su salida es `activa: false`. Si la categoría de la última compra no está activa, la acción abre
// `/programadas/nueva` con esos valores como borrador (05 §4.11). La salida queda en su lugar aunque la revalidación quite el hallazgo.
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { useCallback, useEffect, useRef } from 'react';
import { almacen } from '../../../../cliente/almacen';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Boton } from '../../../../componentes/base/boton';
import { COLOR_TEXTO } from '../../../../componentes/dominio/indicador-estado';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { centavosATextoDecimal, formatearMonto } from '../../../../formato';
import { instanteActual } from '../../../../formato/instante';
import { claveDeBorrador } from '../../../../formularios/clave-borrador';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { useUnToque } from '../../../../formularios/use-un-toque';
import { inicio as ti } from '../../../../textos/inicio';
import { reportes as t } from '../../../../textos/reportes';

export type HallazgoSuscripcion = ReporteDe<'suscripciones'>['hallazgos'][number];
type Valores = Extract<HallazgoSuscripcion['accion'], { tipo: 'programar' }>['valores'];
/** Del lector: OP-42 (`gestionarProgramada`) y OP-51 (`eliminarProgramada`). */
export interface AccionesSuscripciones {
  readonly gestionar: AccionEscritura;
  readonly eliminar: AccionEscritura;
}

const RUTA_NUEVA = '/programadas/nueva';
const SIN_ACCION = (): Promise<never> => Promise.reject(new Error('Sin acción de programadas'));
const ENLACE =
  'inline-flex min-h-11 items-center gap-1.5 text-etiqueta font-bold no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

/** OP-42 `crear`: la programada completa de la propuesta (el `id` lo pone `useOperacion`). */
const crearDe = (v: Valores) => ({
  accion: 'crear',
  tipo: 'gasto',
  cuentaId: v.cuentaId,
  comercio: v.comercio,
  monto: centavosATextoDecimal(v.monto),
  tolerancia: centavosATextoDecimal(v.tolerancia),
  frecuencia: v.frecuencia,
  primeraFecha: v.primeraFecha,
  registroAutomatico: v.registroAutomatico,
  lineas: [{ monto: centavosATextoDecimal(v.monto), categoriaId: v.categoriaId }],
});

/** Los valores iniciales de `/programadas/nueva`, como los campos de su formulario (texto), en su borrador (05 §4.11). */
function escribirBorrador(v: Valores): void {
  const campos = {
    tipo: 'gasto',
    cuentaId: v.cuentaId,
    cuentaDestinoId: '',
    comercio: v.comercio,
    monto: centavosATextoDecimal(v.monto),
    tolerancia: centavosATextoDecimal(v.tolerancia),
    frecuencia: v.frecuencia,
    frecuenciaDias: '',
    primeraFecha: v.primeraFecha,
    fechaFin: '',
    registroAutomatico: v.registroAutomatico,
    lineas: [{ monto: centavosATextoDecimal(v.monto), categoriaId: v.categoriaId ?? '' }],
  };
  almacen.escribir(
    claveDeBorrador(RUTA_NUEVA),
    JSON.stringify({
      version: 1,
      guardadoEn: instanteActual(),
      campos,
      id: null,
      esperado: null,
      revisionAlAbrir: null,
    }),
  );
}

export function HallazgosSuscripciones({
  hallazgos,
  acciones,
}: {
  readonly hallazgos: readonly HallazgoSuscripcion[];
  readonly acciones?: AccionesSuscripciones;
}) {
  const tocado = useRef<HallazgoSuscripcion | null>(null);
  // Tras revalidar, las Server Actions llegan con otra identidad; funciones estables que llaman a las últimas evitan que
  // `useUnToque` rearme su salida y «Deshacer» reaparezca después de usarlo.
  const ultimas = useRef(acciones);
  useEffect(() => {
    ultimas.current = acciones;
  }, [acciones]);
  const gestionar = useCallback<AccionEscritura>(
    (entrada) => (ultimas.current?.gestionar ?? SIN_ACCION)(entrada),
    [],
  );
  // Reactivar se revierte con `activa: false` (OP-42); programar, eliminando la creada (OP-51).
  const revertir = useCallback<AccionEscritura>(
    (entrada) =>
      tocado.current?.accion.tipo === 'reactivar'
        ? gestionar(entrada)
        : (ultimas.current?.eliminar ?? SIN_ACCION)(entrada),
    [gestionar],
  );
  const un = useUnToque({
    accion: gestionar,
    accionInversa: revertir,
    creacion: true,
    inversa: (_entrada, valor) => {
      const h = tocado.current;
      if (h === null) return null;
      if (h.accion.tipo === 'reactivar')
        return {
          descripcion: t.suscripciones.reactivada(h.comercio),
          etiqueta: ti.deshacer,
          entrada: { accion: 'activar', programadaId: h.accion.programadaId, activa: false },
        };
      const id = (valor as { id?: string } | undefined)?.id;
      return id === undefined
        ? null
        : {
            descripcion: t.suscripciones.programada(h.comercio, formatearMonto(h.mensual)),
            etiqueta: ti.deshacer,
            entrada: { programadaId: id },
          };
    },
  });
  const ocupado = un.estado === 'enviando' || un.revertir.estado === 'enviando';
  const fallo = un.error ?? un.revertir.error;
  const tocar = (h: HallazgoSuscripcion) => {
    if (h.accion.tipo === 'abrir_flujo') return;
    tocado.current = h;
    void un.tocar(
      h.accion.tipo === 'reactivar'
        ? { accion: 'activar', programadaId: h.accion.programadaId, activa: true }
        : crearDe(h.accion.valores),
    );
  };
  return (
    <div className="flex flex-col gap-2.5">
      {hallazgos.map((h) => {
        const a = h.accion;
        const texto = h.desactivada
          ? t.suscripciones.desactivada(h.comercio, formatearMonto(h.mensual))
          : t.suscripciones.sinProgramar(
              h.comercio,
              formatearMonto(h.mensual),
              formatearMonto(h.anual),
            );
        return (
          <div key={h.clave} data-hallazgo-suscripcion={h.clave}>
            <AvisoEnLinea
              estado={h.estado}
              {...(acciones === undefined
                ? {}
                : {
                    accion:
                      a.tipo === 'abrir_flujo' ? (
                        <EnlaceFinn
                          href={RUTA_NUEVA}
                          className={[ENLACE, COLOR_TEXTO[h.estado]].join(' ')}
                          onClick={() => {
                            escribirBorrador(a.valores);
                          }}
                        >
                          {t.suscripciones.programarla}
                        </EnlaceFinn>
                      ) : (
                        <Boton
                          variante="secundaria"
                          enviando={un.estado === 'enviando'}
                          deshabilitado={ocupado}
                          textoEnviando={
                            a.tipo === 'reactivar'
                              ? t.suscripciones.reactivando
                              : t.suscripciones.programando
                          }
                          onClick={() => {
                            tocar(h);
                          }}
                        >
                          {a.tipo === 'reactivar'
                            ? t.suscripciones.reactivarla
                            : t.suscripciones.programarla}
                        </Boton>
                      ),
                  })}
            >
              {texto}
            </AvisoEnLinea>
          </div>
        );
      })}
      {un.salida === null ? null : (
        <div data-suscripciones-hecho>
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
