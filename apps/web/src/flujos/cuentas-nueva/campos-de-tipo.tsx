'use client';
// Los campos propios de la tarjeta, el préstamo y la inversión de `/cuentas/nueva` (FT-50), con sus etiquetas y opciones. El
// formulario los carga al elegir uno de esos tipos (05 §13.3): con efectivo, el tipo por defecto, no van en el JS de la ruta
// (05 §13.1). Qué campos son, cuáles se piden y cuándo se muestran lo dicen los descriptores de `campos.ts`.
import type { UseFormRegister } from 'react-hook-form';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { EntradaTexto } from '../../componentes/base/campo';
import { Seleccion } from '../../componentes/base/seleccion';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { cuentasNuevaTipos as t } from '../../textos/cuentas-nueva-tipos';
import { CAMPOS_DE_TIPO, visible, type Campos, type Clave } from './campos';
import { ColorTarjeta } from './color-tarjeta';

const ETIQUETAS: Partial<Record<Clave, string>> = {
  limiteCredito: t.limiteCredito,
  tasaAnual: t.tasaAnual,
  diaCorte: t.diaCorte,
  diaPago: t.diaPago,
  red: t.red,
  contraparte: t.contraparte,
  montoOriginal: t.montoOriginal,
  tasaNominalAnual: t.tasaAnual,
  tipoTasa: t.tipoTasa,
  frecuencia: t.frecuencia,
  frecuenciaDias: t.frecuenciaDias,
  cuotaPactada: t.cuotaPactada,
  plazoCuotas: t.plazoCuotas,
  cuotasPagadasAlCrear: t.cuotasPagadas,
  modeloCalculo: t.modelo,
  seguroPrimerMes: t.seguroPrimerMes,
  comision: t.comision,
  rendimientoAnualEsperado: t.rendimiento,
};
const OPCIONES: Partial<Record<Clave, Readonly<Record<string, string>>>> = {
  red: t.redes,
  tipoTasa: t.tiposTasa,
  frecuencia: t.frecuencias,
  modeloCalculo: t.modelos,
};

export interface PropsCamposDeTipo {
  readonly c: Campos;
  readonly poner: (n: keyof Campos) => (valor: string) => void;
  readonly error: (n: keyof Campos) => string | undefined;
  readonly register: UseFormRegister<Campos>;
  readonly institucion: string | undefined;
}

// E2-9: el préstamo en secciones; «Condiciones · opcional» va plegada. Cada campo conserva su descriptor (campos.ts).
const SECCIONES_PRESTAMO: readonly {
  readonly titulo: string;
  readonly claves: readonly Clave[];
  readonly plegada?: true;
}[] = [
  { titulo: t.seccionPrestamo, claves: ['contraparte', 'montoOriginal'] },
  {
    titulo: t.seccionCuotas,
    claves: ['frecuencia', 'frecuenciaDias', 'cuotaPactada', 'plazoCuotas', 'cuotasPagadasAlCrear'],
  },
  {
    titulo: t.seccionCondiciones,
    claves: ['tasaNominalAnual', 'tipoTasa', 'modeloCalculo', 'seguroPrimerMes', 'comision'],
    plegada: true,
  },
];

export function CamposDeTipo(props: PropsCamposDeTipo) {
  if (props.c.tipo !== 'prestamo') return <CamposPlanos {...props} />;
  return (
    <>
      {SECCIONES_PRESTAMO.map((s) => {
        const cuerpo = <CamposPlanos {...props} claves={s.claves} />;
        return s.plegada === true ? (
          <details
            key={s.titulo}
            data-seccion="condiciones"
            open={s.claves.some((k) => props.error(k) !== undefined)}
            className="flex flex-col gap-4"
          >
            <summary className="text-titulo-seccion min-h-11 cursor-pointer py-2">
              {s.titulo}
            </summary>
            <div className="flex flex-col gap-5 pt-2">
              <AvisoEnLinea estado="informacion">{t.avisoSinModelo}</AvisoEnLinea>
              {cuerpo}
            </div>
          </details>
        ) : (
          <section key={s.titulo} data-seccion={s.titulo} className="flex flex-col gap-5">
            <h2 className="text-titulo-seccion">{s.titulo}</h2>
            {cuerpo}
          </section>
        );
      })}
    </>
  );
}

function CamposPlanos({
  c,
  poner,
  error,
  register,
  institucion,
  claves,
}: PropsCamposDeTipo & { readonly claves?: readonly Clave[] }) {
  return CAMPOS_DE_TIPO[c.tipo].map((x) => {
    if (claves !== undefined && !claves.includes(x.n)) return null;
    if (!visible(x, c)) return null;
    const etiqueta = ETIQUETAS[x.n] ?? '';
    const mensaje = error(x.n);
    if (x.clase === 'monto')
      return (
        <EntradaMonto
          key={x.n}
          nombre={x.n}
          etiqueta={etiqueta}
          valor={c[x.n]}
          alCambiar={poner(x.n)}
          error={mensaje}
          requerido={x.requerido}
        />
      );
    if (x.n === 'color')
      return (
        <ColorTarjeta
          key={x.n}
          valor={c.color}
          alCambiar={poner('color')}
          vista={{
            nombre: c.nombre,
            red: t.redes[c.red as keyof typeof t.redes],
            ...(c.ultimos4.trim() === '' ? {} : { ultimos4: c.ultimos4.trim() }),
            ...(institucion === undefined ? {} : { institucion }),
          }}
        />
      );
    if (x.clase === 'opciones')
      return (
        <Seleccion
          key={x.n}
          etiqueta={etiqueta}
          opciones={Object.entries(OPCIONES[x.n] ?? {}).map(([valor, e]) => ({
            valor,
            etiqueta: e,
          }))}
          valor={c[x.n]}
          alCambiar={poner(x.n)}
          {...(mensaje === undefined ? {} : { error: mensaje })}
        />
      );
    return (
      <EntradaTexto
        key={x.n}
        etiqueta={etiqueta}
        requerido={x.requerido}
        inputMode={x.clase === 'texto' ? 'text' : x.clase === 'entero' ? 'numeric' : 'decimal'}
        autoComplete="off"
        {...(x.n === 'rendimientoAnualEsperado' ? { descripcion: t.rendimientoInfo } : {})}
        {...(mensaje === undefined ? {} : { error: mensaje })}
        {...register(x.n)}
      />
    );
  });
}
