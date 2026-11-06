// Textos de `/bandeja` (FT-34, 05 §2.5, 06-identidad-visual §7). Los de cada fila están en `cuentas.bandeja`; los avisos
// y push de AV-23 son los de 04 §11.4. Voseo (§12.2).
const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

export const bandeja = {
  titulo: 'Bandeja',
  porRevisar: (n: number) => `${n} por revisar`,
  lista: 'Movimientos por revisar',
  desglose: {
    pendientes: (n: number) => plural(n, 'pendiente', 'pendientes'),
    conCoincidencia: (n: number) => plural(n, 'con coincidencia', 'con coincidencia'),
    posiblesDuplicados: (n: number) => plural(n, 'posible duplicado', 'posibles duplicados'),
    noReconocidos: (n: number) => plural(n, 'no reconocido', 'no reconocidos'),
    errores: (n: number) => plural(n, 'con error', 'con error'),
  },
  nota: 'Tocá un movimiento para revisarlo completo.',
  alDia: {
    titulo: 'Bandeja al día',
    texto: 'No hay movimientos por revisar.',
  },
  // FT-37: descartar, restaurar y los descartados (05 §4.14; «No hay movimientos descartados» y «No es este pago» son nuevos)
  descartaste: (nombre: string) => `Descartaste ${nombre}.`,
  restauraste: (nombre: string) => `Restauraste ${nombre}.`,
  restaurar: 'Restaurar',
  esDuplicado: 'Es duplicado',
  noEsEstePago: 'No es este pago',
  resolver: 'Resolver este movimiento',
  vistas: {
    nombre: 'Vista de la Bandeja',
    activos: 'Por revisar',
    activosConConteo: (n: number) => `Por revisar · ${n}`,
    descartados: 'Descartados',
  },
  descartados: {
    lista: 'Movimientos descartados',
    vacio: {
      titulo: 'No hay movimientos descartados',
      texto: 'Lo que descartes aparece acá, para que lo restaures si te equivocaste.',
    },
    descartado: 'Descartado',
    autodescartado: 'Autodescartado',
    verMas: 'Ver más descartados',
  },
  // FT-38: SMS no reconocidos y con error (lo mínimo para confirmar lo que se hizo)
  reprocesado: 'Se volvió a procesar este SMS.',
  referenciaCopiada: 'Referencia copiada.',
  noSePudoCopiar: (referencia: string) => `No se pudo copiar. La referencia es ${referencia}.`,
  // FT-35: aprobar con un toque (05 §4.15) y revisar el movimiento completo (`/bandeja/[movimientoId]`)
  aprobado: (...partes: string[]) => `Aprobado: ${partes.join(' · ')}`,
  aprobadoSinDatos: 'Aprobado',
  dividido: (n: number) => `Dividido en ${n} partes`,
  porCobrarA: (nombre: string) => `Por cobrar: ${nombre}`,
  verTransaccion: 'Ver transacción',
  // FT-36: Aprobar todos (OP-38) y AV-19. «Aprobar todos ({n})» es nuevo; los motivos son los de 04 OP-38
  aprobarTodos: {
    boton: (n: number) => `Aprobar todos (${n})`,
    aprobando: 'Aprobando…',
    aprobaste: (n: number) => `Aprobaste ${n} ${n === 1 ? 'movimiento' : 'movimientos'}.`,
    noAprobados: (n: number) =>
      n === 1 ? 'No se aprobó 1 movimiento' : `No se aprobaron ${n} movimientos`,
    sinComercio: 'Movimiento sin comercio',
    motivos: {
      requiere_revision_individual: 'Requiere revisión individual (afecta un período cerrado).',
      pago_sin_origen: 'Elegí de qué cuenta salió el pago.',
    } as Readonly<Record<string, string>>,
  },
  // FT-78: arrastrar un movimiento a una categoría (CF-21, CF-22, FD-30)
  arrastre: {
    asa: (detalle: string) => `Arrastrar ${detalle} a una categoría`,
    instrucciones:
      'Para arrastrar, presioná Espacio. Mientras arrastrás, usá las flechas para elegir una categoría, Espacio para soltar o Escape para cancelar.',
    tomaste: (comercio: string) => `Tomaste ${comercio}.`,
    sobre: (categoria: string) => `Sobre ${categoria}.`,
    soltaste: (comercio: string, categoria: string) => `Soltaste ${comercio} en ${categoria}.`,
    cancelado: 'Arrastre cancelado.',
    panel: 'Destinos del arrastre',
    sugerida: (categoria: string) => `Sugerida: ${categoria}`,
    otra: 'Otra categoría…',
    sinComercio: 'el movimiento',
  },
  revisar: {
    titulo: 'Revisar movimiento',
    sms: 'Texto del SMS',
    detalleError: 'Detalle del error',
    referencia: 'Referencia',
    tipo: 'Tipo',
    tipos: {
      gasto: 'Gasto',
      ingreso: 'Ingreso',
      pago_tarjeta: 'Pago de tarjeta',
      devolucion: 'Devolución',
    },
    monto: 'Monto',
    aprobar: 'Aprobar',
    // CH-136: el pie fijo dice cuánto se aprueba, como «Guardar $X» de Registrar gasto
    aprobarMonto: (monto: string) => `Aprobar ${monto}`,
    categoriaSugerida: (nombre: string, porRegla: boolean) =>
      `Categoría sugerida: ${nombre} (${porRegla ? 'por regla' : 'de tu historial'})`,
    aprobando: 'Aprobando…',
    aprobadoYa: 'Este movimiento ya se aprobó.',
    descartadoYa: 'Este movimiento está descartado.',
    volver: 'Volver a la Bandeja',
    coincidencia: 'Coincide con un pago programado',
    coincidePendiente: (programada: string, fecha: string, monto: string) =>
      `Coincide con «${programada}» esperada el ${fecha} por ${monto}. Al confirmar, se crea la transacción y la ocurrencia queda emparejada.`,
    coincideRegistrada: (programada: string, fecha: string, monto: string) =>
      `Coincide con «${programada}» del ${fecha} por ${monto}, que Finn ya registró. Al confirmar, esa transacción pasa al monto del SMS y no se crea otra.`,
    confirmarCoincidencia: 'Confirmar',
    confirmando: 'Confirmando…',
    recordar: 'Recordar esta categoría para este comercio',
    revisarImpacto: 'Revisá antes de aprobar',
    // CH-137: los estados con pantalla propia (S4 del export; los textos de esta lista son nuevos)
    programada: 'Programada',
    fechaEsperada: 'Fecha esperada',
    montoEsperado: 'Monto esperado',
    coincidenciaNota:
      'Un movimiento con coincidencia no se descarta: si no es este pago, se revisa como un gasto nuevo.',
    igualA: (fecha: string) => `Igual a un gasto del ${fecha}`,
    igualDetalle: 'Ya hay un gasto igual en la misma cuenta, el mismo día y por el mismo monto.',
    duplicadoNota: '«Es duplicado» lo descarta; se puede restaurar desde Descartados.',
    noReconocido:
      'No encontramos un formato que lea este SMS. Podés registrarlo a mano con el texto a la vista o descartarlo.',
    falloTitulo: 'Algo falló al procesarlo',
    falloTexto:
      'Algo falló al procesar este SMS. No se registró nada. Podés intentarlo de nuevo; si vuelve a fallar, guardá la referencia.',
    referenciaNota: 'La misma referencia aparece en Ajustes › Diagnóstico.',
    siguiente: 'Siguiente movimiento',
    soloLectura: 'Solo lectura',
    panel: {
      posicion: (n: number, total: number) => `${n} de ${total}`,
      anterior: 'Anterior',
      siguiente: 'Siguiente',
    },
  },
} as const;
