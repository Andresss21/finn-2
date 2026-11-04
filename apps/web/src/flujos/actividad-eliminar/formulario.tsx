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
import { ConfirmacionImpactoDeVista } from '../../componentes/formularios/confirmacion-impacto';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearFechaTexto } from '../../formato';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import { transaccion as t } from '../../textos/transaccion';

const ENLACE = 'inline-flex min-h-11 items-center font-bold text-enlace underline';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const RUTA_AL_TERMINAR = '/actividad';
const ROTULOS = { cobro: t.restituido, condonacion: t.condonado, devolucion: t.devuelto } as const;

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
    readonly tipo: keyof typeof ROTULOS;
    readonly fecha: FechaLocal;
    readonly monto: Centavos;
  }[];
  /** `restricciones.motivoNoEliminar` ya compuesto; sin él se puede eliminar. */
  readonly bloqueo?: string;
}

interface Vista extends VistaDeImpacto {
  readonly avisos?: readonly { readonly codigo: string }[];
}

export function FormularioActividadEliminar(p: PropsFormularioActividadEliminar) {
  const { accion, transaccionId, nombre, detalle, eventos, bloqueo } = p;
  const enviar = useCallback<AccionEscritura>(
    (payload) => accion({ ...(payload as object), transaccionId }),
    [accion, transaccionId],
  );
  const operacion = useOperacion({ accion: enviar, previsualizarPrimero: true });
  const { estado, error: fallo } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Vista;

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.eliminarTitulo} rutaPadre={detalle}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_AL_TERMINAR} />
      </PaginaFlujoDeRuta>
    );

  if (estado === 'confirmando')
    return (
      <PaginaFlujoDeRuta titulo={t.eliminarTitulo} rutaPadre={detalle}>
        <ConfirmacionImpactoDeVista
          titulo={t.revisar}
          {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          vista={vista}
          avisos={(vista.avisos ?? []).map((a) => t.avisosEliminar[a.codigo] ?? a.codigo)}
          textoConfirmar={t.eliminar}
          textoVolver={t.cancelar}
          enviando={false}
          alConfirmar={() => void operacion.confirmar()}
          alVolver={operacion.volverAEditar}
        />
      </PaginaFlujoDeRuta>
    );

  return (
    <PaginaFlujoDeRuta titulo={t.eliminarTitulo} rutaPadre={detalle}>
      <div className="flex flex-col gap-5">
        {bloqueo !== undefined ? (
          <>
            <h2 className="text-titulo-seccion">{t.noSePuedeEliminar}</h2>
            <AvisoEnLinea estado="problema">{bloqueo}</AvisoEnLinea>
            {eventos.length === 0 ? null : (
              <ul className="flex flex-col gap-1" data-eventos>
                {eventos.map((e) => (
                  <li key={e.clave} className="flex justify-between gap-3">
                    <span>{`${ROTULOS[e.tipo]} · ${formatearFechaTexto(e.fecha)}`}</span>
                    <Monto centavos={e.monto} presentacion="absoluto" />
                  </li>
                ))}
              </ul>
            )}
            <EnlaceFinn href={detalle} className={ENLACE}>
              {t.verTransaccion}
            </EnlaceFinn>
          </>
        ) : (
          <>
            <h2 className="text-titulo-seccion">{t.eliminarPregunta(nombre)}</h2>
            <p>{t.eliminarNota}</p>
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
