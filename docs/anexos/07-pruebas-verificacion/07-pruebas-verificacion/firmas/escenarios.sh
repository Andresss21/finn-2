D=/tmp/claude-0/firmas; cd $D
sed -i 's|git -c gpg.ssh.allowedSignersFile="$F" verify-commit|git -c gpg.ssh.program=ssh-keygen -c gpg.ssh.allowedSignersFile="$F" verify-commit|' verificar-firmas.sh
rm -rf repo; git init -q repo; cd repo
git config user.email andres@example.com; git config user.name Andrés; git config gpg.format ssh; git config gpg.ssh.program ssh-keygen
mkdir -p pruebas/manuales; echo "andres@example.com $(cat ../usuario.pub)" > pruebas/firmantes-permitidos
git add .; git -c user.signingkey=$D/usuario commit -q -S -m "firmantes"
echo "| PRU-MAN-BAND-001 | 2027-03-02 | Android | pasa | Andrés | abc | |" > pruebas/manuales/resultados.md
git add .; git -c user.signingkey=$D/usuario commit -q -S -m "resultado firmado por el usuario"
echo "== caso 1: solo firmas del usuario"; sh ../verificar-firmas.sh HEAD; echo "salida $?"
echo "| PRU-MAN-ACCESO-001 | 2027-03-02 | Android | pasa | Andrés | abc | |" >> pruebas/manuales/resultados.md
git add .; git -c user.signingkey=$D/agente commit -q -S -m "resultado firmado con otra clave"
echo "== caso 2: un commit firmado con otra clave"; sh ../verificar-firmas.sh HEAD~1; echo "salida $?"
git reset -q --hard HEAD~1; echo "| PRU-MAN-ACCESO-001 | x |" >> pruebas/manuales/resultados.md; git add .; git commit -q --no-gpg-sign -m "resultado sin firma"
echo "== caso 3: un commit sin firma"; sh ../verificar-firmas.sh HEAD~1; echo "salida $?"
git reset -q --hard HEAD~1; echo "agente@x $(cat ../agente.pub)" >> pruebas/firmantes-permitidos; echo "| y |" >> pruebas/manuales/resultados.md
git add .; git -c user.signingkey=$D/agente commit -q -S -m "el PR agrega otra clave a firmantes y firma con ella"
echo "== caso 4: el PR agrega su propia clave (los firmantes se leen de la base)"; sh ../verificar-firmas.sh HEAD~1; echo "salida $?"
echo "== control: si se leyeran los firmantes del propio PR, el caso 4 pasaría"; sh ../verificar-firmas.sh HEAD; echo "salida $?"
