'use client';
// E2-13 [CH-248]: el resultado de Asignar y de Mover queda en el detalle, bajo sus botones, sin pantalla propia ni tiempo límite.
// Lo dibuja a partir de `?resultado=` (validado en `flujos/presupuesto-asignar-categoria/resultado.ts`); el detalle de arriba ya trae
// los números nuevos. «Deshacer» (05 §4.14): en la asignación escrita es OP-14 con los dos valores intercambiados, los que la persona
// ya vio; en Mover es otra OP-15 con el mismo monto y origen y destino intercambiados (nada se calcula, PF-3). Como la interfaz no
// conoce las dos asignaciones de después, la primera llamada lleva un `esperado` que no coincide y, si el servidor contesta
// `conflicto_desactualizado`, se repite con las `actuales` que él mismo devuelve (la persona ya vio el monto movido).
import { useCallback } from 'react';
import { AvisoEnLinea } from '../../../../../componentes/base/aviso';
import { Boton } from '../../../../../componentes/base/boton';
import { Resultado } from '../../../../../componentes/base/resultado';
import { formatearMontoTexto } from '../../../../../formato';
import type { ResultadoPresupuesto } from '../../../../../flujos/presupuesto-asignar-categoria/resultado';
import { useOperacion, type AccionEscritura } from '../../../../../formularios/use-operacion';
import { categoriaDetalle } from '../../../../../textos/categoria-detalle';

const t = categoriaDetalle.resultado;
const SIN_VER = { asignacionOrigen: '0.00', asignacionDestino: '0.00' };

export function ResultadoDelFlujo({
  resultado,
  categoriaId,
  nombre,
  periodoInicio,
  asignar,
  mover,
}: {
  readonly resultado: ResultadoPresupuesto | undefined;
  readonly categoriaId: string;
  readonly nombre: string;
  readonly periodoInicio: string;
  /** `asignarEnCategoria` (OP-14): la pone el lector, así la pantalla se prueba sin servidor. */
  readonly asignar: AccionEscritura;
  /** `moverDinero` (OP-15): la pone el lector; sin ella el resultado de Mover sale sin «Deshacer». */
  readonly mover?: AccionEscritura;
}) {
  const operacion = useOperacion({
    accion: asignar,
    ...(resultado?.tipo === 'asignado' && resultado.nuevo !== undefined
      ? { esperado: { monto: resultado.nuevo } }
      : {}),
  });
  const inversaDeMover = useCallback<AccionEscritura>(
    async (entrada) => {
      if (mover === undefined) throw new Error('sin moverDinero');
      let r = await mover({ ...(entrada as object), esperado: SIN_VER });
      if (!r.ok && r.error.codigo === 'conflicto_desactualizado') {
        const actuales = r.error.datos?.['actuales'];
        if (actuales !== undefined) r = await mover({ ...(entrada as object), esperado: actuales });
      }
      return r;
    },
    [mover],
  );
  const deshacerMover = useOperacion({ accion: inversaDeMover, previsualizarPrimero: true });
  if (resultado === undefined) return null;
  if (resultado.tipo === 'movido') {
    const { origenId, destinoId, monto } = resultado;
    if (deshacerMover.estado === 'listo')
      return (
        <div data-resultado-flujo="deshecho">
          <Resultado texto={t.movidoDeshecho} />
        </div>
      );
    const inversa =
      mover !== undefined && origenId !== undefined && destinoId !== undefined
        ? {
            etiqueta: deshacerMover.estado === 'enviando' ? t.deshaciendo : t.deshacer,
            ejecutar: () => {
              if (deshacerMover.estado === 'editando' || deshacerMover.estado === 'error')
                void deshacerMover.enviar({
                  origenId: destinoId,
                  destinoId: origenId,
                  periodoInicio,
                  monto,
                });
            },
          }
        : undefined;
    return (
      <div data-resultado-flujo="movido" className="flex flex-col gap-2">
        <Resultado
          texto={t.movido(formatearMontoTexto(monto))}
          {...(inversa === undefined ? {} : { salida: inversa })}
        />
        {deshacerMover.estado === 'confirmando' ? (
          <Boton variante="secundaria" onClick={() => void deshacerMover.confirmar()}>
            {t.confirmarDeshacer}
          </Boton>
        ) : null}
        {deshacerMover.estado === 'error' && deshacerMover.error !== undefined ? (
          <AvisoEnLinea estado="problema" aparecioDespues>
            {deshacerMover.error.mensaje}
          </AvisoEnLinea>
        ) : null}
      </div>
    );
  }
  if (operacion.estado === 'listo')
    return (
      <div data-resultado-flujo="deshecho">
        <Resultado texto={t.deshecho(nombre)} />
      </div>
    );
  const { nuevo, anterior } = resultado;
  const inversa =
    nuevo !== undefined && anterior !== undefined
      ? {
          etiqueta: operacion.estado === 'enviando' ? t.deshaciendo : t.deshacer,
          ejecutar: () => {
            if (operacion.estado !== 'enviando')
              void operacion.enviar({ categoriaId, periodoInicio, montoNuevo: anterior });
          },
        }
      : undefined;
  return (
    <div data-resultado-flujo="asignado" className="flex flex-col gap-2">
      <Resultado
        texto={
          nuevo === undefined
            ? t.asignadoSinMonto(nombre)
            : t.asignado(formatearMontoTexto(nuevo), nombre)
        }
        {...(inversa === undefined ? {} : { salida: inversa })}
      />
      {operacion.estado === 'confirmando' ? (
        <Boton variante="secundaria" onClick={() => void operacion.confirmar()}>
          {t.confirmarDeshacer}
        </Boton>
      ) : null}
      {operacion.estado === 'error' && operacion.error !== undefined ? (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {operacion.error.mensaje}
        </AvisoEnLinea>
      ) : null}
    </div>
  );
}
