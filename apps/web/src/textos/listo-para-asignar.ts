// Textos de `/presupuesto/listo-para-asignar` (FT-15; 05 §2.3; 06 FT-15). Voseo (05 §12.2). Los avisos de AV-09 y AV-20 son los
// del billete (`dominio.billete`): no se repiten acá.
import { glosario } from './glosario.ts';

export const listoParaAsignar = {
  titulo: glosario.listoParaAsignar,
  volver: 'Volver al presupuesto',
  descomposicion: {
    titulo: 'De dónde sale',
    suma: 'Entradas al presupuesto',
    resta: 'Lo que ya tiene un trabajo o lo redujo',
    ingresos: 'Ingresos',
    otrasEntradas: 'Otras entradas',
    restituciones: 'Restituciones',
    saldosIniciales: 'Saldos iniciales',
    asignadoCerrados: 'Asignado en períodos cerrados',
    asignadoActivo: 'Asignado en el período actual',
    asignadoFuturos: 'Asignado en períodos futuros',
    sobregiroDebito: 'Reducciones por sobregiro con débito',
    pagoExcedente: 'Reducciones por pago excedente',
    enCamino: glosario.enCamino,
  },
  reduccion: {
    titulo: 'Reducción proyectada al cierre',
    texto:
      'Al cierre del período actual, Listo para asignar baja por estos sobregiros con débito y pagos de más.',
    categorias: 'Categorías',
    tarjetas: 'Tarjetas',
    ninguna: 'Nada va a reducir Listo para asignar al cierre del período.',
  },
  historial: {
    titulo: 'Historial',
    grafico: 'Listo para asignar al cierre de cada período',
    resumen: (n: number) => `${n} ${n === 1 ? 'período' : 'períodos'}`,
    nota: 'Cada valor es lo que Listo para asignar valía al cierre de ese período, sin contar lo asignado por adelantado a períodos posteriores.',
    vacio: 'Todavía no hay períodos cerrados.',
  },
} as const;
