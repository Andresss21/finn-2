import { describe, expect, it } from 'vitest';
import { areas, autenticacion, glosario } from './index.ts';

// Voseo de 04 §7.10 aplicado a src/textos/ (05 §12.2): formas tuteadas al inicio o tras puntuación.
const TUTEO = /(^|[.!?¡¿,;:]\s*)(revisa|intenta|vuelve|puedes|tienes|elige|asigna)\s/i;

// Recorre el catálogo; las funciones se evalúan con argumentos de muestra.
function* textos(nodo: unknown, ruta: string): Generator<[string, string]> {
  if (typeof nodo === 'string') yield [ruta, nodo];
  else if (typeof nodo === 'function') {
    yield [ruta, (nodo as (...a: string[]) => string)('X', 'Y')];
  } else if (nodo !== null && typeof nodo === 'object') {
    for (const [k, v] of Object.entries(nodo)) yield* textos(v, `${ruta}.${k}`);
  }
}

const todos = areas.flatMap(([n, a]) => [...textos(a, n)]);

describe('catálogo de textos de la interfaz', () => {
  it('PRU-DOM-VAL-102 sin áreas ni términos duplicados y sin textos vacíos', () => {
    const nombres = areas.map(([n]) => n);
    expect(new Set(nombres).size).toBe(nombres.length);
    const terminos = Object.values(glosario);
    expect(new Set(terminos).size).toBe(terminos.length);
    expect(todos.length).toBeGreaterThan(0);
    for (const [ruta, t] of todos) expect(t.trim(), ruta).not.toBe('');
  });

  it('PRU-DOM-VAL-102 voseo: ningún texto usa formas tuteadas', () => {
    for (const [ruta, t] of todos) expect(TUTEO.test(t), `${ruta}: ${t}`).toBe(false);
    expect(TUTEO.test('Revisa los campos. Intenta de nuevo.')).toBe(true);
    expect(TUTEO.test('Revisá los campos. Intentá de nuevo.')).toBe(false);
  });

  it('PRU-DOM-VAL-102 glosario de 05 §12.3 y [R2] con alcance', () => {
    expect(glosario.listoParaAsignar).toBe('Listo para asignar');
    expect(glosario.teFaltaReservar).toBe('Te falta reservar');
    expect(glosario.deudaSinReservar).toBe('Deuda sin reservar');
    expect(glosario.loQueTeQuedoDelPeriodo).toBe('Lo que te quedó del período');
    expect(Object.values(glosario).join(' ')).not.toMatch(/deuda sin respaldo/i);
  });

  it('PRU-DOM-VAL-102 cada mensaje de 05 §9.7 existe', () => {
    expect({ ...autenticacion }).toEqual({
      credenciales_invalidas: 'El email o la contraseña no son correctos.',
      demasiados_intentos: 'Hiciste demasiados intentos. Esperá unos minutos y volvé a intentar.',
      codigo_incorrecto: 'El código no es correcto. Revisá que sea el de Finn en tu app.',
      codigo_vencido: 'El código venció. Escribí el que muestra ahora tu app.',
      inscripcion_no_permitida: 'Ya tenés un factor. Ingresá con tu código.',
      factor_unico: 'Agregá otro factor antes de quitar este.',
    });
  });
});
