'use client';
// `/cuentas/[cuentaId]/archivar` (FT-53, OP-04; 05 §2.7): el flujo corto de archivar una cuenta. Con bloqueos (saldo, deuda,
// reserva) los explica en texto y no deja continuar; en una tarjeta ofrece devolver las asignaciones futuras de su categoría de
// pago. No calcula montos (PF-3): todo sale del detalle.
import type { Centavos } from '@finn/dominio/valores';
import { useCallback, useEffect, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Seleccion } from '../../componentes/base/seleccion';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { CerrarFlujoAlMontar, useCerrarFlujo } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { centavosATextoDecimal } from '../../formato/monto';
import { AccionesDeBloqueo } from './acciones-bloqueo';
import { MarcoCorto } from './marco-corto';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { cuentasGestion } from '../../textos/cuentas-gestion';
import { formularios } from '../../textos/formularios';

const t = cuentasGestion.archivar;
const n = cuentasGestion.comunes;
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const DEVOLVER = 'devolver';

export interface PropsFormularioCuentasArchivar {
  /** `archivarCuenta` (OP-04): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly cuentaId: string;
  readonly nombre: string;
  readonly esTarjeta: boolean;
  readonly saldo: Centavos;
  readonly deuda: Centavos | undefined;
  readonly reservado: Centavos | undefined;
  /** `acciones.bloqueosArchivo` del detalle: códigos de 04 §7.5. */
  readonly bloqueos: readonly string[];
  /** GLO-23: abierto como hoja o panel sobre el detalle (ruta interceptada). */
  readonly superpuesto?: boolean;
}

interface Vista {
  readonly impacto?: { readonly deltaLpa: Centavos } | null;
  readonly avisos?: readonly { readonly codigo: string }[];
}

/** El mensaje de cada bloqueo, armado con los números del detalle. */
function textoDeBloqueo(codigo: string, p: PropsFormularioCuentasArchivar): string {
  const money = (c: Centavos | undefined) => formatearMonto((c ?? 0) as Centavos);
  switch (codigo) {
    case 'cuenta_con_saldo':
      return t.bloqueos.cuenta_con_saldo(p.nombre, money(p.saldo));
    case 'tarjeta_con_deuda':
      return t.bloqueos.tarjeta_con_deuda(p.nombre, money(p.deuda));
    case 'reserva_tarjeta_no_cero':
      return t.bloqueos.reserva_tarjeta_no_cero(p.nombre, money(p.reservado));
    default:
      return t.bloqueos.cuenta_ya_archivada(p.nombre);
  }
}

export function FormularioCuentasArchivar(p: PropsFormularioCuentasArchivar) {
  const { accion, cuentaId, esTarjeta, bloqueos, superpuesto = false } = p;
  const rutaPadre = `/cuentas/${cuentaId}`;
  const [futuras, setFuturas] = useState(DEVOLVER);
  const [pedida, setPedida] = useState<string>();
  const enviar = useCallback<AccionEscritura>(
    (payload) =>
      accion({
        ...(payload as object),
        cuentaId,
        ...(esTarjeta ? { devolverAsignacionesFuturas: futuras === DEVOLVER } : {}),
      }),
    [accion, cuentaId, esTarjeta, futuras],
  );
  // E4-1: archivar empieza por el impacto. La previsualización se pide al abrir y cada vez que cambia lo elegido.
  const operacion = useOperacion({ accion: enviar, previsualizarPrimero: true });
  const { estado, error: fallo, enviar: pedir, volverAEditar } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Vista;
  const cerrar = useCerrarFlujo(rutaPadre, superpuesto);
  const sinBloqueos = bloqueos.length === 0;
  useEffect(() => {
    if (!sinBloqueos || estado !== 'editando' || pedida === futuras) return;
    setPedida(futuras);
    void pedir({});
  }, [sinBloqueos, estado, pedida, futuras, pedir]);

  if (estado === 'listo')
    return (
      <MarcoCorto superpuesto={superpuesto} titulo={t.titulo} rutaPadre={rutaPadre}>
        <CerrarFlujoAlMontar rutaPadre={rutaPadre} superpuesto={superpuesto} />
      </MarcoCorto>
    );
  const cambiar = (valor: string) => {
    setFuturas(valor);
    if (estado === 'confirmando') volverAEditar();
  };
  return (
    <MarcoCorto
      superpuesto={superpuesto}
      titulo={sinBloqueos ? t.titulo : t.tituloBloqueo}
      rutaPadre={rutaPadre}
    >
      <div className="flex flex-col gap-5">
        {!sinBloqueos ? (
          <>
            <ul className="flex flex-col gap-2" data-bloqueos>
              {bloqueos.map((b) => (
                <li key={b}>
                  <AvisoEnLinea estado="problema">{textoDeBloqueo(b, p)}</AvisoEnLinea>
                </li>
              ))}
            </ul>
            {bloqueos.includes('cuenta_con_saldo') ? (
              <p className="text-texto-secundario">{t.guiaSaldo}</p>
            ) : null}
            <AccionesDeBloqueo
              cerrarHref={rutaPadre}
              {...(bloqueos.includes('cuenta_con_saldo') && p.saldo > 0
                ? {
                    principal: {
                      href: `/registrar/transferencia?cuenta=${cuentaId}&total=${centavosATextoDecimal(p.saldo)}`,
                      texto: t.transferirSaldo,
                    },
                  }
                : {})}
            />
          </>
        ) : (
          <>
            <p>{t.pregunta(p.nombre)}</p>
            {esTarjeta ? (
              <Seleccion
                etiqueta={t.futuras}
                opciones={[
                  { valor: DEVOLVER, etiqueta: t.devolver },
                  { valor: 'dejar', etiqueta: t.dejar },
                ]}
                valor={futuras}
                alCambiar={cambiar}
              />
            ) : null}
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
            {estado === 'confirmando' ? (
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
                avisos={(vista.avisos ?? []).map(
                  (a) =>
                    (n.avisos as Readonly<Record<string, string | undefined>>)[a.codigo] ??
                    a.codigo,
                )}
                textoConfirmar={t.archivarCuenta(p.nombre)}
                textoVolver={t.cancelar}
                enviando={false}
                alConfirmar={() => void operacion.confirmar()}
                alVolver={cerrar}
              />
            ) : estado === 'error' ? null : (
              <p role="status" className="text-texto-secundario">
                {operacion.previsualizacion === undefined ? t.revisando : t.archivando}
              </p>
            )}
          </>
        )}
      </div>
    </MarcoCorto>
  );
}
