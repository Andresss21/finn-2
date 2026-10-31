// Textos de los componentes base (05 §10.7): estados propios del componente, no de una pantalla.
export const base = {
  opcional: 'Opcional',
  guardando: 'Guardando…',
  buscando: 'Buscando…',
  sinResultados: 'Sin resultados',
  errorBusqueda: 'No pudimos buscar. Probá de nuevo.',
  cerrar: 'Cerrar',
  errorTitulo: 'Algo salió mal',
  errorTexto: 'No pudimos mostrar esto. Probá de nuevo.',
  reintentar: 'Intentar de nuevo',
  estados: {
    positivo: 'Positivo',
    cero: 'En cero',
    advertencia: 'Advertencia',
    problema: 'Problema',
    deuda: 'Deuda',
    'deuda-sin-respaldo': 'Deuda sin respaldo',
    informacion: 'Información',
  },
  resultados: (n: string) => (n === '1' ? '1 resultado' : `${n} resultados`),
} as const;
