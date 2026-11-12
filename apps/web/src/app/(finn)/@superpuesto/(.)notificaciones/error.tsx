'use client';
// Error de carga del panel de notificaciones (E6-9, CF-23; `K1-navegacion/notificaciones-error`): el error se ve dentro del panel,
// nombrado por su título «Notificaciones», con la referencia, «Copiar la referencia» e «Intentar de nuevo».
import { ErrorDeLaPantalla } from '../../../../componentes/navegacion/error-de-pantalla';
import { SuperpuestoDeRuta } from '../../../../componentes/navegacion/flujo-de-ruta';
import { notificaciones as t } from '../../../../textos/notificaciones';

export default function ErrorDelPanel(props: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <SuperpuestoDeRuta titulo={t.titulo} desde="arriba">
      <ErrorDeLaPantalla {...props} enPanel />
    </SuperpuestoDeRuta>
  );
}
