'use client';
// Lo que se ve al aprobar o confirmar desde el flujo (FT-35, CP-15; S4 del export, CH-137): lo aprobado según el servidor, «Ver transacción»
// y, en el pie, «Siguiente movimiento» (el que seguía en la lista cuando se abrió) o «Volver a la Bandeja». Se carga cuando hace falta: la
// pantalla de revisión no lo necesita para dibujarse (05 §13.1).
import type { ComponentProps } from 'react';
import { Resultado } from '../../componentes/base/resultado';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { bandeja as t } from '../../textos/bandeja';
import { textoAprobado, type ValorAprobado } from './aprobado';
import { ENLACE } from './piezas';

export default function ResultadoDeAprobar({
  marco,
  valor,
  siguienteId,
}: {
  readonly marco: Omit<ComponentProps<typeof PaginaFlujoDeRuta>, 'children' | 'acciones'>;
  readonly valor: ValorAprobado;
  readonly siguienteId: string | undefined;
}) {
  return (
    <PaginaFlujoDeRuta
      {...marco}
      acciones={
        <div className="flex w-full flex-col gap-2">
          {siguienteId === undefined ? null : (
            <EnlaceFinn href={`/bandeja/${siguienteId}`} className={ENLACE.principal}>
              {t.revisar.siguiente}
            </EnlaceFinn>
          )}
          <EnlaceFinn
            href="/bandeja"
            className={siguienteId === undefined ? ENLACE.principal : ENLACE.tonal}
          >
            {t.revisar.volver}
          </EnlaceFinn>
        </div>
      }
    >
      <Resultado
        texto={textoAprobado(valor)}
        enlace={
          <EnlaceFinn href={`/actividad/${valor.transaccionId}`}>{t.verTransaccion}</EnlaceFinn>
        }
      />
    </PaginaFlujoDeRuta>
  );
}
