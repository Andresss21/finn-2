// PRU-DOM-RELOJ-101 (04 §13.1.3, P4-9) y PRU-DOM-RELOJ-102 (BE-57, 04 §14.2): instante a fecha local en
// America/El_Salvador y la comprobación de que el proceso corre en UTC.
import { describe, expect, it } from 'vitest';
import type { Instante } from '@finn/dominio';
import { fechaLocalDeInstante, verificarZonaDelProceso, zonaDelProceso } from './index.ts';

const i = (t: string) => t as Instante;

describe('PRU-DOM-RELOJ', () => {
  it('PRU-DOM-RELOJ-101 CT-01: fechaLocalDeInstante da AAAA-MM-DD en America/El_Salvador (UTC−6, sin horario de verano)', () => {
    // 05:59:59.999 UTC es todavía el día anterior en El Salvador; 06:00 UTC ya es el día nuevo
    expect(fechaLocalDeInstante(i('2027-02-21T05:59:59.999Z'))).toBe('2027-02-20');
    expect(fechaLocalDeInstante(i('2027-02-21T06:00:00.000Z'))).toBe('2027-02-21');
    // Un instante con desplazamiento propio se interpreta como tal
    expect(fechaLocalDeInstante(i('2027-02-20T19:00:00-06:00'))).toBe('2027-02-20');
    expect(fechaLocalDeInstante(i('2027-02-20T05:00:00+09:00'))).toBe('2027-02-19');
    // Cambio de año y 29 de febrero
    expect(fechaLocalDeInstante(i('2027-01-01T05:00:00Z'))).toBe('2026-12-31');
    expect(fechaLocalDeInstante(i('2028-03-01T03:00:00Z'))).toBe('2028-02-29');
    // Julio: El Salvador no cambia de hora (el desfase sigue siendo −6)
    expect(fechaLocalDeInstante(i('2027-07-15T05:30:00Z'))).toBe('2027-07-14');
    expect(() => fechaLocalDeInstante(i('ayer'))).toThrow(RangeError);
  });

  it('PRU-DOM-RELOJ-102 BE-57: la aplicación no arranca si la zona del proceso no es UTC o Etc/UTC', () => {
    // La zona del proceso sale de Intl (la de esta máquina no se afirma: los scripts todavía no fijan TZ=UTC)
    expect(zonaDelProceso()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(() => {
      verificarZonaDelProceso('UTC');
    }).not.toThrow();
    expect(() => {
      verificarZonaDelProceso('Etc/UTC');
    }).not.toThrow();
    for (const zona of ['America/El_Salvador', 'America/New_York', 'Europe/Madrid', 'GMT', ''])
      expect(() => {
        verificarZonaDelProceso(zona);
      }, zona).toThrow(/BE-57/);
  });
});
