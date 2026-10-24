"""[R5] Aplica CF-25 (aprobado en la revisión de la Parte E) a 01, 04 y 05 ya enmendados con la Fase 6."""
import sys, pathlib
sys.argv = [sys.argv[0], str(pathlib.Path(__file__).parent)] + sys.argv[1:]
src = open(pathlib.Path(__file__).with_name('aplicar.py')).read().split("exec(open(")[0]
exec(src)

# ---------------- 01
d01 = Doc('01-dominio.md')
d01.s = d01.s.rstrip('\n') + """
- **CF-25** (Fase 6, aprobado en la revisión de la Parte E de `06-features.md`). **OP-16, variante nueva "Cubrir el sobregiro" (precisión):** Asig(c, p) = Asig(c, p) + máx(0, −Disp(c, p)); se ofrece solo si Disp(c, p) < 0 y se aplica con las reglas de OP-14, incluido AV-11. Detalle en `06-features.md` §5.8 y `04-backend.md` §6.14.4.
"""
d01.n += 1

# ---------------- 04
d04 = Doc('04-backend.md')
d04.cambiar("los cambios CF-01, CF-02, CF-04 a CF-07, CF-09, CF-15 a CF-22 y CF-24 de ",
            "los cambios CF-01, CF-02, CF-04 a CF-07, CF-09, CF-15 a CF-22, CF-24 y CF-25 de ")
d04.cambiar("CF-03 (unir deudores) queda diseñado y **diferido** (06 §3.4); CF-25 está pendiente de aprobación y no se aplica.",
            "CF-03 (unir deudores) queda diseñado y **diferido** (06 §3.4).")
d04.despues("| CF-24 | Motivo `cuota_proxima` | 10.1, 10.2, 11.2, 11.4 | 3.16 |\n",
            "| CF-25 | Datos de los componentes visuales de la identidad: barra de gastado, resumen del historial, progreso de la meta, intensidad del calendario, próximo pago, uso sin reservar, barras de la posición neta, porcentaje y diferencia de la referencia semanal, `porRegla` y variante \"cubrir el sobregiro\" de OP-16 | 6.2, 6.3, 6.5, 6.8, 6.9.3, 6.14.4 | 5.8 |\n")
d04.cambiar("  asignadoEsperado: Centavos;                       // el valor para \"esperado\" de OP-14 (4.6.2)\n}\ninterface FilaPagoTarjeta {",
            "  asignadoEsperado: Centavos;                       // el valor para \"esperado\" de OP-14 (4.6.2)\n"
            "  barra: { cubiertoBp: number; excedenteBp: number;               // [F6] CF-25 (06 §5.8)\n"
            "           tipoExcedente: 'debito' | 'tarjeta' | 'mixto' | null; metaBp?: number } | null;\n"
            "}\ninterface FilaPagoTarjeta {")
d04.despues("### 6.2 Presupuesto\n",
            "\n**[F6] `barra` (CF-25).** Con F = fondo del período (§4.5 de 01, con las entradas), cubierto = Σ cubierto del reparto D2 y excedente = SobT + SobD (§4.7): base = máx(máx(0, F), cubierto + excedente); `excedenteBp` = excedente × 10.000 / base (mitad hacia arriba; al menos 1 si el excedente es positivo); `cubiertoBp` = mín(cubierto × 10.000 / base, 10.000 − `excedenteBp`), nunca negativo; `tipoExcedente` = tipo del `SobregiroDto` de la fila; `null` solo si base = 0. `metaBp` = el progreso de `metas()` (6.10), en metas de ahorro. Propiedad que prueba la Fase 7: `excedenteBp > 0` ⇔ `sobregiro ≠ null`, con el mismo tipo.\n")
d04.cambiar("    pedido; falta; estado: EstadoMeta;\n",
            "    pedido; falta; estado: EstadoMeta;\n    progresoBp?: number;                           // [F6] CF-25: como en metas() (6.10), metas de ahorro; tope 10.000\n")
d04.cambiar("  calendario: { fecha: FechaLocal; gastado: Centavos }[];      // días del período con gasto ≠ 0 (R8)\n",
            "  calendario: { fecha: FechaLocal; gastado: Centavos; intensidadBp: number }[];   // días con gasto ≠ 0 (R8); [F6] CF-25: máx(0, gastado) / máximo del período; 0 si el máximo ≤ 0\n"
            "  historialResumen: { promedioGastado: Centavos; periodosExcedidos: number };   // [F6] CF-25: sobre `historial` (gastado > asignado)\n")
d04.cambiar("  desgloseAlPagar: { deudaAnterior; cargosDelCiclo; yaPagado; paraNoGenerarIntereses: Centavos; ultimoCorte: FechaLocal };  // §4.14 a hoy\n",
            "  desgloseAlPagar: { deudaAnterior; cargosDelCiclo; yaPagado; paraNoGenerarIntereses: Centavos; ultimoCorte: FechaLocal;\n"
            "                     proximoPago: FechaLocal };   // §4.14 a hoy; [F6] CF-25: el proximoPago de 6.5\n")
