// Errores de autenticación de 05 §9.7: códigos propios de las funciones de CP-11.
// El servidor los entrega ya compuestos en su catálogo (04 §7.10); este objeto fija el texto esperado
// de cada código para los estados propios del cliente. No reescribe los del servidor (SP-09).
export const autenticacion = {
  credenciales_invalidas: 'El email o la contraseña no son correctos.',
  demasiados_intentos: 'Hiciste demasiados intentos. Esperá unos minutos y volvé a intentar.',
  codigo_incorrecto: 'El código no es correcto. Revisá que sea el de Finn en tu app.',
  codigo_vencido: 'El código venció. Escribí el que muestra ahora tu app.',
  inscripcion_no_permitida: 'Ya tenés un factor. Ingresá con tu código.',
  factor_unico: 'Agregá otro factor antes de quitar este.',
} as const;
