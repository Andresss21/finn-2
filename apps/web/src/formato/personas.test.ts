// Nombres de «Agregar otra persona» (C-45; docs/anexos/finn-campos-v3/CAMPOS-V3.md §9): capitalizar, reutilizar a quien ya
// existe sin importar mayúsculas, rechazar «vos» y «yo», el vacío y más de 19 personas. Solo texto.
import { describe, expect, it } from 'vitest';
import { capitalizarNombre, MAXIMO_PERSONAS, resolverNombre } from './personas';

const CONOCIDAS = [
  { clave: 'd-carlos', nombre: 'Carlos' },
  { clave: 'd-ana', nombre: 'Ana' },
  { clave: 'd-ana-maria', nombre: 'Ana María' },
];

describe('PRU-DOM-VAL nombres de otra persona', () => {
  it('PRU-DOM-VAL-822 [C-45] CA-K3-12: el nombre se capitaliza; «ana» reutiliza a la Ana existente; «Luis» es nueva; «yo», «vos» y el vacío se rechazan; más de 19 llega al máximo', () => {
    expect(capitalizarNombre('  luis   pérez ')).toBe('Luis Pérez');
    expect(capitalizarNombre('ñandú')).toBe('Ñandú');
    expect(capitalizarNombre('')).toBe('');

    // Sin importar mayúsculas ni espacios de más: la persona que ya existe, con su nombre.
    expect(resolverNombre('ana', CONOCIDAS, [])).toEqual({
      tipo: 'existente',
      persona: { clave: 'd-ana', nombre: 'Ana' },
    });
    expect(resolverNombre(' ANA   maría', CONOCIDAS, [])).toEqual({
      tipo: 'existente',
      persona: { clave: 'd-ana-maria', nombre: 'Ana María' },
    });
    expect(resolverNombre('luis', CONOCIDAS, ['d-carlos'])).toEqual({
      tipo: 'nueva',
      nombre: 'Luis',
    });

    for (const propio of ['yo', 'Yo', ' VOS ', 'vos'])
      expect(resolverNombre(propio, CONOCIDAS, [])).toEqual({ tipo: 'propio' });
    for (const vacio of ['', '   '])
      expect(resolverNombre(vacio, CONOCIDAS, [])).toEqual({ tipo: 'vacio' });

    // Vos más 19 da 20 líneas, el máximo de `lineas` (05).
    expect(MAXIMO_PERSONAS).toBe(19);
    const diecinueve = Array.from({ length: 19 }, (_, k) => `p${String(k)}`);
    expect(resolverNombre('Luis', CONOCIDAS, diecinueve)).toEqual({ tipo: 'maximo' });
    expect(resolverNombre('ana', CONOCIDAS, diecinueve)).toEqual({ tipo: 'maximo' });
    expect(resolverNombre('Luis', CONOCIDAS, diecinueve.slice(1))).toEqual({
      tipo: 'nueva',
      nombre: 'Luis',
    });
    // Quien ya está marcado no suma: se reutiliza aunque haya 19.
    expect(resolverNombre('ana', CONOCIDAS, [...diecinueve.slice(1), 'd-ana'])).toEqual({
      tipo: 'existente',
      persona: { clave: 'd-ana', nombre: 'Ana' },
    });
  });
});
