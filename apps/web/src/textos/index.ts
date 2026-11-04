// Catálogo de textos de la interfaz (05 §12.1, FE-23): un objeto `as const` por área.
// Cada ficha agrega su área acá; ningún texto literal va en JSX fuera de `src/textos/` (L8).
import { actividad } from './actividad.ts';
import { ajustesCiclo } from './ajustes-ciclo.ts';
import { ajustesFormatos } from './ajustes-formatos.ts';
import { ajustesInstituciones } from './ajustes-instituciones.ts';
import { ajustesExportar } from './ajustes-exportar.ts';
import { ajustesApariencia } from './ajustes-apariencia.ts';
import { ajustesWebhook } from './ajustes-webhook.ts';
import { autenticacion } from './autenticacion.ts';
import { bandeja } from './bandeja.ts';
import { base } from './base.ts';
import { categoriaDetalle } from './categoria-detalle.ts';
import { categoriaPago } from './categoria-pago.ts';
import { categoriasArchivar } from './categorias-archivar.ts';
import { categoriasFusionar } from './categorias-fusionar.ts';
import { cuentaDetalle } from './cuenta-detalle.ts';
import { cuentas } from './cuentas.ts';
import { cuentasCuota } from './cuentas-cuota.ts';
import { cuentasNueva } from './cuentas-nueva.ts';
import { dominio } from './dominio.ts';
import { estados } from './estados.ts';
import { estructura } from './estructura.ts';
import { formularios } from './formularios.ts';
import { alcanceReserva, glosario } from './glosario.ts';
import { ingreso } from './ingreso.ts';
import { inicio } from './inicio.ts';
import { instalacion } from './instalacion.ts';
import { metas } from './metas.ts';
import { programadas } from './programadas.ts';
import { navegacion } from './navegacion.ts';
import { plantilla } from './plantilla.ts';
import { porCobrar } from './por-cobrar.ts';
import { presupuesto } from './presupuesto.ts';
import { presupuestoAsignar } from './presupuesto-asignar.ts';
import { presupuestoAutoAsignar } from './presupuesto-auto-asignar.ts';
import { presupuestoMover } from './presupuesto-mover.ts';
import { primerosPasos } from './primeros-pasos.ts';
import { registrarGasto } from './registrar-gasto.ts';
import { registrarTipo } from './registrar-tipo.ts';
import { reportes } from './reportes.ts';
import { transaccion } from './transaccion.ts';
import { verificarSaldo } from './verificar-saldo.ts';

export {
  actividad,
  ajustesCiclo,
  ajustesFormatos,
  ajustesInstituciones,
  ajustesExportar,
  ajustesApariencia,
  ajustesWebhook,
  autenticacion,
  alcanceReserva,
  bandeja,
  base,
  categoriaDetalle,
  categoriaPago,
  categoriasArchivar,
  categoriasFusionar,
  cuentaDetalle,
  cuentas,
  cuentasCuota,
  cuentasNueva,
  dominio,
  estados,
  estructura,
  formularios,
  glosario,
  ingreso,
  inicio,
  instalacion,
  metas,
  programadas,
  navegacion,
  plantilla,
  porCobrar,
  presupuesto,
  presupuestoAsignar,
  presupuestoAutoAsignar,
  presupuestoMover,
  primerosPasos,
  registrarGasto,
  registrarTipo,
  reportes,
  transaccion,
  verificarSaldo,
};

/** Áreas registradas, en un arreglo para que una prueba detecte nombres repetidos. */
export const areas = [
  ['actividad', actividad],
  ['ajustesCiclo', ajustesCiclo],
  ['ajustesFormatos', ajustesFormatos],
  ['ajustesInstituciones', ajustesInstituciones],
  ['ajustesExportar', ajustesExportar],
  ['ajustesApariencia', ajustesApariencia],
  ['ajustesWebhook', ajustesWebhook],
  ['inicio', inicio],
  ['instalacion', instalacion],
  ['plantilla', plantilla],
  ['porCobrar', porCobrar],
  ['presupuesto', presupuesto],
  ['presupuestoAsignar', presupuestoAsignar],
  ['presupuestoAutoAsignar', presupuestoAutoAsignar],
  ['presupuestoMover', presupuestoMover],
  ['primerosPasos', primerosPasos],
  ['autenticacion', autenticacion],
  ['bandeja', bandeja],
  ['base', base],
  ['categoriaDetalle', categoriaDetalle],
  ['categoriaPago', categoriaPago],
  ['categoriasArchivar', categoriasArchivar],
  ['categoriasFusionar', categoriasFusionar],
  ['cuentaDetalle', cuentaDetalle],
  ['cuentas', cuentas],
  ['cuentasCuota', cuentasCuota],
  ['cuentasNueva', cuentasNueva],
  ['dominio', dominio],
  ['estados', estados],
  ['estructura', estructura],
  ['formularios', formularios],
  ['glosario', glosario],
  ['alcanceReserva', alcanceReserva],
  ['ingreso', ingreso],
  ['navegacion', navegacion],
  ['registrarGasto', registrarGasto],
  ['registrarTipo', registrarTipo],
  ['reportes', reportes],
  ['transaccion', transaccion],
  ['verificarSaldo', verificarSaldo],
] as const;
