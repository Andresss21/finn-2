# Auditoría de diseño · arnés de captura y medición

Solo auditoría: **no se modifica código de la app**. Lo único que se escribe es `tools/auditoria/` (scripts) y
`docs/auditoria-diseno/` (informe, capturas, medidas). Nada se commitea. No se toca `plan/`, `pruebas/` ni `docs/0*.md`.

## Qué hay

| Archivo | Para qué |
|---|---|
| `servir.mjs` | Levanta la pila local (Supabase + base `finn_e2e` + usuario de prueba con TOTP), compila y sirve la app en `http://localhost:3100`. **Ya está corriendo**: no lo lances ni lo detengas. |
| `correr.mjs` | Corre casos de captura contra ese servidor. Toma un candado: si otro agente está capturando, espera su turno. |
| `lib.ts` | `caso({...})`, `capturar()`, `sembrarOps()`, `escenarioA7()`, `entrar()`, `quieta()`. |
| `medir.ts` | Medidor que corre en la página: textos (familia, tamaño, peso, interlineado, `font-stretch`, tnum, color, fondo, contraste, caja), tocables (tamaño y área real de toque), cajas (fondo, radio, sombra, padding), desbordes, marco, roles. |
| `analizar.mjs` | Cruza las medidas de la app con los tokens y con la referencia medida. Escribe `docs/auditoria-diseno/analisis/<id>.md`. |
| `referencias.ref.ts` | Ya corrido: `docs/auditoria-diseno/medidas-ref/` tiene la medida de cada HTML de referencia. |
| `casos/*.cap.ts` | Los casos, un archivo por sección. |

## Comandos (desde `C:/finn/repo`, con Git Bash)

```bash
node tools/auditoria/correr.mjs casos/30-cat            # todos los casos de ese archivo, en las 3 variantes
node tools/auditoria/correr.mjs casos/30-cat --project=telefono-claro -g "categoria__sobregiro"   # uno, para depurar
node tools/auditoria/analizar.mjs categoria__           # analiza los ids que contienen ese texto
```

Variantes (proyectos): `telefono-claro` y `telefono-oscuro` (390 × 844, 2×), `computadora-claro` (1440 × 900).
Depurá siempre con una sola variante y un `-g`; corré las tres al final.

## Un caso

```ts
import { caso, capturar, escenarioA7, test, entrar, sembrarOps, abrir, type Op } from '../lib.ts';

const A7 = { escenario: escenarioA7(), hoyServidor: '2026-10-15', soloLectura: true } as const; // los datos de las referencias

caso({
  id: 'categoria__principal',                 // <pantalla>__<estado>: es el nombre de la captura
  ruta: '/presupuesto/categorias/[categoriaId]',                  // patrón de la ruta
  comp: 'apps/web/src/app/(finn)/presupuesto/categorias/[categoriaId]/page.tsx',
  ref: '02-referencias/entrega-1/pantallas/S3-Detalle',           // sin variante ni extensión; o 'SIN DISEÑO'
  ...A7,                                      // o: ops: [...], hoy: '2027-02-10'
  url: async (page) => { /* resolver el id navegando */ return `/presupuesto/categorias/${id}`; },
  antes: async (page, context) => { /* mocks de red, context.setOffline(true), localStorage… */ },
  pasos: async (page) => { /* abrir la hoja, escribir, forzar el error… */ },
  // soloLectura: true → el caso no escribe en la base y el siguiente con la misma semilla no vuelve a sembrar
  // sesion: false → sin sesión (acceso);  carga: true → captura de un estado de carga
});
```

Para varios estados de un mismo recorrido, un `test(...)` propio con varios `capturar(page, info, id, {ruta, comp, ref})`.

- `ref` apunta a `docs/diseno/`: p. ej. `02-referencias/entrega-2/pantallas/06-detalle-de-cuenta/tarjeta`,
  `02-referencias/entrega-1/pantallas/S4-Bandeja__bandeja-al-dia`, `entrega-3/pantallas/16-salir/ajustes-indice`.
  Si lo que manda es una decisión o una sección escrita, poné el PNG/HTML más cercano y aclaralo en `nota`.
- **Cómo forzar cada estado**: las E2E del repo ya lo hacen. Copiá la semilla (`Op[]`), el `hoy` y los pasos de
  `apps/web/e2e/pantallas/<sección>/*.e2e.ts`, `apps/web/e2e/flujos/<sección>/*.e2e.ts` y `apps/web/e2e/recorridos/`.
  Las operaciones (`OP-nn`) están tipadas en `packages/dominio/escenarios/tipos.ts`. Los textos de la interfaz están en
  `apps/web/src/textos/`. Hay páginas de desarrollo en `/pruebas/estados/[caso]` y `/pruebas/estados/carga`.
- La red externa está bloqueada (solo la app y la pila local). Tiempo máximo por caso: 90 s.
- Cada caso deja: `capturas/<id>__<variante>.png` (pantalla completa, con las barras fijas arriba y abajo),
  `capturas/pliegue/<id>__<variante>.png` (lo que se ve al abrir, sin desplazar) y `medidas/<id>__<variante>.json`.

## Jerarquía del diseño

`docs/diseno/01-especificacion/DECISIONES.md` (y la sección "Entrega 3" de `docs/diseno/entrega-3/DECISIONES.md`) >
`tokens.css` > PNG/HTML de referencia > `PANTALLAS.md` > demo. `05-auditoria-previa/` no es fuente de verdad.
Los índices `INDICE-entrega-1.md`, `INDICE-entrega-2.md` y `entrega-3/INDICE-entrega-3.md` dicen qué archivo
corresponde a cada ruta y estado. `FALTANTES.md` lista lo que no tiene diseño.
