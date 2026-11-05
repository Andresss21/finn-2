'use client';
// Tarjeta de crédito (cara) y billetera (05 §10.8; 06-identidad-visual 2.9; export K3 y K5). Cada cara de atrás es un botón:
// traerla al frente es un toque o la tecla Enter, sin gesto de arrastre. Los puntos básicos del DTO se dibujan tal cual (PF-3).
import { useState } from 'react';
import type { Centavos } from '@finn/dominio/valores';
import { formatearFecha, formatearPorcentaje } from '../../formato';
import { cuentas } from '../../textos/cuentas';
import { EnlaceFinn } from '../navegacion/enlace-finn';
import { IndicadorEstado } from './indicador-estado';
import { Monto } from './monto';

export interface TarjetaDto {
  readonly cuenta: { readonly id: string; readonly nombre: string };
  readonly institucion?: string;
  readonly ultimos4?: string;
  readonly red?: string;
  readonly color?: string;
  readonly deuda: Centavos;
  readonly saldoAFavor: Centavos;
  readonly limite: Centavos;
  readonly usoLimite: number;
  readonly faltaReservar: Centavos;
  readonly reservaExcedente: Centavos;
  readonly proximoCorte: string;
  readonly proximoPago: string;
  readonly paraNoGenerarIntereses: Centavos;
  readonly usoSinReservarBp: number | null;
  readonly saldoConfirmado?: Centavos;
}

const t = cuentas.tarjeta;
const PASO = 62; // franja visible de cada cara de atrás (06 2.9)
const ancho = (bp: number) => ({ width: `${bp / 100}%` });
// Guilloché y chip del export: decorativos.
const GUILLOCHE =
  'repeating-radial-gradient(circle at 115% -25%, transparent 0 11px, rgba(255,255,255,.07) 11px 12px)';
const CHIP = {
  oro: 'linear-gradient(135deg, #F3E3B5, #B8975A)',
  plata: 'linear-gradient(135deg, #EEF1F4, #9AA3AE)',
} as const;
const ATRAS =
  'absolute inset-x-0 z-0 min-h-11 scale-[.94] cursor-pointer rounded-tarjeta saturate-[.85] brightness-[.92]';
const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

/** Lo que dibuja la cara; el detalle de cuenta (FT-52) la usa sin el resto del DTO de la lista. */
export type DatosCara = Pick<
  TarjetaDto,
  'cuenta' | 'institucion' | 'ultimos4' | 'red' | 'color' | 'deuda' | 'saldoAFavor'
>;

