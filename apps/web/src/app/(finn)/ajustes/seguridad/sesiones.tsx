'use client';
// Sesiones de `/ajustes/seguridad` (FT-74, 05 §9.6): «Cerrar las otras sesiones» [1T] y «Salir». Salir borra los borradores de la
// pestaña (4.11) y navega a `/ingresar`; la suscripción push del dispositivo no se toca (para eso está Ajustes > Notificaciones).
import { useEffect } from 'react';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Boton } from '../../../../componentes/base/boton';
import { Icono } from '../../../../componentes/base/icono';
import { borrarBorradores } from '../../../../formularios/use-borrador';
import { useOperacion, type AccionEscritura } from '../../../../formularios/use-operacion';
import { seguridad as t } from '../../../../textos/seguridad';

export interface PropsSesiones {
  /** `cerrarOtrasSesiones` (CP-11): la pone la página, así el componente se prueba sin servidor. */
  readonly cerrarOtras: AccionEscritura;
  /** `salir` (CP-11), del acceso previo a AAL2. */
  readonly salir: AccionEscritura;
}

export function Sesiones({ cerrarOtras, salir }: PropsSesiones) {
  const otras = useOperacion({ accion: cerrarOtras });
  const fuera = useOperacion({ accion: salir });

  useEffect(() => {
    if (fuera.estado !== 'listo') return;
    borrarBorradores();
    window.location.assign('/ingresar');
  }, [fuera.estado]);

  return (
    <section className="flex flex-col gap-2.5" aria-labelledby="titulo-sesiones">
      <h2 id="titulo-sesiones" className="text-titulo-seccion">
        {t.sesiones}
      </h2>
      <div className="grid min-h-14 grid-cols-[40px_minmax(0,1fr)] items-center gap-3 rounded-contenedor bg-superficie px-4 py-3 shadow-elevacion-1">
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-pastilla bg-superficie-hundida text-texto-secundario"
        >
          <Icono nombre="user" tamano={20} />
        </span>
        <span className="flex flex-col">
          <span className="text-cuerpo font-semibold">{t.esteDispositivo}</span>
          <span className="text-cuerpo-pequeno text-texto-secundario">{t.activaAhora}</span>
        </span>
      </div>
      {otras.estado === 'error' && otras.error !== undefined ? (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {otras.error.mensaje}
        </AvisoEnLinea>
      ) : null}
      {otras.estado === 'listo' ? (
        <AvisoEnLinea estado="positivo" aparecioDespues>
          {t.otrasCerradas}
        </AvisoEnLinea>
      ) : null}
      <Boton
        variante="secundaria"
        enviando={otras.estado === 'enviando'}
        textoEnviando={t.cerrandoOtras}
        deshabilitado={!otras.enLinea}
        {...(otras.motivoSinEnvio === undefined
          ? {}
          : { motivoDeshabilitado: otras.motivoSinEnvio })}
        onClick={() => void otras.enviar({})}
      >
        {t.cerrarOtras}
      </Boton>
      {fuera.estado === 'error' && fuera.error !== undefined ? (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {fuera.error.mensaje}
        </AvisoEnLinea>
      ) : null}
      <Boton
        variante="discreta"
        enviando={fuera.estado === 'enviando' || fuera.estado === 'listo'}
        textoEnviando={t.saliendo}
        onClick={() => void fuera.enviar({})}
      >
        {t.salir}
      </Boton>
    </section>
  );
}
