// Aviso en línea (06-identidad-visual 2.14, 05 §10.7): tres señales por estado, color, glifo y texto (nunca solo color).
import type { ReactNode } from 'react';
import { cn } from '../../components/ui/utils';
import { base } from '../../textos/base';
import { Icono } from './icono';

export type EstadoFinanciero =
  'positivo' | 'cero' | 'advertencia' | 'problema' | 'deuda' | 'deuda-sin-respaldo' | 'informacion';

// Clases completas (no armadas con plantillas) para que Tailwind las encuentre.
const CLASES: Record<EstadoFinanciero, { caja: string; texto: string }> = {
  positivo: { caja: 'bg-positivo-fondo', texto: 'text-positivo-texto' },
  cero: { caja: 'bg-cero-fondo', texto: 'text-cero-texto' },
  advertencia: { caja: 'bg-advertencia-fondo', texto: 'text-advertencia-texto' },
  problema: { caja: 'bg-problema-fondo', texto: 'text-problema-texto' },
  deuda: { caja: 'bg-deuda-fondo', texto: 'text-deuda-texto' },
  'deuda-sin-respaldo': {
    caja: 'bg-deuda-sin-respaldo-fondo',
    texto: 'text-deuda-sin-respaldo-texto',
  },
  informacion: { caja: 'bg-informacion-fondo', texto: 'text-informacion-texto' },
};

export interface PropsAvisoEnLinea {
  readonly estado: EstadoFinanciero;
  readonly titulo?: string;
  readonly children: ReactNode;
  readonly accion?: ReactNode;
  /** `true` si aparece después de cargar la pantalla: lleva `role="status"`; si viene con ella, no lleva rol. */
  readonly aparecioDespues?: boolean;
}

export function AvisoEnLinea({
  estado,
  titulo,
  children,
  accion,
  aparecioDespues = false,
}: PropsAvisoEnLinea) {
  const clases = CLASES[estado];
  return (
    <div
      {...(aparecioDespues ? { role: 'status' } : {})}
      data-estado={estado}
      className={cn('flex items-start gap-3 rounded-contenedor px-3.5 py-3', clases.caja)}
    >
      <span className={cn('mt-0.5 shrink-0', clases.texto)}>
        <Icono nombre={estado} etiqueta={base.estados[estado]} />
      </span>
      <div className="min-w-0 flex-1">
        {titulo === undefined ? null : (
          <p className={cn('text-etiqueta font-bold', clases.texto)}>{titulo}</p>
        )}
        <div className="text-cuerpo-pequeno text-texto">{children}</div>
        {accion === undefined ? null : (
          <div className={cn('mt-1 font-bold underline', clases.texto)}>{accion}</div>
        )}
      </div>
    </div>
  );
}
