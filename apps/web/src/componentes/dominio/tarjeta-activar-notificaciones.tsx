'use client';
// Tarjeta «Activá las notificaciones» de Inicio (E5-15, CA-06.1 y CA-06.2; `S1-inicio/activar-notificaciones`): entre Listo para
// asignar (o los Primeros pasos) y «Necesita tu atención». Visible mientras el permiso esté sin decidir y no se haya descartado;
// no aparece con el permiso decidido ni en un iPhone sin instalar. Finn nunca pide el permiso al abrir: solo lo pide el botón.
// «Ahora no» la descarta en este dispositivo. Usa `cliente/notificaciones` sin cambiarlo (lo cambia TA-591).
import { useEffect, useState } from 'react';
import {
  activar,
  descartarTarjeta,
  tarjetaDescartada,
  usePermiso,
  type RegistrarSuscripcion,
} from '../../cliente/notificaciones';
import { inicioEntrega4 } from '../../textos/inicio-entrega-4';
import { notificaciones as t } from '../../textos/notificaciones';
import { Boton } from '../base/boton';
import { Icono } from '../base/icono';

export function TarjetaActivarNotificaciones({
  registrar,
}: {
  readonly registrar: RegistrarSuscripcion;
}) {
  const [permiso, releer] = usePermiso();
  const [descartada, setDescartada] = useState(true);
  const [activando, setActivando] = useState(false);
  useEffect(() => {
    setDescartada(tarjetaDescartada());
  }, []);
  if (permiso !== 'sin_decidir' || descartada) return null;
  const textos = inicioEntrega4.tarjetaNotificaciones;
  return (
    <section
      aria-labelledby="tarjeta-notificaciones"
      data-tarjeta-notificaciones
      className="flex flex-col gap-3 rounded-contenedor bg-superficie p-4 shadow-elevacion-1"
    >
      <div className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 flex-none items-center justify-center rounded-full bg-accion-tonal text-accion"
        >
          <Icono nombre="bell" tamano={20} />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="tarjeta-notificaciones" className="text-cuerpo font-semibold">
            {textos.titulo}
          </h2>
          <p className="text-cuerpo-pequeno text-texto-secundario">{textos.ayuda}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Boton
          enviando={activando}
          textoEnviando={t.activando}
          onClick={() => {
            setActivando(true);
            void activar(registrar).then(() => {
              setActivando(false);
              releer();
            });
          }}
        >
          {t.activar}
        </Boton>
        <Boton
          variante="discreta"
          onClick={() => {
            descartarTarjeta();
            setDescartada(true);
          }}
        >
          {t.descartar}
        </Boton>
      </div>
    </section>
  );
}
