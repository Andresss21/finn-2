// Textos de `/ajustes/exportar` (FT-75; 05 §12). Los archivos los arma el servidor (OPT-08): acá solo se describen.
export const ajustesExportar = {
  titulo: 'Exportar tus datos',
  descripcion: 'Descargá una copia de tus datos para guardarla o abrirla en otra herramienta.',
  json: {
    titulo: 'Todos tus datos (JSON)',
    detalle:
      'Cuentas, categorías, asignaciones y transacciones con sus líneas y efectos. Los montos van en centavos enteros.',
    descargar: 'Descargar JSON',
  },
  csv: {
    titulo: 'Tus transacciones (CSV)',
    detalle:
      'Una fila por línea de cada transacción, para abrirla en una hoja de cálculo. Los montos van en dólares, con dos decimales y los negativos con guion.',
    descargar: 'Descargar CSV',
  },
  privacidad:
    'El archivo trae tus datos reales y se descarga sin guardarse en la aplicación. Cuidalo como cuidás tu estado de cuenta.',
} as const;
