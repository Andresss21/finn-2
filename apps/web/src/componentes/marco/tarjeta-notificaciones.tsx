'use client';
// Tarjeta «Activar notificaciones» de Inicio (FT-06, CA-06.1 y CA-06.2; CP-5): visible mientras el permiso esté sin decidir y no
// se haya descartado. Al abrir la app nunca pide el permiso: solo lo pide el botón. Descartarla se recuerda en este dispositivo.
import { useEffect, useState } from 'react';
import {
  activar,
  descartarTarjeta,
  tarjetaDescartada,
  usePermiso,
  type RegistrarSuscripcion,
} from '../../cliente/notificaciones';
import { notificaciones as t } from '../../textos/notificaciones';
import { Boton } from '../base/boton';

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
  return (
    <section
      aria-labelledby="tarjeta-notificaciones"
      className="flex flex-col gap-2 rounded-contenedor bg-superficie p-4"
    >
      <h2 id="tarjeta-notificaciones" className="text-titulo-seccion">
        {t.tarjetaTitulo}
      </h2>
      <p className="text-cuerpo-pequeno text-texto">{t.tarjetaAyuda}</p>
      <div className="flex gap-3">
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
