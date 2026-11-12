// Textos de `/ajustes/instituciones` (FT-73; 05 §2.11, §12; OPT-07; E5-14). Voseo (05 §12.2). El rechazo `nombre_repetido` llega ya
// compuesto del servidor en el campo (04 §7.10 [CH-240]): acá no se repite.
export const ajustesInstituciones = {
  titulo: 'Instituciones',
  nueva: 'Nueva institución',
  vacio: {
    titulo: 'Todavía no hay instituciones',
    texto: 'Agregá la primera para poder crear sus formatos.',
  },
  tituloNueva: 'Nueva institución',
  tituloEditar: 'Renombrar institución',
  renombrar: (nombre: string) => `Renombrar ${nombre}`,
  ayudaNueva: 'Después le agregás sus formatos para leer sus SMS.',
  ayudaRenombrar: 'Cambia el nombre en tus cuentas y formatos. Los SMS se siguen leyendo igual.',
  // E5-14 sin «· N cuentas»: `AjustesDto.instituciones` no trae las cuentas (04 §6.11; CH-247 e)
  formatosDe: (n: number) =>
    n === 0 ? 'sin formatos' : n === 1 ? '1 formato' : `${String(n)} formatos`,
  nombre: 'Nombre',
  crear: 'Crear institución',
  guardar: 'Guardar',
  cancelar: 'Cancelar',
  guardando: 'Guardando…',
  formatos: 'Formatos bancarios',
} as const;
