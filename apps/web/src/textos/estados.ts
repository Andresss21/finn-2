// Textos de los estados de pantalla (05 §7.1 a §7.3, §12.1): carga, error de la consulta, «no existe» y las tres clases
// de vacío (FE-34). Voseo (§12.2).
export const estados = {
  cargando: 'Cargando la pantalla',
  errorTitulo: 'Algo salió mal y no se pudo cargar esta pantalla.',
  referencia: (id: string) => `Referencia: ${id}`,
  noExisteTitulo: 'Esto ya no existe.',
  noExisteTexto: 'Puede que se haya eliminado o que el enlace ya no sea válido.',
  irA: (seccion: string) => `Ir a ${seccion}`,
  primerUso: {
    titulo: 'Empecemos por lo primero',
    texto: 'Creá tu primera cuenta y revisá las categorías para empezar a presupuestar.',
    crearCuenta: 'Crear una cuenta',
    revisarCategorias: 'Revisar las categorías',
  },
  sinResultados: {
    titulo: 'Sin resultados con estos filtros',
    texto: 'Probá con otros filtros o quitalos para ver todo.',
    quitar: 'Quitar filtros',
  },
} as const;
