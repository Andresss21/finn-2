// Identidad por tipo de cuenta (05 §10.8.1; 06-identidad-visual 2.10; export K5). Fondo y motivo son decorativos: la
// información va en texto. [CH-224] En efectivo, la identidad sale del subtipo del DTO, nunca del nombre: corriente con
// libreta, ahorro con anillos y billetera con `wallet` sin motivo; préstamo con talón; inversión; archivada. Sin rótulos:
// nombre, banco · últimos dígitos y el saldo.
import type { Centavos } from '@finn/dominio/valores';
import type { CSSProperties, ReactNode } from 'react';
import { formatearFecha } from '../../formato';
import { cuentas } from '../../textos/cuentas';
import { Icono, type NombreIcono } from '../base/icono';
import { IndicadorEstado } from './indicador-estado';
import { Monto } from './monto';

interface Ref {
  readonly id: string;
  readonly nombre: string;
}
interface Base {
  readonly cuenta: Ref;
  readonly institucion?: string;
  readonly ultimos4?: string;
}
export type SubtipoEfectivo = 'corriente' | 'ahorro' | 'billetera';
export interface FilaEfectivo extends Base {
  readonly subtipoEfectivo?: SubtipoEfectivo;
  readonly saldo: Centavos;
  readonly saldoConfirmado: Centavos;
  readonly ultimaConciliacion?: { readonly diferenciaActual: Centavos };
}
export interface FilaPrestamo {
  readonly cuenta: Ref;
  readonly contraparte: string;
  readonly capitalPendiente: Centavos;
  readonly proximaCuota?: {
    readonly fecha: string;
    readonly monto: Centavos;
    readonly numero: number;
  };
}
export interface FilaInversion {
  readonly cuenta: Ref;
  readonly valor: Centavos;
}
export type PropsIdentidadCuenta =
  | { readonly tipo: 'efectivo'; readonly fila: FilaEfectivo }
  | { readonly tipo: 'prestamo'; readonly fila: FilaPrestamo }
  | { readonly tipo: 'inversion'; readonly fila: FilaInversion }
  | { readonly tipo: 'archivada'; readonly fila: Ref };

const t = cuentas.cuenta;
const BASE = 'relative overflow-hidden rounded-identidad text-texto';
const FONDO = {
  efectivo: 'bg-cuenta-banco',
  prestamo: 'bg-cuenta-prestamo',
  inversion: 'bg-cuenta-inversion',
  archivada: 'bg-superficie-hundida opacity-85',
} as const;
const ICONO: Readonly<Record<PropsIdentidadCuenta['tipo'], NombreIcono>> = {
  efectivo: 'bank',
  prestamo: 'ticket',
  inversion: 'trend',
  archivada: 'lock',
};
// Motivo decorativo de la cuenta de efectivo: líneas de libreta (1 px cada 14) en el 70 % derecho, desvanecidas.
const LIBRETA: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(180deg, transparent 0 13px, var(--cuenta-motivo) 13px 14px)',
  maskImage: 'linear-gradient(to left, var(--decorativo-mascara) 30%, transparent)',
};
// Motivo de la cuenta de ahorro: anillos concéntricos cada 11 px en un círculo de 150 px que sale por la esquina.
const ANILLOS: CSSProperties = {
  backgroundImage:
    'repeating-radial-gradient(circle, transparent 0 9px, var(--cuenta-motivo) 9px 11px)',
};

/** [CH-224] Fondo, ícono y motivo de una cuenta de efectivo según su subtipo (06-identidad-visual 2.10). */
export function identidadEfectivo(subtipo: SubtipoEfectivo = 'corriente'): {
  readonly fondo: string;
  readonly icono: NombreIcono;
  readonly motivo: ReactNode;
} {
  if (subtipo === 'ahorro')
    return {
      fondo: 'bg-cuenta-ahorro',
      icono: 'coins',
      motivo: (
        <span
          aria-hidden="true"
          data-motivo="anillos"
          style={ANILLOS}
          className="absolute -top-10 -right-10 size-[150px] rounded-full"
        />
      ),
    };
  if (subtipo === 'billetera') return { fondo: 'bg-cuenta-banco', icono: 'wallet', motivo: null };
  return {
    fondo: 'bg-cuenta-banco',
    icono: 'bank',
    motivo: (
      <span
        aria-hidden="true"
        data-motivo="libreta"
        style={LIBRETA}
        className="absolute inset-y-0 right-0 w-[70%]"
      />
    ),
  };
}

const BARRAS = [
  [0, 46, 14],
  [22, 36, 24],
  [44, 40, 20],
  [66, 24, 36],
  [88, 12, 48],
  [110, 0, 60],
] as const;

