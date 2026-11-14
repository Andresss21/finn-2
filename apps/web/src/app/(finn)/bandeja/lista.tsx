'use client';
// La lista de `/bandeja` (06-identidad-visual §7): resumen con los contadores, las filas compactas (`MovimientoBandeja`) y,
// sin movimientos, el vacío «Bandeja al día». Lo que muestra es lo que devolvió `bandeja()`, salvo la fila que se aprobó con
// un toque: la revalidación la saca de la lista y su resultado queda en su lugar (FT-35, 05 §4.15). [CH-281] El resultado es la
// etiqueta de C-50, pegada arriba de la fila (el monto queda a la vista); la fila se retiene mientras se ve y se recoge.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useConexion } from '../../../cliente/useConexion';
import { Boton } from '../../../componentes/base/boton';
import {
  EtiquetaResultado,
  FilaQueSale,
  useEtiqueta,
} from '../../../componentes/base/etiqueta-resultado';
import { Icono } from '../../../componentes/base/icono';
import { Vacio } from '../../../componentes/base/vacio';
import type { MovimientoDto } from '../../../componentes/dominio/movimiento-bandeja';
import { bandeja as t } from '../../../textos/bandeja';
import type { ResultadoFila } from '../../../flujos/bandeja-movimiento/descarte';
import { aprobarTodos } from '../../../servidor/acciones/bandeja';
import { AprobarTodos } from './aprobar-todos';
import type { DestinosArrastre } from './arrastre';
import { FilaBandeja, type Soltado } from './fila';
import { OtraCategoria } from './otra-categoria';

/** La librería de arrastre llega aparte, después de hidratar (FD-30, V6-08): hasta entonces los botones hacen todo. */
type Arrastre = typeof import('./arrastre');

interface Contadores {
  readonly pendientes: number;
  readonly conCoincidencia: number;
  readonly posiblesDuplicados: number;
  readonly noReconocidos: number;
  readonly errores: number;
}

/** [CH-240 E3-9] Se ven los primeros 8 movimientos; «Aprobar todos» cuenta todos los elegibles. */
const VISIBLES = 8;
const ID_SIN_CONEXION = 'bandeja-sin-conexion';

/** Una fila que se aprobó o se está aprobando: se queda donde estaba aunque la lista ya no la traiga. */
interface Retenida {
  readonly movimiento: MovimientoDto;
  readonly indice: number;
  readonly resultado: ResultadoFila | undefined;
  readonly enCurso: boolean;
}

/** Solo las clases que tienen movimientos, en el orden de `contadores`. */
function desglose(c: Contadores): string {
  return (Object.keys(t.desglose) as (keyof Contadores)[])
    .filter((k) => c[k] > 0)
    .map((k) => t.desglose[k](c[k]))
    .join(' · ');
}

