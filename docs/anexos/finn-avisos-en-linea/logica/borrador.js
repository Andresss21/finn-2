// Finn 2.0 · C-51 · Aviso de borrador recuperado: sale una sola vez por borrador (lógica de referencia, sin interfaz).
//
// El borrador vive donde ya vive (05 §4.11, `finn:borrador:v1:<flujo>`). C-51 le agrega un dato: `avisoVisto`.
// Al abrir un flujo largo:
//   const r = alAbrir(leerBorrador(clave));
//   if (r.mostrarAviso) aviso.mostrar(...)      // reloj y pausa: crearAviso de C-50 (aviso-de-resultado/logica/aviso.js)
//   guardarBorrador(clave, r.borrador);         // queda marcado como visto
// Al escribir en un campo con el aviso a la vista: se quita con la salida de --duracion-normal (sin animación con movimiento reducido).
// «Descartar borrador» (al pie, mientras haya borrador): borrar la clave y vaciar el formulario.
// Guardar con éxito: borrar la clave, como hoy.

function alAbrir(borrador) {
  if (!borrador) return { mostrarAviso: false, borrador: null };
  if (borrador.avisoVisto) return { mostrarAviso: false, borrador: borrador };
  var marcado = {}; for (var k in borrador) marcado[k] = borrador[k];
  marcado.avisoVisto = true;
  return { mostrarAviso: true, borrador: marcado };
}

// Un cambio nuevo no vuelve a mostrar el aviso: el borrador sigue siendo el mismo hasta guardarse o descartarse.
function alCambiar(borrador, valores) {
  var r = {}; for (var k in borrador || {}) r[k] = borrador[k];
  r.valores = valores;
  if (borrador && borrador.avisoVisto) r.avisoVisto = true;
  return r;
}

function verDescartar(borrador) { return !!borrador; }

if (typeof module !== 'undefined') module.exports = { alAbrir: alAbrir, alCambiar: alCambiar, verDescartar: verDescartar };
