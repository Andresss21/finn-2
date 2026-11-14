// node aviso.test.js — pruebas de la lógica de referencia con un reloj falso
var assert = require('assert');
var crearAviso = require('./aviso.js').crearAviso;

function relojFalso() {
  var ahora = 0, tareas = [], id = 0;
  return {
    poner: function (f, ms) { tareas.push({ id: ++id, en: ahora + ms, f: f }); return id; },
    quitar: function (i) { tareas = tareas.filter(function (t) { return t.id !== i; }); },
    avanzar: function (ms) {
      var fin = ahora + ms;
      for (;;) {
        tareas.sort(function (a, b) { return a.en - b.en; });
        if (!tareas.length || tareas[0].en > fin) break;
        var t = tareas.shift(); ahora = t.en; t.f();
      }
      ahora = fin;
    }
  };
}
var mov = { id: 'farmacia', palabra: 'Movida', frase: 'Moviste Farmacia a Comida fuera: ahora es la segunda.', accion: { texto: 'Deshacer', inversa: function () {} } };
var creada = { id: 'mascota', palabra: 'Creada', frase: 'Creaste la categoría Mascota en Casa.' };

// 1. Se va a los 3 s, con 220 ms de salida
var r = relojFalso(), a = crearAviso({ reloj: r });
a.mostrar(mov);
r.avanzar(2999); assert.strictEqual(a.estado().fase, 'visible');
r.avanzar(1); assert.strictEqual(a.estado().fase, 'saliendo');
assert.ok(a.verDeshacerEnFila('farmacia'), '↶ aparece mientras se va');
r.avanzar(220); assert.strictEqual(a.estado().actual, null);
assert.ok(a.verDeshacerEnFila('farmacia'), '↶ queda después');

// 2. La pausa detiene el reloj; reanudar cuenta 3 s completos otra vez
r = relojFalso(); a = crearAviso({ reloj: r });
a.mostrar(mov); r.avanzar(2500); a.pausar(); r.avanzar(10000);
assert.strictEqual(a.estado().fase, 'visible'); assert.ok(!a.verDeshacerEnFila('farmacia'), 'sin ↶ mientras se ve la etiqueta');
a.reanudar(); r.avanzar(2999); assert.strictEqual(a.estado().fase, 'visible');
r.avanzar(1 + 220); assert.strictEqual(a.estado().actual, null);

// 3. Pausar durante la salida la trae de vuelta
r = relojFalso(); a = crearAviso({ reloj: r });
a.mostrar(mov); r.avanzar(3100); assert.strictEqual(a.estado().fase, 'saliendo');
a.pausar(); r.avanzar(1000); assert.strictEqual(a.estado().fase, 'visible');

// 4. Un resultado nuevo reemplaza al anterior y reinicia el reloj; sin inverso no hay ↶
r = relojFalso(); a = crearAviso({ reloj: r });
a.mostrar(mov); r.avanzar(2000); a.mostrar(creada);
assert.strictEqual(a.estado().actual.id, 'mascota');
assert.ok(!a.verDeshacerEnFila('farmacia'), 'el ↶ anterior se va con la acción siguiente');
r.avanzar(2999); assert.strictEqual(a.estado().fase, 'visible');

// 5. Movimiento reducido: se quita sin esperar la salida
r = relojFalso(); a = crearAviso({ reloj: r, movimientoReducido: function () { return true; } });
a.mostrar(mov); r.avanzar(3000); assert.strictEqual(a.estado().actual, null);

// 6. Cerrar y otra acción
r = relojFalso(); a = crearAviso({ reloj: r });
a.mostrar(mov); a.cerrar(); assert.strictEqual(a.estado().actual, null); assert.ok(a.verDeshacerEnFila('farmacia'));
a.otraAccion(); assert.ok(!a.verDeshacerEnFila('farmacia'));

console.log('aviso: 6 casos, todo bien');
