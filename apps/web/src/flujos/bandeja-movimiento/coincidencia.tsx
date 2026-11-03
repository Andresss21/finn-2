'use client';
// La coincidencia de un movimiento con un pago programado (FT-35, 04 OP-40 `confirmar_coincidencia`): dice con qué coincide y
// qué pasa al confirmar. Con la ocurrencia ya registrada por el registro automático no se crea otra transacción (B-9).
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { bandeja as t } from '../../textos/bandeja';

export interface DatosCoincidencia {
  readonly programada: string;
  readonly fecha: string;
  readonly monto: string;
  readonly registrada: boolean;
}

export function Coincidencia({
  coincidencia: c,
  enviando,
  deshabilitado,
  alConfirmar,
}: {
  readonly coincidencia: DatosCoincidencia;
  readonly enviando: boolean;
  readonly deshabilitado: boolean;
  readonly alConfirmar: () => void;
}) {
  return (
    <section aria-label={t.revisar.coincidencia} className="flex flex-col gap-2">
      <AvisoEnLinea estado="informacion" titulo={t.revisar.coincidencia}>
        {c.registrada
          ? t.revisar.coincideRegistrada(c.programada, c.fecha, c.monto)
          : t.revisar.coincidePendiente(c.programada, c.fecha, c.monto)}
      </AvisoEnLinea>
      <Boton
        variante="secundaria"
        onClick={alConfirmar}
        enviando={enviando}
        textoEnviando={t.revisar.confirmando}
        deshabilitado={deshabilitado}
      >
        {t.revisar.confirmarCoincidencia}
      </Boton>
    </section>
  );
}