const Disco = ({ tipo, icono }: { tipo: PropsIdentidadCuenta['tipo']; icono?: NombreIcono }) => (
  <span className="relative flex size-9.5 flex-none items-center justify-center rounded-xl bg-cuenta-disco">
    <Icono nombre={icono ?? ICONO[tipo]} tamano={20} />
  </span>
);

function Datos({
  nombre,
  detalle,
  clase = '',
  children,
}: {
  nombre: string;
  detalle?: string;
  clase?: string;
  children?: ReactNode;
}) {
  return (
    <div className={['relative flex flex-col gap-0.5', clase].join(' ')}>
      <p className="text-cuerpo font-bold">{nombre}</p>
      {detalle === undefined || detalle === '' ? null : (
        <p className="text-cuerpo-pequeno text-texto-secundario">{detalle}</p>
      )}
      {children}
    </div>
  );
}

export function IdentidadCuenta(props: PropsIdentidadCuenta) {
  const { tipo } = props;
  if (props.tipo === 'efectivo') {
    const f = props.fila;
    const dif = f.ultimaConciliacion?.diferenciaActual ?? 0;
    const id = identidadEfectivo(f.subtipoEfectivo);
    return (
      <article
        data-identidad={tipo}
        data-subtipo={f.subtipoEfectivo ?? 'corriente'}
        className={[BASE, id.fondo, 'flex min-h-42 flex-col gap-3 p-4'].join(' ')}
      >
        {id.motivo}
        <Disco tipo={tipo} icono={id.icono} />
        <Datos
          clase="mt-auto"
          nombre={f.cuenta.nombre}
          detalle={[
            f.institucion,
            f.ultimos4 === undefined ? undefined : cuentas.tarjeta.ultimos4(f.ultimos4),
          ]
            .filter(Boolean)
            .join(' · ')}
        >
          <Monto centavos={f.saldo} rol="cifra" />
          <p className="text-cuerpo-pequeno text-texto-secundario">
            {t.confirmado} <Monto centavos={f.saldoConfirmado} rol="cuerpo" />
          </p>
          {dif === 0 ? null : <IndicadorEstado estado="advertencia" etiqueta={t.diferencia} />}
        </Datos>
      </article>
    );
  }
  if (props.tipo === 'prestamo') {
    const f = props.fila;
    return (
      <article
        data-identidad={tipo}
        className={[BASE, FONDO[tipo], 'grid grid-cols-[1fr_103px]'].join(' ')}
      >
        <span
          aria-hidden="true"
          className="absolute -top-[11px] right-[92px] size-[22px] rounded-full bg-fondo"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-[11px] right-[92px] size-[22px] rounded-full bg-fondo"
        />
        <div className="relative flex flex-col gap-3 p-4">
          <Disco tipo={tipo} />
          <Datos
            nombre={f.cuenta.nombre}
            detalle={`${f.contraparte} · ${t.capitalPendiente.toLowerCase()}`}
          >
            <Monto centavos={f.capitalPendiente} rol="cifra" />
          </Datos>
        </div>
        <div
          data-talon
          className="relative flex flex-col items-center justify-center gap-0.5 border-l-2 border-dashed border-texto/20 px-2 py-4 text-center"
        >
          {f.proximaCuota === undefined ? (
            <span className="text-cuerpo-pequeno text-texto-secundario">{t.sinModelo}</span>
          ) : (
            <>
              <span className="text-rotulo text-texto-secundario">{t.cuota}</span>
              <span className="font-titulo text-[2.75rem] leading-none font-extrabold">
                {f.proximaCuota.numero}
              </span>
              <span className="text-cuerpo-pequeno font-bold">
                {formatearFecha(f.proximaCuota.fecha)}
              </span>
              <span className="text-cuerpo-pequeno text-texto-secundario">
                <Monto centavos={f.proximaCuota.monto} rol="cuerpo" />
              </span>
            </>
          )}
        </div>
      </article>
    );
  }
  if (props.tipo === 'inversion') {
    return (
      <article
        data-identidad={tipo}
        className={[BASE, FONDO[tipo], 'flex items-center gap-3.5 px-4 py-4.5'].join(' ')}
      >
        <svg aria-hidden="true" width="128" height="60" className="absolute right-3.5 bottom-3.5">
          {BARRAS.map(([x, y, alto]) => (
            <rect key={x} x={x} y={y} width="16" height={alto} rx="4" fill="var(--cuenta-motivo)" />
          ))}
        </svg>
        <Disco tipo={tipo} />
        <Datos clase="flex-1" nombre={props.fila.cuenta.nombre}>
          <Monto centavos={props.fila.valor} rol="cifra" />
        </Datos>
      </article>
    );
  }
  return (
    <article
      data-identidad={tipo}
      className={[BASE, FONDO[tipo], 'flex items-center gap-3.5 p-4'].join(' ')}
    >
      <Disco tipo={tipo} />
      <Datos clase="flex-1" nombre={props.fila.nombre} detalle={t.archivada} />
    </article>
  );
}
