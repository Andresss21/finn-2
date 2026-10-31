// Agenda de la medianoche (05 §6.7, V5-10; FE-21). El objetivo es la medianoche de El Salvador que sigue al `hoy` del
// servidor: UTC−6 sin horario de verano (00 P18), o sea 06:00 UTC del día siguiente, más 5 s para que `finn.hoy()`
// ya devuelva el día nuevo. El reloj del dispositivo solo mide cuánto falta; no decide qué día es.
export const MARGEN_MS = 5000;
const MINUTO_MS = 60_000;
/** Un temporizador de JavaScript no admite más que un entero de 32 bits con signo. */
const TOPE_TEMPORIZADOR_MS = 2 ** 31 - 1;
const HORAS_DE_DESFASE_SV = 6;

/** `hoy` es una `FechaLocal` («AAAA-MM-DD»). */
export function objetivoMedianoche(hoy: string): number {
  const [anio, mes, dia] = hoy.split('-').map(Number);
  return Date.UTC(anio ?? 0, (mes ?? 1) - 1, (dia ?? 1) + 1, HORAS_DE_DESFASE_SV, 0, 0) + MARGEN_MS;
}

export interface AgendaMedianoche {
  /** Cada `Encabezado` nuevo reprograma la agenda (6.7, paso 5). */
  programar(hoy: string): void;
  /** Con la pestaña oculta los temporizadores se retrasan: al volver se comprueba si ya pasó el objetivo (paso 4). */
  alVolverVisible(): void;
  cancelar(): void;
}

export function crearAgendaMedianoche(refrescar: () => void): AgendaMedianoche {
  let temporizador: ReturnType<typeof setTimeout> | null = null;
  let hoyActual: string | null = null;
  let refrescadoPara: string | null = null;
  let reintentando = false;

  const limpiar = (): void => {
    if (temporizador !== null) clearTimeout(temporizador);
    temporizador = null;
    reintentando = false;
  };

  // Paso 3: una vez por valor de `hoy`; si el día no cambió, se vuelve a intentar al minuto (sin bucle apretado).
  const disparar = (hoy: string): void => {
    refrescadoPara = hoy;
    reintentando = true;
    refrescar();
    temporizador = setTimeout(() => {
      temporizador = null;
      disparar(hoy);
    }, MINUTO_MS);
  };

  const programar = (hoy: string): void => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hoy)) return; // sin un `hoy` válido no hay medianoche que agendar
    if (reintentando && hoy === hoyActual) return; // ya hay un reintento en curso para este `hoy`
    limpiar();
    hoyActual = hoy;
    const espera = objetivoMedianoche(hoy) - Date.now();
    if (espera > TOPE_TEMPORIZADOR_MS) {
      temporizador = setTimeout(() => {
        programar(hoy);
      }, TOPE_TEMPORIZADOR_MS);
    } else if (espera > 0) {
      temporizador = setTimeout(() => {
        disparar(hoy);
      }, espera);
    } else if (refrescadoPara !== hoy) {
      disparar(hoy);
    } else {
      reintentando = true;
      temporizador = setTimeout(() => {
        disparar(hoy);
      }, MINUTO_MS);
    }
  };

  return {
    programar,
    alVolverVisible() {
      if (hoyActual === null || reintentando) return;
      if (Date.now() >= objetivoMedianoche(hoyActual)) programar(hoyActual);
    },
    cancelar() {
      limpiar();
      hoyActual = null;
    },
  };
}
