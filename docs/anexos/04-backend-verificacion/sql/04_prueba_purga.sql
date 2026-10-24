-- Prepara: 3 eliminaciones viejas (revisiones 5, 9, 7) y 2 recientes (revisiones 20, 21); revision_minima_incremental = 0
BEGIN; SELECT finn.tomar_bloqueo();
DELETE FROM finn.eliminaciones;
INSERT INTO finn.eliminaciones (tabla, fila_id, revision, eliminada_en) VALUES
 ('asignaciones', gen_random_uuid(), 5,  now() - interval '45 days'),
 ('asignaciones', gen_random_uuid(), 9,  now() - interval '31 days'),
 ('asignaciones', gen_random_uuid(), 7,  now() - interval '30 days 1 minute'),
 ('asignaciones', gen_random_uuid(), 20, now() - interval '29 days'),
 ('asignaciones', gen_random_uuid(), 21, now());
UPDATE finn.revision SET revision_minima_incremental = 0 WHERE id = 1;
COMMIT;
