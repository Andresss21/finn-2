'use client';
// Cifras del billete (06-identidad-visual 2.8 [CH-220 e], FIXES §3): ruedan dígito a dígito (1.4 s, 90 ms entre dígitos) solo
// en la primera entrada de la sesión; después, y sin `sessionStorage`, aparecen enteras. Si el monto cambia con la pantalla
// montada, destella (C3). Con movimiento reducido no se anima nada (regla global de globals.css). No calcula montos (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { useLayoutEffect, useRef, useState } from 'react';
import { almacen } from '../../cliente/almacen';
import { formatearMonto, formatearMontoAccesible } from '../../formato';
import { Destello } from '../movimiento/destello';

export const CLAVE_BILLETE_VISTO = 'finn:billete-rodo';

/** `true` si el billete ya rodó en esta sesión; sin `sessionStorage` (bloqueado o privado) también, para no animar. */
function yaRodo(): boolean {
  if (almacen.leer(CLAVE_BILLETE_VISTO) !== null) return true;
  almacen.escribir(CLAVE_BILLETE_VISTO, '1');
  // Si no quedó escrito, no hay almacenamiento: tampoco se anima.
  return almacen.leer(CLAVE_BILLETE_VISTO) === null;
}

export function CifrasBillete({
  centavos,
  grande,
}: {
  readonly centavos: Centavos;
  readonly grande: boolean;
}) {
  // El servidor dibuja la rueda; antes de pintar en el cliente se decide si esta entrada la conserva.
  // La decisión se toma una vez por montaje (el doble efecto del modo estricto no la repite).
  const [rueda, setRueda] = useState(true);
  const decidido = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    decidido.current ??= yaRodo();
    if (decidido.current) setRueda(false);
  }, []);
  const visible = formatearMonto(centavos);
  return (
    <Destello valor={centavos}>
      <span
        data-centavos={centavos}
        data-rueda={rueda ? '' : undefined}
        className={[
          'whitespace-nowrap tabular-nums',
          grande ? 'text-cifra-principal' : 'text-cifra',
        ].join(' ')}
        style={{ fontSize: grande ? '3.25rem' : '1.75rem' }}
      >
        <span aria-hidden="true">
          {Array.from(visible).map((ch, i) => (
            <span
              key={i}
              className={
                rueda
                  ? 'inline-block animate-[finn-cifra-rueda_1.4s_var(--curva-estandar)_backwards]'
                  : 'inline-block'
              }
              style={rueda ? { animationDelay: `${String(i * 90)}ms` } : undefined}
            >
              {ch}
            </span>
          ))}
        </span>
        <span className="sr-only">{formatearMontoAccesible(centavos)}</span>
      </span>
    </Destello>
  );
}
