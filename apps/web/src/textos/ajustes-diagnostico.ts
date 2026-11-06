// Textos de `/ajustes/diagnostico` (FT-76; 05 §12; 04 §7.8, §10.1): los 50 últimos eventos y «Ejecutar tareas ahora».
export const ajustesDiagnostico = {
  titulo: 'Diagnóstico',
  enlace: 'Diagnóstico',
  descripcion: 'Los últimos eventos del sistema. Si algo falló, buscá su referencia.',
  tareasTitulo: 'Tareas del día',
  tareasDetalle: 'Finn las corre solo cada día. Podés correrlas ahora; repetirlas no duplica nada.',
  ejecutar: 'Ejecutar tareas ahora',
  ejecutando: 'Ejecutando…',
  ejecutadas: 'Las tareas terminaron. El evento nuevo aparece arriba en la lista.',
  version: 'Versión desplegada',
  eventos: 'Últimos eventos',
  buscar: 'Buscar por referencia o texto',
  buscarAyuda: 'Pegá la referencia que te mostró el error.',
  sinEventos: 'Todavía no hay eventos.',
  sinResultados: 'Ningún evento coincide con la búsqueda.',
  referencia: 'Referencia',
  nivel: { aviso: 'Aviso', error: 'Error' },
} as const;
