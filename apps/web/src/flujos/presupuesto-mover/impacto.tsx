// El impacto de Mover dinero (D-6, CA-11.2; E4-1, E4-25): el aviso de advertencia con el negativo que va a quedar y la K4 con los
// dos Disponibles «antes → después». Todo viene de la previsualización de OP-15 [CH-246]; no suma ni resta (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { formatearMonto, MENOS } from '../../formato/monto';
import { presupuestoMover as t } from '../../textos/presupuesto-mover';
import { FilaAntesDespues, TarjetaImpacto } from '../presupuesto-impacto-k4';

export interface PropsImpactoMover {
  readonly origen: { readonly id: string; readonly nombre: string };
  readonly destino: { readonly id: string; readonly nombre: string };
  readonly deltas: readonly {
    readonly categoriaId: string;
    readonly antes: Centavos;
    readonly despues: Centavos;
  }[];
  /** «El impacto cambió» (05 §4.4 paso 2). */
  readonly impactoCambio?: boolean;
}

export function ImpactoMover({
  origen,
  destino,
  deltas,
  impactoCambio = false,
}: PropsImpactoMover) {
  const filas = [origen, destino].flatMap((k) => {
    const d = deltas.find((x) => x.categoriaId === k.id);
    return d === undefined ? [] : [{ ...k, antes: d.antes, despues: d.despues }];
  });
  if (filas.length === 0) return null;
  const sobregirada = filas.find((f) => f.id === origen.id && f.despues < 0);
  return (
    <div className="flex flex-col gap-3">
      {sobregirada === undefined ? null : (
        <AvisoEnLinea
          estado="advertencia"
          aparecioDespues
          titulo={t.vaAQuedar(sobregirada.nombre, formatearMonto(sobregirada.despues))}
        >
          {t.sobregirada(formatearMonto(sobregirada.despues).replace(MENOS, ''))}
        </AvisoEnLinea>
      )}
      <TarjetaImpacto
        rotulo={t.rotuloImpacto}
        {...(impactoCambio ? { nota: t.impactoCambio } : {})}
        filas={filas.map((f) => (
          <FilaAntesDespues key={f.id} nombre={f.nombre} antes={f.antes} despues={f.despues} />
        ))}
      />
    </div>
  );
}
