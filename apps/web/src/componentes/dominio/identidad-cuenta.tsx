// Identidad por tipo de cuenta (05 §10.8.1; 06-identidad-visual 2.10). Fondo y motivo son decorativos: la información
// va en texto. Una identidad para toda cuenta de efectivo; préstamo con talón; inversión; archivada.
import type { Centavos } from '@finn/dominio/valores';
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
export interface FilaEfectivo extends Base {
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
// Motivos decorativos (aria-hidden): libreta, boleto con línea punteada y barras que suben.
const MOTIVO = {
  efectivo:
    'absolute right-0 inset-y-0 w-[70%] bg-[repeating-linear-gradient(0deg,var(--cuenta-motivo)_0_1px,transparent_1px_14px)] [mask-image:linear-gradient(90deg,transparent,#000)]',
  prestamo: 'absolute right-[103px] inset-y-4 border-l-2 border-dashed border-cuenta-motivo',
  inversion:
    'absolute right-3 bottom-3 h-12 w-24 bg-[repeating-linear-gradient(90deg,var(--cuenta-motivo)_0_10px,transparent_10px_16px)] rounded-control',
  archivada: 'hidden',
} as const;

function Datos({
  nombre,
  detalle,
  children,
}: {
  nombre: string;
  detalle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-auto">
      <p className="text-cuerpo font-bold text-texto">{nombre}</p>
      {detalle === undefined || detalle === '' ? null : (
        <p className="text-cuerpo-pequeno text-texto-secundario">{detalle}</p>
      )}
      {children}
    </div>
  );
}

const Rotulo = ({ children }: { children: React.ReactNode }) => (
  <span className="mr-1 text-rotulo text-texto-secundario">{children}</span>
);

export function IdentidadCuenta(props: PropsIdentidadCuenta) {
  const { tipo } = props;
  let cuerpo: React.ReactNode;
  if (props.tipo === 'efectivo') {
    const f = props.fila;
    const dif = f.ultimaConciliacion?.diferenciaActual ?? 0;
    cuerpo = (
      <Datos
        nombre={f.cuenta.nombre}
        detalle={[
          f.institucion,
          f.ultimos4 === undefined ? undefined : cuentas.tarjeta.ultimos4(f.ultimos4),
        ]
          .filter(Boolean)
          .join(' · ')}
      >
        <p>
          <Rotulo>{t.saldo}</Rotulo>
          <Monto centavos={f.saldo} rol="cifra" />
        </p>
        <p>
          <Rotulo>{t.confirmado}</Rotulo>
          <Monto centavos={f.saldoConfirmado} rol="cuerpo" />
        </p>
        {dif === 0 ? null : <IndicadorEstado estado="advertencia" etiqueta={t.diferencia} />}
      </Datos>
    );
  } else if (props.tipo === 'prestamo') {
    const f = props.fila;
    cuerpo = (
      <Datos nombre={f.cuenta.nombre} detalle={f.contraparte}>
        <p>
          <Rotulo>{t.capitalPendiente}</Rotulo>
          <Monto centavos={f.capitalPendiente} rol="cifra" />
        </p>
        <p data-talon className="mt-2 text-cuerpo-pequeno">
          {f.proximaCuota === undefined ? (
            t.sinModelo
          ) : (
            <>
              <Rotulo>{t.cuota}</Rotulo>
              <span className="font-titulo text-[2.75rem] font-extrabold">
                {f.proximaCuota.numero}
              </span>{' '}
              <span className="font-bold">{formatearFecha(f.proximaCuota.fecha)}</span>{' '}
              <Monto centavos={f.proximaCuota.monto} rol="cuerpo" />
            </>
          )}
        </p>
      </Datos>
    );
  } else if (props.tipo === 'inversion') {
    cuerpo = (
      <Datos nombre={props.fila.cuenta.nombre}>
        <p>
          <Rotulo>{t.valor}</Rotulo>
          <Monto centavos={props.fila.valor} rol="cifra" />
        </p>
      </Datos>
    );
  } else {
    cuerpo = (
      <Datos nombre={props.fila.nombre} detalle={t.archivada}>
        {null}
      </Datos>
    );
  }
  return (
    <article
      data-identidad={tipo}
      className={[
        'relative flex min-h-[10.5rem] flex-col gap-3 overflow-hidden rounded-identidad p-4 text-texto',
        FONDO[tipo],
      ].join(' ')}
    >
      <span aria-hidden="true" className={MOTIVO[tipo]} />
      <span className="relative flex size-9.5 items-center justify-center rounded-xl bg-cuenta-disco">
        <Icono nombre={ICONO[tipo]} tamano={20} />
      </span>
      <div className="relative mt-auto">{cuerpo}</div>
    </article>
  );
}
