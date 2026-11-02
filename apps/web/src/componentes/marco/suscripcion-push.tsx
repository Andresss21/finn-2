'use client';
// `SuscripcionPush` (05 §8.6, FE-57, CA-06.3): con el permiso ya concedido, al abrir la app con sesión AAL2 renueva la
// suscripción del dispositivo (OPT-02) sin preguntar nada, una sola vez por pestaña. Va en el layout de `(finn)`, que solo
// se ve con sesión. No dibuja nada.
import { useEffect } from 'react';
import { renovar, type RegistrarSuscripcion } from '../../cliente/notificaciones';

export function SuscripcionPush({ registrar }: { readonly registrar: RegistrarSuscripcion }) {
  useEffect(() => {
    void renovar(registrar);
  }, [registrar]);
  return null;
}
