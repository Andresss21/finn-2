// Devolución vinculada contra PostgreSQL (TA-138 corrección; 03 §3.14 `ck_lineas_destino`, DB-05; 01 §5.5
// OP-33a): sobre los hechos de prueba de @finn/db, OP-33a del dominio se escribe con `escribir()` +
// `aplicarCambios()` y la base la acepta. Cada línea nueva guarda solo `linea_original_id`, y la instantánea
// releída da los mismos derivados que la de memoria. Vive en @finn/aplicacion porque `aplicar` y `calcular`
// son valores de dominio (04 §1.3, CH-28).
import { beforeAll, describe, expect, it } from 'vitest';
import { aplicar, calcular, verificarInvariantes } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import type { ComandoDominio, Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, escribir, leer } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const c = (n: number) => n as never; // Centavos de la prueba
// De los hechos de prueba: el gasto 5 (E1, 25 ene) con L2 = 500 a C1 y L3 = 1.500 por cobrar a Ana,
// que tiene un cobro de 1.000 y una condonación de 300 (abierto 200).
const C1 = uuid(11),
  TX5 = uuid(105),
  L2 = uuid(302),
  L3 = uuid(303);

describe('PRU-INT-DEV', () => {
  const base = crearBasePrueba();
  let antes: Hechos;

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    antes = await leer((t) => cargarHechos(t), RELOJ);
  });

  it('PRU-INT-DEV-101 [INV-08] OP-33a DB-05: una devolución vinculada con una parte a categoría y otra por cobrar se escribe sin 23514 `ck_lineas_destino`; sus líneas guardan solo `linea_original_id` y la instantánea releída da los mismos derivados', async () => {
    let n = 0;
    const comando = {
      operacion: 'OP-33',
      id: uuid(960),
      instante: '2027-02-04T15:00:00.000Z' as Instante,
      fecha: FechaLocal.desdeTexto('2027-02-04'),
      ids: { siguiente: () => uuid(970 + ++n) },
      transaccionOriginalId: TX5,
      total: c(250),
      reparto: [
        { lineaId: L2, monto: c(100) },
        { lineaId: L3, monto: c(150) },
      ],
    } as unknown as ComandoDominio;
    const r = aplicar(antes, comando, FechaLocal.desdeTexto(HOY));
    if (!r.ok) throw new Error(`rechazada: ${JSON.stringify(r.rechazos)}`);

    await escribir((tx) => tx.aplicarCambios(r.cambios), RELOJ);
    const despues = await leer((t) => cargarHechos(t), RELOJ);

    const nuevas = despues.lineas
      .filter((l) => l.transaccionId === uuid(960))
      .sort((a, b) => a.orden - b.orden)
      .map((l) => [l.categoriaId, l.deudorId, l.lineaOriginalId, l.monto]);
    expect(nuevas).toEqual([
      [null, null, L2, 100],
      [null, null, L3, 150],
    ]);
    const hoy = FechaLocal.desdeTexto(HOY);
    const [enBase, enMemoria] = [calcular(despues, hoy), calcular(r.hechosNuevos, hoy)];
    expect(verificarInvariantes(enBase)).toEqual([]);
    const abierto = (i: typeof enBase) => i.porCobrar.find((x) => x.lineaId === L3)?.abierto;
    expect(abierto(enBase)).toBe(50);
    expect(abierto(enBase)).toBe(abierto(enMemoria));
    const disp = (i: typeof enBase) =>
      i.presupuesto.celdas.filter((x) => x.categoriaId === C1).map((x) => x.disponible);
    expect(disp(enBase)).toEqual(disp(enMemoria));
  });
});
