'use client';
// Una fila de `/bandeja` con «Aprobar», «Es otro gasto» y «Descartar» de un toque (FT-35, FT-37, FE-24, FE-25, 05 §4.14, §4.15),
// cada acción con su propio `useOperacion`. Si el servidor pide confirmar o datos al aprobar, traspasa al flujo
// `/bandeja/[movimientoId]`; si no, el resultado dice lo que se hizo (CP-15) y, al descartar, ofrece «Restaurar» (OP-39).
// [CH-281] El resultado es la etiqueta de C-50 sobre la fila (AVISO-DE-RESULTADO §8): «Aprobado» con «Ver transacción» o
// «Descartado» con «Restaurar»; la fila se queda los ms de `--duracion-aviso` y se recoge (la lista la retiene hasta entonces).
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { Centavos } from '@finn/dominio/valores';
import { useEffect, useRef } from 'react';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { Boton } from '../../../componentes/base/boton';
import type { AccionEtiqueta, ApiEtiqueta } from '../../../componentes/base/etiqueta-resultado';
import {
  MovimientoBandeja,
  type AccionBandeja,
  type MovimientoDto,
} from '../../../componentes/dominio/movimiento-bandeja';
import { textoAprobado, type ValorAprobado } from '../../../flujos/bandeja-movimiento/aprobado';
import type { ResultadoFila } from '../../../flujos/bandeja-movimiento/descarte';
import { formatearMonto } from '../../../formato';
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
import { cuentas } from '../../../textos/cuentas';
import { formularios } from '../../../textos/formularios';

/** Al soltar sobre una categoría, estos dos se quedan en la fila: el flujo no los arregla (FT-78). */
const DE_LA_FILA = ['arrastre_no_permitido'];
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

/** La categoría de la primera línea que vio la lista, o `null` si no tenía. */
const categoriaVista = (m: MovimientoDto): string | null => {
  const primera = lineasVistas(m)[0] as { categoriaId?: string | null } | undefined;
  return primera?.categoriaId ?? null;
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
  /** [CH-281] La etiqueta de la lista (una por pantalla, C-50). */
  readonly etiqueta: ApiEtiqueta;
  readonly alIniciar: (id: string) => void;
  readonly alTerminar: (id: string, valor: ResultadoFila | undefined) => void;
  /** FT-78: la fila reserva el lugar del asa; `ContextoArrastre` la monta cuando llega la librería. */
  readonly conArrastre?: boolean;
  readonly soltado?: Soltado;
  /** [CH-240 E6-3] Sin conexión: «Aprobar» y «Descartar» se deshabilitan con el aviso de la lista como motivo. */
  readonly sinConexion?: { readonly idMotivo: string };
  /** [CH-220 A10] Abre el selector de categorías de la lista para este movimiento (solo los arrastrables, FT-78). */
  readonly alElegirCategoria?: (id: string) => void;
}

export function FilaBandeja({
  movimiento: m,
  hrefRevisar,
  etiqueta,
  alIniciar,
  alTerminar,
  conArrastre,
  soltado,
  sinConexion,
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
  // Cada resultado se muestra una vez; la etiqueta cambia con su estado, así que los efectos la leen de un ref
  const mostrado = useRef<unknown>(undefined);
  const api = useRef(etiqueta);
  useEffect(() => {
    api.current = etiqueta;
  });
  const comercio = m.comercio ?? cuentas.bandeja.sinComercio;
  /** La etiqueta en esta fila; al irse, la lista deja de retenerla (la fila ya se recogió). */
  const mostrar = (palabra: string, frase: string, accion: AccionEtiqueta, r: ResultadoFila) => {
    alTerminar(m.id, r);
    api.current.mostrar({
      id: m.id,
      palabra,
      frase,
      accion,
      alIrse: () => {
        alTerminar(m.id, undefined);
      },
    });
  };
  const mostrarRef = useRef(mostrar);
  useEffect(() => {
    mostrarRef.current = mostrar;
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
      // [CH-240 E6-5] Si las líneas cambiaron desde que la lista las vio, el flujo recibe la categoría que se vio
      const visto =
        error?.codigo === 'conflicto_desactualizado' && categoria !== undefined
          ? `&conflicto=1&visto=${categoriaVista(m) ?? ''}`
          : '';
      window.location.assign(
        `${hrefRevisar}?traspaso=1${categoria === undefined ? '' : `&categoria=${categoria}`}${visto}`,
      );
    };
    if (estado === 'confirmando') traspasar();
    else if (estado === 'error' && error !== undefined) {
      if (necesitaElFlujo(error, porArrastre.current !== undefined)) traspasar();
      else alTerminar(m.id, undefined);
    } else if (estado === 'listo' && exito !== undefined && mostrado.current !== exito) {
      mostrado.current = exito;
      const valor = exito.valor as ValorAprobado;
      const destino = valor.aprobado?.destino;
      // Al soltar, la frase empieza con «Soltaste {comercio} en {categoría}.» (§8)
      const soltaste =
        porArrastre.current !== undefined && destino !== undefined && 'categoria' in destino
          ? `${t.arrastre.soltaste(comercio, destino.categoria.nombre)} `
          : '';
      mostrarRef.current(
        t.etiqueta.aprobado,
        soltaste + textoAprobado(valor),
        { texto: t.verTransaccion, href: `/actividad/${valor.transaccionId}` },
        { tipo: 'aprobado', valor },
      );
    }
  }, [estado, error, exito, m, comercio, hrefRevisar, alTerminar]);

  // Descartar deja la etiqueta con «Restaurar»; restaurar la quita (la revalidación devuelve la fila a la lista)
  const enviarRestaurar = restaurar.enviar;
  useEffect(() => {
    if (descartar.estado === 'listo' && mostrado.current !== descartar.exito) {
      mostrado.current = descartar.exito;
      mostrarRef.current(
        t.etiqueta.descartado,
        t.etiqueta.descartadoFrase(
          ...[comercio, m.monto === null ? '' : formatearMonto(m.monto as Centavos)].filter(
            (x) => x !== '',
          ),
        ),
        {
          texto: t.restaurar,
          icono: 'undo',
          alTocar: () => {
            void enviarRestaurar({ movimientoId: m.id, accion: 'restaurar' });
          },
        },
        { tipo: 'descartado' },
      );
    } else if (descartar.estado === 'error') alTerminar(m.id, undefined);
  }, [descartar.estado, descartar.exito, comercio, m.id, m.monto, enviarRestaurar, alTerminar]);
  useEffect(() => {
    if (restaurar.estado !== 'listo') return;
    api.current.cerrar();
    alTerminar(m.id, undefined);
  }, [restaurar.estado, m.id, alTerminar]);

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
      <div>
        <MovimientoBandeja
          movimiento={m}
          hrefRevisar={hrefRevisar}
          alAccionar={alAccionar}
          ranuraAsa={conArrastre === true && m.aprobacion.arrastrable === true}
          reservarAsa={conArrastre === true && m.aprobacion.arrastrable !== true}
          {...(sinConexion === undefined ? {} : { sinConexion })}
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
