// Indicador de estado financiero con triple señal: color, forma (glifo) y nombre (05 §10.3, FE-41, PF-2).
import { Icono } from '../base/icono';

export type EstadoFinanciero =
  'positivo' | 'cero' | 'problema' | 'advertencia' | 'deuda' | 'deuda-sin-respaldo' | 'informacion';

// Clases literales por estado: Tailwind solo genera las que encuentra escritas (L13).
export const COLOR_TEXTO: Readonly<Record<EstadoFinanciero, string>> = {
  positivo: 'text-positivo-texto',
  cero: 'text-cero-texto',
  problema: 'text-problema-texto',
  advertencia: 'text-advertencia-texto',
  deuda: 'text-deuda-texto',
  'deuda-sin-respaldo': 'text-deuda-sin-respaldo-texto',
  informacion: 'text-informacion-texto',
};

const COLOR_PASTILLA: Readonly<Record<EstadoFinanciero, string>> = {
  positivo: 'bg-positivo-fondo border-positivo-borde text-positivo-texto',
  cero: 'bg-cero-fondo border-cero-borde text-cero-texto',
  problema: 'bg-problema-fondo border-problema-borde text-problema-texto',
  advertencia: 'bg-advertencia-fondo border-advertencia-borde text-advertencia-texto',
  deuda: 'bg-deuda-fondo border-deuda-borde text-deuda-texto',
  'deuda-sin-respaldo':
    'bg-deuda-sin-respaldo-fondo border-deuda-sin-respaldo-borde text-deuda-sin-respaldo-texto',
  informacion: 'bg-informacion-fondo border-informacion-borde text-informacion-texto',
};

interface PropsIndicadorEstado {
  readonly estado: EstadoFinanciero;
  /** El nombre del estado (textos/estados, §12). */
  readonly etiqueta: string;
  /** Con `false` el nombre queda solo para lectores de pantalla y el glifo lleva la señal visible. */
  readonly visible?: boolean;
}

export function IndicadorEstado({ estado, etiqueta, visible = true }: PropsIndicadorEstado) {
  return (
    <span
      data-estado={estado}
      className={[
        'inline-flex items-center gap-1.5 rounded-pastilla border px-2 py-0.5 text-etiqueta',
        COLOR_PASTILLA[estado],
      ].join(' ')}
    >
      <Icono nombre={estado} tamano={16} />
      <span className={visible ? '' : 'sr-only'}>{etiqueta}</span>
    </span>
  );
}
