'use client';
// Un movimiento que al abrir el flujo ya estaba aprobado o descartado (FT-35): su estado y el enlace que corresponde.
import type { ReactNode } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { bandeja as t } from '../../textos/bandeja';

export default function YaResuelto({
  aprobado,
  children,
}: {
  readonly aprobado: boolean;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {children}
      <AvisoEnLinea estado="informacion">
        {aprobado ? t.revisar.aprobadoYa : t.revisar.descartadoYa}
      </AvisoEnLinea>
      <EnlaceFinn
        href="/bandeja"
        className="inline-flex min-h-11 items-center font-bold text-enlace underline"
      >
        {t.revisar.volver}
      </EnlaceFinn>
    </div>
  );
}