export function ListaBandeja({
  contadores,
  elegibles,
  movimientos,
  destinos,
}: {
  readonly contadores: Contadores;
  readonly elegibles: readonly string[];
  readonly movimientos: readonly MovimientoDto[];
  /** `destinosArrastre` de `bandeja()` (CF-22): sin ellos no hay arrastre. */
  readonly destinos?: DestinosArrastre;
}) {
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [soltado, setSoltado] = useState<(Soltado & { readonly movimientoId: string }) | null>(
    null,
  );
  const [otra, setOtra] = useState<string | null>(null);
  const [limite, setLimite] = useState(VISIBLES);
  const { enLinea } = useConexion();
  const [anuncio, setAnuncio] = useState('');
  const etiqueta = useEtiqueta(setAnuncio);
  const { pausar, reanudar } = etiqueta;
  const alArrastrar = useCallback(
    (enCurso: boolean) => {
      if (enCurso) pausar('arrastre');
      else reanudar('arrastre');
    },
    [pausar, reanudar],
  );
  const pedida = useRef(false);
  const contador = useRef(0);
  const cargar = useCallback(() => {
    if (pedida.current) return;
    pedida.current = true;
    void import('./arrastre').then(setArrastre);
  }, []);
  const alSoltar = useCallback((movimientoId: string, categoriaId: string) => {
    contador.current += 1;
    setSoltado({ movimientoId, categoriaId, n: contador.current });
  }, []);
  const elegirOtra = useCallback((movimientoId: string) => {
    setOtra(movimientoId);
  }, []);
  const hayArrastrables = movimientos.some((m) => m.aprobacion.arrastrable === true);
  // Después de `load` y en el primer momento libre, con tope de 2 s (05 §13.3); antes, si hay un primer toque o tecla
  useEffect(() => {
    if (!hayArrastrables || destinos === undefined) return;
    let libre: (() => void) | undefined;
    const programar = (): void => {
      if (typeof window.requestIdleCallback === 'function') {
        const id = window.requestIdleCallback(cargar, { timeout: 2000 });
        libre = () => {
          window.cancelIdleCallback(id);
        };
      } else {
        const id = window.setTimeout(cargar, 200);
        libre = () => {
          window.clearTimeout(id);
        };
      }
    };
    if (document.readyState === 'complete') programar();
    else window.addEventListener('load', programar, { once: true });
    return () => {
      window.removeEventListener('load', programar);
      libre?.();
    };
  }, [hayArrastrables, destinos, cargar]);
  const [retenidas, setRetenidas] = useState<Readonly<Record<string, Retenida>>>({});
  const alIniciar = useCallback(
    (id: string) => {
      const indice = movimientos.findIndex((m) => m.id === id);
      const movimiento = movimientos[indice];
      if (movimiento === undefined) return;
      setRetenidas((r) => ({
        ...r,
        [id]: { movimiento, indice, resultado: undefined, enCurso: true },
      }));
    },
    [movimientos],
  );
  const alTerminar = useCallback((id: string, resultado: ResultadoFila | undefined) => {
    setRetenidas((r) => {
      const previa = r[id];
      return previa === undefined ? r : { ...r, [id]: { ...previa, resultado, enCurso: false } };
    });
  }, []);

  const filas = [...movimientos];
  // Con resultado, la fila se ve mientras su etiqueta (la reemplaza la siguiente acción, Escape la quita)
  const conEtiqueta = etiqueta.estado.actual?.id;
  for (const r of Object.values(retenidas))
    if (
      (r.enCurso || (r.resultado !== undefined && conEtiqueta === r.movimiento.id)) &&
      !filas.some((m) => m.id === r.movimiento.id)
    )
      filas.splice(Math.min(r.indice, filas.length), 0, r.movimiento);
  // «Aprobar todos» ocupa siempre el mismo lugar: su resultado sobrevive a que la lista quede vacía (FT-36)
  const cuerpo = (
    <>
      {filas.length === 0 ? null : (
        <p className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-titulo-seccion">{t.porRevisar(movimientos.length)}</span>
          <span className="text-cuerpo-pequeno text-texto-secundario">{desglose(contadores)}</span>
        </p>
      )}
      {enLinea ? null : (
        // [CH-240 E6-3] El motivo de «Aprobar», «Descartar» y el arrastre, una vez para toda la lista
        <p
          id={ID_SIN_CONEXION}
          className="flex items-start gap-2 rounded-contenedor bg-superficie px-3.5 py-3 text-cuerpo-pequeno text-texto-secundario"
        >
          <Icono nombre="wifioff" tamano={18} className="mt-0.5 shrink-0" />
          {t.sinConexion}
        </p>
      )}
      <AprobarTodos accion={aprobarTodos} elegibles={elegibles} movimientos={movimientos} />
      {/* [CH-281] La región de estado de la pantalla: la frase completa de la etiqueta (C-50 §7) */}
      <p role="status" data-anuncio="bandeja" className="sr-only">
        {anuncio}
      </p>
      {filas.length === 0 ? (
        <Vacio titulo={t.alDia.titulo} texto={t.alDia.texto} icono="inbox" />
      ) : (
        <>
          <ul
            aria-label={t.lista}
            onPointerDownCapture={cargar}
            onKeyDownCapture={cargar}
            className="fz-tarjeta-etiqueta divide-y divide-borde-sutil rounded-contenedor bg-superficie shadow-elevacion-1"
          >
            {filas
              .map((m, i) => ({ m, i }))
              .filter(({ m, i }) => i < limite || retenidas[m.id] !== undefined)
              .map(({ m }) => (
                <FilaQueSale key={m.id} api={etiqueta} id={m.id}>
                  <div
                    {...(etiqueta.resaltada(m.id) ? { 'data-resaltada': '' } : {})}
                    className="fz-resaltable"
                  >
                    <FilaBandeja
                      movimiento={m}
                      hrefRevisar={`/bandeja/${m.id}`}
                      etiqueta={etiqueta}
                      alIniciar={alIniciar}
                      alTerminar={alTerminar}
                      {...(enLinea ? {} : { sinConexion: { idMotivo: ID_SIN_CONEXION } })}
                      {...(destinos === undefined
                        ? {}
                        : { conArrastre: true, alElegirCategoria: elegirOtra })}
                      {...(soltado?.movimientoId === m.id ? { soltado } : {})}
                    />
                    <EtiquetaResultado api={etiqueta} id={m.id} posicion="arriba" />
                  </div>
                </FilaQueSale>
              ))}
          </ul>
          {filas.length > limite ? (
            <Boton
              variante="secundaria"
              className="w-full"
              onClick={() => {
                setLimite(filas.length);
              }}
            >
              {t.mostrarMas(filas.length - limite)}
            </Boton>
          ) : null}
          <p className="text-cuerpo-pequeno text-texto-terciario">{t.nota}</p>
        </>
      )}
    </>
  );
  // El contexto de arrastre es un hermano del cuerpo, no su envoltura: al llegar la librería las filas no se vuelven a montar
  return (
    <>
      {cuerpo}
      {arrastre === null || destinos === undefined ? null : (
        <arrastre.ContextoArrastre
          movimientos={movimientos}
          destinos={destinos}
          alSoltar={alSoltar}
          alElegirOtra={elegirOtra}
          deshabilitado={!enLinea}
          alArrastrar={alArrastrar}
        />
      )}
      {otra === null || destinos === undefined ? null : (
        <OtraCategoria
          grupos={destinos.grupos}
          alElegir={(categoriaId) => {
            alSoltar(otra, categoriaId);
            setOtra(null);
          }}
          alCerrar={() => {
            setOtra(null);
          }}
        />
      )}
    </>
  );
}
