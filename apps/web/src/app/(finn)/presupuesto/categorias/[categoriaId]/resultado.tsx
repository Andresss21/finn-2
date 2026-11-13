'use client';
// E2-13 [CH-248]: el resultado de Asignar y de Mover queda en el detalle, bajo sus botones, sin pantalla propia ni tiempo límite.
// Lo dibuja a partir de `?resultado=` (validado en `flujos/presupuesto-asignar-categoria/resultado.ts`); el detalle de arriba ya trae
// los números nuevos. «Deshacer» (05 §4.14) solo existe para la asignación escrita: es OP-14 con los dos valores intercambiados, los que
// la persona ya vio (nada se calcula, PF-3). [CH-254] Mover también: su inversa es otra OP-15 con el mismo monto, el origen y el
// destino intercambiados y, como `esperado`, las dos asignaciones de después que devolvió OP-15 (vienen en la URL). Sin ellas, no.
import { AvisoEnLinea } from '../../../../../componentes/base/aviso';
import { Boton } from '../../../../../componentes/base/boton';
import { Resultado } from '../../../../../componentes/base/resultado';
import { formatearMontoTexto } from '../../../../../formato';
import type {
  InversaMover,
  ResultadoPresupuesto,
} from '../../../../../flujos/presupuesto-asignar-categoria/resultado';
import { useOperacion, type AccionEscritura } from '../../../../../formularios/use-operacion';
import { categoriaDetalle } from '../../../../../textos/categoria-detalle';

const t = categoriaDetalle.resultado;

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
  /** [CH-254] `moverDinero` (OP-15) para el «Deshacer» de Mover; sin ella, Mover no lo ofrece. */
  readonly mover?: AccionEscritura;
}) {
  const operacion = useOperacion({
    accion: asignar,
    ...(resultado?.tipo === 'asignado' && resultado.nuevo !== undefined
      ? { esperado: { monto: resultado.nuevo } }
      : {}),
  });
  if (resultado === undefined) return null;
  if (resultado.tipo === 'movido')
    return resultado.inversa === undefined || mover === undefined ? (
      <div data-resultado-flujo="movido">
        <Resultado texto={t.movido(formatearMontoTexto(resultado.monto))} />
      </div>
    ) : (
      <ResultadoMovido
        monto={resultado.monto}
        inversa={resultado.inversa}
        periodoInicio={periodoInicio}
        mover={mover}
      />
    );
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

/** [CH-254] Mover con «Deshacer»: OP-15 de vuelta, con lo que dejó la URL tal cual (sin aritmética ni `esperado` inventado). */
function ResultadoMovido({
  monto,
  inversa,
  periodoInicio,
  mover,
}: {
  readonly monto: string;
  readonly inversa: InversaMover;
  readonly periodoInicio: string;
  readonly mover: AccionEscritura;
}) {
  const operacion = useOperacion({
    accion: mover,
    esperado: {
      asignacionOrigen: inversa.asignacionOrigen,
      asignacionDestino: inversa.asignacionDestino,
    },
  });
  if (operacion.estado === 'listo')
    return (
      <div data-resultado-flujo="deshecho">
        <Resultado texto={t.movimientoDeshecho(formatearMontoTexto(monto))} />
      </div>
    );
  return (
    <div data-resultado-flujo="movido" className="flex flex-col gap-2">
      <Resultado
        texto={t.movido(formatearMontoTexto(monto))}
        salida={{
          etiqueta: operacion.estado === 'enviando' ? t.deshaciendo : t.deshacer,
          ejecutar: () => {
            if (operacion.estado !== 'enviando')
              void operacion.enviar({
                origenId: inversa.origenId,
                destinoId: inversa.destinoId,
                periodoInicio,
                monto,
              });
          },
        }}
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
