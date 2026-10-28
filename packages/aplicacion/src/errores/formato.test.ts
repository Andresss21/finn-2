// PRU-DOM-VAL-001 (V-18; 04 §7.10, §13.3; BE-34, CF-15): los formatos de `Intl` en Node 24 y el catálogo de mensajes.
import { describe, expect, it } from 'vitest';
import { Centavos } from '@finn/dominio/valores';
import {
  formatearFecha,
  formatearFechaCorrida,
  formatearInstante,
  formatearMonto,
  MENOS,
} from './formato.ts';
import { MENSAJES_RECHAZO, mensajeDeRechazo, rellenar } from './mensajes.ts';

const c = (t: string): Centavos => Centavos.desdeTexto(t);

describe('PRU-DOM-VAL', () => {
  it('PRU-DOM-VAL-001 [V-18] BE-34, CF-15: es-SV da $1,234.50, -$45.00 y 05/10/2026; los módulos de formato muestran U+2212 y las exportaciones el guion', () => {
    // Las salidas crudas de ICU que fijan el contrato (si una actualización las cambia, se fija el formato)
    const moneda = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
    expect(moneda.format(1234.5)).toBe('$1,234.50');
    expect(moneda.format(-45)).toBe('-$45.00');
    const fecha = new Intl.DateTimeFormat('es-SV', {
      timeZone: 'America/El_Salvador',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    expect(fecha.format(new Date('2026-10-05T12:00:00Z'))).toBe('05/10/2026');
    // El módulo de formato: desde centavos enteros, sin flotantes
    expect(formatearMonto(c('1234.50'))).toBe('$1,234.50');
    expect(formatearMonto(c('0.75'))).toBe('$0.75');
    expect(formatearMonto(c('0'))).toBe('$0.00');
    expect(formatearMonto(c('21474836.47'))).toBe('$21,474,836.47');
    expect(formatearMonto(c('-45'))).toBe(`${MENOS}$45.00`);
    expect(formatearMonto(c('-0.05'))).toBe('−$0.05');
    expect(formatearMonto(c('-45'), '-')).toBe('-$45.00');
    expect(formatearFecha('2026-10-05')).toBe('05/10/2026');
    expect(formatearFechaCorrida('2026-09-05')).toBe('5 sep 2026');
    // 14:32 en El Salvador (UTC−6) son las 20:32Z; la coma de ICU no aparece
    expect(formatearInstante('2026-10-05T20:32:00.000Z')).toBe('05/10/2026 14:32');
    expect(formatearInstante('2026-10-06T05:59:00.000Z')).toBe('05/10/2026 23:59');
  });

  it('PRU-DOM-VAL-151 BE-34, CF-15: todo mensaje del catálogo pasa el control de voseo y trae sus datos formateados', () => {
    const tuteo = /(^|[.!?¿¡]\s*)(revisa|intenta|vuelve|elige|asigna)\b|\b(puedes|tienes)\b/i;
    for (const [codigo, m] of Object.entries(MENSAJES_RECHAZO)) {
      const textos = typeof m === 'function' ? [m({}), m({ tarjeta: 'X' })] : [m];
      for (const t of textos) expect(t, codigo).not.toMatch(tuteo);
    }
    expect(
      mensajeDeRechazo({
        codigo: 'suma_lineas_distinta',
        datos: { suma: c('45'), total: c('50') },
      }),
    ).toBe('Las partes suman $45.00 y el total es $50.00.');
    expect(
      mensajeDeRechazo({
        codigo: 'sin_saldo_abierto',
        datos: { fecha: '2026-10-05' },
      }),
    ).toBe('Ese por cobrar no tiene saldo pendiente al 05/10/2026.');
    expect(
      mensajeDeRechazo({
        codigo: 'cuenta_con_saldo',
        datos: { cuenta: 'Efectivo', saldo: c('-3') },
      }),
    ).toBe('Para archivar Efectivo, su saldo debe ser $0.00 (hoy es −$3.00).');
    // Dos textos para un mismo código (R2) y un número que no es monto
    expect(
      mensajeDeRechazo({ codigo: 'nombre_repetido', datos: { nombre: 'A', grupo: 'G' } }),
    ).toBe('Ya existe A en G.');
    expect(
      mensajeDeRechazo({ codigo: 'nombre_repetido', datos: { nombre: 'A', tarjeta: 'T' } }),
    ).toBe('El nombre A lo usa la tarjeta archivada T. Elegí otro o desarchivala.');
    expect(rellenar('El ciclo ya empieza el día {dia}.', { dia: 15 })).toBe(
      'El ciclo ya empieza el día 15.',
    );
    expect(mensajeDeRechazo({ codigo: 'codigo_inexistente' })).toBeNull();
  });
});
