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
  noSeAplica: 'No se aplica: la categoría está archivada',
  hacia: (categoria: string) => `→ ${categoria}`,
  archivadaEnLista: (categoria: string) => `${categoria} (archivada)`,
  patron: 'El comercio contiene',
  categoria: 'Categoría',
  obligatorio: 'Completá este campo.',
  guardar: 'Guardar regla',
  guardando: 'Guardando…',
  creada: 'Regla creada',
  guardada: 'Regla guardada',
  cancelar: 'Cancelar',
  eliminar: 'Eliminar regla',
  eliminando: 'Eliminando…',
  eliminada: 'Regla eliminada',
  confirmarEliminar: (patron: string) =>
    `¿Eliminar la regla «${patron}»? Los próximos SMS de ese comercio tomarán la categoría del historial.`,
  confirmarSi: 'Sí, eliminar',
  noEliminar: 'No eliminar',
  sinCategorias: 'Primero creá una categoría para poder armar una regla.',
} as const;
