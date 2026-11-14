// Los montos que propone Registrar gasto (C-45 §10, C-49 §2; CH-276): los ejemplos de CA-K3-9, CA-K3-10, CA-R-3, CA-R-5,
// CA-R-6 y CA-R-8. Partes iguales y porcentaje dejan el redondeo en la primera fila; la suma siempre es el total.
import { Centavos } from '@finn/dominio/valores';
import { describe, expect, it } from 'vitest';
import {
  centesimasDe,
  centesimasEscritas,
  partesIguales,
  porcentajesIguales,
  porPorcentaje,
  repartir,
  textoDeCentesimas,
  textoDeCentavos,
} from './reparto';

const c = (texto: string) => Centavos.desdeTexto(texto);
const textos = (xs: readonly Centavos[]) => xs.map(textoDeCentavos);
const fila = (monto: string, pct = '', auto = false) => ({ monto, pct, auto });

describe('PRU-DOM-VAL montos propuestos de Registrar gasto', () => {
  it('PRU-DOM-VAL-860 [C-45, C-49] CA-K3-9 y CA-R-5: partes iguales son ⌊total/n⌋ y el resto va a la primera fila ($1,236.40 entre tres y $148.60 entre tres)', () => {
    expect(textos(partesIguales(c('1236.40'), 3))).toEqual(['412.14', '412.13', '412.13']);
    expect(textos(partesIguales(c('148.60'), 3))).toEqual(['49.54', '49.53', '49.53']);
    // con 4 partes y 3 centavos de resto, los 3 van a la primera (no uno a cada una)
    expect(textos(partesIguales(c('0.07'), 4))).toEqual(['0.04', '0.01', '0.01', '0.01']);
    expect(textos(partesIguales(c('10'), 1))).toEqual(['10.00']);
    expect(partesIguales(c('10'), 0)).toEqual([]);
    expect(porcentajesIguales(3)).toEqual(['33.34', '33.33', '33.33']);
    expect(porcentajesIguales(2)).toEqual(['50', '50']);
  });

  it('PRU-DOM-VAL-861 [C-45, C-49] CA-K3-10 y CA-R-6: porcentaje con redondeo mitad hacia arriba; con 100 % la diferencia va a la primera fila', () => {
    // 40/20/20 de $1,236.40: faltan 20 % ($247.28)
    const r = repartir(c('1236.40'), 'porcentaje', [fila('', '40'), fila('', '20'), fila('', '20')]);
    expect(r.pctSuma).toBe(8000);
    expect(textoDeCentavos(Centavos.restar(c('1236.40'), r.suma))).toBe('247.28');
    // 60/40 de $148.60: $89.16 y $59.44; 60/20: $89.16 y $29.72
    expect(textos(porPorcentaje(c('148.60'), [6000, 4000]))).toEqual(['89.16', '59.44']);
    expect(textos(porPorcentaje(c('148.60'), [6000, 2000]))).toEqual(['89.16', '29.72']);
    // 33.33 × 3 no llega a 100: sin ajuste; 33.34/33.33/33.33 sí, y la primera absorbe el redondeo
    expect(textos(porPorcentaje(c('100'), [3334, 3333, 3333]))).toEqual(['33.34', '33.33', '33.33']);
    expect(textos(porPorcentaje(c('0.05'), [5000, 5000]))).toEqual(['0.02', '0.03']);
    expect(repartir(c('10'), 'porcentaje', [fila('', '120')]).pasaDe100).toBe(true);
    expect(centesimasEscritas('12.5')).toBe(1250);
    expect(centesimasEscritas('60.')).toBe(6000);
    expect(centesimasEscritas('')).toBe(0);
    expect(textoDeCentesimas(8000)).toBe('80');
    expect(textoDeCentesimas(1250)).toBe('12.5');
  });

  it('PRU-DOM-VAL-862 [C-49] CA-R-3 y CA-R-8: «Lo que queda» vale lo que se reparte menos las demás filas, nunca menos de 0; escrita, vale lo escrito', () => {
    const queda = repartir(c('148.60'), 'montos', [fila('', '', true), fila('52.50')]);
    expect(textos(queda.montos)).toEqual(['96.10', '52.50']);
    expect(textoDeCentavos(queda.suma)).toBe('148.60');
    // tu parte baja a $108.60: la fila «Lo que queda» se ajusta sola a $86.10
    expect(textos(repartir(c('108.60'), 'montos', [fila('', '', true), fila('22.50')]).montos)).toEqual(
      ['86.10', '22.50'],
    );
    // escrita, no cambia: 96.10 + 22.50 pasan tu parte de $108.60 por $10.00
    const escrita = repartir(c('108.60'), 'montos', [fila('96.10'), fila('22.50')]);
    expect(textoDeCentavos(Centavos.restar(escrita.suma, c('108.60')))).toBe('10.00');
    expect(textos(repartir(c('10'), 'montos', [fila('', '', true), fila('25')]).montos)).toEqual([
      '0.00',
      '25.00',
    ]);
    // el porcentaje debajo de una cifra: $118.60 de $148.60 es 79.81 %
    expect(centesimasDe(c('118.60'), c('148.60'))).toBe(7981);
    expect(centesimasDe(c('1'), Centavos.cero)).toBe(0);
  });
});
