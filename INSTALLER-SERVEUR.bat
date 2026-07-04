@echo off
setlocal enabledelayedexpansion
title Installation du serveur - Gestion Couture

:: ================================================================
::  Installateur du SERVEUR Gestion Couture (mode hybride cable/Wi-Fi)
:: ================================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo   Ce programme doit etre lance en tant qu'ADMINISTRATEUR.
  echo   Clic droit sur ce fichier  -^>  "Executer en tant qu'administrateur".
  echo.
  pause
  exit /b 1
)

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo   Node.js n'est pas installe. Installez-le depuis https://nodejs.org puis relancez.
  echo.
  pause
  exit /b 1
)

echo ================================================
echo    Installation du serveur Gestion Couture
echo ================================================
echo.

echo [1/8] Dependances de l'interface...
call npm install || goto :erreur

echo [2/8] Construction de l'interface web...
call npm run build || goto :erreur

echo [3/8] Dependances du serveur...
cd backend
call npm install || goto :erreur

echo [4/8] Construction du serveur...
call npm run build || goto :erreur
if exist init.sql copy /Y init.sql dist\init.sql >nul
cd ..

echo [5/8] Activation de PostgreSQL au demarrage...
powershell -NoProfile -Command "Get-Service -Name 'postgresql*' -ErrorAction SilentlyContinue | ForEach-Object { Set-Service -Name $_.Name -StartupType Automatic; Start-Service -Name $_.Name -ErrorAction SilentlyContinue }"

echo [6/8] Ouverture du port 3001 dans le pare-feu (cable + Wi-Fi)...
powershell -NoProfile -Command "if (-not (Get-NetFirewallRule -DisplayName 'Gestion Couture (3001)' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName 'Gestion Couture (3001)' -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -Profile Any | Out-Null }"

echo [7/8] Detection des adresses reseau du serveur...
powershell -NoProfile -Command "$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' } | Select-Object -ExpandProperty IPAddress -Unique; $lignes = @('# Adresses du serveur (generees automatiquement le ' + (Get-Date -Format 'yyyy-MM-dd HH:mm') + ')') + $ips; Set-Content -Path 'outils\serveurs.txt' -Value $lignes -Encoding UTF8; Write-Host ('   ' + ($ips -join ' , '))"

echo [8/8] Installation du service Windows (demarrage automatique)...
cd backend
node service\install-service.js || goto :erreur
cd ..

echo.
echo Creation du raccourci d'ouverture automatique (lanceur hybride)...
powershell -NoProfile -ExecutionPolicy Bypass -File "outils\creer-raccourci.ps1"

echo.
echo ================================================
echo    TERMINE !
echo ================================================
echo.
echo   Le serveur demarre TOUT SEUL a chaque allumage de Windows et se
echo   relance automatiquement. Il repond a la fois sur le cable ET le Wi-Fi.
echo.
echo   Adresses de l'application (a donner aux autres postes) :
powershell -NoProfile -Command "Get-Content 'outils\serveurs.txt' | Where-Object { $_ -and -not $_.Trim().StartsWith('#') } | ForEach-Object { '        http://' + $_.Trim() + ':3001' }"
echo.
echo   Sur CE PC serveur : http://localhost:3001
echo.
pause
exit /b 0

:erreur
echo.
echo   *** Une erreur est survenue. Lisez les messages ci-dessus. ***
echo.
pause
exit /b 1
