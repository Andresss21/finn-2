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
  // Pantallas de ingreso (05 §9.3 y §9.4, FT-01)
  tituloIngresar: 'Ingresar',
  email: 'Email',
  contrasena: 'Contraseña',
  mostrarContrasena: 'Mostrar contraseña',
  ocultarContrasena: 'Ocultar contraseña',
  ingresar: 'Ingresar',
  ingresando: 'Ingresando…',
  escribiEmail: 'Escribí tu email.',
  escribiContrasena: 'Escribí tu contraseña.',
  sinRecuperacion:
    'Finn no tiene registro ni recuperación de contraseña en la app. Si la perdiste, seguí el procedimiento del repositorio.',
  tituloVerificar: 'Verificá tu código',
  introVerificar: 'Escribí el código de 6 dígitos que muestra tu app de autenticación.',
  codigo: 'Código',
  codigoSeisDigitos: 'Escribí los 6 dígitos del código.',
  factor: 'Factor',
  verificar: 'Verificar',
  verificando: 'Verificando…',
  usarOtraCuenta: 'Usar otra cuenta',
  saliendo: 'Saliendo…',
} as const;
