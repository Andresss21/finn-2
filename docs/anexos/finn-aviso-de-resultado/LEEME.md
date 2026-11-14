# Finn 2.0 · Etiqueta de resultado (C-50)

Copiá esta carpeta como `docs/diseno/aviso-de-resultado/` y dale al agente `PROMPT-AVISO.md`.

| Archivo | Qué es |
|---|---|
| `PROMPT-AVISO.md` | El encargo, con los criterios CA-A-1 a CA-A-17 |
| `AVISO-DE-RESULTADO.md` | La especificación: anatomía, dónde se pega, tiempo, ↶, accesibilidad, textos exactos y alcance |
| `DECISIONES.md` | El registro completo: principio 5 enmendado y C-50 después de C-49 |
| `estilos/tokens-propuesta.css` | El token nuevo `--duracion-aviso: 3000ms`, al final, con su motivo |
| `referencias/estructura/` | 7 estados en teléfono y computadora, de día y de noche, en HTML y PNG |
| `referencias/variantes/` | Fila con monto y fila que se va, sobre un esquema de la Bandeja |
| `logica/aviso.js` | Reloj, pausa y ↶ de referencia; `node logica/aviso.test.js` corre sus 6 pruebas |

Estados de `referencias/estructura/`:
- **aparece:** «Movida» con «Deshacer» sobre Farmacia, ya en Comida fuera.
- **en-pausa-por-foco:** el foco está en «Deshacer» y la etiqueta espera.
- **se-va:** un fotograma a mitad de la salida.
- **despues:** queda ↶ en la fila.
- **despues-de-deshacer:** Farmacia de vuelta en Casa, con «Volvió».
- **categoria-creada:** «Creada», sin acción.
- **grupo-movido:** «Movido» con «Deshacer» en el encabezado de Ahorro.

El esquema de `variantes/` muestra solo la regla. Las filas de la Bandeja son las de sus referencias aprobadas.
