'use client';
// El estado sin cuentas de `/registrar/gasto` (05 §7, FT-21 «Estados»): explica que primero hay que crear una cuenta y enlaza a crearla.
// Se carga solo cuando hace falta (05 §13.1: presupuesto de bytes de la ruta).
import { Vacio } from '../../componentes/base/vacio';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { registrarGasto as t } from '../../textos/registrar-gasto';

/** Un enlace con el aspecto de un botón principal (05 §10.7): al menos 44 px de alto (05 §11.5). */
const ENLACE =
  'inline-flex min-h-12 items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export default function SinCuentas() {
  return (
    <Vacio
      titulo={t.sinCuentasTitulo}
      texto={t.sinCuentasTexto}
      accion={
        <EnlaceFinn href="/cuentas/nueva" className={ENLACE}>
          {t.crearCuenta}
        </EnlaceFinn>
      }
    />
  );
}
