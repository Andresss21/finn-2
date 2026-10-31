'use client';
// `useOperacion` (05 §4.3 a §4.9): la única forma de llamar a una Server Action de escritura. Completa la entrada
// (modo, id de creación, `esperado`, confirmación), ignora el doble envío con una referencia, aplica la tabla de §4.7
// con un solo reintento automático y trata el fallo de red como INCIERTO. No calcula montos (PF-3).
import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import type { ErrorFinn, ResultadoAccion } from '@finn/aplicacion/errores';
import { formularios } from '../textos/formularios';

export type EstadoOperacion = 'editando' | 'enviando' | 'confirmando' | 'listo' | 'error';

export type AccionEscritura = (entrada: unknown) => Promise<ResultadoAccion<unknown>>;

type Exito = Extract<ResultadoAccion<unknown>, { ok: true }>;
type Modo = 'previsualizar' | 'confirmar';
interface Confirmacion {
  readonly revisionVista: string;
  readonly huellaImpacto: string;
}
interface Envio {
  readonly modo: Modo;
  readonly entrada: unknown;
  readonly confirmacion: Confirmacion | undefined;
}

export interface OpcionesOperacion {
  readonly accion: AccionEscritura;
  /** Operación de clase creación (04 §4.6): lleva un `id` generado en el primer envío (FE-08). */
  readonly creacion?: boolean;
  /** Lista cerrada de 05 §4.4: la primera llamada es `modo: 'previsualizar'` (FE-07). */
  readonly previsualizarPrimero?: boolean;
  /** Lo que vio el usuario al abrir (FE-09): se copia una sola vez; un `router.refresh()` no lo actualiza. */
  readonly esperado?: Readonly<Record<string, unknown>>;
  /** Para sustituir la espera de 1 a 2 s del reintento de `OCUPADO` y el redireccionamiento. */
  readonly esperarOcupado?: () => Promise<void>;
  readonly alNoAutorizado?: () => void;
}

const ESPERA_OCUPADO_MS = (): Promise<void> =>
  new Promise((listo) => setTimeout(listo, 1000 + Math.floor(Math.random() * 1000)));

const IR_A_INGRESAR = (): void => {
  window.location.assign(`/ingresar?volver=${encodeURIComponent(window.location.pathname)}`);
};

const errorSinConexion: ErrorFinn = {
  categoria: 'INTERNO',
  codigo: 'sin_conexion',
  mensaje: formularios.sinConexion,
};
/** 05 §4.8: la llamada lanzó, no se sabe si llegó. */
const errorDeRed: ErrorFinn = {
  categoria: 'INCIERTO',
  codigo: 'red',
  mensaje: formularios.incierto,
};

/** 05 §4.10: el servidor nuevo no conoce la acción de la pestaña vieja (409 con `Server Action "…" was not found…`). */
const MENSAJE_ACCION_DESCONOCIDA =
  /Server Action .* was not found on the server|Failed to find Server Action/i;
const errorVersionNueva: ErrorFinn = {
  categoria: 'INTERNO',
  codigo: 'version_nueva',
  mensaje: formularios.versionNueva,
};

function suscribirConexion(avisar: () => void): () => void {
  window.addEventListener('online', avisar);
  window.addEventListener('offline', avisar);
  return () => {
    window.removeEventListener('online', avisar);
    window.removeEventListener('offline', avisar);
  };
}

/** `false` solo si el navegador dice que no hay conexión (05 §4.8). En el servidor, con conexión. */
export function useEnLinea(): boolean {
  return useSyncExternalStore(
    suscribirConexion,
    () => navigator.onLine,
    () => true,
  );
}

interface Vista {
  readonly estado: EstadoOperacion;
  readonly exito?: Exito;
  readonly error?: ErrorFinn;
  readonly previsualizacion?: unknown;
  readonly impactoCambio: boolean;
}

const reintentable = (e: ErrorFinn): boolean =>
  e.categoria === 'OCUPADO' || e.categoria === 'INCIERTO';

