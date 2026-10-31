// Posición neta (05 §10.8.1; 06-identidad-visual 2.11). Las barras dibujan los puntos básicos del DTO (CF-25): la
// mayor al 100 %; las deudas van rayadas para distinguirlas sin color.
import type { Centavos } from '@finn/dominio/valores';
import { glosario } from '../../textos/glosario';
import { cuentas } from '../../textos/cuentas';
import { Monto } from './monto';

export interface PosicionNetaDto {
  readonly activos: {
    readonly efectivo: Centavos;
    readonly saldosAFavor: Centavos;
    readonly inversiones: Centavos;
    readonly porCobrar: Centavos;
    readonly total: Centavos;
  };
  readonly deudas: {
    readonly tarjetas: Centavos;
    readonly prestamos: Centavos;
    readonly total: Centavos;
  };
  readonly neto: Centavos;
  readonly barras: { readonly activosBp: number; readonly deudasBp: number };
}

const t = cuentas.posicion;
const RAYADO =
  'bg-[repeating-linear-gradient(135deg,var(--texto-secundario)_0_3px,transparent_3px_6px)]';

function Fila({
  nombre,
  total,
  bp,
  relleno,
  desglose,
}: {
  nombre: string;
  total: Centavos;
  bp: number;
  relleno: string;
  desglose: readonly (readonly [string, Centavos])[];
}) {
  return (
    <div data-fila-posicion={nombre}>
      <p className="flex items-baseline justify-between">
        <span className="text-etiqueta font-bold">{nombre}</span>
        <Monto centavos={total} rol="cuerpo" />
      </p>
      <div aria-hidden="true" className="my-1 h-2.5 rounded-pastilla bg-superficie-hundida">
        <div
          data-barra-bp={bp}
          style={{ width: `${bp / 100}%` }}
          className={['h-full rounded-pastilla', relleno].join(' ')}
        />
      </div>
      <p className="flex flex-wrap gap-x-3 text-cuerpo-pequeno text-texto-secundario">
        {desglose.map(([rotulo, monto]) => (
          <span key={rotulo}>
            {rotulo} <Monto centavos={monto} rol="cuerpo" />
          </span>
        ))}
      </p>
    </div>
  );
}

export function PosicionNeta({ posicion }: { readonly posicion: PosicionNetaDto }) {
  const { activos, deudas, barras } = posicion;
  return (
    <section
      data-posicion-neta
      className="flex flex-col gap-4 rounded-contenedor bg-superficie p-4.5"
    >
      <div>
        <p className="text-rotulo text-texto-secundario">{glosario.posicionNeta}</p>
        <Monto centavos={posicion.neto} rol="cifra-principal" />
      </div>
      <Fila
        nombre={t.activos}
        total={activos.total}
        bp={barras.activosBp}
        relleno="bg-grafico-tinta"
        desglose={[
          [t.efectivo, activos.efectivo],
          [t.saldosAFavor, activos.saldosAFavor],
          [t.inversiones, activos.inversiones],
          [t.porCobrar, activos.porCobrar],
        ]}
      />
      <Fila
        nombre={t.deudas}
        total={deudas.total}
        bp={barras.deudasBp}
        relleno={RAYADO}
        desglose={[
          [t.tarjetas, deudas.tarjetas],
          [t.prestamos, deudas.prestamos],
        ]}
      />
    </section>
  );
}
