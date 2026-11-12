'use client';
// Instalación de la app en `/ajustes` (FT-05, 05 §8.7, FE-58; E5-17): una tarjeta arriba del índice. En Android con Chrome, el botón
// abre el diálogo del navegador; en iPhone, los pasos de «Compartir». Ya instalada (`standalone`) no se ofrece nada, y nunca hay
// un aviso al abrir la app (CA-05.6).
import { useInstalacion } from '../../../cliente/instalacion';
import { instalacion } from '../../../textos/instalacion';
import { Boton } from '../../../componentes/base/boton';

const TARJETA = 'flex flex-col gap-3 rounded-contenedor bg-superficie p-4 shadow-elevacion-1';

export function InstalarFinn() {
  const { oferta, instalar } = useInstalacion();
  if (oferta === 'android') {
    return (
      <section className={TARJETA} aria-labelledby="instalar-finn" data-instalar-finn>
        <h2 id="instalar-finn" className="text-titulo-seccion">
          {instalacion.titulo}
        </h2>
        <p className="text-cuerpo-pequeno text-texto-secundario">{instalacion.ayudaAndroid}</p>
        <Boton
          onClick={() => {
            void instalar();
          }}
        >
          {instalacion.accion}
        </Boton>
      </section>
    );
  }
  if (oferta === 'ios') {
    return (
      <section className={TARJETA} aria-labelledby="instalar-finn" data-instalar-finn>
        <h2 id="instalar-finn" className="text-titulo-seccion">
          {instalacion.iosTitulo}
        </h2>
        <p className="text-cuerpo-pequeno text-texto-secundario">{instalacion.iosAyuda}</p>
        <p className="text-cuerpo-pequeno text-texto">{instalacion.iosIntro}</p>
        <ol className="text-cuerpo-pequeno list-decimal pl-5 text-texto">
          {instalacion.iosPasos.map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ol>
      </section>
    );
  }
  return null;
}