export function useOperacion(opciones: OpcionesOperacion) {
  const enVuelo = useRef(false); // FE-12: una referencia, no estado de React
  const idCreacion = useRef<string | null>(null);
  const esperado = useRef(opciones.esperado === undefined ? undefined : { ...opciones.esperado });
  const ultimo = useRef<Envio | null>(null);
  const confirmacion = useRef<Confirmacion | null>(null);
  const [vista, setVista] = useState<Vista>({ estado: 'editando', impactoCambio: false });
  const enLinea = useEnLinea();
  const { accion, creacion = false, previsualizarPrimero = false } = opciones;
  const { esperarOcupado = ESPERA_OCUPADO_MS, alNoAutorizado = IR_A_INGRESAR } = opciones;

  const llamar = useCallback(
    async (payload: unknown): Promise<ResultadoAccion<unknown>> => {
      try {
        return await accion(payload);
      } catch (e) {
        const desfase = e instanceof Error && MENSAJE_ACCION_DESCONOCIDA.test(e.message);
        return { ok: false, error: desfase ? errorVersionNueva : errorDeRed };
      }
    },
    [accion],
  );

  const ejecutar = useCallback(
    async (envio: Envio, automatico = true): Promise<void> => {
      if (enVuelo.current) return; // 4.9, paso 1
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setVista({ estado: 'error', error: errorSinConexion, impactoCambio: false });
        return;
      }
      enVuelo.current = true;
      ultimo.current = envio;
      const veniaConfirmando = envio.confirmacion !== undefined;
      setVista((v) => ({ ...v, estado: 'enviando' }));
      // FE-08: el id nace en el primer intento y se conserva hasta un `ok: true`.
      if (creacion && idCreacion.current === null) idCreacion.current = crypto.randomUUID();
      const payload = {
        ...(envio.entrada as Record<string, unknown>),
        modo: envio.modo,
        ...(creacion ? { id: idCreacion.current } : {}),
        ...(esperado.current === undefined ? {} : { esperado: esperado.current }),
        ...(envio.confirmacion ?? {}),
      };
      let resultado: ResultadoAccion<unknown>;
      try {
        resultado = await llamar(payload);
        // 4.7: un solo reintento automático, con la misma entrada y el mismo id.
        if (automatico && !resultado.ok && reintentable(resultado.error)) {
          if (resultado.error.categoria === 'OCUPADO') await esperarOcupado();
          resultado = await llamar(payload);
        }
      } finally {
        enVuelo.current = false;
      }
      if (resultado.ok) {
        if (envio.modo === 'previsualizar') {
          const p = resultado.valor as { revisionVista: string; huellaImpacto: string | null };
          confirmacion.current =
            p.huellaImpacto === null
              ? null
              : { revisionVista: p.revisionVista, huellaImpacto: p.huellaImpacto };
          setVista({
            estado: 'confirmando',
            previsualizacion: resultado.valor,
            impactoCambio: false,
          });
          return;
        }
        idCreacion.current = null; // se renueva solo después de `ok: true`
        confirmacion.current = null;
        setVista({ estado: 'listo', exito: resultado, impactoCambio: false });
        return;
      }
      const { error } = resultado;
      if (error.categoria === 'REQUIERE_CONFIRMACION') {
        const p = error.previsualizacion;
        confirmacion.current =
          p === undefined
            ? null
            : { revisionVista: String(p['revisionVista']), huellaImpacto: p.huellaImpacto };
        setVista({
          estado: 'confirmando',
          previsualizacion: p,
          impactoCambio: veniaConfirmando, // 4.4 paso 2: nunca se confirma solo
        });
        return;
      }
      if (error.categoria === 'NO_AUTORIZADO') alNoAutorizado();
      setVista({ estado: 'error', error, impactoCambio: false });
    },
    [creacion, llamar, esperarOcupado, alNoAutorizado],
  );

  /** `enviar(entrada)`: el envío del formulario ya validado. */
  const enviar = useCallback(
    (entrada: unknown): Promise<void> =>
      ejecutar({
        modo: previsualizarPrimero ? 'previsualizar' : 'confirmar',
        entrada,
        confirmacion: undefined,
      }),
    [ejecutar, previsualizarPrimero],
  );

  /** Con la previsualización a la vista: la misma entrada más `revisionVista` y `huellaImpacto` (4.4). */
  const confirmar = useCallback((): Promise<void> => {
    const c = confirmacion.current;
    if (ultimo.current === null || c === null) return Promise.resolve();
    return ejecutar({ modo: 'confirmar', entrada: ultimo.current.entrada, confirmacion: c });
  }, [ejecutar]);

  /** Reintento manual: la misma entrada con el mismo id, una sola llamada (4.7: después del automático, solo manual). */
  const reintentar = useCallback(
    (): Promise<void> =>
      ultimo.current === null ? Promise.resolve() : ejecutar(ultimo.current, false),
    [ejecutar],
  );

  const volverAEditar = useCallback((): void => {
    confirmacion.current = null;
    setVista({ estado: 'editando', impactoCambio: false });
  }, []);

  /** `conflicto_desactualizado`: toma los valores actuales como nuevo `esperado` y vuelve a editar (4.7). */
  const usarValorActual = useCallback((): void => {
    setVista((v) => {
      if (v.error?.datos !== undefined)
        esperado.current = { ...esperado.current, ...v.error.datos };
      return { estado: 'editando', impactoCambio: false };
    });
  }, []);

  /** `conflicto_id`: "Guardar como nuevo" genera un id nuevo y envía (4.7). */
  const guardarComoNuevo = useCallback((): Promise<void> => {
    idCreacion.current = null;
    return reintentar();
  }, [reintentar]);

  /** 05 §4.10: "Recargar" tras `version_nueva`; el borrador de los flujos largos sobrevive (4.11). */
  const recargar = useCallback((): void => {
    window.location.reload();
  }, []);

  /** Lo que guarda el borrador (4.11): el id de creación y la copia de `esperado` de cuando se abrió. */
  const paraBorrador = useCallback(
    () => ({ id: idCreacion.current, esperado: esperado.current }),
    [],
  );
  const restaurarBorrador = useCallback(
    (guardado: { id: string | null; esperado: Readonly<Record<string, unknown>> | undefined }) => {
      idCreacion.current = guardado.id;
      esperado.current = guardado.esperado === undefined ? undefined : { ...guardado.esperado };
    },
    [],
  );

  return {
    ...vista,
    enLinea,
    recargar,
    paraBorrador,
    restaurarBorrador,
    motivoSinEnvio: enLinea ? undefined : formularios.sinConexionMotivo,
    enviar,
    confirmar,
    reintentar,
    volverAEditar,
    usarValorActual,
    guardarComoNuevo,
  };
}

export type Operacion = ReturnType<typeof useOperacion>;
