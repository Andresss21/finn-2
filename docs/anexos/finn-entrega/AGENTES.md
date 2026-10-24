# Finn 2.0 · guía para el agente de frontend

Leé esto primero. Explica qué hay en este paquete, en qué orden usarlo y qué reglas no se rompen.

## Qué hay en el paquete

| Archivo | Para qué |
|---|---|
| `tokens.css` | Variables CSS de los dos temas (claro por defecto, oscuro por `prefers-color-scheme` o `data-theme="oscuro"`) y clases `.t-<rol>` de tipografía. **Es la única fuente de colores, radios, sombras, espaciado y movimiento.** |
| `tokens.json` | Los mismos valores como datos (para Tailwind, un tema de CSS-in-JS o Flutter). |
| `PANTALLAS.md` | Cómo se construye cada pantalla de A.7 y cada componente: anatomía, tokens, medidas, estados, interacción y transiciones. |
| `referencia/` | Capturas de cada pantalla y estado (teléfono a 2×, computadora a 1×) y de los tableros de componentes. Úsalas para comparar tu resultado. |
| `referencia/prototipo-logica.js` | La lógica de navegación del prototipo interactivo: pantallas, hojas, dirección de las transiciones. |
| `iconos/` | Los 52 íconos (trazo 1.5, extremos rectos, `currentColor`) y `iconos/estados/` con los 7 glifos de estado (trazo 1.8). |
| `ENTREGA.md` | Fuentes, contraste de los tokens nuevos, lista de lo agregado, tabla F → contrato y ajustes. |
| `finn-marca.zip` | Símbolo, logotipo, íconos de la app, favicon e insignia, con su `manifest-icons.json`. |

## Orden de trabajo recomendado

1. Importá `tokens.css` en la raíz y autohospedá **Archivo** (variable, ejes `wght` 100–900 y `wdth` 62–125) y **Big Shoulders Display** 700 y 800. Nada de otras familias.
2. Construí los componentes base y de dominio de `PANTALLAS.md` §2 antes que las pantallas. Cada componente usa solo variables de `tokens.css`; ningún color en hexadecimal en el código de un componente.
3. Construí el marco: barra superior, barra inferior con la Bandeja al centro, barra lateral en computadora (§3).
4. Construí las pantallas en este orden: Inicio, Presupuesto, Detalle de categoría, Bandeja, Registrar gasto, Cuentas, Gasto semanal (§4–§10). Para cada una hacé primero la vista principal y después cada estado listado.
5. Agregá las transiciones (§11) al final, detrás de `prefers-reduced-motion`.
6. Compará cada pantalla con su captura en `referencia/` en los dos temas.

## Reglas que no se rompen

- **Tres señales en todo estado financiero**: color del estado + su glifo + su etiqueta en texto. Nunca solo color. Los nombres de los estados y sus textos son los de A.4 ("Deuda sin reservar" por categoría, "Te falta reservar" por tarjeta, etc.).
- **Voseo** en todos los textos ("Asigná", "Tocá", "Revisá").
- **Montos** siempre con `font-variant-numeric: tabular-nums`, en Archivo (nunca en Big Shoulders), con signo y dos decimales: `−$26.30`, `$1,350.00`. El signo menos es U+2212.
- **Tocables de 44 × 44 px** como mínimo (`--tactil-minimo`), aunque el dibujo sea más chico.
- **Ningún gesto obligatorio**: si algo se puede arrastrar, también tiene un botón.
- **Resultados en el lugar**: después de una acción queda un "Resultado de una acción" donde estaba el elemento; no desaparece solo. Aprobar un movimiento **no** tiene "Deshacer" (ofrece "Ver transacción"); descartar sí ("Restaurar").
- **Flujos cortos sobre la pantalla** (hoja inferior en teléfono, panel lateral en computadora); **flujos largos a pantalla completa** (Registrar gasto, revisar un movimiento de la Bandeja).
- **Contenedores sin borde**: superficie + `--elevacion-1` + `--radio-contenedor`. Los bordes de 1 px solo para separar filas dentro de un contenedor (`--borde-sutil`).
- **Reducir movimiento**: con la preferencia activa no hay ninguna animación (ya está en `tokens.css`).
- **Datos de ejemplo**: las pantallas usan los datos reales de A.7. Lo marcado "(ejemplo)" en las capturas es un estado que el anexo pide pero sin datos; reemplazalo por los datos reales de la app.

## Cuando algo no está especificado

Mirá la captura del estado más parecido y usá el mismo componente. Si no existe, combiná componentes de §2 con los tokens; no inventes colores, radios ni tamaños nuevos.
