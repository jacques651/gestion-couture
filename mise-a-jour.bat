@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul

REM ============================================================
REM  MISE A JOUR - Gestion Couture
REM
REM  A lancer apres CHAQUE modification du code.
REM  Le script fait TOUT automatiquement :
REM    1. Reconstruit le frontend (React/Vite)
REM    2. Reconstruit le backend (TypeScript -> dist)
REM    3. Copie le frontend dans le dossier servi par le serveur
REM    4. Redemarre le service Windows "GestionCouture"
REM    5. Verifie que le serveur repond (/health)
REM
REM  Lancer de preference en tant qu'ADMINISTRATEUR
REM  (necessaire pour redemarrer le service Windows).
REM ============================================================

cd /d "%~dp0"

echo.
echo ============================================================
echo   MISE A JOUR - GESTION COUTURE
echo ============================================================
echo.

REM ---------- 0. Verification droits administrateur ----------
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Droits administrateur requis pour redemarrer le service.
    echo     Relance automatique en mode administrateur...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

REM ---------- 1. BUILD FRONTEND ----------
echo [1/5] Construction du frontend (React/Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] La construction du frontend a echoue.
    echo          Corrigez les erreurs ci-dessus puis relancez ce script.
    pause
    exit /b 1
)
echo       OK - Frontend construit dans backend\public
echo.

REM ---------- 2. BUILD BACKEND ----------
echo [2/5] Construction du backend (TypeScript)...
pushd backend
call npx tsc
if %errorlevel% neq 0 (
    popd
    echo.
    echo [ERREUR] La compilation du backend a echoue.
    pause
    exit /b 1
)
popd
echo       OK - Backend compile dans backend\dist
echo.

REM ---------- 3. COPIE DU FRONTEND VERS LE SERVEUR ----------
echo [3/5] Deploiement du frontend dans backend\dist\public...
robocopy "backend\public" "backend\dist\public" /MIR /NFL /NDL /NJH /NJS >nul
if %errorlevel% geq 8 (
    echo [ERREUR] La copie du frontend a echoue.
    pause
    exit /b 1
)
echo       OK - Frontend deploye
echo.

REM ---------- 4. REDEMARRAGE DU SERVICE (auto-reparation) ----------
echo [4/5] Redemarrage du service GestionCouture...

set "SVC="
sc query "gestioncouture.exe" >nul 2>&1 && set "SVC=gestioncouture.exe"
if not defined SVC sc query "GestionCouture" >nul 2>&1 && set "SVC=GestionCouture"

REM Pas de service ? On l'installe directement (on est administrateur).
if not defined SVC (
    echo    [!] Service non trouve - installation...
    goto :installer_service
)

REM Configuration winsw manquante (gestioncouture.xml) ? Le service ne pourra
REM jamais demarrer : reinstallation propre.
if not exist "backend\dist\daemon\gestioncouture.xml" (
    echo    [!] Configuration du service manquante - reinstallation...
    goto :reinstaller_service
)

net stop "%SVC%" >nul 2>&1
net start "%SVC%" >nul 2>&1
if %errorlevel% equ 0 (
    echo       OK - Service "%SVC%" redemarre
    goto :verification
)
echo    [!] Echec du redemarrage - reinstallation du service...

:reinstaller_service
pushd backend
node service\uninstall-service.js
timeout /t 6 /nobreak >nul
popd

:installer_service
pushd backend
node service\install-service.js
popd
timeout /t 5 /nobreak >nul
echo       OK - Service installe et demarre

:verification
echo.

REM ---------- 5. VERIFICATION ----------
echo [5/5] Verification du serveur (http://localhost:3001/health)...
set "OK="
for /l %%i in (1,1,15) do (
    if not defined OK (
        powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
        if !errorlevel! equ 0 ( set "OK=1" ) else ( timeout /t 2 /nobreak >nul )
    )
)

echo.
echo ============================================================
if defined OK (
    echo   MISE A JOUR TERMINEE - Le serveur repond correctement.
    echo.
    echo   - Navigateurs / telephones : actualisez la page ^(Ctrl+F5^)
    echo   - Application de bureau ^(Tauri^) : son interface est integree.
    echo     Pour la mettre a jour : npm run tauri build ^(puis reinstaller^).
    echo     Astuce : utilisez le navigateur ^(http://localhost:3001^) pour
    echo     profiter des mises a jour instantanees.
) else (
    echo   ATTENTION : le serveur ne repond pas encore.
    echo   Attendez quelques secondes puis testez :
    echo   http://localhost:3001/health
)
echo ============================================================
echo.
pause
