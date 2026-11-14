# Finn 2.0 · Avisos en línea: línea compacta (C-51)

Copiá esta carpeta como `docs/diseno/avisos-en-linea/` y dale al agente `PROMPT-AVISOS.md`.

| Archivo | Qué es |
|---|---|
| `PROMPT-AVISOS.md` | El encargo, con los criterios CA-L-1 a CA-L-13 |
| `AVISOS-EN-LINEA.md` | La especificación: anatomía, cuatro tipos de permanencia, borrador recuperado, Inicio y accesibilidad |
| `DECISIONES.md` | El registro completo, con C-51 después de C-50 |
| `referencias/pantallas/` | 6 estados en teléfono y computadora, de día y de noche, en HTML y PNG |
| `referencias/catalogo/` | Un aviso de cada tipo y tono, y uno dentro de una superficie |
| `logica/borrador.js` | Cuándo sale el aviso del borrador; `node logica/borrador.test.js` corre sus 6 pruebas |
| `logica/aviso.js` | El reloj de C-50 (3 s, pausa), que usa el aviso momentáneo |

Estados de `referencias/pantallas/`:
- **inicio-version-nueva:** la pastilla con «Recargar». La Bandeja es una fila de «Necesita tu atención».
- **inicio-sin-conexion:** la pastilla sin acción.
- **borrador-aparece:** el aviso con su descripción, y «Descartar borrador» al pie.
- **borrador-se-va:** un fotograma a mitad de la salida.
- **borrador-se-fue:** sin aviso. Así se ve también al volver a abrir.
- **borrador-descartado:** el formulario vacío, sin el enlace.

Los campos del formulario y la barra lateral son esquemáticos. En la app van los campos de C-48 y la barra marca la sección donde estás.
