@echo off
setlocal enabledelayedexpansion
title Configuration d'un poste - Gestion Couture

:: ================================================================
::  A executer sur chaque POSTE CLIENT (mode hybride cable/Wi-Fi).
::  Pas besoin de droits administrateur.
:: ================================================================

cd /d "%~dp0"

echo ================================================
echo    Configuration d'un poste client (hybride)
echo ================================================
echo.
echo   Entrez les adresses IP du PC SERVEUR, separees par un ESPACE.
echo   Mettez celle du cable ET celle du Wi-Fi si vous utilisez les deux.
echo.
echo   Exemple :  192.168.100.151 192.168.11.114
echo.
if exist "outils\serveurs.txt" (
  echo   Adresses deja enregistrees :
  powershell -NoProfile -Command "Get-Content 'outils\serveurs.txt' | Where-Object { $_ -and -not $_.Trim().StartsWith('#') } | ForEach-Object { '     - ' + $_ }"
  echo   ^(Laissez vide et appuyez sur Entree pour les CONSERVER.^)
  echo.
)
set /p SERVERIPS=Adresses IP du serveur :

if "%SERVERIPS%"=="" (
  if exist "outils\serveurs.txt" (
    echo.
    echo   Adresses existantes conservees.
    goto :raccourcis
  )
  echo.
  echo   Aucune adresse saisie. Abandon.
  pause
  exit /b 1
)

:: Ecrit la liste des adresses (une par ligne) dans outils\serveurs.txt
powershell -NoProfile -Command "$saisie = '%SERVERIPS%'; $ips = $saisie -split '[ ,;]+' | Where-Object { $_ }; $lignes = @('# Adresses du serveur (saisies le ' + (Get-Date -Format 'yyyy-MM-dd HH:mm') + ')') + $ips; Set-Content -Path 'outils\serveurs.txt' -Value $lignes -Encoding UTF8"

:raccourcis

powershell -NoProfile -ExecutionPolicy Bypass -File "outils\creer-raccourci.ps1"

echo.
echo ================================================
echo    TERMINE !
echo ================================================
echo.
echo   L'application s'ouvrira automatiquement au demarrage de ce poste,
echo   en choisissant seule le reseau disponible (cable ou Wi-Fi).
echo   Un raccourci "Gestion Couture" est aussi sur le Bureau.
echo.
echo   (Le PC serveur doit etre allume.)
echo.
pause
exit /b 0
