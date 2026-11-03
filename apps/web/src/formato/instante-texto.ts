// Instantes ISO UTC en la hora de El Salvador (05 §5.4).

// [CH-87] Se crea al primer uso: sin efectos al cargar (ver monto.ts).
let instanteLocal: Intl.DateTimeFormat | undefined;
const formatoInstante = (): Intl.DateTimeFormat =>
  (instanteLocal ??= new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }));

/** Instante ISO UTC → `05/10/2026 14:32` en America/El_Salvador. ICU pone una coma: se arma con `formatToParts`. */
export function formatearInstante(iso: string): string {
  const p = Object.fromEntries(
    formatoInstante()
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p['day']}/${p['month']}/${p['year']} ${p['hour']}:${p['minute']}`;
}