d04.cambiar("              saldoConfirmado: Centavos }[];\n  prestamos:",
            "              saldoConfirmado: Centavos;\n"
            "              usoSinReservarBp: number | null }[];   // [F6] CF-25: S(t) × 10.000 / límite, tope 10.000; null sin límite o con 0\n  prestamos:")
d04.cambiar("    neto: Centavos;\n  };\n  enCamino: Centavos;",
            "    neto: Centavos;\n"
            "    barras: { activosBp: number; deudasBp: number };   // [F6] CF-25: el mayor total = 10.000, el otro en proporción (≥ 1 si > 0); 0 y 0 si los dos son 0\n"
            "  };\n  enCamino: Centavos;")
d04.cambiar("  categoriaSugerida: Ref | null;\n",
            "  categoriaSugerida: (Ref & { porRegla: boolean }) | null;   // [F6] CF-25: origen 'regla' de sugerirCategoria\n")
d04.cambiar("               anteriores: { periodo: FechaLocal; gasto: Centavos }[] }[];\n  }[];\n}",
            "               anteriores: { periodo: FechaLocal; gasto: Centavos }[] }[];\n"
            "    semanaActual?: { k: number; porcentajeReferenciaBp: number | null };   // [F6] CF-25: gasto / Ref(k), sin tope; null si Ref(k) ≤ 0\n"
            "    diferenciaReferencia?: Centavos;                // [F6] CF-25: RefAcum(k) − gasto acumulado a la semana en curso\n"
            "  }[];\n}")
d04.cambiar("rapida: { faltaMeta?; igualPeriodoAnterior; promedioGasto?: { monto: Centavos; periodos: 1 \\| 2 \\| 3 } } }`",
            "rapida: { faltaMeta?; igualPeriodoAnterior; promedioGasto?: { monto: Centavos; periodos: 1 \\| 2 \\| 3 }; cubrirSobregiro?: Centavos } }` (**[F6]** CF-25: `cubrirSobregiro` = Asig + máx(0, −Disp), solo si Disp < 0; variante \"Cubrir el sobregiro\" de 01 OP-16)")
d04.s = d04.s.rstrip('\n') + "\n- **CF-25** (Fase 6, aprobado en la revisión de la Parte E): datos de los componentes visuales de la identidad y variante \"cubrir el sobregiro\" de OP-16, con sus bordes (6.2, 6.3, 6.5, 6.8, 6.9.3, 6.14.4). Tabla en 0.9.2; detalle en `06-features.md` §5.8.\n"
d04.n += 1

# ---------------- 05
d05 = Doc('05-frontend.md')
d05.cambiar("CF-03 queda diferido; CF-25, P6-26 y P6-27 (06 §5.8) están pendientes y no se aplican.",
            "CF-03 queda diferido; CF-25 se aplicó con la revisión de la Parte E y P6-26 y P6-27 son ajustes del diseño (06 §5.6), sin cambios aquí.")
d05.despues("| CF-23 | `/notificaciones` interceptada en `@superpuesto` desde la campana; `Superpuesto` con la variante \"desde arriba\" | 1.3, 1.4, 10.7 | 0.14, FT-69 |\n",
            "| CF-25 | Los componentes visuales dibujan las proporciones que trae el DTO (barra de gastado, uso sin reservar, barras de la posición neta, intensidad del calendario, porcentaje de la referencia) sin recalcular | 10.8.1 | 5.8 |\n")
d05.cambiar("Los campos marcados *(CF-25)* dependen de un cambio a 04 pendiente de aprobación: hasta entonces, el componente se muestra sin esa parte.",
            "Los campos marcados *(CF-25)* son los de 04 (CF-25, aplicado): el componente dibuja esos puntos básicos tal cual, y un valor nulo no se dibuja.")
d05.cambiar("| `PosicionNeta` | `{ posicion: CuentasDto['posicionNeta'] }` | No | 04 6.5; `deudasSobreActivosBp` *(CF-25)* | Deudas rayadas para distinguirlas sin color |",
            "| `PosicionNeta` | `{ posicion: CuentasDto['posicionNeta'] }` | No | 04 6.5; `barras: { activosBp; deudasBp }` *(CF-25)*, escala relativa al mayor | La mayor al 100 %; deudas rayadas para distinguirlas sin color |")
d05.cambiar("| `BilleteraTarjetas` | `{ tarjetas: CuentasDto['tarjetas'] }` | Sí (traer al frente) | 04 6.5; `usoSinReservarBp` *(CF-25)* |",
            "| `BilleteraTarjetas` | `{ tarjetas: CuentasDto['tarjetas'] }` | Sí (traer al frente) | 04 6.5; `usoSinReservarBp` *(CF-25)*: nulo sin límite, tope 10.000 |")
d05.s = d05.s.rstrip('\n') + "\n- **CF-25** (Fase 6, aprobado en la revisión de la Parte E): los componentes de 10.8.1 dibujan las proporciones que trae el DTO, sin recalcular. Detalle en `06-features.md` §5.8.\n"
d05.n += 1

print('01:', d01.guardar(), '04:', d04.guardar(), '05:', d05.guardar())
