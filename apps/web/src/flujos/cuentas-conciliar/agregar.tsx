'use client';
// «Agregar» de un movimiento «solo en el estado» (OP-46; 06 FT-43 CA-43.5): el alta que admite su signo, con la fecha y el monto
// del estado. La carga firmada la trae el formulario; aquí solo se arma la entrada (el servidor reclasifica y fija la fecha, 04 §9.1).
// No calcula montos (PF-3): el texto del monto es el del movimiento, sin signo.
import type { Centavos } from '@finn/dominio/valores';
import { useRef, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Seleccion } from '../../componentes/base/seleccion';
import { centavosATextoDecimal } from '../../formato';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { conciliar as t } from '../../textos/conciliar';

/** Los tipos de alta que esta pantalla sabe armar con lo que trae el movimiento, en el orden en que se prefieren. */
export const ALTAS_SOPORTADAS = ['gasto', 'ingreso', 'entrada_tarjeta'] as const;
export type TipoAlta = (typeof ALTAS_SOPORTADAS)[number];

export interface MovimientoDelEstado {
  readonly indice: number;
  readonly fecha: string;
  readonly monto: Centavos;
  readonly descripcion: string;
}

export interface PropsAgregar {
  readonly agregar: AccionEscritura;
  readonly cuentaId: string;
  readonly carga: string;
  readonly movimiento: MovimientoDelEstado;
  readonly tipo: TipoAlta;
  readonly categorias: readonly { readonly id: string; readonly nombre: string }[];
}

export function Agregar({
  agregar,
  cuentaId,
  carga,
  movimiento: m,
  tipo,
  categorias,
}: PropsAgregar) {
  const operacion = useOperacion({ accion: agregar });
  const idAlta = useRef(crypto.randomUUID());
  const [categoriaId, setCategoriaId] = useState('');
  const [falta, setFalta] = useState(false);

  if (operacion.estado === 'listo')
    return <span className="font-semibold">{t.agregadoComo[tipo]}</span>;

  const enviar = () => {
    if (tipo === 'gasto' && categoriaId === '') {
      setFalta(true);
      return;
    }
    setFalta(false);
    const total = centavosATextoDecimal(m.monto).replace('-', '');
    const base = { id: idAlta.current, fecha: m.fecha, total };
    const alta =
      tipo === 'gasto'
        ? {
            operacion: 'OP-20',
            datos: {
              ...base,
              cuentaId,
              comercio: m.descripcion,
              lineas: [{ monto: total, destino: { categoriaId } }],
            },
          }
        : tipo === 'ingreso'
          ? { operacion: 'OP-21', datos: { ...base, cuentaId, comercio: m.descripcion } }
          : { operacion: 'OP-27', datos: { ...base, modalidad: 'entrada', tarjetaId: cuentaId } };
    void operacion.enviar({ cuentaId, carga, movimientoIndice: m.indice, ...alta });
  };

  const fallo = operacion.estado === 'error' ? operacion.error : undefined;
  return (
    <div className="flex basis-full flex-col gap-2 pb-2">
      {tipo === 'gasto' ? (
        <Seleccion
          etiqueta={t.categoriaDe(m.descripcion)}
          opciones={categorias.map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
          valor={categoriaId}
          alCambiar={(v) => {
            idAlta.current = crypto.randomUUID();
            setCategoriaId(v);
          }}
          {...(falta ? { error: t.elegirCategoria } : {})}
        />
      ) : null}
      {fallo === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {fallo.mensaje}
        </AvisoEnLinea>
      )}
      {operacion.estado === 'confirmando' ? (
        <AvisoEnLinea
          estado="advertencia"
          aparecioDespues
          accion={
            <>
              <Boton onClick={() => void operacion.confirmar()}>{t.confirmarAgregar}</Boton>
              <Boton variante="secundaria" onClick={operacion.volverAEditar}>
                {t.cancelarAgregar}
              </Boton>
            </>
          }
        >
          {t.confirmarPeriodo}
        </AvisoEnLinea>
      ) : (
        <Boton
          variante="secundaria"
          enviando={operacion.estado === 'enviando'}
          textoEnviando={t.agregando}
          deshabilitado={!operacion.enLinea}
          onClick={enviar}
        >
          {t.agregar}
        </Boton>
      )}
    </div>
  );
}
