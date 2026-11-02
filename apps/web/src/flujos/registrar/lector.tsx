// Lector de `/registrar` (05 §2.4): llama a `cuentas()` y ofrece solo los tipos de registro que tienen la cuenta que necesitan: el gasto
// pide una cuenta de efectivo o una tarjeta, el ingreso una de efectivo y la transferencia dos de efectivo. Sin cuentas, enlaza a
// `/cuentas/nueva`. Los demás tipos (pagar tarjeta, cuota, cobro…) los agregan sus fichas. Lo único que traduce los errores de la
// consulta es `consultar()`.
import { cuentas } from '@finn/aplicacion/consultas/cuentas';
import { Vacio } from '../../componentes/base/vacio';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { registrarGasto as t } from '../../textos/registrar-gasto';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const FILA = `flex min-h-14 flex-col justify-center rounded-control bg-superficie px-4 py-2 ${FOCO}`;
const BOTON = `inline-flex min-h-12 items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion ${FOCO}`;

export async function LectorRegistrar() {
  const dto = await consultar(async () => cuentas(await depsDeConsulta()));
  const conDinero = dto.efectivo.length + dto.tarjetas.length;
  const tipos = [
    ...(conDinero >= 1
      ? [{ href: '/registrar/gasto', titulo: t.tipoGasto, detalle: t.tipoGastoDetalle }]
      : []),
    ...(dto.efectivo.length >= 1
      ? [{ href: '/registrar/ingreso', titulo: t.tipoIngreso, detalle: t.tipoIngresoDetalle }]
      : []),
    ...(dto.efectivo.length >= 2
      ? [
          {
            href: '/registrar/transferencia',
            titulo: t.tipoTransferencia,
            detalle: t.tipoTransferenciaDetalle,
          },
        ]
      : []),
  ];
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre="/">
      {tipos.length === 0 ? (
        <Vacio
          titulo={t.sinCuentasTitulo}
          texto={t.sinCuentasTexto}
          accion={
            <EnlaceFinn href="/cuentas/nueva" className={BOTON}>
              {t.crearCuenta}
            </EnlaceFinn>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="text-titulo-seccion">{t.elegir}</h2>
          <ul className="flex flex-col gap-2">
            {tipos.map((x) => (
              <li key={x.href}>
                <EnlaceFinn href={x.href} className={FILA}>
                  <span className="font-semibold">{x.titulo}</span>
                  <span className="text-cuerpo-pequeno text-texto-secundario">{x.detalle}</span>
                </EnlaceFinn>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PaginaFlujoDeRuta>
  );
}
