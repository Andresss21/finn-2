// Textos de los componentes base (05 §10.7): estados propios del componente, no de una pantalla.
export const base = {
  opcional: 'Opcional',
  guardando: 'Guardando…',
  buscando: 'Buscando…',
  sinResultados: 'Sin resultados',
  errorBusqueda: 'No pudimos buscar. Probá de nuevo.',
  resultados: (n: string) => (n === '1' ? '1 resultado' : `${n} resultados`),
} as const;
