"""Aplica las enmiendas de la Fase 6 (CF-01 a CF-24, salvo CF-03) a una copia de 03, 04 y 05.

Cada inserción se ancla en un texto que debe aparecer exactamente una vez; si no, el script falla
sin escribir nada. Uso: python3 aplicar.py <dir con 03-base-de-datos.md, 04-backend.md, 05-frontend.md>
"""
import sys, pathlib

base = pathlib.Path(sys.argv[1])


class Doc:
    def __init__(self, nombre):
        self.ruta = base / nombre
        self.s = self.ruta.read_text()
        self.n = 0

    def _uno(self, ancla):
        c = self.s.count(ancla)
        assert c == 1, f'{self.ruta.name}: el ancla aparece {c} veces: {ancla[:80]!r}'
        return self.s.index(ancla)

    def despues(self, ancla, texto):
        i = self._uno(ancla) + len(ancla)
        self.s = self.s[:i] + texto + self.s[i:]; self.n += 1

    def antes(self, ancla, texto):
        i = self._uno(ancla)
        self.s = self.s[:i] + texto + self.s[i:]; self.n += 1

    def cambiar(self, viejo, nuevo):
        self._uno(viejo)
        self.s = self.s.replace(viejo, nuevo); self.n += 1

    def guardar(self):
        self.ruta.write_text(self.s)
        return self.n


exec(open(pathlib.Path(__file__).with_name('enm_04.py')).read())
exec(open(pathlib.Path(__file__).with_name('enm_05.py')).read())
exec(open(pathlib.Path(__file__).with_name('enm_03.py')).read())
print('04:', d04.guardar(), 'cambios;', '05:', d05.guardar(), 'cambios;', '03:', d03.guardar(), 'cambios')
