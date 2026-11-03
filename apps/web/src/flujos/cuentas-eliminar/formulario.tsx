'use client';
// `/cuentas/[cuentaId]/eliminar` (FT-53, OP-06; 05 §2.7, §4.4): el flujo corto de eliminar una cuenta. Previsualiza primero y
// confirma siempre: la pantalla de confirmación trae AV-15 (el efecto en Listo para asignar y la categoría de pago que se
// elimina) y AV-01 si había hechos en períodos cerrados. Con bloqueos los explica y ofrece archivar. No calcula montos (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { useCallback } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { cuentasGestion } from '../../textos/cuentas-gestion';
import { formularios } from '../../textos/formularios';

const t = cuentasGestion.eliminar;
const n = cuentasGestion.comunes;
const ENLACE = 'inline-flex min-h-11 items-center font-bold text-enlace underline';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const RUTA_AL_TERMINAR = '/cuentas';

export interface PropsFormularioCuentasEliminar {
  /** `eliminarCuenta` (OP-06): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly cuentaId: string;
  readonly nombre: string;
  readonly archivada: boolean;
  /** Cuántas programadas usan la cuenta (para el mensaje de `cuenta_con_programadas`). */
  readonly programadas: number;
  /** `acciones.bloqueosEliminar` del detalle: códigos de 04 §7.5. */
  readonly bloqueos: readonly string[];
}

interface Aviso {
  readonly codigo: string;
  readonly datos?: { readonly categoriaId?: string; readonly conciliaciones?: number };
}
interface Vista {
  readonly impacto?: { readonly deltaLpa: Centavos } | null;
  readonly avisos?: readonly Aviso[];
}

export function FormularioCuentasEliminar(p: PropsFormularioCuentasEliminar) {
  const { accion, cuentaId, nombre, bloqueos } = p;
  const rutaPadre = `/cuentas/${cuentaId}`;
  const enviar = useCallback<AccionEscritura>(
    (payload) => accion({ ...(payload as object), cuentaId }),
    [accion, cuentaId],
  );
  const operacion = useOperacion({ accion: enviar, previsualizarPrimero: true });
  const { estado, error: fallo } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Vista;

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_AL_TERMINAR} />
      </PaginaFlujoDeRuta>
    );

  if (estado === 'confirmando') {
    // Los avisos "antes" con su texto: AV-15 nombra lo que se elimina con la cuenta; AV-01, el período cerrado.
    const avisos = (vista.avisos ?? []).flatMap((a) =>
      a.codigo === 'AV-15'
        ? [
            ...(a.datos?.categoriaId === undefined ? [] : [t.categoriaDePago(nombre)]),
            ...((a.datos?.conciliaciones ?? 0) > 0
              ? [t.conciliaciones(a.datos?.conciliaciones ?? 0)]
              : []),
          ]
        : [n.avisos[a.codigo] ?? a.codigo],
    );
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
        <ConfirmacionImpacto
          titulo={n.revisar}
          {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          impacto={
            vista.impacto
              ? [
                  n.impactoLpa(
                    `${vista.impacto.deltaLpa > 0 ? '+' : ''}${formatearMonto(vista.impacto.deltaLpa)}`,
                  ),
                ]
              : []
          }
          avisos={avisos}
          textoConfirmar={t.eliminar}
          textoVolver={t.volver}
          enviando={false}
          alConfirmar={() => void operacion.confirmar()}
          alVolver={operacion.volverAEditar}
        />
      </PaginaFlujoDeRuta>
    );
  }

  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
      <div className="flex flex-col gap-5">
        {bloqueos.length > 0 ? (
          <>
            <ul className="flex flex-col gap-2" data-bloqueos>
              {bloqueos.map((b) => (
                <li key={b}>
                  <AvisoEnLinea estado="problema">
                    {b === 'cuenta_con_programadas'
                      ? t.bloqueos.cuenta_con_programadas(nombre, p.programadas)
                      : t.bloqueos.cuenta_con_movimientos(nombre)}
                  </AvisoEnLinea>
                </li>
              ))}
            </ul>
            {p.archivada ? null : (
              <EnlaceFinn href={`${rutaPadre}/archivar`} className={ENLACE}>
                {t.archivarEnLugar}
              </EnlaceFinn>
            )}
          </>
        ) : (
          <>
            <p>{t.pregunta(nombre)}</p>
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
