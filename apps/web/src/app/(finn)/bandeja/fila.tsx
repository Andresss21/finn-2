'use client';
// Una fila de `/bandeja` con «Aprobar», «Es otro gasto» y «Descartar» de un toque (FT-35, FT-37, FE-24, FE-25, 05 §4.14, §4.15),
// cada acción con su propio `useOperacion`. Si el servidor pide confirmar o datos al aprobar, traspasa al flujo
// `/bandeja/[movimientoId]`; si no, el resultado dice lo que se hizo (CP-15) y, al descartar, ofrece «Restaurar» (OP-39).
// [CH-220 C2] Al aprobar, la fila sale (240 ms) y el resultado entra en el mismo lugar con `fz-pop-in`; sin «Deshacer».
import type { ErrorFinn } from '@finn/aplicacion/errores';
import { useEffect, useRef } from 'react';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { Boton } from '../../../componentes/base/boton';
import { Resultado } from '../../../componentes/base/resultado';
import {
  MovimientoBandeja,
  type AccionBandeja,
  type MovimientoDto,
} from '../../../componentes/dominio/movimiento-bandeja';
import { useSalida } from '../../../componentes/movimiento/use-salida';
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

/** Al soltar sobre una categoría, estos dos se quedan en la fila: el flujo no los arregla (FT-78). */
const DE_LA_FILA = ['arrastre_no_permitido', 'conflicto_desactualizado'];
/** Los rechazos que necesitan datos del usuario pasan al flujo; el resto se queda en la fila (05 §4.15). */
const necesitaElFlujo = (e: ErrorFinn, porArrastre: boolean): boolean =>
  !(porArrastre && DE_LA_FILA.includes(e.codigo)) &&
  (e.categoria === 'VALIDACION' ||
    e.categoria === 'CONFLICTO' ||
    (e.categoria === 'DOMINIO' && e.codigo !== 'movimiento_estado_no_valido'));
/** Las líneas que vio la lista (CF-21): el servidor las compara con las de ahora (`conflicto_desactualizado`). */
const lineasVistas = (m: MovimientoDto): unknown[] => {
  const l = m.esperado?.['lineas'];
  return Array.isArray(l) ? (l as unknown[]) : [];
};

/** Una categoría soltada sobre esta fila; `n` distingue una suelta de la siguiente. */
export interface Soltado {
  readonly categoriaId: string;
  readonly n: number;
}
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];

interface Props {
  readonly movimiento: MovimientoDto;
  readonly hrefRevisar: string;
  readonly resultado: ResultadoFila | undefined;
  readonly alIniciar: (id: string) => void;
  readonly alTerminar: (id: string, valor: ResultadoFila | undefined) => void;
  /** FT-78: la fila reserva el lugar del asa; `ContextoArrastre` la monta cuando llega la librería. */
  readonly conArrastre?: boolean;
  readonly soltado?: Soltado;
  /** [CH-220 A10] Abre el selector de categorías de la lista para este movimiento (solo los arrastrables, FT-78). */
  readonly alElegirCategoria?: (id: string) => void;
}

export function FilaBandeja({
  movimiento: m,
  hrefRevisar,
  resultado,
  alIniciar,
  alTerminar,
  conArrastre,
  soltado,
  alElegirCategoria,
}: Props) {
  const operacion = useOperacion({ accion: aprobarMovimiento, creacion: true });
  const descartar = useOperacion({ accion: descartarMovimiento });
  const restaurar = useOperacion({ accion: descartarMovimiento });
  const legitimo = useOperacion({ accion: resolverCoincidencia });
  const reprocesar = useOperacion({ accion: reprocesarSms }); // OP-49 (FT-38)
  const { copia, copiar } = useCopiarReferencia();
  const { estado, error, exito, enviar } = operacion;
  const ultimoSoltado = useRef(0);
  const porArrastre = useRef<string | undefined>(undefined);
  const origenId = m.origenPropuesto?.id;
  // El resultado de aprobar espera a que la fila termine de salir.
  const aprobado = useRef<ResultadoFila | undefined>(undefined);
  const salida = useSalida(() => {
    alTerminar(m.id, aprobado.current);
  }, '--duracion-salida-fila');
  const salirFila = useRef(salida.salir);
  useEffect(() => {
    salirFila.current = salida.salir;
  });

  // FT-78: soltar sobre una categoría es una sola llamada a OP-37 con `{ categoriaId }` y las líneas que vio la lista
  useEffect(() => {
    if (soltado === undefined || soltado.n === ultimoSoltado.current) return;
    ultimoSoltado.current = soltado.n;
    porArrastre.current = soltado.categoriaId;
    alIniciar(m.id);
    void enviar({
      movimientoId: m.id,
      ...(origenId === undefined ? {} : { origenId }),
      categoriaId: soltado.categoriaId,
      esperado: { lineas: lineasVistas(m) },
    });
  }, [soltado, m, origenId, enviar, alIniciar]);

  useEffect(() => {
    // Traspaso al flujo (05 §4.15): allí se vuelve a aprobar y el servidor repite su mensaje o su confirmación.
    // Si venía de un arrastre, el flujo recibe también la categoría soltada (FT-78).
    const traspasar = (): void => {
      const categoria = porArrastre.current;
      window.location.assign(
        `${hrefRevisar}?traspaso=1${categoria === undefined ? '' : `&categoria=${categoria}`}`,
      );
    };
    if (estado === 'confirmando') traspasar();
    else if (estado === 'error' && error !== undefined) {
      if (necesitaElFlujo(error, porArrastre.current !== undefined)) traspasar();
      else alTerminar(m.id, undefined);
    } else if (estado === 'listo' && exito !== undefined) {
      aprobado.current = { tipo: 'aprobado', valor: exito.valor as ValorAprobado };
      salirFila.current();
    }
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
      <div data-resultado-entra className="fz-resultado-entra">
        <Resultado
          texto={textoAprobado(resultado.valor)}
          enlace={
            <EnlaceFinn href={`/actividad/${resultado.valor.transaccionId}`}>
              {t.verTransaccion}
            </EnlaceFinn>
          }
        />
      </div>
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
      porArrastre.current = undefined;
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
      !(o === operacion && necesitaElFlujo(o.error, porArrastre.current !== undefined)),
  );
  const mensaje = fallida?.error;
  return (
    <>
      <div
        {...(salida.saliendo ? { 'data-saliendo': '', className: 'fz-fila-sale' } : {})}
        onAnimationEnd={salida.saliendo ? salida.alTerminarAnimacion : undefined}
      >
        <MovimientoBandeja
          movimiento={m}
          hrefRevisar={hrefRevisar}
          alAccionar={alAccionar}
          ranuraAsa={conArrastre === true && m.aprobacion.arrastrable === true}
          {...(alElegirCategoria !== undefined && m.aprobacion.arrastrable === true
            ? {
                alElegirCategoria: () => {
                  alElegirCategoria(m.id);
                },
              }
            : {})}
        />
      </div>
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
