'use client';
// `/actividad/[transaccionId]/eliminar` (FT-26, OP-29; 05 §2.6, §4.4): el flujo corto de eliminar una transacción. Previsualiza
// primero y confirma siempre, con AV-16 si estaba conciliada y AV-01 si es de un período cerrado (las líneas de impacto las arma el
// servidor). Con eventos vinculados no se elimina: explica `transaccion_con_eventos` y enlaza al detalle, donde están. No calcula
// montos (PF-3).
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { useCallback } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Monto } from '../../componentes/dominio/monto';
import { ConfirmacionImpactoDeVista } from '../../componentes/formularios/confirmacion-impacto-de-vista';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearFechaTexto } from '../../formato';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import { transaccion as t } from '../../textos/transaccion';

const ENTENDIDO =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion-tonal px-4 font-bold text-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ELIMINAR_EVENTO =
  'inline-flex min-h-11 items-center px-2 font-semibold text-problema-texto focus-visible:outline-3 focus-visible:outline-foco';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const RUTA_AL_TERMINAR = '/actividad';
const ROTULOS = { cobro: t.restituido, condonacion: t.condonado, devolucion: t.devuelto } as const;

/** El `?volver=` del detalle, para encadenarlo al enlace de un evento. */
const volverDe = (detalle: string): string => {
  const i = detalle.indexOf('?');
  return i < 0 ? '' : `&${detalle.slice(i + 1)}`;
};

export interface PropsFormularioActividadEliminar {
  /** `eliminarTransaccion` (OP-29): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly transaccionId: string;
  readonly nombre: string;
  /** El detalle al que se vuelve al cancelar (con su `?volver=`). */
  readonly detalle: string;
  /** Los eventos vinculados de sus partes. */
  readonly eventos: readonly {
    readonly clave: string;
    /** El id del evento para `?evento=` (R2): el de la transacción de cobro o devolución, o el de la condonación. */
    readonly id: string;
    readonly tipo: keyof typeof ROTULOS;
    readonly fecha: FechaLocal;
    readonly monto: Centavos;
  }[];
  /** `restricciones.motivoNoEliminar` ya compuesto; sin él se puede eliminar. */
  readonly bloqueo?: string;
  /** Eliminar un evento de la compra (FT-28, OP-34): sus textos y la entrada que se envía en lugar de `transaccionId`. */
  readonly textos?: {
    readonly titulo: string;
    readonly pregunta: string;
    readonly nota: string;
    readonly confirmar: string;
  };
  readonly entrada?: Readonly<Record<string, string>>;
}

interface Vista extends VistaDeImpacto {
  readonly avisos?: readonly { readonly codigo: string }[];
}

export function FormularioActividadEliminar(p: PropsFormularioActividadEliminar) {
  const { accion, transaccionId, nombre, detalle, eventos, bloqueo, entrada } = p;
  const x = p.textos ?? {
    titulo: t.eliminarTitulo,
    pregunta: t.eliminarPregunta(nombre),
    nota: t.eliminarNota,
    confirmar: t.eliminar,
  };
  const enviar = useCallback<AccionEscritura>(
    (payload) => accion({ ...(payload as object), ...(entrada ?? { transaccionId }) }),
    [accion, transaccionId, entrada],
  );
  const operacion = useOperacion({ accion: enviar, previsualizarPrimero: true });
  const { estado, error: fallo } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Vista;

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={x.titulo} rutaPadre={detalle}>
        <CerrarFlujoAlMontar rutaPadre={entrada === undefined ? RUTA_AL_TERMINAR : detalle} />
      </PaginaFlujoDeRuta>
    );

  if (estado === 'confirmando')
    return (
      <PaginaFlujoDeRuta titulo={x.titulo} rutaPadre={detalle}>
        <ConfirmacionImpactoDeVista
          titulo={t.revisar}
          {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          vista={vista}
          avisos={(vista.avisos ?? []).map((a) => t.avisosEliminar[a.codigo] ?? a.codigo)}
          textoConfirmar={x.confirmar}
          textoVolver={t.cancelar}
          enviando={false}
          alConfirmar={() => void operacion.confirmar()}
          alVolver={operacion.volverAEditar}
        />
      </PaginaFlujoDeRuta>
    );

  return (
    <PaginaFlujoDeRuta titulo={x.titulo} rutaPadre={detalle}>
      <div className="flex flex-col gap-5">
        {bloqueo !== undefined ? (
          <>
            <h2 className="text-titulo-seccion">{t.noSePuedeEliminar}</h2>
            <AvisoEnLinea estado="problema">{bloqueo}</AvisoEnLinea>
            {eventos.length === 0 ? null : (
              <ul className="flex flex-col gap-1" data-eventos>
                {eventos.map((e) => (
                  <li key={e.clave} className="flex items-center justify-between gap-3">
                    <span>{`${ROTULOS[e.tipo]} · ${formatearFechaTexto(e.fecha)}`}</span>
                    <span className="flex items-center gap-2">
                      <Monto centavos={e.monto} presentacion="absoluto" />
                      <EnlaceFinn
                        href={`/actividad/${transaccionId}/eventos/eliminar?tipo-evento=${e.tipo}&evento=${e.id}${volverDe(detalle)}`}
                        aria-label={t.eliminarEventoDe(
                          ROTULOS[e.tipo],
                          formatearFechaTexto(e.fecha),
                        )}
                        className={ELIMINAR_EVENTO}
                      >
                        {t.eliminarEvento}
                      </EnlaceFinn>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <EnlaceFinn href={detalle} className={ENTENDIDO}>
              {t.entendido}
            </EnlaceFinn>
          </>
        ) : (
          <>
            <h2 className="text-titulo-seccion">{x.pregunta}</h2>
            <p>{x.nota}</p>
            {estado === 'error' && fallo !== undefined ? (
              <AvisoEnLinea
                estado="problema"
                aparecioDespues
                {...(REINTENTABLES.includes(fallo.categoria)
                  ? {
                      accion: (
                        <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                          {formularios.intentarDeNuevo}
                        </Boton>
                      ),
                    }
                  : {})}
              >
                {fallo.mensaje}
              </AvisoEnLinea>
            ) : null}
            <Boton
              enviando={estado === 'enviando'}
              textoEnviando={t.revisando}
              deshabilitado={!operacion.enLinea}
              {...(operacion.motivoSinEnvio === undefined
                ? {}
                : { motivoDeshabilitado: operacion.motivoSinEnvio })}
              onClick={() => void operacion.enviar({})}
            >
              {t.verCambios}
            </Boton>
          </>
        )}
      </div>
    </PaginaFlujoDeRuta>
  );
}
