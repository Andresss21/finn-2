'use client';
// `/ajustes/seguridad/factores/[factorId]/quitar` (FT-74, 05 §9.6): el flujo corto de quitar un factor. Si es el único verificado
// lo explica con el enlace a agregar otro y no deja continuar (CA-74.1); si no, confirma y ejecuta `quitarFactor({ factorId })`.
import { useCallback } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
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
  /** Es el único factor verificado: se necesita otro antes (04 §12.2). */
  readonly esUnico: boolean;
}

export function FormularioQuitarFactor({
  accion,
  factorId,
  nombre,
  esUnico,
}: PropsFormularioQuitarFactor) {
  const enviar = useCallback<AccionEscritura>(
    (payload) => accion({ ...(payload as object), factorId }),
    [accion, factorId],
  );
  const operacion = useOperacion({ accion: enviar });
  const { estado, error: fallo } = operacion;
  // `factor_unico` también llega de la acción si otra pestaña cambió los factores mientras tanto
  const bloqueado = esUnico || fallo?.codigo === 'factor_unico';

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.tituloQuitar} rutaPadre={RUTA_PADRE}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );
  return (
    <PaginaFlujoDeRuta titulo={t.tituloQuitar} rutaPadre={RUTA_PADRE}>
      <div className="flex flex-col gap-5">
        {bloqueado ? (
          <>
            <AvisoEnLinea estado="problema">{autenticacion.factor_unico}</AvisoEnLinea>
            <EnlaceFinn href="/ajustes/seguridad/factores/nuevo" className={ENLACE}>
              {t.agregar}
            </EnlaceFinn>
            <EnlaceFinn href={RUTA_PADRE} className={ENLACE}>
              {t.volver}
            </EnlaceFinn>
          </>
        ) : (
          <>
            <p>{t.preguntaQuitar(nombre)}</p>
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
            <Boton
              variante="peligro"
              enviando={estado === 'enviando'}
              textoEnviando={t.quitando}
              deshabilitado={!operacion.enLinea}
              {...(operacion.motivoSinEnvio === undefined
                ? {}
                : { motivoDeshabilitado: operacion.motivoSinEnvio })}
              onClick={() => void operacion.enviar({})}
            >
              {t.quitar}
            </Boton>
          </>
        )}
      </div>
    </PaginaFlujoDeRuta>
  );
}
