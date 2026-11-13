// [CH-251] El texto de cada hallazgo lo arma el servidor (06 §3.5.2, 04 §7.10 CF-04): los ejemplos de 06 §3.5.4 a §3.5.10
// con los formatos del catálogo (montos con U+2212, fechas dd/mm/aaaa).
import type { Uuid } from '@finn/dominio';
import { Centavos, FechaLocal } from '@finn/dominio/valores';
import { describe, expect, it } from 'vitest';
import { conTexto, textoDeHallazgo, type HallazgoSinTexto } from './textos-hallazgos.ts';

const c = (n: number) => Centavos.desdeEntero(n);
const ref = (nombre: string) => ({ id: `id-${nombre}` as Uuid, nombre });
const base = { clave: 'x', impacto: c(1) };

describe('PRU-DOM-REP', () => {
  it('PRU-DOM-REP-794 [FT-67, CA-67.1] (CH-251) cada tipo de hallazgo trae su frase de 06 §3.5 en voseo, con montos, porcentajes y fechas del catálogo', () => {
    const casos: [HallazgoSinTexto, string][] = [
      [
        {
          ...base,
          tipo: 'ritmo',
          estado: 'problema',
          categoria: ref('Restaurantes'),
          exceso: c(5556),
          sobregiroActual: c(2630),
          fin: FechaLocal.desdeTexto('2026-10-20'),
          accion: { tipo: 'revisar', categoriaId: 'id' as Uuid },
        },
        'Ya te pasaste $26.30 en Restaurantes y, a este ritmo, llegarías a $55.56 el 20/10.',
      ],
      [
        {
          ...base,
          tipo: 'ritmo',
          estado: 'problema',
          categoria: ref('Gasolina'),
          exceso: c(3850),
          sobregiroActual: c(0),
          fin: FechaLocal.desdeTexto('2026-10-20'),
          accion: { tipo: 'revisar', categoriaId: 'id' as Uuid },
        },
        'Vas camino a pasarte $38.50 en Gasolina antes del 20/10.',
      ],
      [
        {
          ...base,
          tipo: 'promedio',
          estado: 'informacion',
          categoria: ref('Restaurantes'),
          gasto: c(17556),
          promedio: c(11195),
          variacion: 5682,
          accion: { tipo: 'revisar', categoriaId: 'id' as Uuid },
        },
        'En Restaurantes vas camino a $175.56 este período, 56.82% más que tu promedio de $111.95.',
      ],
      [
        {
          ...base,
          tipo: 'promedio',
          estado: 'informacion',
          categoria: ref('Cine'),
          gasto: c(1000),
          promedio: c(4000),
          variacion: -7500,
          accion: { tipo: 'revisar', categoriaId: 'id' as Uuid },
        },
        'En Cine vas camino a $10.00 este período, 75% menos que tu promedio de $40.00.',
      ],
      [
        {
          ...base,
          tipo: 'realidad',
          estado: 'advertencia',
          categoria: ref('Súper'),
          causa: 'pasas',
          promedioGastado: c(18000),
          asignadoPromedio: c(15000),
          sugerido: c(18000),
          accion: { tipo: 'asignar', montoNuevo: c(18000) },
        },
        'En los últimos 3 períodos gastaste en promedio $180.00 en Súper y asignaste $150.00. ¿Ajustar a $180.00?',
      ],
      [
        {
          ...base,
          tipo: 'realidad',
          estado: 'advertencia',
          categoria: ref('Súper'),
          causa: 'sobra',
          promedioGastado: c(9000),
          asignadoPromedio: c(15000),
          sugerido: c(9000),
          accion: { tipo: 'asignar', montoNuevo: c(9000) },
        },
        'En los últimos 3 períodos gastaste en promedio $90.00 en Súper y te sobró dinero cada vez. ¿Ajustar a $90.00?',
      ],
      [
        {
          ...base,
          tipo: 'hormiga',
          estado: 'advertencia',
          agrupacion: 'categoria',
          etiqueta: 'Cafés y antojos',
          compras: 12,
          total: c(6408),
          enlace: {
            pantalla: 'actividad',
            desde: FechaLocal.desdeTexto('2026-09-21'),
            hasta: FechaLocal.desdeTexto('2026-10-20'),
            montoHasta: c(1000),
          },
        },
        '12 compras pequeñas en Cafés y antojos este período: $64.08.',
      ],
      [
        {
          ...base,
          tipo: 'hormiga',
          estado: 'advertencia',
          agrupacion: 'comercio',
          etiqueta: 'STARBUCKS',
          compras: 6,
          total: c(3000),
          enlace: {
            pantalla: 'actividad',
            desde: FechaLocal.desdeTexto('2026-09-21'),
            hasta: FechaLocal.desdeTexto('2026-10-20'),
            montoHasta: c(1000),
          },
        },
        '6 compras en STARBUCKS este período: $30.00.',
      ],
      [
        {
          ...base,
          tipo: 'suscripcion',
          estado: 'advertencia',
          comercio: 'SPOTIFY',
          mensual: c(599),
          anual: c(7188),
          desactivada: false,
          accion: { tipo: 'reactivar', programadaId: 'p' as Uuid },
        },
        'SPOTIFY te cobra $5.99 cada mes ($71.88 al año) y no la tenés programada.',
      ],
      [
        {
          ...base,
          tipo: 'suscripcion',
          estado: 'advertencia',
          comercio: 'NETFLIX',
          mensual: c(1549),
          anual: c(18588),
          desactivada: true,
          accion: { tipo: 'reactivar', programadaId: 'p' as Uuid },
        },
        'NETFLIX te sigue cobrando $15.49 cada mes, pero su programada está desactivada.',
      ],
      [
        {
          ...base,
          tipo: 'tarjeta',
          estado: 'deuda-sin-respaldo',
          tarjeta: ref('Visa Oro'),
          arrastre: c(45683),
          corte: FechaLocal.desdeTexto('2026-08-25'),
          sinRespaldo: c(1875),
          accion: { tipo: 'pagar', tarjetaId: 't' as Uuid },
        },
        'Con Visa Oro quedaron $456.83 sin pagar del corte del 25/08/2026: esa deuda puede generar intereses.',
      ],
      [
        {
          ...base,
          tipo: 'flujo',
          estado: 'deuda-sin-respaldo',
          tarjeta: ref('Visa Oro'),
          comprasConTarjeta: c(34035),
          pagosTarjeta: c(20000),
          accion: {
            tipo: 'reservar',
            tarjeta: ref('Visa Oro'),
            categoriaId: 'p' as Uuid,
            monto: c(1875),
            montoNuevo: c(1875),
          },
        },
        'Con tarjeta compraste $340.35 y pagaste $200.00 de tarjetas en este período: te falta reservar $18.75 para Visa Oro.',
      ],
    ];
    for (const [h, texto] of casos) expect(textoDeHallazgo(h)).toBe(texto);
    // `conTexto` conserva cada campo del selector y agrega `texto`.
    const [h, texto] = casos[0] ?? [];
    expect(conTexto(h === undefined ? [] : [h])).toEqual([{ ...h, texto }]);
  });
});
