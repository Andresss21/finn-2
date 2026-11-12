'use client';
// CTA-02: la elección del tipo de cuenta en tarjetas con ícono (E4 «nueva-tipo»). Un grupo de radios nativos: el teclado y los
// lectores de pantalla lo manejan sin código; cada tarjeta mide al menos 44 px. Los íconos y el relleno elegido salen de tokens.
import { Icono, type NombreIcono } from '../../componentes/base/icono';
import { cuentasNuevaBase as t } from '../../textos/cuentas-nueva-base';
import { TIPOS, type TipoCuenta } from './campos';

const ICONO: Readonly<Record<TipoCuenta, NombreIcono>> = {
  efectivo: 'bank',
  tarjeta: 'card',
  prestamo: 'ticket',
  inversion: 'trend',
};

const TARJETA =
  'flex min-h-11 cursor-pointer flex-col gap-2 rounded-contenedor border-2 border-transparent bg-superficie p-4 shadow-elevacion-1 has-checked:border-accion has-checked:bg-accion-tonal has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-foco';

export function ElegirTipo({
  valor,
  alCambiar,
}: {
  readonly valor: TipoCuenta;
  readonly alCambiar: (tipo: TipoCuenta) => void;
}) {
  return (
    <div role="radiogroup" aria-label={t.tipo} className="grid grid-cols-2 gap-3">
      {TIPOS.map((tipo) => (
        <label
          key={tipo}
          htmlFor={`tipo-cuenta-${tipo}`}
          data-tipo-cuenta={tipo}
          className={TARJETA}
        >
          <input
            id={`tipo-cuenta-${tipo}`}
            type="radio"
            name="tipo-cuenta"
            value={tipo}
            checked={valor === tipo}
            onChange={() => {
              alCambiar(tipo);
            }}
            className="sr-only"
          />
          <span className="flex size-10 items-center justify-center rounded-full bg-superficie-hundida">
            <Icono nombre={ICONO[tipo]} tamano={20} />
          </span>
          <span className="text-cuerpo font-bold">{t.tipos[tipo]}</span>
          <span className="text-cuerpo-pequeno text-texto-secundario">{t.tiposAyuda[tipo]}</span>
        </label>
      ))}
    </div>
  );
}
