D=/tmp/claude-0/firmas; cd $D; rm -rf repo2; git init -q repo2; cd repo2
git config user.email andres@example.com; git config user.name Andrés; git config gpg.format ssh; git config gpg.ssh.program ssh-keygen
mkdir -p pruebas/manuales; echo "andres@example.com $(cat ../usuario.pub)" > pruebas/firmantes-permitidos
git add .; git -c user.signingkey=$D/usuario commit -q -S -m "firmantes"
printf '| PRU-MAN-BAND-001 | 2027-03-02 | Android | pasa | Andrés | abc | |\n| PRU-MAN-ACCESO-001 | 2027-03-02 | Android | falla | Andrés | abc | |\n' > pruebas/manuales/resultados.md
git add .; git -c user.signingkey=$D/usuario commit -q -S -m "dos resultados firmados"
echo "== caso A: todo firmado por el usuario"; sh ../verificar-firmas.sh HEAD; echo "salida $?"
sed -i 's/| falla |/| pasa |/' pruebas/manuales/resultados.md; git add .; git commit -q --no-gpg-sign -m "un agente cambia falla por pasa"
echo "== caso B: una fila editada sin firma"; sh ../verificar-firmas.sh HEAD~1; echo "salida $?"; git reset -q --hard HEAD~1
sed -i '/ACCESO/d' pruebas/manuales/resultados.md; git add .; git commit -q --no-gpg-sign -m "un agente borra la falla"
echo "== caso C: una fila borrada sin firma (blame no la ve; el log sí)"; sh ../verificar-firmas.sh HEAD~1; echo "salida $?"; git reset -q --hard HEAD~1
echo "agente@x $(cat ../agente.pub)" >> pruebas/firmantes-permitidos; git add .; git -c user.signingkey=$D/usuario commit -q -S -m "dos claves en firmantes"
echo "== caso D: firmantes con dos claves"; sh ../verificar-firmas.sh HEAD; echo "salida $?"
