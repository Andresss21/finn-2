'use client';
// `/cuentas/[cuentaId]/eliminar` (FT-53, OP-06; 05 §2.7, §4.4): el flujo corto de eliminar una cuenta. Previsualiza primero y
// confirma siempre: la pantalla de confirmación trae AV-15 (el efecto en Listo para asignar y la categoría de pago que se
// elimina) y AV-01 si había hechos en períodos cerrados. Con bloqueos los explica y ofrece archivar. No calcula montos (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { useCallback } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { ErrorDeFlujo } from '../../componentes/formularios/error-de-flujo';
import { Boton } from '../../componentes/base/boton';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { AccionesDeBloqueo } from '../cuentas-archivar/acciones-bloqueo';
import { CerrarFlujoAlMontar, useCerrarFlujo } from '../../componentes/navegacion/flujo-de-ruta';
import { MarcoCorto } from '../cuentas-archivar/marco-corto';
import { formatearMonto } from '../../formato';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { cuentasGestion } from '../../textos/cuentas-gestion';
import { formularios } from '../../textos/formularios';

const t = cuentasGestion.eliminar;
const n = cuentasGestion.comunes;
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
  /** GLO-23: abierto como hoja o panel sobre el detalle (ruta interceptada). */
  readonly superpuesto?: boolean;
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
  const { accion, cuentaId, nombre, bloqueos, superpuesto = false } = p;
  const rutaPadre = `/cuentas/${cuentaId}`;
  const enviar = useCallback<AccionEscritura>(
    (payload) => accion({ ...(payload as object), cuentaId }),
    [accion, cuentaId],
  );
  const operacion = useOperacion({ accion: enviar, previsualizarPrimero: true });
  const { estado, error: fallo } = operacion;
  const cerrar = useCerrarFlujo(rutaPadre, superpuesto);
  const vista = (operacion.previsualizacion ?? {}) as Vista;

  if (estado === 'listo')
    return (
      <MarcoCorto superpuesto={superpuesto} titulo={t.titulo} rutaPadre={rutaPadre}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_AL_TERMINAR} />
      </MarcoCorto>
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
      <MarcoCorto superpuesto={superpuesto} titulo={t.titulo} rutaPadre={rutaPadre}>
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
          peligro
          descripcion={t.descripcion(nombre)}
          textoVolver={t.cancelar}
          enviando={false}
          alConfirmar={() => void operacion.confirmar()}
          alVolver={cerrar}
        />
      </MarcoCorto>
    );
  }

  return (
    <MarcoCorto
      superpuesto={superpuesto}
      titulo={bloqueos.length > 0 ? t.tituloBloqueo : t.titulo}
      rutaPadre={rutaPadre}
    >
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
            <AccionesDeBloqueo
              cerrarHref={rutaPadre}
              {...(p.archivada
                ? {}
                : { principal: { href: `${rutaPadre}/archivar`, texto: t.archivarCorto } })}
            />
          </>
        ) : (
          <>
            <p>{t.pregunta(nombre)}</p>
            {estado === 'error' && fallo !== undefined ? (
              <ErrorDeFlujo
                tipo="corto"
                error={fallo}
                alReintentar={() => void operacion.reintentar()}
              />
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
    </MarcoCorto>
  );
}
