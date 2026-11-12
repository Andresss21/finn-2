'use client';
// «Salir» (05 §9.6 [CH-242]): `salir()` sin cambios (CH-56), con `useOperacion`; los borradores (4.11) se borran solo tras `ok: true`.
// Con borradores, antes «Tenés N cambios sin enviar». `Salir` (`navegacion-app.tsx`) lo descarga al primer toque.
import { useEffect, useRef, useState } from 'react';
import { clavesConPrefijo } from '../../cliente/almacen';
import { formatearInstante } from '../../formato/instante-texto';
import { borrarBorradores, leerGuardado, PREFIJO_BORRADOR } from '../../formularios/use-borrador';
import { useOperacion } from '../../formularios/use-operacion';
import { salir as accionSalir } from '../../servidor/acciones/autenticacion';
import { salir as t } from '../../textos/salir';
import { AvisoEnLinea } from '../base/aviso';
import { Boton } from '../base/boton';
import { EnlaceFinn } from '../navegacion/enlace-finn';
import { FilaSalir, type VarianteSalir } from '../navegacion/navegacion-app';
import { Superpuesto } from './superpuesto';

// El nombre del flujo largo por su ruta (05 §2, 4.11): el primero que coincide.
const FLUJOS: readonly (readonly [RegExp, keyof typeof t.flujos])[] = [
  [/^\/registrar\/gasto$/, 'gasto'],
  [/^\/registrar\//, 'registrar'],
  [/\/editar$/, 'editar'],
  [/\/devolver$/, 'devolver'],
  [/^\/bandeja\/[^/]+$/, 'revisar'],
  [/\/conciliar$/, 'conciliar'],
  [/\/plantilla$/, 'plantilla'],
  [/\/archivar$/, 'archivar'],
  [/\/fusionar$/, 'fusionar'],
  [/^\/cuentas\//, 'cuenta'],
  [/^\/programadas\//, 'programada'],
  [/^\/ajustes\/formatos\//, 'formato'],
];

/** Los borradores válidos de la pestaña, del más viejo al más nuevo: el flujo y «PRICESMART · guardado 12:41». */
function listarBorradores() {
  const prefijo = `${PREFIJO_BORRADOR}v1:`;
  return clavesConPrefijo(prefijo)
    .flatMap((clave) => {
      const g = leerGuardado(clave);
      if (g === null || !/^\d{4}-\d\d-\d\dT/.test(g.guardadoEn)) return [];
      const ruta = clave.slice(prefijo.length, clave.lastIndexOf(':'));
      const comercio = (g.campos as { comercio?: unknown } | null)?.comercio; // texto del usuario (PF-3)
      const antes = typeof comercio === 'string' && comercio.trim() !== '' ? comercio.trim() : null;
      const flujo = FLUJOS.find(([patron]) => patron.test(ruta))?.[1] ?? 'otro';
      const hora = t.guardado(formatearInstante(g.guardadoEn).slice(-5));
      const detalle = antes === null ? hora : `${antes.toUpperCase()} · ${hora}`;
      return [{ clave, ruta, guardadoEn: g.guardadoEn, nombre: t.flujos[flujo], detalle }];
    })
    .sort((a, b) => a.guardadoEn.localeCompare(b.guardadoEn));
}

export function ControlSalir({
  variante,
  subtitulo,
}: {
  readonly variante: VarianteSalir;
  readonly subtitulo?: string | undefined;
}) {
  const { estado, enLinea, enviar } = useOperacion({ accion: accionSalir });
  // `null`: sin diálogo. Se leen al tocar «Salir»: un borrador se escribe 500 ms después del último cambio.
  const [borradores, setBorradores] = useState<ReturnType<typeof listarBorradores> | null>(null);
  const saliendo = estado === 'enviando' || estado === 'listo';
  const cerrar = (): void => {
    setBorradores(null);
  };
  const empezar = (): void => {
    const lista = listarBorradores();
    if (lista.length === 0) void enviar({});
    else setBorradores(lista);
  };
  const empezado = useRef(false);
  useEffect(() => {
    if (empezado.current) return;
    empezado.current = true;
    empezar();
  });
  useEffect(() => {
    if (estado !== 'listo') return;
    borrarBorradores();
    window.location.assign('/ingresar');
  }, [estado]);

  const n = borradores?.length ?? 0;
  const enLaFila = borradores === null && (saliendo || estado === 'error');
  return (
    <>
      <FilaSalir
        variante={variante}
        estado={enLaFila ? (saliendo ? 'saliendo' : 'error') : 'quieto'}
        sinConexion={!enLinea}
        subtitulo={subtitulo}
        onClick={empezar}
      />
      {borradores === null ? null : (
        <Superpuesto
          titulo={t.cambiosSinEnviar(n)}
          descripcion={t.explicacion(n)}
          alCerrar={cerrar}
          acciones={
            <>
              <Boton
                variante="secundaria"
                className="flex-1"
                deshabilitado={saliendo}
                onClick={cerrar}
              >
                {t.quedarme}
              </Boton>
              <Boton
                variante="peligro"
                className="flex-1"
                enviando={saliendo}
                textoEnviando={t.saliendo}
                deshabilitado={!enLinea}
                motivoDeshabilitado={t.sinConexion}
                {...(saliendo ? { 'aria-busy': true } : {})}
                onClick={() => void enviar({})}
              >
                {t.salirYBorrar(n)}
              </Boton>
            </>
          }
        >
          <ul className="flex flex-col divide-y divide-borde-sutil">
            {borradores.map((b) => (
              <li key={b.clave} className="flex min-h-14 items-center gap-3 py-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-cuerpo font-semibold">{b.nombre}</span>
                  <span className="text-cuerpo-pequeno truncate text-texto-secundario">
                    {b.detalle}
                  </span>
                </span>
                {saliendo ? (
                  <span aria-disabled="true" className="text-etiqueta px-2 text-texto-terciario">
                    {t.seguir}
                  </span>
                ) : (
                  <EnlaceFinn
                    href={b.ruta}
                    onClick={cerrar}
                    className="text-etiqueta inline-flex min-h-11 items-center px-2 text-enlace"
                  >
                    {t.seguir}
                  </EnlaceFinn>
                )}
              </li>
            ))}
          </ul>
          {estado === 'error' ? (
            <div role="alert" className="mt-3">
              <AvisoEnLinea estado="problema" titulo={t.errorTitulo}>
                {t.errorTexto}
              </AvisoEnLinea>
            </div>
          ) : null}
        </Superpuesto>
      )}
    </>
  );
}
