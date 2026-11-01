'use client';
// Cliente mínimo de `/sin-conexion` (05 §8.5): "Intentar de nuevo" recarga la URL pedida y, si la pestaña tiene un
// borrador (4.11), lo dice sin leer montos. Está también en el precache.
import { useEffect, useState } from 'react';
import { PREFIJO_BORRADOR } from '../../formularios/use-borrador';
import { almacen } from '../../cliente/almacen';
import { base } from '../../textos/base';
import { navegacion } from '../../textos/navegacion';
import { Boton } from '../base/boton';

export function ReintentarSinConexion() {
  const [borrador, setBorrador] = useState(false);
  useEffect(() => {
    setBorrador(almacen.hayPrefijo(PREFIJO_BORRADOR));
  }, []);
  return (
    <>
      {borrador ? <p>{navegacion.sinConexionPagina.borrador}</p> : null}
      <Boton
        onClick={() => {
          location.reload();
        }}
      >
        {base.reintentar}
      </Boton>
    </>
  );
}
