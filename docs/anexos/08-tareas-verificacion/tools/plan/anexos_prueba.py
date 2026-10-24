# Prueba de anexos.ts (V8-05) con una carpeta sintética: archivos VACÍOS con los nombres citados en el plan.
# No contiene nada de los anexos reales. Uso: python3 -I tools/plan/anexos_prueba.py <08-tareas.md> <carpeta-temporal>
import io, os, re, shutil, subprocess, sys, zipfile
plan, dest = sys.argv[1], sys.argv[2]
shutil.rmtree(dest, ignore_errors=True); os.makedirs(dest)
vacia = os.path.join(dest, '_vacia'); os.makedirs(vacia)
salida = subprocess.run(['node', 'tools/plan/anexos.ts', '--plan', plan, '--anexos', vacia], capture_output=True, text=True).stdout
nombres = sorted(set(re.findall(r'^(?:FALTA|REVISAR) (\S+)', salida, re.M)))
shutil.rmtree(vacia)
carpeta = os.path.join(dest, 'anexos'); os.makedirs(carpeta)
def zipear(nombre, archivos, anidado=None):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        for a in archivos:
            z.writestr(a if not a.endswith('/') else a + 'x.svg', b'')
        if anidado: z.writestr(anidado[0], anidado[1])
    return buf.getvalue()
marca = zipear('finn-marca.zip', ['manifest-icons.json'])
entrega = [n for n in nombres if n in ('tokens.css', 'tokens.json')] + [f'iconos/i{k:02d}.svg' for k in range(52)] + [f'iconos/estados/e{k}.svg' for k in range(7)]
open(os.path.join(carpeta, 'finn-entrega.zip'), 'wb').write(zipear('finn-entrega.zip', entrega, ('finn-marca.zip', marca)))
resto = [n for n in nombres if n not in entrega and n not in ('finn-marca.zip', 'manifest-icons.json', 'iconos/', 'iconos/estados/')]
# [F8] lista de TU-04 (archivos vacíos con esos nombres)
for n in ['00-decisiones.md', '01-dominio.md', '02-tecnologias.md', '03-base-de-datos.md', '04-backend.md', '05-frontend.md', '06-features.md', '07-pruebas.md', '08-tareas.md', '05-anexo-encargo-claude-design.md', '06-identidad-visual.md', 'Finn 2.0 — Características, Funciones y Mejoras.md', '04-backend-verificacion.md', '05-frontend-verificacion.md']:
    open(os.path.join(carpeta, n), 'wb').close()
for f in range(3, 9):
    if f != 7: open(os.path.join(carpeta, f'0{f}-verificacion.zip'), 'wb').write(zipear('x', ['LEEME.md']))
mitad = len(resto) // 2
open(os.path.join(carpeta, '07-pruebas-verificacion.zip'), 'wb').write(zipear('07.zip', ['07-pruebas-verificacion/' + n for n in resto[:mitad]]))
for n in resto[mitad:]:
    os.makedirs(os.path.join(carpeta, 'extraidos', os.path.dirname(n)), exist_ok=True)
    open(os.path.join(carpeta, 'extraidos', n), 'wb').close()
print(f'Carpeta sintética: {len(nombres)} nombres (archivos vacíos); finn-marca.zip dentro de finn-entrega.zip; {mitad} en fase-7.zip; {len(resto) - mitad} extraídos.')
r = subprocess.run(['node', 'tools/plan/anexos.ts', '--plan', plan, '--anexos', carpeta, '--entrada', '--negativo'], capture_output=True, text=True)
print(r.stdout, end='')
os.remove(os.path.join(carpeta, 'extraidos', resto[-1]))
r2 = subprocess.run(['node', 'tools/plan/anexos.ts', '--plan', plan, '--anexos', carpeta], capture_output=True, text=True)
print(f'Con {resto[-1]} borrado de la carpeta: ' + ('detectado' if f'FALTA {resto[-1]}' in r2.stdout and r2.returncode == 1 else 'NO DETECTADO'))
# [F8] control: finn-entrega.zip con 51 íconos
open(os.path.join(carpeta, 'finn-entrega.zip'), 'wb').write(zipear('finn-entrega.zip', [x for x in entrega if x != 'iconos/i00.svg'], ('finn-marca.zip', marca)))
r3 = subprocess.run(['node', 'tools/plan/anexos.ts', '--plan', plan, '--anexos', carpeta, '--entrada'], capture_output=True, text=True)
print('Con 51 íconos en finn-entrega.zip: ' + ('detectado' if 'hay 51' in r3.stdout and r3.returncode == 1 else 'NO DETECTADO'))
sys.exit(0 if r.returncode == 0 and r2.returncode == 1 and r3.returncode == 1 and 'hay 51' in r3.stdout else 1)
