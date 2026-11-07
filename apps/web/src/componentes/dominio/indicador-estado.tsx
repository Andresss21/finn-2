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

// Círculo de 20 px con el fondo del estado; el glifo lleva el color de texto del estado (A.6 §2.4, sin cajita).
export const COLOR_CIRCULO: Readonly<Record<EstadoFinanciero, string>> = {
  positivo: 'bg-positivo-fondo text-positivo-texto',
  cero: 'bg-cero-fondo text-cero-texto',
  problema: 'bg-problema-fondo text-problema-texto',
  advertencia: 'bg-advertencia-fondo text-advertencia-texto',
  deuda: 'bg-deuda-fondo text-deuda-texto',
  'deuda-sin-respaldo': 'bg-deuda-sin-respaldo-fondo text-deuda-sin-respaldo-texto',
  informacion: 'bg-informacion-fondo text-informacion-texto',
};

interface PropsIndicadorEstado {
  readonly estado: EstadoFinanciero;
  /** El nombre del estado (textos/estados, §12). */
  readonly etiqueta: string;
  /** Con `false` el nombre queda solo para lectores de pantalla y el glifo lleva la señal visible. */
  readonly visible?: boolean;
  /** Sobre el grafito del billete la etiqueta va en `texto-sobre-marca`; el círculo conserva el color del estado. */
  readonly sobreMarca?: boolean;
}

export function IndicadorEstado({
  estado,
  etiqueta,
  visible = true,
  sobreMarca = false,
}: PropsIndicadorEstado) {
  return (
    <span
      data-estado={estado}
      className={[
        'inline-flex items-center gap-2 whitespace-nowrap text-etiqueta font-semibold',
        sobreMarca ? 'text-texto-sobre-marca' : COLOR_TEXTO[estado],
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'inline-flex size-5 flex-none items-center justify-center rounded-full',
          COLOR_CIRCULO[estado],
        ].join(' ')}
      >
        <Icono nombre={estado} tamano={13} />
      </span>
      <span className={visible ? '' : 'sr-only'}>{etiqueta}</span>
    </span>
  );
}
