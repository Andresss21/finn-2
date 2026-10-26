// Autodescarte (01 §4.17, H12, inv. 16; 04 §8.4 c): texto idéntico, carácter por carácter, al de
// otro SMS recibido en [t − 10 min, t), con t = `recibido_en`. Sin `Date`: el instante es texto ISO
// UTC con milisegundos (04 §13.1), como en `claveOrdenEditada` de OP-02.
import type { Instante, SmsRecibido } from '../hechos';
import { FechaLocal } from '../valores/fecha-local';

const DIA_MS = 86_400_000;
const VENTANA_MS = 10 * 60_000;
const EPOCA = FechaLocal.desdeTexto('1970-01-01');

/** Milisegundos desde 1970-01-01T00:00:00.000Z de un instante `AAAA-MM-DDTHH:MM:SS.mmmZ`. */
export function msDeInstante(instante: Instante): number {
  const [dia = '', hora = ''] = instante.split('T');
  const n = (a: number, b: number) => Number(hora.slice(a, b));
  const ms = n(0, 2) * 3_600_000 + n(3, 5) * 60_000 + n(6, 8) * 1000 + n(9, 12);
  return FechaLocal.diasEntre(EPOCA, FechaLocal.desdeTexto(dia)) * DIA_MS + ms;
}

/** Si otro SMS con el mismo texto llegó en [t − 10 min, t). */
export function esAutodescarte(sms: SmsRecibido, anteriores: readonly SmsRecibido[]): boolean {
  const t = msDeInstante(sms.recibidoEn);
  return anteriores.some((x) => {
    const r = msDeInstante(x.recibidoEn);
    return x.id !== sms.id && x.texto === sms.texto && t - VENTANA_MS <= r && r < t;
  });
}
