// V5-10: agenda de la medianoche de El Salvador.
import { agendarMedianoche as ag, instanteMedianocheSiguiente as med } from './reloj.ts';
let f = 0; const eq = (n: string, a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) { f++; console.log('FALLA', n, a, b); } };
eq('medianoche 20 oct', new Date(med('2026-10-20')).toISOString(), '2026-10-21T06:00:00.000Z');
eq('fin de año', new Date(med('2026-12-31')).toISOString(), '2027-01-01T06:00:00.000Z');
eq('bisiesto', new Date(med('2028-02-28')).toISOString(), '2028-02-29T06:00:00.000Z');
const t = (iso: string) => Date.parse(iso);
eq('23:59 local', ag('2026-10-20', t('2026-10-21T05:59:00Z'), null), { accion: 'esperar', ms: 65_000 });
eq('14:00 local', ag('2026-10-20', t('2026-10-20T20:00:00Z'), null), { accion: 'esperar', ms: 10 * 3600_000 + 5000 });
eq('reloj adelantado', ag('2026-10-20', t('2026-10-21T07:00:00Z'), null), { accion: 'refrescar_ya' });
eq('sin bucle', ag('2026-10-20', t('2026-10-21T07:00:00Z'), '2026-10-20'), { accion: 'esperar', ms: 60_000 });
eq('reloj atrasado 3 días: tope del temporizador', ag('2026-10-20', t('2026-09-01T00:00:00Z'), null).accion, 'esperar');
// La zona del dispositivo no influye: misma respuesta con cualquier TZ del proceso.
console.log(f ? `${f} fallos` : 'V5-10: 8 de 8');
process.exit(f ? 1 : 0);
