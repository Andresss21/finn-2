'use client';
// Una fila de `/bandeja` con «Aprobar» de un toque (FT-35, FE-25, 05 §4.15), con su propio `useOperacion`. Si el servidor pide
// confirmar o datos, traspasa al flujo `/bandeja/[movimientoId]`; si no, el resultado dice lo que aprobó (CP-15).
import type { ErrorFinn } from '@finn/aplicacion/errores';
import { useEffect } from 'react';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { Boton } from '../../../componentes/base/boton';
import { Resultado } from '../../../componentes/base/resultado';
import {
  MovimientoBandeja,
  type AccionBandeja,
  type MovimientoDto,
} from '../../../componentes/dominio/movimiento-bandeja';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { textoAprobado, type ValorAprobado } from '../../../flujos/bandeja-movimiento/aprobado';
import { useOperacion } from '../../../formularios/use-operacion';
import { aprobarMovimiento } from '../../../servidor/acciones/bandeja';
import { bandeja as t } from '../../../textos/bandeja';
import { formularios } from '../../../textos/formularios';

/** Los rechazos que necesitan datos del usuario pasan al flujo; el resto se queda en la fila (05 §4.15). */
const necesitaElFlujo = (e: ErrorFinn): boolean =>
  e.categoria === 'VALIDACION' ||
  e.categoria === 'CONFLICTO' ||
  (e.categoria === 'DOMINIO' && e.codigo !== 'movimiento_estado_no_valido');
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];

interface Props {
  readonly movimiento: MovimientoDto;
  readonly hrefRevisar: string;
  readonly resultado: ValorAprobado | undefined;
  readonly alIniciar: (id: string) => void;
  readonly alTerminar: (id: string, valor: ValorAprobado | undefined) => void;
}

export function FilaBandeja({
  movimiento: m,
  hrefRevisar,
  resultado,
  alIniciar,
  alTerminar,
}: Props) {
  const operacion = useOperacion({ accion: aprobarMovimiento, creacion: true });
  const { estado, error, exito } = operacion;

  useEffect(() => {
    // Traspaso al flujo (05 §4.15): allí se vuelve a aprobar y el servidor repite su mensaje o su confirmación
    const traspasar = (): void => {
      window.location.assign(`${hrefRevisar}?traspaso=1`);
    };
    if (estado === 'confirmando') traspasar();
    else if (estado === 'error' && error !== undefined) {
      if (necesitaElFlujo(error)) traspasar();
      else alTerminar(m.id, undefined);
    } else if (estado === 'listo' && exito !== undefined)
      alTerminar(m.id, exito.valor as ValorAprobado);
  }, [estado, error, exito, m.id, hrefRevisar, alTerminar]);

  if (resultado !== undefined)
    return (
      <Resultado
        texto={textoAprobado(resultado)}
        enlace={
          <EnlaceFinn href={`/actividad/${resultado.transaccionId}`}>{t.verTransaccion}</EnlaceFinn>
        }
      />
    );
  const alAccionar = (accion: AccionBandeja): void => {
    if (accion !== 'aprobar') return;
    alIniciar(m.id);
    void operacion.enviar({
      movimientoId: m.id,
      ...(m.origenPropuesto === undefined ? {} : { origenId: m.origenPropuesto.id }),
    });
  };
  const mensaje =
    estado === 'error' && error !== undefined && !necesitaElFlujo(error) ? error : undefined;
  return (
    <>
      <MovimientoBandeja movimiento={m} hrefRevisar={hrefRevisar} alAccionar={alAccionar} />
      {mensaje === undefined ? null : (
        <div className="px-4 pb-3.5">
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(REINTENTABLES.includes(mensaje.categoria)
              ? {
                  accion: (
                    <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                      {formularios.intentarDeNuevo}
                    </Boton>
                  ),
                }
              : {})}
          >
            {mensaje.mensaje}
          </AvisoEnLinea>
        </div>
      )}
    </>
  );
}
