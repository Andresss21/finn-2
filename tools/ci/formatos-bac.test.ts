// PRU-DOM-BAND-105 (TA-181, DT-12): los formatos que dejan la siembra de 03 §9.5 y las migraciones,
// contra las muestras anonimizadas del BAC (TU-13). Las funciones probadas son puras (`interpretar`,
// `validarFormato`, `aplicarMigraciones`); los archivos solo se leen para obtener sus entradas.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { interpretar } from '../../packages/sms/src/interpretar.ts';
import {
  PARAMETROS_ANALISIS,
  TIEMPO_ANALISIS_MS,
  validarFormato,
} from '../../packages/sms/src/validar-formato.ts';
import { aplicarMigraciones, formatosDeLaSiembra, leerFormatos } from './formatos-activos.ts';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const leer = (ruta: string): string => readFileSync(join(raiz, ruta), 'utf8');

const BAC_COMPRA = 'BAC compra';
const muestras = leer('packages/sms/pruebas/muestras/bac.txt')
  .split(/\n\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s !== '');
const cobertura = JSON.parse(leer('pruebas/muestras-cobertura.json')) as {
  sms: { institucion: string; tipos: Record<string, number> }[];
};

// Campos esperados, leídos a mano de cada muestra (07 §12.1: los números salen de los datos).
const esperado: Record<string, { tipo: string; campos?: object }> = {
  'DLC UBER EATS': {
    tipo: 'compra',
    campos: { ultimos4: '0001', monto: 2498, comercio: 'DLC UBER EATS -I-', fecha: '2026-10-23' },
  },
  'MC DONALDS': {
    tipo: 'compra',
    campos: {
      ultimos4: '0001',
      monto: 300,
      comercio: 'MC DONALDS ZONA ROSA K',
      fecha: '2026-10-23',
    },
  },
  transferencia: { tipo: 'sin_clasificar' },
};
const clave = (sms: string): string => {
  const k = Object.keys(esperado).filter((x) => sms.includes(x));
  if (k.length !== 1 || k[0] === undefined) throw new Error(`muestra sin caso esperado: ${sms}`);
  return k[0];
};

