// Cabecera del detalle de cuenta (FT-52; export `06-detalle-de-cuenta`): la identidad de la cuenta con su saldo, igual que en la lista
// pero con rótulo. Fondo y motivo son decorativos; la información va en texto. La tarjeta dibuja su cara (K3) y el resto de sus
// datos va en `por-tipo.tsx`. Todo sale del DTO: no calcula nada (PF-3).
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import type { CSSProperties } from 'react';
import { Icono, type NombreIcono } from '../../../../componentes/base/icono';
import { Cara } from '../../../../componentes/dominio/billetera';
import { IndicadorEstado } from '../../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../../componentes/dominio/monto';
import { cuentaDetalle as t } from '../../../../textos/cuenta-detalle';

const FONDO = {
  efectivo: 'bg-cuenta-banco',
  prestamo: 'bg-cuenta-prestamo',
  inversion: 'bg-cuenta-inversion',
  archivada: 'bg-superficie-hundida',
} as const;
const ICONO: Readonly<Record<keyof typeof FONDO, NombreIcono>> = {
  efectivo: 'bank',
  prestamo: 'ticket',
  inversion: 'trend',
  archivada: 'lock',
};
// Líneas de libreta de la cuenta de efectivo: decorativas.
const LIBRETA: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(180deg, transparent 0 13px, var(--cuenta-motivo) 13px 14px)',
  maskImage: 'linear-gradient(to left, #000 30%, transparent)',
};

export function Cabecera({ dto }: { readonly dto: DetalleCuentaDto }) {
  const { cuenta } = dto;
  if (cuenta.tipo === 'tarjeta' && !cuenta.archivada)
    return (
      <div data-identidad="tarjeta">
        <Cara
          tarjeta={{
            cuenta,
            ...(cuenta.institucion === undefined ? {} : { institucion: cuenta.institucion }),
            ...(cuenta.ultimos4 === undefined ? {} : { ultimos4: cuenta.ultimos4 }),
            deuda: dto.tarjeta?.deuda ?? dto.saldo,
            saldoAFavor: dto.tarjeta?.saldoAFavor ?? dto.saldo,
          }}
        />
      </div>
    );
  const clave: keyof typeof FONDO = cuenta.archivada
    ? 'archivada'
    : cuenta.tipo === 'prestamo' || cuenta.tipo === 'inversion'
      ? cuenta.tipo
      : 'efectivo';
  const rotulo =
    clave === 'prestamo'
      ? t.prestamo.capitalPendiente
      : clave === 'inversion'
        ? t.inversion.valor
        : t.saldo;
  const cifra = dto.prestamo?.capitalPendiente ?? dto.inversion?.valor ?? dto.saldo;
  const banco = cuenta.institucion ?? dto.prestamo?.condiciones.contraparte;
  const detalle = [banco, cuenta.ultimos4 === undefined ? undefined : `•••• ${cuenta.ultimos4}`]
    .filter((x) => x !== undefined)
    .join(' · ');
  return (
    <header
      data-identidad={clave}
      className={[
        'relative flex flex-col gap-4 overflow-hidden rounded-identidad p-5 text-texto',
        FONDO[clave],
      ].join(' ')}
    >
      {clave === 'efectivo' ? (
        <span aria-hidden="true" style={LIBRETA} className="absolute inset-y-0 right-0 w-[70%]" />
      ) : null}
      <div className="relative flex items-center gap-3">
        <span className="flex size-9.5 flex-none items-center justify-center rounded-xl bg-cuenta-disco">
          <Icono nombre={ICONO[clave]} tamano={20} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-cuerpo font-bold">{cuenta.nombre}</p>
          {detalle === '' ? null : (
            <p className="text-cuerpo-pequeno text-texto-secundario">{detalle}</p>
          )}
        </div>
        {cuenta.archivada ? (
          <span className="ml-auto">
            <IndicadorEstado estado="cero" etiqueta={t.archivada} />
          </span>
        ) : null}
      </div>
      <dl className="relative flex flex-col gap-0.5">
        <dt className="text-rotulo text-texto-secundario">{rotulo}</dt>
        <dd>
          <Monto centavos={cifra} rol="cifra-principal" />
        </dd>
      </dl>
      {dto.inversion === undefined ? (
        <p className="relative text-cuerpo-pequeno text-texto-secundario">
          {t.saldoConfirmado} <Monto centavos={dto.saldoConfirmado} rol="cuerpo" />
        </p>
      ) : (
        <dl data-bloque="inversion" className="relative grid grid-cols-3 gap-2 text-cuerpo-pequeno">
          {(
            [
              [t.inversion.aportes, dto.inversion.aportes],
              [t.inversion.retiros, dto.inversion.retiros],
              [t.inversion.ajustes, dto.inversion.ajustes],
            ] as const
          ).map(([etiqueta, centavos]) => (
            <div key={etiqueta}>
              <dt className="text-rotulo text-texto-secundario">{etiqueta}</dt>
              <dd className="font-bold">
                <Monto centavos={centavos} rol="cuerpo" />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
