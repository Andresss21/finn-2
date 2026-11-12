'use client';
// `/ajustes/seguridad/factores/[factorId]/quitar` (FT-74, 05 §9.6; CH-240 E2-8): con dos o más factores verificados, una hoja
// (panel de 440 px en computadora) que confirma y ejecuta `quitarFactor({ factorId })`; el resultado queda en Seguridad. Con uno solo
// no hay flujo: Seguridad lo explica en línea (AJU-14) y el lector vuelve allí. `factor_unico` también llega de la acción si otra
// pestaña cambió los factores mientras tanto (CA-74.1).
import { useCallback, useEffect, type ReactNode } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import {
  PaginaFlujoDeRuta,
  SuperpuestoDeRuta,
  useCerrarFlujo,
} from '../../componentes/navegacion/flujo-de-ruta';
import { useIrA } from '../../componentes/navegacion/use-ir-a';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { autenticacion } from '../../textos/autenticacion';
import { seguridad as t } from '../../textos/seguridad';

const RUTA_PADRE = '/ajustes/seguridad';
const ENLACE = 'inline-flex min-h-11 items-center font-bold text-enlace underline';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];

export interface PropsFormularioQuitarFactor {
  /** `quitarFactor` (CP-11): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly factorId: string;
  readonly nombre: string;
  /** «Alta dd/mm/aaaa», ya armada por el lector. */
  readonly alta: string;
  /** Los nombres de los otros factores verificados: lo que le queda a la persona. */
  readonly quedan: readonly string[];
  /** Es el único factor verificado: se necesita otro antes (04 §12.2). */
  readonly esUnico: boolean;
  /** Se abrió desde Seguridad (ruta interceptada): hoja o panel sobre la pantalla de origen. */
  readonly superpuesto?: boolean;
}

function Marco({
  superpuesto,
  titulo,
  acciones,
  children,
}: {
  readonly superpuesto: boolean;
  readonly titulo: string;
  readonly acciones?: ReactNode;
  readonly children: ReactNode;
}) {
  const conAcciones = acciones === undefined ? {} : { acciones };
  return superpuesto ? (
    <SuperpuestoDeRuta titulo={titulo} {...conAcciones}>
      {children}
    </SuperpuestoDeRuta>
  ) : (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre={RUTA_PADRE} {...conAcciones}>
      {children}
    </PaginaFlujoDeRuta>
  );
}

export function FormularioQuitarFactor({
  accion,
  factorId,
  nombre,
  alta,
  quedan,
  esUnico,
  superpuesto = false,
}: PropsFormularioQuitarFactor) {
  const irA = useIrA();
  const cerrar = useCerrarFlujo(RUTA_PADRE, superpuesto);
  const enviar = useCallback<AccionEscritura>(
    (payload) => accion({ ...(payload as object), factorId }),
    [accion, factorId],
  );
  const operacion = useOperacion({ accion: enviar });
  const { estado, error: fallo } = operacion;
  // El resultado queda en Seguridad, en su lugar: sin pantalla de cierre (E2-8)
  useEffect(() => {
    if (estado === 'listo') irA(`${RUTA_PADRE}?quitado=${encodeURIComponent(nombre)}`, true);
  }, [estado, irA, nombre]);
  const bloqueado = esUnico || fallo?.codigo === 'factor_unico';

  if (bloqueado)
    return (
      <Marco superpuesto={superpuesto} titulo={t.tituloQuitar}>
        <div className="flex flex-col gap-5">
          <AvisoEnLinea estado="advertencia">{autenticacion.factor_unico}</AvisoEnLinea>
          <EnlaceFinn href="/ajustes/seguridad/factores/nuevo" className={ENLACE}>
            {t.agregar}
          </EnlaceFinn>
          <EnlaceFinn href={RUTA_PADRE} className={ENLACE}>
            {t.volver}
          </EnlaceFinn>
        </div>
      </Marco>
    );
  return (
    <Marco
      superpuesto={superpuesto}
      titulo={t.preguntaQuitarFactor(nombre)}
      acciones={
        <>
          <Boton variante="secundaria" onClick={cerrar}>
            {t.cancelar}
          </Boton>
          <Boton
            variante="peligro"
            enviando={estado === 'enviando' || estado === 'listo'}
            textoEnviando={t.quitando}
            deshabilitado={!operacion.enLinea}
            {...(operacion.motivoSinEnvio === undefined
              ? {}
              : { motivoDeshabilitado: operacion.motivoSinEnvio })}
            onClick={() => void operacion.enviar({})}
          >
            {t.quitarNombre(nombre)}
          </Boton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-cuerpo-pequeno text-texto-secundario">{alta}</p>
        <p>{t.consecuenciaQuitar(nombre, quedan)}</p>
        {estado === 'error' && fallo !== undefined ? (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(REINTENTABLES.includes(fallo.categoria)
              ? {
                  accion: (
                    <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                      {t.intentarDeNuevo}
                    </Boton>
                  ),
                }
              : {})}
          >
            {fallo.mensaje}
          </AvisoEnLinea>
        ) : null}
      </div>
    </Marco>
  );
}
