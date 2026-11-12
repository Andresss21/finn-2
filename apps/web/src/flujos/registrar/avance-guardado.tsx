'use client';
// [CH-240 E3-22] El resultado de un avance guardado queda arriba del selector de Registrar: el flujo guarda el texto ya compuesto
// y, si el servidor devolvió el id, el enlace; al llegar a `/registrar` se muestra una vez y se borra. Sin sessionStorage (modo
// privado, sitio bloqueado) simplemente no se muestra: el avance ya quedó registrado.
import { useEffect, useState } from 'react';
import { almacen } from '../../cliente/almacen';
import { Resultado } from '../../componentes/base/resultado';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { registrarGasto as t } from '../../textos/registrar-gasto';

const CLAVE = 'finn:registrar:avance-guardado';

export interface AvanceGuardado {
  readonly texto: string;
  readonly transaccionId?: string;
}

export function recordarAvance(avance: AvanceGuardado): void {
  almacen.escribir(CLAVE, JSON.stringify(avance));
}

function tomarAvance(): AvanceGuardado | null {
  const crudo = almacen.leer(CLAVE);
  if (crudo === null) return null;
  almacen.borrar(CLAVE);
  try {
    return JSON.parse(crudo) as AvanceGuardado;
  } catch {
    return null;
  }
}

export function ResultadoAvance() {
  const [avance, setAvance] = useState<AvanceGuardado | null>(null);
  useEffect(() => {
    const guardado = tomarAvance();
    if (guardado !== null) setAvance(guardado);
  }, []);
  if (avance === null) return null;
  return (
    <div data-rol="resultado-avance">
      <Resultado
        texto={avance.texto}
        {...(avance.transaccionId === undefined
          ? {}
          : {
              enlace: (
                <EnlaceFinn href={`/actividad/${avance.transaccionId}`}>
                  {t.verTransaccion}
                </EnlaceFinn>
              ),
            })}
      />
    </div>
  );
}
