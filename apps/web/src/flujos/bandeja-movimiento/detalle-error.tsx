'use client';
// El detalle de un SMS con error en la revisión (FT-38, 04 §7.8): el detalle saneado con su referencia y «Copiar referencia».
// Se carga solo cuando el movimiento está en error, para no sumar bytes a `/bandeja/[movimientoId]` (05 §13.1).
import { Boton } from '../../componentes/base/boton';
import { bandeja as t } from '../../textos/bandeja';
import { cuentas } from '../../textos/cuentas';
import { referenciaDe, useCopiarReferencia } from './error-sms';

export default function DetalleError({ errorDetalle }: { readonly errorDetalle: string }) {
  const { copia, copiar } = useCopiarReferencia();
  const referencia = referenciaDe(errorDetalle);
  return (
    <section aria-label={t.revisar.detalleError} className="flex flex-col gap-1">
      <h2 className="text-cuerpo-pequeno font-bold text-texto-secundario">
        {t.revisar.detalleError}
      </h2>
      <p className="rounded-xl bg-superficie-hundida p-3 text-cuerpo-pequeno text-texto">
        {errorDetalle}
      </p>
      <p className="text-cuerpo-pequeno text-texto-secundario">
        {t.revisar.referencia}: <span data-testid="referencia">{referencia}</span>
      </p>
      <div className="flex items-center gap-3">
        <Boton
          variante="secundaria"
          onClick={() => {
            copiar(referencia);
          }}
        >
          {cuentas.bandeja.copiarReferencia}
        </Boton>
        <span role="status" className="text-cuerpo-pequeno text-texto-secundario">
          {copia === 'copiada'
            ? t.referenciaCopiada
            : copia === 'fallo'
              ? t.noSePudoCopiar(referencia)
              : ''}
        </span>
      </div>
    </section>
  );
}
