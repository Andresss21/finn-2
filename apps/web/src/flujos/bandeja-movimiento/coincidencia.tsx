'use client';
// La coincidencia de un movimiento con un pago programado (FT-35, 04 OP-40 `confirmar_coincidencia`; S4 del export, CH-137): dice con qué
// coincide y qué pasa al confirmar, con la tabla Programada / Fecha esperada / Monto esperado. «Confirmar» y «No es este pago» van en el
// pie fijo. Con la ocurrencia ya registrada por el registro automático no se crea otra transacción (B-9).
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { bandeja as t } from '../../textos/bandeja';
import { Nota, TablaDatos } from './piezas';

export interface DatosCoincidencia {
  readonly programada: string;
  readonly fecha: string;
  readonly monto: string;
  readonly registrada: boolean;
}

export function Coincidencia({ coincidencia: c }: { readonly coincidencia: DatosCoincidencia }) {
  const r = t.revisar;
  return (
    <section aria-label={r.coincidencia} className="flex flex-col gap-3">
      <AvisoEnLinea estado="informacion" titulo={r.coincidencia}>
        {c.registrada
          ? r.coincideRegistrada(c.programada, c.fecha, c.monto)
          : r.coincidePendiente(c.programada, c.fecha, c.monto)}
      </AvisoEnLinea>
      <TablaDatos
        filas={[
          [r.programada, c.programada],
          [r.fechaEsperada, c.fecha],
          [r.montoEsperado, c.monto],
        ]}
      />
      <Nota>{r.coincidenciaNota}</Nota>
    </section>
  );
}
