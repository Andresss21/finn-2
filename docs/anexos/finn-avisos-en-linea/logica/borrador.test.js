// node borrador.test.js
var assert = require('assert');
var b = require('./borrador.js');
// 1. Sin borrador: nada
assert.deepStrictEqual(b.alAbrir(null), { mostrarAviso: false, borrador: null });
// 2. Primera apertura: aviso y queda marcado
var r = b.alAbrir({ valores: { nombre: 'Netflix' } });
assert.strictEqual(r.mostrarAviso, true); assert.strictEqual(r.borrador.avisoVisto, true);
// 3. Segunda apertura del mismo borrador: sin aviso, mismos valores
var r2 = b.alAbrir(r.borrador);
assert.strictEqual(r2.mostrarAviso, false); assert.strictEqual(r2.borrador.valores.nombre, 'Netflix');
// 4. Escribir no reinicia el aviso
var c = b.alCambiar(r.borrador, { nombre: 'Netflix', monto: '$16.99' });
assert.strictEqual(b.alAbrir(c).mostrarAviso, false);
// 5. «Descartar borrador» se ve mientras haya borrador
assert.strictEqual(b.verDescartar(c), true); assert.strictEqual(b.verDescartar(null), false);
// 6. Un borrador nuevo (después de descartar o guardar) vuelve a avisar una vez
assert.strictEqual(b.alAbrir({ valores: { nombre: 'Gimnasio' } }).mostrarAviso, true);
console.log('borrador: 6 casos, todo bien');