export function Cara({ tarjeta }: { readonly tarjeta: DatosCara }) {
  const plata = tarjeta.color === 'plata';
  const aFavor = tarjeta.deuda === 0 && tarjeta.saldoAFavor > 0;
  return (
    <span
      data-tarjeta={tarjeta.cuenta.id}
      style={{
        backgroundImage: `${GUILLOCHE}, var(${plata ? '--tarjeta-plata' : '--tarjeta-oro'})`,
      }}
      className={[
        'relative flex h-[206px] flex-col overflow-hidden rounded-tarjeta px-5 py-4.5 text-left shadow-elevacion-2',
        plata ? 'text-tarjeta-plata-texto' : 'text-tarjeta-oro-texto',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="absolute -inset-y-[30%] left-0 w-[70px] animate-[finn-brillo_8s_linear_infinite] bg-linear-to-r from-transparent via-white/15 to-transparent"
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
            backgroundImage: CHIP[plata ? 'plata' : 'oro'],
            borderRadius: 7,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.18)',
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
        <span>
          <span className="block text-rotulo opacity-75">{aFavor ? t.saldoAFavor : t.deuda}</span>
          <Monto centavos={aFavor ? tarjeta.saldoAFavor : tarjeta.deuda} rol="cifra" />
        </span>
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

function Detalle({ tarjeta }: { readonly tarjeta: TarjetaDto }) {
  const sin = tarjeta.usoSinReservarBp;
  return (
    <div
      data-detalle-tarjeta
      className="mt-3.5 flex flex-col gap-3.5 rounded-contenedor bg-superficie p-4 shadow-elevacion-1"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {tarjeta.faltaReservar > 0 ? (
          <p className="flex flex-wrap items-center gap-2">
            <IndicadorEstado estado="deuda-sin-respaldo" etiqueta={t.teFaltaReservar} />
            <Monto centavos={tarjeta.faltaReservar} estado="deuda-sin-respaldo" rol="cifra" />
          </p>
        ) : tarjeta.saldoAFavor > 0 ? (
          <IndicadorEstado estado="positivo" etiqueta={t.saldoAFavor} />
        ) : tarjeta.deuda > 0 ? (
          <IndicadorEstado estado="deuda" etiqueta={t.deudaDeTarjeta} />
        ) : (
          <IndicadorEstado estado="cero" etiqueta={t.sinDeuda} />
        )}
        {tarjeta.saldoConfirmado === undefined ? null : (
          <p className="text-cuerpo-pequeno text-texto-secundario">
            {cuentas.cuenta.confirmado} <Monto centavos={tarjeta.saldoConfirmado} rol="cuerpo" />
          </p>
        )}
      </div>
      {tarjeta.reservaExcedente > 0 ? (
        <IndicadorEstado estado="informacion" etiqueta={cuentas.tarjeta.reservadoDeMas} />
      ) : null}
      {tarjeta.limite > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="flex justify-between gap-2 text-cuerpo-pequeno">
            <span className="text-texto-secundario">
              {t.usoDelLimite} <Monto centavos={tarjeta.limite} rol="cuerpo" />
            </span>
            <span className="font-semibold tabular-nums">
              {formatearPorcentaje(tarjeta.usoLimite)}
            </span>
          </p>
          <div
            role="progressbar"
            aria-label={`${t.usoDelLimite} ${formatearPorcentaje(tarjeta.usoLimite)}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={tarjeta.usoLimite / 100}
            aria-valuetext={formatearPorcentaje(tarjeta.usoLimite)}
            style={{ borderRadius: 2, boxShadow: 'inset 0 0 0 1px var(--borde-sutil)' }}
            className="relative h-2 overflow-hidden bg-superficie-hundida"
          >
            <span
              style={ancho(tarjeta.usoLimite)}
              className="absolute inset-y-0 left-0 bg-accion"
            />
            {sin === null || sin <= 0 ? null : (
              <span
                data-segmento="sin-reservar"
                style={ancho(sin)}
                className="absolute inset-y-0 left-0 bg-[image:var(--patron-sin-reservar)]"
              />
            )}
          </div>
        </div>
      ) : null}
      <dl className="grid grid-cols-3 gap-2.5 text-cuerpo-pequeno">
        <div>
          <dt className="text-rotulo text-texto-secundario">{t.corte}</dt>
          <dd className="font-bold">{formatearFecha(tarjeta.proximoCorte)}</dd>
        </div>
        <div>
          <dt className="text-rotulo text-texto-secundario">{t.pago}</dt>
          <dd className="font-bold">{formatearFecha(tarjeta.proximoPago)}</dd>
        </div>
        <div>
          <dt className="text-rotulo text-texto-secundario">{t.sinIntereses}</dt>
          <dd className="font-bold">
            <Monto centavos={tarjeta.paraNoGenerarIntereses} rol="cuerpo" />
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Con `enlazar`, la cara del frente lleva al detalle de la cuenta: la tarjeta entera enlaza, sin enlaces aparte. */
export function BilleteraTarjetas({
  tarjetas,
  enlazar = false,
}: {
  readonly tarjetas: readonly TarjetaDto[];
  readonly enlazar?: boolean;
}) {
  const [frente, setFrente] = useState(0);
  if (tarjetas.length === 0) return null;
  const actual = tarjetas[Math.min(frente, tarjetas.length - 1)] as TarjetaDto;
  const atras = tarjetas.filter((x) => x !== actual);
  const topFrente = atras.length * PASO;
  return (
    <section data-billetera>
      <div className="relative" style={{ height: topFrente + 206 }}>
        {atras.map((x, i) => (
          <button
            key={x.cuenta.id}
            type="button"
            onClick={() => {
              setFrente(tarjetas.indexOf(x));
            }}
            style={{ top: i * PASO }}
            className={[ATRAS, FOCO].join(' ')}
          >
            <span className="sr-only">{t.traerAlFrente}. </span>
            <Cara tarjeta={x} />
          </button>
        ))}
        <div className="absolute inset-x-0 z-10" style={{ top: topFrente }}>
          {enlazar ? (
            <EnlaceFinn
              href={`/cuentas/${actual.cuenta.id}`}
              aria-label={cuentas.pantalla.verDetalle(actual.cuenta.nombre)}
              className={['block rounded-tarjeta', FOCO].join(' ')}
            >
              <Cara tarjeta={actual} />
            </EnlaceFinn>
          ) : (
            <Cara tarjeta={actual} />
          )}
        </div>
      </div>
      {atras.length > 0 ? (
        <p className="mt-2 text-center text-cuerpo-pequeno text-texto-terciario">{t.ayuda}</p>
      ) : null}
      <Detalle tarjeta={actual} />
    </section>
  );
}
