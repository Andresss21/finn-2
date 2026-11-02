'use client';
// Instalación de la app en `/ajustes` (FT-05, 05 §8.7, FE-58): en Android con Chrome, el botón abre el diálogo del navegador;
// en iPhone, las instrucciones de «Compartir». Ya instalada (`standalone`) no se ofrece nada.
import { useInstalacion } from '../../../cliente/instalacion';
import { instalacion } from '../../../textos/instalacion';
import { Boton } from '../../../componentes/base/boton';

export function InstalarFinn() {
  const { oferta, instalar } = useInstalacion();
  if (oferta === 'android') {
    return (
      <section className="flex flex-col gap-2" aria-labelledby="instalar-finn">
        <h2 id="instalar-finn" className="text-titulo-seccion">
          {instalacion.titulo}
        </h2>
        <p>{instalacion.ayudaAndroid}</p>
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
      <section className="flex flex-col gap-2" aria-labelledby="instalar-finn">
        <h2 id="instalar-finn" className="text-titulo-seccion">
          {instalacion.iosTitulo}
        </h2>
        <ol className="list-decimal pl-5">
          {instalacion.iosPasos.map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ol>
      </section>
    );
  }
  return null;
}
