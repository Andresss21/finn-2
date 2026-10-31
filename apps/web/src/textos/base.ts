// Textos de los componentes base (05 §10.7): estados propios del componente, no de una pantalla.
export const base = {
  opcional: 'Opcional',
  guardando: 'Guardando…',
  buscando: 'Buscando…',
  sinResultados: 'Sin resultados',
  errorBusqueda: 'No pudimos buscar. Probá de nuevo.',
  resultados: (n: string) => (n === '1' ? '1 resultado' : `${n} resultados`),
  signoDelMonto: 'Signo del monto',
  montoIncompleto: 'Escribí un monto.',
  montoSeparador: 'Usá el punto o la coma solo para los centavos, sin separador de miles.',
  montoMaximo: 'El monto máximo es $21,474,836.47.',
  montoVistaPrevia: (monto: string) => `Se entiende como ${monto}`,
  fechaFuera: 'Elegí una fecha dentro del rango permitido.',
  fechaVistaPrevia: (fecha: string) => `Fecha elegida: ${fecha}`,
} as const;
