// Finn 2.0 · C-50 · Etiqueta de resultado: reloj, pausa y «Deshacer» después (lógica de referencia, sin interfaz)
//
// Un solo aviso a la vez. mostrar() lo reemplaza; se va solo a los `duracion` ms; pausar() lo detiene
// (puntero encima, foco dentro, arrastre en curso) y reanudar() vuelve a contar la duración completa.
// Cuando el resultado tiene inverso, queda `ultimo` para el ↶ de la fila hasta la siguiente acción.
//
// const aviso = crearAviso({ duracion: leerMs('--duracion-aviso', 3000), salida: leerMs('--duracion-normal', 220),
//                            movimientoReducido: () => matchMedia('(prefers-reduced-motion: reduce)').matches,
//                            alCambiar: (estado) => render(estado) });
// aviso.mostrar({ id: 'farmacia', palabra: 'Movida', frase: 'Moviste Farmacia a Comida fuera: ahora es la segunda.',
//                 accion: { texto: 'Deshacer', inversa: () => api.moverCategoria(...) } });

function crearAviso(op) {
  var duracion = op.duracion == null ? 3000 : op.duracion;
  var salida = op.salida == null ? 220 : op.salida;
  var reducido = op.movimientoReducido || function () { return false; };
  var reloj = op.reloj || { poner: setTimeout, quitar: clearTimeout };
  var estado = { actual: null, fase: 'nada', pausado: false, ultimo: null };
  var t1 = null, t2 = null;

  function avisar() { if (op.alCambiar) op.alCambiar({ actual: estado.actual, fase: estado.fase, pausado: estado.pausado, ultimo: estado.ultimo }); }
  function limpiar() { if (t1) reloj.quitar(t1); if (t2) reloj.quitar(t2); t1 = t2 = null; }
  function contar() {
    limpiar();
    t1 = reloj.poner(function () {
      t1 = null; estado.fase = 'saliendo'; avisar();
      t2 = reloj.poner(function () { t2 = null; estado.actual = null; estado.fase = 'nada'; avisar(); }, reducido() ? 0 : salida);
    }, duracion);
  }

  return {
    // Resultado nuevo: reemplaza al anterior. `accion.inversa` existe solo si hay «Deshacer».
    mostrar: function (r) {
      estado.actual = r; estado.fase = 'visible'; estado.pausado = false;
      estado.ultimo = r.accion && r.accion.inversa ? r : null;
      avisar(); contar();
    },
    // Puntero encima, foco dentro de la etiqueta o arrastre en curso.
    pausar: function () {
      if (!estado.actual) return;
      limpiar();
      if (estado.fase === 'saliendo') estado.fase = 'visible';
      estado.pausado = true; avisar();
    },
    // Salió el puntero, el foco dejó la etiqueta o terminó el arrastre sin resultado nuevo: cuenta la duración completa otra vez.
    reanudar: function () {
      if (!estado.actual || !estado.pausado) return;
      estado.pausado = false; avisar(); contar();
    },
    // × de una banda o Escape con el foco en la etiqueta.
    cerrar: function () { limpiar(); estado.actual = null; estado.fase = 'nada'; estado.pausado = false; avisar(); },
    // Cualquier otra acción que cambia datos sin resultado propio: el ↶ se va.
    otraAccion: function () { estado.ultimo = null; avisar(); },
    // ↶ visible en la fila `id`: hay inverso y la etiqueta de esa fila ya no se ve (o se está yendo).
    verDeshacerEnFila: function (id) {
      return !!(estado.ultimo && estado.ultimo.id === id && (!estado.actual || estado.actual.id !== id || estado.fase === 'saliendo'));
    },
    estado: function () { return estado; }
  };
}

if (typeof module !== 'undefined') module.exports = { crearAviso: crearAviso };
