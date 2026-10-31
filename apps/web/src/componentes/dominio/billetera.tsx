'use client';
// Tarjeta de crédito (cara) y billetera (05 §10.8; 06-identidad-visual 2.9). Cada cara de atrás es un botón: traerla
// al frente es un toque o la tecla Enter, sin gesto de arrastre. Los puntos básicos del DTO se dibujan tal cual (PF-3).
import { useState } from 'react';
import type { Centavos } from '@finn/dominio/valores';
import { formatearFecha, formatearPorcentaje } from '../../formato';
import { cuentas } from '../../textos/cuentas';
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
}

const t = cuentas.tarjeta;
const PASO = 62; // franja visible de cada cara de atrás (06 2.9)
const ancho = (bp: number) => ({ width: `${bp / 100}%` });

function Cara({ tarjeta }: { readonly tarjeta: TarjetaDto }) {
  const plata = tarjeta.color === 'plata';
  const aFavor = tarjeta.deuda === 0 && tarjeta.saldoAFavor > 0;
  return (
    <span
      data-tarjeta={tarjeta.cuenta.id}
      className={[
        'relative flex h-[206px] flex-col justify-between overflow-hidden rounded-tarjeta px-5 py-4.5 text-left shadow-elevacion-2',
        plata
          ? 'bg-[image:var(--tarjeta-plata)] text-tarjeta-plata-texto'
          : 'bg-[image:var(--tarjeta-oro)] text-tarjeta-oro-texto',
      ].join(' ')}
    >
      <span className="block">
        <span className="block truncate text-titulo-seccion">{tarjeta.cuenta.nombre}</span>
        <span className="block text-rotulo opacity-80">{tarjeta.institucion}</span>
      </span>
      <span className="flex items-end justify-between gap-3">
        <span>
          <span className="block text-rotulo">{aFavor ? t.saldoAFavor : t.deuda}</span>
          <Monto centavos={aFavor ? tarjeta.saldoAFavor : tarjeta.deuda} rol="cifra" />
        </span>
        <span className="text-right">
          {tarjeta.ultimos4 === undefined ? null : (
            <span className="block font-semibold tracking-[.14em]">
              {t.ultimos4(tarjeta.ultimos4)}
            </span>
          )}
          {tarjeta.red === undefined ? null : (
            <span className="block text-rotulo">{t.credito(tarjeta.red)}</span>
          )}
        </span>
      </span>
    </span>
  );
}

function Detalle({ tarjeta }: { readonly tarjeta: TarjetaDto }) {
  const sin = tarjeta.usoSinReservarBp;
  return (
    <div data-detalle-tarjeta className="mt-3.5 flex flex-col gap-3.5 p-4">
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
      {tarjeta.reservaExcedente > 0 ? (
        <IndicadorEstado estado="informacion" etiqueta={cuentas.tarjeta.reservadoDeMas} />
      ) : null}
      {tarjeta.limite > 0 ? (
        <div>
          <p className="text-cuerpo-pequeno text-texto-secundario">
            {t.usoDelLimite} <Monto centavos={tarjeta.limite} rol="cuerpo" />
          </p>
          <div
            role="progressbar"
            aria-label={`${t.usoDelLimite} ${formatearPorcentaje(tarjeta.usoLimite)}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={tarjeta.usoLimite / 100}
            aria-valuetext={formatearPorcentaje(tarjeta.usoLimite)}
            className="relative mt-1 h-2 overflow-hidden rounded-pastilla bg-superficie-hundida"
          >
            <span
              style={ancho(tarjeta.usoLimite)}
              className="absolute inset-y-0 left-0 bg-texto-secundario"
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
      <dl className="grid grid-cols-3 gap-2 text-cuerpo-pequeno">
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

export function BilleteraTarjetas({ tarjetas }: { readonly tarjetas: readonly TarjetaDto[] }) {
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
            className="absolute inset-x-0 z-0 min-h-11 scale-[.94] cursor-pointer rounded-tarjeta saturate-[.85] brightness-[.92] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
          >
            <span className="sr-only">{t.traerAlFrente}. </span>
            <Cara tarjeta={x} />
          </button>
        ))}
        <div className="absolute inset-x-0 z-10" style={{ top: topFrente }}>
          <Cara tarjeta={actual} />
        </div>
      </div>
      {atras.length > 0 ? (
        <p className="mt-2 text-center text-cuerpo-pequeno text-texto-terciario">{t.ayuda}</p>
      ) : null}
      <Detalle tarjeta={actual} />
    </section>
  );
}
