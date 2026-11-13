// Textos de `/reglas`, `/reglas/nueva` y `/reglas/[reglaId]` (FT-39; 05 §2, §7). Voseo (05 §12.2). Los rechazos
// (`patron_repetido`, `categoria_archivada`, `categoria_de_pago_no_permitida`) los trae el servidor en `mensaje` (04 §7).
export const reglas = {
  titulo: 'Reglas',
  nuevaRegla: 'Nueva regla',
  tituloNueva: 'Nueva regla',
  tituloEditar: 'Editar regla',
  vacioTitulo: 'Todavía no hay reglas',
  vacioTexto:
    'Las reglas se crean al aprobar un movimiento con «Recordar esta categoría», o desde acá.',
  buscar: 'Buscar reglas',
  buscarMarcador: 'Comercio o categoría',
  sinCoincidencias: 'Ninguna regla con ese texto',
  // E4-22: el vacío de la búsqueda dice qué se buscó y ofrece quitarla.
  ningunaPara: (busqueda: string) => `Ninguna regla para ${busqueda}.`,
  quitarBusqueda: 'Quitar la búsqueda',
  noSeAplica: 'No se aplica: la categoría está archivada',
  hacia: (categoria: string) => `→ ${categoria}`,
  archivadaEnLista: (categoria: string) => `${categoria} (archivada)`,
  patron: 'El comercio contiene',
  // [CH-251] E4-22: comercios que contienen el patrón (de `ReglaDto.coincideCon`).
  coincideCon: (comercios: readonly string[]) => `Coincide con: ${comercios.join(', ')}.`,
  categoria: 'Categoría',
  obligatorio: 'Completá este campo.',
  guardar: 'Guardar regla',
  guardando: 'Guardando…',
  sinCambios: 'Todavía no cambiaste nada.',
  creada: 'Regla creada',
  guardada: 'Regla guardada',
  cancelar: 'Cancelar',
  eliminar: 'Eliminar regla',
  eliminando: 'Eliminando…',
  eliminada: 'Regla eliminada',
  confirmarEliminar: (patron: string) =>
    `¿Eliminar la regla «${patron}»? Los próximos SMS de ese comercio tomarán la categoría del historial.`,
  confirmarSi: 'Eliminar',
  noEliminar: 'Cancelar',
  sinCategorias: 'Primero creá una categoría para poder armar una regla.',
} as const;
