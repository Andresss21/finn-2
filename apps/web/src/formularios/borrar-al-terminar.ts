'use client';
// [CH-290] 05 §4.11 «Borrar: al terminar con `ok: true`», para los flujos que cargan su borrador aparte (05 §13.1: Registrar
// gasto, Programadas y Verificar saldo). El resultado reemplaza al formulario y el componente del borrador se desmonta en el
// mismo render, así que su `useBorrador` nunca ve el `listo`: el borrador quedaba con el id de creación ya guardado y el
// próximo formulario de la pestaña lo restauraba (CONFLICTO `conflicto_id` con otros datos; en OP-53, INTERNO al
// previsualizar). Este efecto vive en el formulario, que sí sigue montado. Liviano: sin `useBorrador`.
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { almacen } from '../cliente/almacen';
import { claveDeBorrador } from './clave-borrador';

/** Borra el borrador de la ruta actual (la misma clave que usa `useBorrador` sin `ruta` ni `entidad`) al llegar a `listo`. */
export function useBorrarBorradorAlTerminar(terminado: boolean): void {
  const ruta = usePathname();
  useEffect(() => {
    if (terminado) almacen.borrar(claveDeBorrador(ruta));
  }, [terminado, ruta]);
}
