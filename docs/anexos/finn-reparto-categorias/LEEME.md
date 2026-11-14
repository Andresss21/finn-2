# Finn 2.0 · Registrar gasto: dividir mi gasto entre categorías (C-49)

Copiá esta carpeta como `docs/diseno/reparto-categorias/` y dale al agente `PROMPT-REPARTO.md`.

| Archivo | Qué es |
|---|---|
| `PROMPT-REPARTO.md` | El encargo, con los criterios CA-R-1 a CA-R-16 |
| `REPARTO-ENTRE-CATEGORIAS.md` | La especificación: sección, filas, modos, resumen, Guardar, edición y textos |
| `DECISIONES.md` | El registro completo, con C-49 después de C-48 (cierra P-1 de C-45) |
| `referencias/` | 13 estados en teléfono y computadora, de día y de noche, en HTML y PNG |
| `logica/reparto.js` | El cálculo del prototipo: «Lo que queda», partes iguales, porcentaje y resumen |

Estados de las referencias:
- **Una categoría:** una categoría y con alguien con una categoría.
- **Varias categorías:** lista abierta, dos categorías, tres en partes iguales y porcentaje incompleto.
- **Errores:** falta repartir, sin categoría al guardar, las categorías pasan tu parte y las personas no cierran.
- **Con alguien:** con alguien y categorías.
- **Límites:** máximo de partes.
- **Edición:** editar una dividida.

En todas, «¿Quién paga?» es la sección completa de C-45.
