// Cara de la tarjeta de crédito (05 §10.8; 06-identidad-visual 2.9; export K3). Módulo aparte para que el formulario de crear
// la cuenta dibuje la vista previa sin traer la billetera entera (presupuesto de bytes, PRU-REN-PWA-002). Decorativa: el color
// sale del `color` guardado (CH-225), nunca del orden.
import type { Centavos } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { caraTarjeta as t } from '../../textos/cara-tarjeta';
import { nombreDeColor } from './colores-tarjeta';

// Guilloché y chip del export: decorativos, con sus valores en `tokens-decorativos.css` (C-18).
const GUILLOCHE = 'var(--decorativo-guilloche-tarjeta)';
const CHIP = {
  oro: 'var(--decorativo-chip-oro)',
  plata: 'var(--decorativo-chip-plata)',
} as const;
/** Lo que dibuja la cara; el detalle de cuenta (FT-52) la usa sin el resto del DTO de la lista. */
export interface DatosCara {
  readonly cuenta: { readonly id: string; readonly nombre: string };
  readonly institucion?: string;
  readonly ultimos4?: string;
  readonly red?: string;
  readonly color?: string;
  readonly deuda: Centavos;
  readonly saldoAFavor: Centavos;
}

/**
 * `saldo` es el rótulo y la cifra que dibuja quien la usa (con `Monto`): la vista previa de crear la tarjeta no tiene saldo y no trae
 * `Monto` ni sus íconos al paquete de la ruta.
 */
export function Cara({
  tarjeta,
  saldo,
}: {
  readonly tarjeta: DatosCara;
  readonly saldo?: ReactNode;
}) {
  const nombre = nombreDeColor(tarjeta.color); // por el color guardado, no por el orden (CH-225 d)
  return (
    <span
      data-tarjeta={tarjeta.cuenta.id}
      data-color={nombre}
      style={{
        backgroundImage: `${GUILLOCHE}, var(--tarjeta-${nombre})`,
        color: `var(--tarjeta-${nombre}-texto)`,
      }}
      className="relative flex h-[206px] flex-col overflow-hidden rounded-tarjeta px-5 py-4.5 text-left shadow-elevacion-2"
    >
      <span
        aria-hidden="true"
        className="absolute -inset-y-[30%] left-0 w-[70px] animate-[finn-brillo_var(--duracion-ambiental)_linear_infinite] bg-linear-to-r from-transparent via-white/15 to-transparent"
      />
      <span className="relative flex items-baseline justify-between gap-2.5">
        <span className="min-w-0 truncate text-titulo-seccion">{tarjeta.cuenta.nombre}</span>
        <span className="flex-none text-rotulo whitespace-nowrap opacity-80">
          {tarjeta.institucion}
        </span>
      </span>
      <span className="relative mt-5 flex items-center gap-3">
        <span
          aria-hidden="true"
          data-chip
          style={{
            backgroundImage: CHIP[nombre === 'oro' ? 'oro' : 'plata'],
            borderRadius: 7,
            boxShadow: 'var(--decorativo-chip-sombra)',
          }}
          className="relative h-[30px] w-10"
        >
          <span className="absolute inset-x-0 top-1/2 h-px bg-black/25" />
          <span className="absolute inset-y-0 left-1/2 w-px bg-black/25" />
          <span
            style={{ borderRadius: 3 }}
            className="absolute inset-x-3 inset-y-2 border border-black/25"
          />
        </span>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
          className="opacity-80"
        >
          <path d="M8.5 8.5a5 5 0 0 1 0 7" />
          <path d="M12 6a8.5 8.5 0 0 1 0 12" />
          <path d="M15.5 3.5a12 12 0 0 1 0 17" />
        </svg>
      </span>
      <span className="relative mt-auto flex items-end justify-between gap-2.5">
        <span>{saldo}</span>
        <span className="text-right">
          {tarjeta.ultimos4 === undefined ? null : (
            <span className="block font-semibold tracking-[.14em]">
              {t.ultimos4(tarjeta.ultimos4)}
            </span>
          )}
          {tarjeta.red === undefined ? null : (
            <span className="block text-rotulo opacity-75">{t.credito(tarjeta.red)}</span>
          )}
        </span>
      </span>
    </span>
  );
}
