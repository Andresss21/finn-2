'use client';
// E6-1, flujo corto (`T1-carga/flujo-corto`): el `loading.tsx` del slot `@superpuesto`. La hoja (panel de 440 en computadora)
// aparece sobre la pantalla de origen con el título y los campos en esqueleto, antes de que lleguen los datos del flujo. Va aparte de
// `hoja-diferida.tsx` para que el esqueleto no sume al JS compartido de todas las rutas.
import { useRouter } from 'next/navigation';
import { estados } from '../../textos/estados';
import { Barra, Esqueleto } from './esqueleto';
import { SuperpuestoDiferido } from './hoja-diferida';

const CAMPO = 'block h-11 w-full rounded-control bg-superficie-hundida';

export function HojaEnCarga() {
  const router = useRouter();
  return (
    <SuperpuestoDiferido
      titulo={estados.cargandoPantalla('formulario')}
      alCerrar={() => {
        router.back();
      }}
    >
      <Esqueleto pantalla="formulario" sinAnuncio>
        <Barra ancho="w-1/3" />
        <span className={CAMPO} />
        <Barra ancho="w-1/3" />
        <span className={CAMPO} />
        <span className={CAMPO} />
      </Esqueleto>
    </SuperpuestoDiferido>
  );
}
