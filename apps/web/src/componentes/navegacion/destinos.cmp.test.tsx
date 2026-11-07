// FT-71 CA-71.13 (05 §3.5, FE-32): el destino de la notificación `cuota_proxima` se abre en la ocurrencia de esa fecha con
// `?notificacion=<id>`, que `MarcarLeidaAlAbrir` convierte en leída (PRU-CMP-NOTIF-120). Registrar con un toque es FT-41.
import { describe, expect, it } from 'vitest';
import { rutaDeDestino } from './destinos';

const PROGRAMADA = '00000000-0000-4000-8000-000000007101';
const NOTIFICACION = '00000000-0000-4000-8000-000000000a01';

describe('PRU-CMP-NOTIF destinos', () => {
  it('PRU-CMP-NOTIF-122 [CA-71.13] el destino de cuota_proxima abre /programadas/[programadaId]/ocurrencias/2026-10-20 con ?notificacion=<id>', () => {
    const destino = {
      pantalla: 'programada',
      programadaId: PROGRAMADA,
      fechaEsperada: '2026-10-20',
    };
    expect(rutaDeDestino(destino, NOTIFICACION)).toBe(
      `/programadas/${PROGRAMADA}/ocurrencias/2026-10-20?notificacion=${NOTIFICACION}`,
    );
  });
});
