@echo off
chcp 65001 >nul

REM ============================================================
REM  MODE DEVELOPPEMENT - Gestion Couture
REM
REM  Lance le frontend ET le backend en mode "rechargement a chaud" :
REM  chaque modification du code est appliquee INSTANTANEMENT,
REM  sans reconstruction ni redemarrage manuel.
REM
REM  - Frontend : http://localhost:1420  (Vite, hot reload)
REM  - Backend  : http://localhost:3001  (ts-node-dev, redemarre seul)
REM
REM  Quand le resultat vous convient, lancez mise-a-jour.bat
REM  pour deployer sur le serveur.
REM ============================================================

cd /d "%~dp0"

echo.
echo Demarrage du BACKEND (rechargement automatique)...
start "Backend DEV - GestionCouture" cmd /k "cd /d %~dp0backend && npm run dev"

echo Demarrage du FRONTEND (rechargement automatique)...
start "Frontend DEV - GestionCouture" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ============================================================
echo   Deux fenetres se sont ouvertes :
echo   - Backend  : http://localhost:3001
echo   - Frontend : http://localhost:1420  ^(a ouvrir dans le navigateur^)
echo.
echo   Modifiez le code : tout se met a jour TOUT SEUL.
echo   Fermez les deux fenetres pour arreter.
echo ============================================================
echo.
pause
