// Textos de `/ajustes/formatos` (FT-73; 05 §2.11, §12; 04 §8.5, §8.7). Voseo (05 §12.2). Los rechazos de la política del patrón
// (`patron_invalido`, `banderas_no_permitidas`, `grupos_obligatorios`, `patron_lento`) llegan ya compuestos del servidor en su campo
// (04 §7.10 [CH-240] [CH-247]): acá no se repiten. Los textos de E5-10 a E5-13 son los del diseño de la entrega 4. Los textos de Instituciones se suman con su parte (CH-125).
export const ajustesFormatos = {
  titulo: 'Formatos bancarios',
  enlace: 'Formatos bancarios',
  descripcion: 'Cómo Finn lee los SMS de cada banco. Los cambios rigen desde el próximo SMS.',
  nuevo: 'Nuevo formato',
  instituciones: 'Instituciones',
  vacio: {
    titulo: 'Todavía no hay formatos',
    texto: 'Creá el primero para que Finn lea los SMS de tu banco.',
  },
  sinUsos: 'Sin usos todavía',
  usos: (n: number | string, ultimo: string) =>
    `${n} ${Number(n) === 1 ? 'uso' : 'usos'} · último ${ultimo}`,
  inactivo: 'Inactivo',
  tituloNuevo: 'Nuevo formato',
  tituloEditar: 'Editar formato',
  tipos: {
    compra: 'Compra',
    deposito: 'Depósito',
    pago_tarjeta: 'Pago de tarjeta',
    devolucion: 'Devolución',
  },
  separadoresMiles: { ',': 'Coma', '.': 'Punto', '': 'Ninguno' },
  separadoresDecimal: { '.': 'Punto', ',': 'Coma' },
  campos: {
    institucion: 'Institución',
    elegirInstitucion: 'Elegí una institución',
    nombre: 'Nombre del formato',
    tipo: 'Tipo de movimiento',
    patron: 'Patrón',
    patronAyuda:
      'Una expresión regular con los grupos ultimos4 y monto; fecha si elegís formatos de fecha.',
    banderas: 'Banderas',
    banderasAyuda: 'Solo i, m, s y u, en ese orden.',
    miles: 'Separador de miles',
    decimal: 'Separador decimal',
    fechas: 'Formatos de fecha',
    fechasAyuda: 'Se prueban en este orden.',
    activo: 'Activo',
    activoAyuda: 'Un formato inactivo no se usa para leer los SMS. Los formatos no se eliminan.',
  },
  guardar: 'Guardar formato',
  guardando: 'Guardando…',
  listo: 'Formato guardado',
  guardado: {
    titulo: (institucion: string, nombre: string) =>
      `Guardaste ${institucion} · ${nombre}. Rige desde el próximo SMS.`,
    // CA-E5-15: el servidor no informa cuántos SMS sin reconocer hay de la institución, así que la frase va sin número
    sinNumero: (institucion: string) =>
      `Si tenés SMS sin reconocer de ${institucion}, probalos de nuevo desde la Bandeja.`,
    verlos: 'Verlos en la Bandeja',
  },
  probar: {
    titulo: 'Probar con un SMS',
    sinSms:
      'No hay SMS sin reconocer ni con error para probar. Cuando llegue uno, lo vas a poder elegir acá.',
    elegir: 'SMS para probar',
    boton: 'Probar',
    probando: 'Probando…',
    nada: 'Probar no guarda nada.',
    noReconocido: 'No reconocido',
    conError: 'Con error',
    coincide: 'El formato reconoce este SMS.',
    demasiadoLargo: 'El SMS es demasiado largo: Finn no lo interpreta.',
    patron: 'El patrón no coincide con el texto.',
    fallo: {
      ultimos4: 'Falló el normalizador de los últimos 4 dígitos.',
      monto: 'Falló el normalizador del monto.',
      fecha: 'Falló el normalizador de la fecha.',
    },
    grupos: 'Grupos capturados',
    grupo: 'Grupo',
    capturo: 'Capturó',
    seLee: 'Se lee como',
    sinGrupos: 'No se capturó ningún grupo.',
  },
} as const;
