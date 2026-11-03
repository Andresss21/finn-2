'use client';
// Una fila de `/bandeja` con «Aprobar», «Es otro gasto» y «Descartar» de un toque (FT-35, FT-37, FE-24, FE-25, 05 §4.14, §4.15),
// cada acción con su propio `useOperacion`. Si el servidor pide confirmar o datos al aprobar, traspasa al flujo
// `/bandeja/[movimientoId]`; si no, el resultado dice lo que se hizo (CP-15) y, al descartar, ofrece «Restaurar» (OP-39).
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
import { textoDescartado, type ResultadoFila } from '../../../flujos/bandeja-movimiento/descarte';
import {
  entradaDeReproceso,
  referenciaDe,
  useCopiarReferencia,
} from '../../../flujos/bandeja-movimiento/error-sms';
import { useOperacion } from '../../../formularios/use-operacion';
import {
  aprobarMovimiento,
  descartarMovimiento,
  reprocesarSms,
  resolverCoincidencia,
} from '../../../servidor/acciones/bandeja';
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
  readonly resultado: ResultadoFila | undefined;
  readonly alIniciar: (id: string) => void;
  readonly alTerminar: (id: string, valor: ResultadoFila | undefined) => void;
}

export function FilaBandeja({
  movimiento: m,
  hrefRevisar,
  resultado,
  alIniciar,
  alTerminar,
}: Props) {
  const operacion = useOperacion({ accion: aprobarMovimiento, creacion: true });
  const descartar = useOperacion({ accion: descartarMovimiento });
  const restaurar = useOperacion({ accion: descartarMovimiento });
  const legitimo = useOperacion({ accion: resolverCoincidencia });
  const reprocesar = useOperacion({ accion: reprocesarSms }); // OP-49 (FT-38)
  const { copia, copiar } = useCopiarReferencia();
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
      alTerminar(m.id, { tipo: 'aprobado', valor: exito.valor as ValorAprobado });
  }, [estado, error, exito, m.id, hrefRevisar, alTerminar]);

  // Descartar deja el resultado en el lugar de la fila; restaurar lo quita (la revalidación la devuelve a la lista)
  useEffect(() => {
    if (descartar.estado === 'listo') alTerminar(m.id, { tipo: 'descartado' });
    else if (descartar.estado === 'error') alTerminar(m.id, undefined);
  }, [descartar.estado, m.id, alTerminar]);
  useEffect(() => {
    if (restaurar.estado === 'listo') alTerminar(m.id, undefined);
  }, [restaurar.estado, m.id, alTerminar]);

  if (resultado?.tipo === 'aprobado')
    return (
      <Resultado
        texto={textoAprobado(resultado.valor)}
        enlace={
          <EnlaceFinn href={`/actividad/${resultado.valor.transaccionId}`}>
            {t.verTransaccion}
          </EnlaceFinn>
        }
      />
    );
  if (resultado?.tipo === 'descartado')
    return (
      <>
        <Resultado
          texto={textoDescartado(m.comercio, m.monto)}
          salida={{
            etiqueta: t.restaurar,
            ejecutar: () => {
              void restaurar.enviar({ movimientoId: m.id, accion: 'restaurar' });
            },
          }}
        />
        {restaurar.estado === 'error' && restaurar.error !== undefined ? (
          <div className="px-4 pb-3.5">
            <AvisoEnLinea estado="problema" aparecioDespues>
              {restaurar.error.mensaje}
            </AvisoEnLinea>
          </div>
        ) : null}
      </>
    );
  const referencia = referenciaDe(m.procesamiento?.errorDetalle);
  const alAccionar = (accion: AccionBandeja): void => {
    if (accion === 'aprobar') {
      alIniciar(m.id);
      void operacion.enviar({
        movimientoId: m.id,
        ...(m.origenPropuesto === undefined ? {} : { origenId: m.origenPropuesto.id }),
      });
    } else if (accion === 'descartar') {
      alIniciar(m.id);
      void descartar.enviar({ movimientoId: m.id, accion: 'descartar' });
    } else if (accion === 'es-otro-gasto')
      void legitimo.enviar({ movimientoId: m.id, decision: 'es_legitimo' });
    else if (accion === 'reintentar') {
      const entrada = entradaDeReproceso(m);
      if (entrada !== undefined) void reprocesar.enviar(entrada);
    } else copiar(referencia);
  };
  const fallida = [operacion, descartar, restaurar, legitimo, reprocesar].find(
    (o) =>
      o.estado === 'error' &&
      o.error !== undefined &&
      !(o === operacion && necesitaElFlujo(o.error)),
  );
  const mensaje = fallida?.error;
  return (
    <>
      <MovimientoBandeja movimiento={m} hrefRevisar={hrefRevisar} alAccionar={alAccionar} />
      {reprocesar.estado === 'listo' || copia !== 'nada' ? (
        <p role="status" className="px-4 pb-3.5 text-cuerpo-pequeno text-texto-secundario">
          {copia === 'copiada'
            ? t.referenciaCopiada
            : copia === 'fallo'
              ? t.noSePudoCopiar(referencia)
              : t.reprocesado}
        </p>
      ) : null}
      {mensaje === undefined ? null : (
        <div className="px-4 pb-3.5">
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(REINTENTABLES.includes(mensaje.categoria)
              ? {
                  accion: (
                    <Boton variante="secundaria" onClick={() => void fallida?.reintentar()}>
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
