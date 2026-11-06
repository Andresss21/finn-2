// Textos de `/ajustes/respaldo` (FT-76; 05 §12; 04 §16). El respaldo lo hace GitHub Actions: la pantalla solo informa.
export const ajustesRespaldo = {
  titulo: 'Respaldo',
  enlace: 'Respaldo',
  descripcion:
    'Cada noche una copia de tus datos se guarda fuera de Finn, y cada mes se prueba que se pueda restaurar.',
  atrasadoEnIndice: 'Respaldo atrasado',
  respaldo: 'Último respaldo',
  restauracion: 'Última prueba de restauración',
  nunca: 'Todavía no hay ninguno.',
  alDia: 'Al día',
  atrasado: 'Atrasado',
  respaldoAtrasado: 'Pasaron más de 36 horas desde el último respaldo. Revisá el diagnóstico.',
  restauracionAtrasada: 'Pasaron más de 35 días desde la última prueba de restauración.',
  verDiagnostico: 'Ver el diagnóstico',
} as const;
