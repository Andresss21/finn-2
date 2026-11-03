// Fechas `AAAA-MM-DD` en números (05 §5.4). Reordena el texto; sin `Date` ni `Intl`.

export interface Periodo {
  readonly inicio: string;
  readonly fin: string;
}

/** `AAAA-MM-DD` → `05/10/2026`. */
export function formatearFecha(f: string): string {
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}`;
}

/** `21/09/2026 – 20/10/2026`. */
export function formatearPeriodo(p: Periodo): string {
  return `${formatearFecha(p.inicio)} – ${formatearFecha(p.fin)}`;
}
