// Carga de hechos (TA-152; 04 §5.2, BE-21; 03 §1.1): PRU-INT-MOTOR-101. Los hechos de las 18 tablas [M] se escriben
// con `escribir()` (ayudante de @finn/db), se leen con `leer()` + `cargarHechos()` y se comparan campo por campo con
// lo escrito. La prueba vive en @finn/aplicacion porque `calcular` es un valor de dominio y 04 §1.3 solo lo permite
// aquí [CH-28].
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import type { Hechos, TablaMotor } from '@finn/dominio';
import { cargarHechos, COLUMNAS_CARGADAS, COLUMNAS_NO_CARGADAS, leer } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import {
  escribirHechosDePrueba,
  HOY,
  RELOJ,
  type Escritos,
} from '../../db/test/ayudantes/hechos-prueba.ts';

describe('PRU-INT-MOTOR', () => {
  const base = crearBasePrueba();
  let escritos: Escritos;
  let cargados: Hechos;

  beforeAll(async () => {
    escritos = await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    cargados = await leer((t) => cargarHechos(t), RELOJ);
  });

  it('PRU-INT-MOTOR-101 [inv. 26] BE-21: cargarHechos devuelve campo por campo lo escrito, con secuencia y revisión, y calcular da la misma instantánea', () => {
    const tablas = Object.keys(escritos.escritas) as TablaMotor[];
    const memoria: Record<string, object[]> = {};
    let comparadas = 0;
    for (const tabla of tablas) {
      const esperadas = escritos.escritas[tabla];
      const clave = (f: object): string => escritos.clave(tabla, f);
      const ids = new Set(esperadas.map(clave));
      const cargadas = (cargados[tabla] as object[]).filter((f) => ids.has(clave(f)));
      const ordenar = (xs: object[]): object[] =>
        [...xs].sort((a, b) => clave(a).localeCompare(clave(b)));
      expect(ordenar(cargadas), tabla).toEqual(ordenar(esperadas));
      // nada de más: lo que la prueba no escribió es lo que sembró la migración
      expect(cargados[tabla].length, `${tabla}: filas`).toBe(
        esperadas.length + (escritos.sembradas[tabla] ?? 0),
      );
      memoria[tabla] = [
        ...esperadas,
        ...(cargados[tabla] as object[]).filter((f) => !ids.has(clave(f))),
      ];
      comparadas += esperadas.length;
    }
    expect(comparadas).toBeGreaterThan(50);
    // monto_original se escribió y no se carga (04 §5.2); la secuencia viaja como texto
    const conMoneda = cargados.transacciones.find((x) => x.id === escritos.txMonedaOriginal);
    expect(conMoneda).toMatchObject({ montoOriginal: null, monedaOriginal: 'EUR' });
    expect(conMoneda?.secuencia).toMatch(/^\d+$/);

    // cada columna de las tablas [M] se carga, salvo las que 04 §5.2 y 03 §3.12 excluyen
    for (const tabla of tablas) {
      const enLaBase = escritos.columnas[tabla]
        .filter((x) => !(COLUMNAS_NO_CARGADAS[tabla] ?? []).includes(x))
        .sort();
      expect([...COLUMNAS_CARGADAS[tabla]].sort(), `columnas de ${tabla}`).toEqual(enLaBase);
    }

    // calcular sobre lo cargado = calcular sobre los hechos en memoria, y no depende del orden (inv. 26)
    const hoy = FechaLocal.desdeTexto(HOY);
    expect(calcular(cargados, hoy)).toEqual(calcular(memoria as unknown as Hechos, hoy));
    const alReves = Object.fromEntries(
      tablas.map((tabla) => [tabla, [...cargados[tabla]].reverse()]),
    ) as unknown as Hechos;
    expect(calcular(alReves, hoy)).toEqual(calcular(cargados, hoy));
  });
});
