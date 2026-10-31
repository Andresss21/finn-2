import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MARGEN_MS, crearAgendaMedianoche, objetivoMedianoche } from './reloj';

const MINUTO = 60_000;
const ahora = (): number => vi.getMockedSystemTime()?.getTime() ?? 0;
// 2027-03-05T20:00:00-06:00 = 2027-03-06T02:00:00Z
const AHORA = Date.UTC(2027, 2, 6, 2, 0, 0);

describe('agenda de medianoche', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AHORA);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('PRU-DOM-RELOJ-001 [V5-10, FE-21] el objetivo es hoy + 1 día a las 00:00 de El Salvador (06:00 UTC) más 5 s', () => {
    expect(objetivoMedianoche('2027-03-05')).toBe(Date.UTC(2027, 2, 6, 6, 0, 5));
    expect(objetivoMedianoche('2027-12-31')).toBe(Date.UTC(2028, 0, 1, 6, 0, 5));
    expect(MARGEN_MS).toBe(5000);
  });

  it('PRU-DOM-RELOJ-001 [V5-10, FE-21] refresca una sola vez al llegar al objetivo', () => {
    const refrescar = vi.fn();
    const agenda = crearAgendaMedianoche(refrescar);
    agenda.programar('2027-03-05');
    vi.advanceTimersByTime(objetivoMedianoche('2027-03-05') - AHORA - 1);
    expect(refrescar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(refrescar).toHaveBeenCalledTimes(1);
    agenda.cancelar();
  });

  it('PRU-DOM-RELOJ-001 [V5-10, FE-21] un Encabezado con el día nuevo reprograma la agenda y no repite el reintento', () => {
    const refrescar = vi.fn();
    const agenda = crearAgendaMedianoche(refrescar);
    agenda.programar('2027-03-05');
    vi.advanceTimersByTime(objetivoMedianoche('2027-03-05') - AHORA);
    expect(refrescar).toHaveBeenCalledTimes(1);
    agenda.programar('2027-03-06'); // el servidor ya cambió de día
    vi.advanceTimersByTime(5 * MINUTO);
    expect(refrescar).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(objetivoMedianoche('2027-03-06') - ahora());
    expect(refrescar).toHaveBeenCalledTimes(2);
    agenda.cancelar();
  });

  it('PRU-DOM-RELOJ-001 [V5-10, FE-21] si el servidor sigue en el mismo día, reintenta al minuto y no en bucle', () => {
    const refrescar = vi.fn();
    const agenda = crearAgendaMedianoche(refrescar);
    agenda.programar('2027-03-05');
    vi.advanceTimersByTime(objetivoMedianoche('2027-03-05') - AHORA);
    expect(refrescar).toHaveBeenCalledTimes(1);
    agenda.programar('2027-03-05'); // otro Encabezado con el mismo hoy no refresca de nuevo
    expect(refrescar).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(MINUTO - 1);
    expect(refrescar).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(refrescar).toHaveBeenCalledTimes(2);
    agenda.cancelar();
  });

  it('PRU-DOM-RELOJ-001 [V5-10, FE-21] con la espera ya vencida (reloj adelantado) refresca de inmediato, una vez por valor de hoy', () => {
    const refrescar = vi.fn();
    const agenda = crearAgendaMedianoche(refrescar);
    vi.setSystemTime(Date.UTC(2027, 2, 6, 7, 0, 0));
    agenda.programar('2027-03-05');
    expect(refrescar).toHaveBeenCalledTimes(1);
    agenda.programar('2027-03-05');
    expect(refrescar).toHaveBeenCalledTimes(1);
    agenda.cancelar();
  });

  it('PRU-DOM-RELOJ-001 [V5-10, FE-21] con la pestaña oculta el temporizador se retrasa; al volver a estar visible se comprueba el objetivo', () => {
    const refrescar = vi.fn();
    const agenda = crearAgendaMedianoche(refrescar);
    agenda.programar('2027-03-05');
    agenda.alVolverVisible(); // todavía no pasó: no refresca
    expect(refrescar).not.toHaveBeenCalled();
    vi.setSystemTime(Date.UTC(2027, 2, 6, 8, 0, 0)); // el navegador congeló los temporizadores
    agenda.alVolverVisible();
    expect(refrescar).toHaveBeenCalledTimes(1);
    agenda.cancelar();
  });

  it('PRU-DOM-RELOJ-001 [V5-10, FE-21] una espera mayor al tope de un temporizador de JavaScript se parte en tramos', () => {
    const refrescar = vi.fn();
    const agenda = crearAgendaMedianoche(refrescar);
    const lejos = '2027-05-05'; // ~60 días: más que 2^31 - 1 ms
    agenda.programar(lejos);
    vi.advanceTimersByTime(2 ** 31 - 1);
    expect(refrescar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(objetivoMedianoche(lejos) - ahora());
    expect(refrescar).toHaveBeenCalledTimes(1);
    agenda.cancelar();
  });
});
