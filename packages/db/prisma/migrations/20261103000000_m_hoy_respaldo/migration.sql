-- finn:manual
-- CH-91 (TA-262; 03 §8.3; 07 §31.1, DP-29): el control de dinero diario lee los hechos como finn_respaldo con leer()
-- de @finn/db, la misma consulta que la app, y leer() llama a finn.hoy(). Expansión (DP-31): solo agrega un privilegio.
-- hoy() es STABLE y no escribe; la sesión de finn_respaldo sigue con default_transaction_read_only = on, y
-- tomar_bloqueo() y eliminar_conciliaciones_de_cuenta(uuid) siguen sin EXECUTE para ese rol. No escribe filas.
GRANT EXECUTE ON FUNCTION finn.hoy() TO finn_respaldo;
