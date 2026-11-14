# finn-2

## Probar cambios en local

`pnpm probar` levanta la app en http://localhost:3100 contra la pila local de la E2E (Supabase en Docker: base
`finn_e2e`, auth y kong), sembrada con los datos de ejemplo de A.7 por operaciones reales, sin desplegar ni esperar CI.
Necesita Docker Desktop encendido.

1. `pnpm probar` compila y sirve como la E2E (`next build` + `next start`). Para ver otro cambio, cortalo y volvé a
   correrlo; `pnpm probar --sin-compilar` reutiliza la última compilación si el código no cambió. No usa `next dev`: con
   Next 16.4.1 deja `/ingresar` en 404 por la ranura `@superpuesto`.
2. Cuando dice `LISTO`, abrí la URL y entrá con el correo, la clave y el código que imprime. El código cambia cada 30 s:
   `pnpm probar:codigo` da el vigente. Son credenciales de esa pila local y de esa corrida.
3. Para terminar: Ctrl+C, o `pnpm probar --bajar` desde otra terminal. Eso baja la pila y suelta el candado.

Mientras está arriba tiene el candado de la E2E local (DT-22): `pnpm test:e2e` de los agentes espera a que la bajes.
El reloj del servidor arranca en el último día de la semilla (15 de octubre de 2026) y avanza desde ahí.
