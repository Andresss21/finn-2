-- finn:manual
INSERT INTO finn.estado_respaldo (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
