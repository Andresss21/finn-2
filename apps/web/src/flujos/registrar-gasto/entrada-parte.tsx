'use client';
// [CH-276, CH-277] La cifra a la derecha de una fila de parte o de categoría (C-45 §10, C-49 §2): en partes iguales, fija a 20 px;
// en porcentaje y montos, una entrada compacta sobre `--superficie-hundida` con «%» o «$» fijo y la máscara de C-45 §5. Debajo, lo
// que resulta (el monto, el porcentaje o «Lo que queda»). No calcula: recibe todo ya formateado.
import { completarDecimales, conMiles, enmascararMonto, enmascararPorcentaje } from '../../formato';
import { Icono } from '../../componentes/base/icono';
import { base } from '../../textos/base';

export interface PropsCifraDeParte {
  readonly modo: 'iguales' | 'porcentaje' | 'montos';
  /** El nombre accesible de la entrada («Monto para Farmacia»). */
  readonly etiqueta: string;
  /** Lo escrito: el monto sin comas o el porcentaje. */
  readonly valor: string;
  /** El monto que resulta, ya formateado (en partes iguales es la cifra fija). */
  readonly monto: string;
  /** Lo que va debajo: el porcentaje, el monto o «Lo que queda». */
  readonly nota?: string | undefined;
  readonly notaInformativa?: boolean;
  readonly error?: boolean;
  readonly deuda?: boolean;
  readonly alCambiar: (texto: string) => void;
  readonly alSalir: () => void;
}

export function CifraDeParte({
  modo,
  etiqueta,
  valor,
  monto,
  nota,
  notaInformativa = false,
  error = false,
  deuda = false,
  alCambiar,
  alSalir,
}: PropsCifraDeParte) {
  const pct = modo === 'porcentaje';
  const debajo =
    nota === undefined ? null : (
      <span className="parte-nota" {...(notaInformativa ? { 'data-informacion': '' } : {})}>
        {nota}
      </span>
    );
  if (modo === 'iguales')
    return (
      <span className="parte-cifra">
        <span className="parte-fija" {...(deuda ? { 'data-deuda': '' } : {})}>
          {monto}
        </span>
        {debajo}
      </span>
    );
  return (
    <span className="parte-cifra">
      <span className="parte-entrada" {...(error ? { 'data-error': '' } : {})}>
        {pct ? null : <span aria-hidden="true">{base.moneda}</span>}
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={etiqueta}
          aria-invalid={error ? true : undefined}
          placeholder={pct ? '0' : '0.00'}
          className={pct ? 'parte-pct' : 'parte-monto'}
          value={pct ? valor : conMiles(valor)}
          onChange={(e) => {
            alCambiar(pct ? enmascararPorcentaje(e.target.value) : enmascararMonto(e.target.value));
          }}
          onBlur={() => {
            if (!pct && valor !== '' && completarDecimales(valor) !== valor)
              alCambiar(completarDecimales(valor));
            alSalir();
          }}
        />
        {pct ? <span aria-hidden="true">{base.porcentaje}</span> : null}
      </span>
      {debajo}
    </span>
  );
}

/** El resumen debajo de un grupo de partes (C-45 §10, C-49 §3): `role="status"`; cierra en positivo, el error en problema. */
export function ResumenReparto({
  texto,
  ok,
  error,
}: {
  readonly texto: string;
  readonly ok: boolean;
  readonly error: boolean;
}) {
  return (
    <p
      role="status"
      tabIndex={-1}
      className="reparto-resumen"
      data-estado={ok ? 'ok' : error ? 'error' : 'falta'}
    >
      <Icono nombre={ok ? 'check' : error ? 'dang' : 'info'} tamano={18} />
      {texto}
    </p>
  );
}
