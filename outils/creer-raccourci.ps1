param(
  [string]$Nom = "Gestion Couture"
)

# Cree des raccourcis qui lancent le "lanceur hybride" (lancer-application.ps1).
# Le lanceur choisit automatiquement l'adresse du serveur qui repond
# (cable ou Wi-Fi). Les raccourcis sont places sur le Bureau et dans le
# dossier Demarrage (ouverture automatique a la connexion).

$dir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$lanceur = Join-Path $dir 'lancer-application.ps1'
$powershell = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'

# Icone : Chrome de preference, sinon Edge, sinon icone PowerShell par defaut
$navigateur = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

$ws = New-Object -ComObject WScript.Shell
$dossiers = @(
  [Environment]::GetFolderPath('Startup'),
  [Environment]::GetFolderPath('Desktop')
)

foreach ($d in $dossiers) {
  $lnk = $ws.CreateShortcut((Join-Path $d "$Nom.lnk"))
  $lnk.TargetPath = $powershell
  $lnk.Arguments  = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$lanceur`""
  $lnk.WorkingDirectory = $dir
  if ($navigateur) { $lnk.IconLocation = "$navigateur,0" }
  $lnk.Description = "Application Gestion Couture (connexion automatique cable ou Wi-Fi)"
  $lnk.Save()
}

Write-Host "Raccourcis crees (Bureau + Demarrage automatique)."
Write-Host "Adresses testees : voir le fichier serveurs.txt"
