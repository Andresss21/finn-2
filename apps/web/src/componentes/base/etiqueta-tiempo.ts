// [CH-278] C-50 (`docs/anexos/finn-aviso-de-resultado/`, AVISO-DE-RESULTADO §4 y §5): el reloj de la etiqueta de resultado,
// sin React ([CH-286] `leerMs`, `reducido` y `relojDeVentana`, al final, leen del navegador y los usa también el aviso
// momentáneo de C-51). Una sola etiqueta a la vez: `mostrar` reemplaza a la anterior y se va sola a los ms de `--duracion-aviso`, que
// llegan de afuera (`duracion()`; sin valor, no se va). Cada motivo de espera (puntero, foco, arrastre) la detiene; cuando no
// queda ninguno, cuenta la duración completa otra vez. Si el resultado tiene inverso, queda `ultimo` para el ↶ de la fila
// hasta la siguiente acción. La especificación es `logica/aviso.js` del anexo; esta es su adaptación, no una copia.

export type Fase = 'nada' | 'visible' | 'saliendo';
export type MotivoEspera = 'puntero' | 'foco' | 'arrastre';

export interface Reloj {
  readonly poner: (f: () => void, ms: number) => number;
  readonly quitar: (id: number) => void;
}

export interface EstadoReloj<R> {
  readonly actual: R | null;
  readonly fase: Fase;
  readonly pausado: boolean;
  /** El último resultado con inverso: su fila muestra ↶ cuando la etiqueta ya no se ve. */
  readonly ultimo: R | null;
}

export interface OpcionesReloj<R> {
  /** `--duracion-aviso` en ms; `undefined` si no se pudo leer (la etiqueta espera). */
  readonly duracion: () => number | undefined;
  /** La salida (`--duracion-normal`); 0 con movimiento reducido. */
  readonly salida: () => number;
  readonly reloj: Reloj;
  readonly alCambiar: (e: EstadoReloj<R>) => void;
  /** Cuando la etiqueta terminó de irse (sin Escape ni reemplazo): la fila que sale se quita. */
  readonly alIrse?: (r: R) => void;
}

export interface EtiquetaReloj<R> {
  /** Un resultado nuevo: reemplaza al anterior. `conInverso` deja ↶ en su fila hasta la siguiente acción. */
  mostrar(r: R, conInverso: boolean): void;
  pausar(motivo: MotivoEspera): void;
  reanudar(motivo: MotivoEspera): void;
  /** Escape con el foco adentro, o una acción nueva que todavía no tiene resultado. */
  cerrar(): void;
  /** Otra acción que cambia datos: el ↶ se va. */
  otraAccion(): void;
  estado(): EstadoReloj<R>;
}

export function crearEtiquetaReloj<R>(op: OpcionesReloj<R>): EtiquetaReloj<R> {
  let estado: EstadoReloj<R> = { actual: null, fase: 'nada', pausado: false, ultimo: null };
  const motivos = new Set<MotivoEspera>();
  let t1: number | null = null;
  let t2: number | null = null;

  const fijar = (cambio: Partial<EstadoReloj<R>>) => {
    estado = { ...estado, ...cambio };
    op.alCambiar(estado);
  };
  const limpiar = () => {
    if (t1 !== null) op.reloj.quitar(t1);
    if (t2 !== null) op.reloj.quitar(t2);
    t1 = null;
    t2 = null;
  };
  const contar = () => {
    limpiar();
    const ms = op.duracion();
    if (ms === undefined) return;
    t1 = op.reloj.poner(() => {
      t1 = null;
      fijar({ fase: 'saliendo' });
      t2 = op.reloj.poner(() => {
        t2 = null;
        const r = estado.actual;
        fijar({ actual: null, fase: 'nada' });
        if (r !== null) op.alIrse?.(r);
      }, op.salida());
    }, ms);
  };

  return {
    mostrar(r, conInverso) {
      motivos.clear();
      fijar({ actual: r, fase: 'visible', pausado: false, ultimo: conInverso ? r : null });
      contar();
    },
    pausar(motivo) {
      motivos.add(motivo);
      if (estado.actual === null) return;
      limpiar();
      fijar({ fase: 'visible', pausado: true });
    },
    reanudar(motivo) {
      motivos.delete(motivo);
      if (estado.actual === null || !estado.pausado || motivos.size > 0) return;
      fijar({ pausado: false });
      contar();
    },
    cerrar() {
      limpiar();
      motivos.delete('puntero');
      motivos.delete('foco');
      if (estado.actual !== null) fijar({ actual: null, fase: 'nada', pausado: false });
    },
    otraAccion() {
      if (estado.ultimo !== null) fijar({ ultimo: null });
    },
    estado: () => estado,
  };
}

/** ↶ en la fila `id`: hay inverso y su etiqueta ya no se ve, o se está yendo (AVISO-DE-RESULTADO §5). */
export function deshacerEnFila<R extends { readonly id: string }>(
  e: EstadoReloj<R>,
  id: string,
): boolean {
  return (
    e.ultimo !== null &&
    e.ultimo.id === id &&
    (e.actual === null || e.actual.id !== id || e.fase === 'saliendo')
  );
}

const MS_POR_S = 1000;

/** Un token de tiempo en ms, como lo resuelve el navegador; `undefined` si no está. Solo en el navegador. */
export function leerMs(token: string): number | undefined {
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const m = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(v);
  if (m === null) return undefined;
  const n = Number(m[1]);
  return m[2] === 'ms' ? n : n * MS_POR_S;
}
/** `prefers-reduced-motion: reduce`. Solo en el navegador. */
export const reducido = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** [CH-286] Los temporizadores de la ventana, que comparten la etiqueta (C-50) y el aviso momentáneo (C-51). */
export const relojDeVentana: Reloj = {
  poner: (f, ms) => window.setTimeout(f, ms),
  quitar: (i) => {
    window.clearTimeout(i);
  },
};
