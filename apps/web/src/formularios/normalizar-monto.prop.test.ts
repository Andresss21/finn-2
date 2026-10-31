import { Centavos } from '@finn/dominio/valores';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { normalizarMontoEscrito } from './normalizar-monto';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1).
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = { numRuns: 300, seed: Number(entorno?.['FC_SEED'] ?? '0') };

const MONTO_TEXTO = /^\d{1,8}(\.\d{1,2})?$/;
const MAXIMO = 2_147_483_647;

// Cada monto de 0 a 21.474.836,47 escrito con punto, coma, ceros a la izquierda y sin decimales.
function formas(centavos: number): string[] {
  const enteros = Math.floor(centavos / 100);
  const dec = String(centavos % 100).padStart(2, '0');
  const lista = [
    `${enteros}.${dec}`,
    `${enteros},${dec}`,
    `000${enteros}.${dec}`,
    `00${enteros},${dec}`,
  ];
  if (centavos % 100 === 0) lista.push(`${enteros}`, `${enteros}.`, `0${enteros},`);
  if (enteros === 0) lista.push(`.${dec}`, `,${dec}`);
  return lista;
}

describe('PRU-PROP-VAL-001 normalización de EntradaMonto', () => {
  it('PRU-PROP-VAL-001 [V5-01] el texto enviado cumple montoTexto y vuelve a los mismos centavos', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ min: 0, max: MAXIMO }), fc.integer({ min: 0, max: 300 })),
        (centavos) => {
          for (const escrito of formas(centavos)) {
            const r = normalizarMontoEscrito(escrito);
            expect(r.estado).toBe('valido');
            if (r.estado !== 'valido') return;
            expect(r.texto).toMatch(MONTO_TEXTO);
            expect(Centavos.desdeTexto(r.texto)).toBe(centavos);
            expect(r.esCero).toBe(centavos === 0);
          }
        },
      ),
      opciones,
    );
  });
});
