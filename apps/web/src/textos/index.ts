// Catálogo de textos de la interfaz (05 §12.1, FE-23): un objeto `as const` por área.
// Cada ficha agrega su área acá; ningún texto literal va en JSX fuera de `src/textos/` (L8).
import { ajustesExportar } from './ajustes-exportar.ts';
import { ajustesWebhook } from './ajustes-webhook.ts';
import { autenticacion } from './autenticacion.ts';
import { bandeja } from './bandeja.ts';
import { base } from './base.ts';
import { categoriaDetalle } from './categoria-detalle.ts';
import { cuentaDetalle } from './cuenta-detalle.ts';
import { cuentas } from './cuentas.ts';
import { cuentasNueva } from './cuentas-nueva.ts';
import { dominio } from './dominio.ts';
import { estados } from './estados.ts';
import { estructura } from './estructura.ts';
import { formularios } from './formularios.ts';
import { alcanceReserva, glosario } from './glosario.ts';
import { ingreso } from './ingreso.ts';
import { navegacion } from './navegacion.ts';
import { plantilla } from './plantilla.ts';
import { presupuesto } from './presupuesto.ts';
import { presupuestoAsignar } from './presupuesto-asignar.ts';
import { primerosPasos } from './primeros-pasos.ts';
import { registrarTipo } from './registrar-tipo.ts';

export {
  ajustesExportar,
  ajustesWebhook,
  autenticacion,
  alcanceReserva,
  bandeja,
  base,
  categoriaDetalle,
  cuentaDetalle,
  cuentas,
  cuentasNueva,
  dominio,
  estados,
  estructura,
  formularios,
  glosario,
  ingreso,
  navegacion,
  plantilla,
  presupuesto,
  presupuestoAsignar,
  primerosPasos,
  registrarTipo,
};

/** Áreas registradas, en un arreglo para que una prueba detecte nombres repetidos. */
export const areas = [
  ['ajustesExportar', ajustesExportar],
  ['ajustesWebhook', ajustesWebhook],
  ['plantilla', plantilla],
  ['presupuesto', presupuesto],
  ['presupuestoAsignar', presupuestoAsignar],
  ['primerosPasos', primerosPasos],
  ['autenticacion', autenticacion],
  ['bandeja', bandeja],
  ['base', base],
  ['categoriaDetalle', categoriaDetalle],
  ['cuentaDetalle', cuentaDetalle],
  ['cuentas', cuentas],
  ['cuentasNueva', cuentasNueva],
  ['dominio', dominio],
  ['estados', estados],
  ['estructura', estructura],
  ['formularios', formularios],
  ['glosario', glosario],
  ['alcanceReserva', alcanceReserva],
  ['ingreso', ingreso],
  ['navegacion', navegacion],
  ['registrarTipo', registrarTipo],
] as const;