describe('PRU-DOM-BAND', () => {
  it(
    'PRU-DOM-BAND-105 DT-12, MIG-15, SP-01-BAC: cada formato del BAC reescrito reconoce sus muestras anonimizadas con los campos esperados y pasa la política de patrones; F-2 y F-3 inactivos',
    () => {
      const formatos = leerFormatos(raiz).formatos;
      const porNombre = new Map(formatos.map((f) => [f.nombre, f]));

      // 08 §6.1: F-2 y F-3 quedan inactivos (DB-17: no se eliminan); el BAC, activo y reescrito.
      expect(porNombre.get('Banco Agrícola compra')?.activo).toBe(false);
      expect(porNombre.get('Cuscatlán compra')?.activo).toBe(false);
      const activos = formatos.filter((f) => f.activo);
      expect(activos.map((f) => f.nombre)).toEqual([BAC_COMPRA]);
      const sembrado = formatosDeLaSiembra(leer('docs/03-base-de-datos.md'));
      expect(porNombre.get(BAC_COMPRA)?.patron).not.toBe(
        sembrado.find((f) => f.nombre === BAC_COMPRA)?.patron,
      );

      // Las muestras cubren lo que declara la cobertura de TU-13 (CH-03).
      const tipos: Record<string, number> = {};
      for (const sms of muestras) {
        const t = esperado[clave(sms)]?.tipo ?? '';
        tipos[t] = (tipos[t] ?? 0) + 1;
      }
      expect(tipos).toEqual(cobertura.sms.find((c) => c.institucion === 'BAC')?.tipos);

      for (const sms of muestras) {
        const caso = esperado[clave(sms)];
        const r = interpretar(sms, formatos);
        if (caso?.campos === undefined) {
          expect(r, sms).toEqual({
            resultado: 'no_reconocido',
            coincidentes: [],
            motivo: 'ninguno',
          });
          continue;
        }
        expect(r, sms).toMatchObject({ resultado: 'reconocido', campos: caso.campos });
        if (r.resultado === 'reconocido') expect(r.formato.nombre).toBe(BAC_COMPRA);
        // Exclusividad (03 §9.5, punto 3): ni los patrones viejos de F-2 y F-3, activados, la toman.
        const todos = formatos.map((f) => ({ ...f, activo: true }));
        expect(interpretar(sms, todos).coincidentes, sms).toEqual([porNombre.get(BAC_COMPRA)?.id]);
      }

      // Variantes de 03 §9.5 que el patrón conserva, y montos que el normalizador rechaza.
      const variante =
        'MASTERCARD 4321: has realizado una compra por USD12.3 en el comercio PIZZA  HUT 20261012';
      expect(interpretar(variante, formatos)).toMatchObject({
        resultado: 'reconocido',
        campos: { ultimos4: '4321', monto: 1230, comercio: 'PIZZA HUT', fecha: '2026-10-12' },
      });
      for (const monto of ['12.', '12.345', '0.00'])
        expect(
          interpretar(
            `VISA 1234: has realizado una compra por USD ${monto} en el comercio X 2026/10/12 10:00:00`,
            formatos,
          ).resultado,
          monto,
        ).toBe('no_reconocido');

      // Política de 04 §8.5 sobre cada formato activo.
      for (const f of activos) {
        const v = validarFormato(f);
        expect(v, f.nombre).toMatchObject({ valido: true });
        if (v.valido) expect(v.grado ?? 0).toBeLessThanOrEqual(2);
      }

      // El análisis por pasos (CH-48) no se vuelve permisivo: lo inseguro se rechaza con su grado.
      const base = activos[0];
      if (base === undefined) throw new Error('sin formato activo');
      const control = (patron: string) => validarFormato({ ...base, patron, formatosFecha: [] });
      expect(control(String.raw`^(?<ultimos4>\d{4}) (?<monto>\d*)\d*\d*x$`)).toMatchObject({
        valido: false,
        error: 'patron_lento',
        grado: 3,
      });
      expect(control(String.raw`^(?<ultimos4>\d{4}) (?<monto>(?:\d+)+)$`)).toMatchObject({
        valido: false,
        error: 'patron_lento',
        grado: 'exponencial',
      });
      const sembradoBac = sembrado.find((f) => f.nombre === BAC_COMPRA);
      if (sembradoBac === undefined) throw new Error('sin F-1 en la siembra');
      expect(validarFormato(sembradoBac), 'F-1 de 03 §9.5').toMatchObject({
        valido: false,
        error: 'patron_lento',
        grado: 3,
      });

      // La lectura falla cerrada: una sentencia sobre formatos_bancarios que no entiende no se ignora.
      expect(() =>
        aplicarMigraciones(sembrado, [
          {
            nombre: 'x_m_rara',
            sql: "DELETE FROM finn.formatos_bancarios WHERE nombre = 'BAC compra';",
          },
        ]),
      ).toThrow(/x_m_rara/);
      expect(() =>
        aplicarMigraciones(sembrado, [
          {
            nombre: 'x_m_sin_fila',
            sql: "UPDATE finn.formatos_bancarios SET activo = false WHERE nombre = 'Nadie';",
          },
        ]),
      ).toThrow(/x_m_sin_fila/);
    },
    6 * TIEMPO_ANALISIS_MS,
  );

  it(
    'PRU-DOM-BAND-110 [V-24] BE-46, CH-48: el grado de recheck no depende del reloj: sin subtiempos, el mismo veredicto y la misma cadena en cada análisis, y un análisis sin terminar se rechaza',
    () => {
      // Lo que fija 04 §8.5, y ningún otro plazo que pueda decidir el grado. `recallTimeout` queda
      // en su valor por defecto, negativo: esa validación no corre.
      expect(PARAMETROS_ANALISIS).toEqual({
        checker: 'auto',
        timeout: TIEMPO_ANALISIS_MS,
        attackTimeout: null,
        incubationTimeout: null,
        seedingTimeout: null,
        attackLimit: 10_000_000,
      });

      const activo = leerFormatos(raiz).formatos.find((f) => f.activo);
      const f1 = formatosDeLaSiembra(leer('docs/03-base-de-datos.md')).find(
        (f) => f.nombre === BAC_COMPRA,
      );
      if (activo === undefined || f1 === undefined) throw new Error('faltan formatos');

      // El patrón que fallaba con la CPU ocupada (grado 2 real) y uno de grado 3 que debe seguir fuera.
      expect(validarFormato(activo)).toEqual({ valido: true, grado: 2 });
      const rechazo = validarFormato(f1);
      expect(rechazo).toMatchObject({ valido: false, error: 'patron_lento', grado: 3 });
      expect(validarFormato(f1)).toEqual(rechazo);

      // Plazo cero: el análisis no llega a terminar, y eso nunca cuenta como éxito.
      expect(validarFormato(activo, { timeoutMs: 0 })).toEqual({
        valido: false,
        error: 'patron_lento',
        grado: null,
        ataque: '',
      });
    },
    6 * TIEMPO_ANALISIS_MS,
  );
});
