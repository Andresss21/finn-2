// Prototipo de IndicadorEstado (05 §10.3): color + forma + nombre accesible. Clases literales: Tailwind solo genera las que ve escritas.
export type EstadoFinanciero = 'positivo' | 'cero' | 'advertencia' | 'problema' | 'deuda' | 'deuda-sin-respaldo' | 'informacion';
const CLASES: Record<EstadoFinanciero, string> = {
  positivo: 'text-positivo-texto bg-positivo-fondo border-positivo-borde',
  cero: 'text-cero-texto bg-cero-fondo border-cero-borde',
  advertencia: 'text-advertencia-texto bg-advertencia-fondo border-advertencia-borde',
  problema: 'text-problema-texto bg-problema-fondo border-problema-borde',
  deuda: 'text-deuda-texto bg-deuda-fondo border-deuda-borde',
  'deuda-sin-respaldo': 'text-deuda-sin-respaldo-texto bg-deuda-sin-respaldo-fondo border-deuda-sin-respaldo-borde',
  informacion: 'text-informacion-texto bg-informacion-fondo border-informacion-borde',
};
const FORMA: Record<EstadoFinanciero, string> = {   // provisional: el diseño elige los glifos
  positivo: 'M8 2 L14 14 L2 14 Z', cero: 'M3 7 H13 V9 H3 Z', advertencia: 'M8 1 L15 15 H1 Z M7 6 H9 V10 H7 Z',
  problema: 'M2 2 H14 V14 H2 Z', deuda: 'M8 1 A7 7 0 1 1 7.99 1 Z', 'deuda-sin-respaldo': 'M8 1 L15 8 L8 15 L1 8 Z', informacion: 'M7 2 H9 V14 H7 Z',
};
export function IndicadorEstado({ estado, etiqueta, visible = false }: { estado: EstadoFinanciero; etiqueta: string; visible?: boolean }) {
  return (
    <span data-estado={estado} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm ${CLASES[estado]}`}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor"><path d={FORMA[estado]} /></svg>
      <span className={visible ? '' : 'sr-only'}>{etiqueta}</span>
    </span>
  );
}
