'use client';
// Una ocurrencia que al abrir ya estaba registrada, emparejada u omitida (05 §7; FT-41, CA-41.3): lo dice y enlaza a su transacción.
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { formatearFecha } from '../../formato';
import { programadas } from '../../textos/programadas';
import { TablaDatos } from '../bandeja-movimiento/piezas';

const t = programadas.ocurrencia;

export function OcurrenciaResuelta({
  texto,
  transaccionId,
  fechaEsperada,
  cuenta,
  alCerrar,
}: {
  /** El mensaje del servidor (`ocurrencia_ya_resuelta`) o el de una omitida. */
  readonly texto: string;
  readonly transaccionId: string | null;
  readonly fechaEsperada: string;
  readonly cuenta: string;
  readonly alCerrar: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <AvisoEnLinea
        estado="positivo"
        accion={
          transaccionId === null ? undefined : (
            <EnlaceFinn href={`/actividad/${transaccionId}`}>{t.verTransaccion}</EnlaceFinn>
          )
        }
      >
        {texto}
      </AvisoEnLinea>
      <TablaDatos
        filas={[
          [t.fechaEsperada, formatearFecha(fechaEsperada)],
          [t.cuenta, cuenta],
        ]}
      />
      <Boton variante="secundaria" onClick={alCerrar} className="w-full">
        {t.cerrar}
      </Boton>
    </div>
  );
}
