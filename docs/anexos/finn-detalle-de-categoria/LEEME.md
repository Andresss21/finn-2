# Finn 2.0 · Detalle de categoría: un recorrido (C-52)

Copiá esta carpeta como `docs/diseno/detalle-de-categoria/` y dale al agente `PROMPT-DETALLE.md`.

| Archivo | Qué es |
|---|---|
| `PROMPT-DETALLE.md` | El encargo, con los criterios CA-D-1 a CA-D-16 |
| `DETALLE-DE-CATEGORIA.md` | La especificación: estructura, consumos, acciones, avisos, calendario e historial, movimiento (§8), accesibilidad, textos y alternativas descartadas |
| `DECISIONES.md` | El registro completo, con C-52 después de C-51 |
| `referencias/` | 9 estados en teléfono y computadora, de día y de noche, en HTML y PNG |
| `logica/consumos.js` | Orden, filtros, semanas y plegado; `node logica/consumos.test.js` corre sus 6 pruebas |

Estados de `referencias/`:
- **muchos-consumos:** Salidas con 45 consumos.
- **dia-elegido:** el 9 de octubre tocado en el calendario.
- **ultimos-6:** el historial.
- **sobregiro-con-debito:** Restaurantes, con «Cubrir $26.30».
- **deuda-sin-reservar:** Ropa.
- **con-meta:** Supermercado.
- **sin-consumos:** Regalos.
- **periodo-cerrado:** Restaurantes, 21/08–20/09.
- **mas-acciones:** con «Archivar» deshabilitado.

Las referencias son estáticas: el movimiento está en §8 del documento y se puede probar en el lienzo, tablero «Probar · Detalle de categoría», en modo Play.
