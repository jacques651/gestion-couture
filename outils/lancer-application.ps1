param(
  [int]$Port = 3001,
  [int]$MaxWaitSec = 90
)

# ================================================================
#  Lanceur "hybride" de Gestion Couture.
#  Teste les adresses connues du serveur (cable + Wi-Fi) et ouvre
#  l'application sur la premiere qui repond. Ainsi, que le poste
#  soit branche en cable ou connecte en Wi-Fi, ca marche tout seul.
#
#  IMPORTANT : au demarrage de Windows, le serveur (service +
#  PostgreSQL) peut mettre 30 a 60 secondes a etre pret. Ce lanceur
#  RE-ESSAIE donc pendant $MaxWaitSec secondes avant d'afficher une
#  erreur, au lieu d'abandonner au premier echec.
# ================================================================

$ErrorActionPreference = 'SilentlyContinue'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$listeFichier = Join-Path $dir 'serveurs.txt'

# Liste des adresses candidates : localhost d'abord (si on est SUR le serveur),
# puis les adresses lues dans serveurs.txt (modifiable sans toucher au code).
$hotes = @('localhost')
if (Test-Path $listeFichier) {
  $hotes += Get-Content $listeFichier |
    Where-Object { $_ -and -not $_.Trim().StartsWith('#') } |
    ForEach-Object { $_.Trim() }
}
$hotes = $hotes | Select-Object -Unique

# Test rapide de connexion TCP (800 ms max par adresse)
function Test-Serveur([string]$h, [int]$p, [int]$timeoutMs = 800) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect($h, $p, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne($timeoutMs, $false)
    $connecte = $ok -and $client.Connected
    if ($connecte) { $client.EndConnect($iar) }
    $client.Close()
    return $connecte
  } catch {
    return $false
  }
}

# Si on est SUR le PC serveur et que le service est arrete, tenter de le demarrer
try {
  $svc = Get-Service | Where-Object { $_.Name -match 'gestioncouture' -or $_.DisplayName -match 'GestionCouture' } | Select-Object -First 1
  if ($svc -and $svc.Status -ne 'Running') {
    Start-Service $svc.Name -ErrorAction SilentlyContinue
  }
} catch { }

# Boucle de detection : re-essayer jusqu'a $MaxWaitSec secondes
$cible = $null
$chrono = [System.Diagnostics.Stopwatch]::StartNew()
while (-not $cible -and $chrono.Elapsed.TotalSeconds -lt $MaxWaitSec) {
  foreach ($h in $hotes) {
    if (Test-Serveur $h $Port) {
      $cible = "http://${h}:$Port"
      break
    }
  }
  if (-not $cible) { Start-Sleep -Seconds 3 }
}

if (-not $cible) {
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show(
    "Impossible de joindre le serveur Gestion Couture apres $MaxWaitSec secondes.`n`n" +
    "Verifiez que :`n" +
    " - le PC serveur est allume,`n" +
    " - vous etes bien connecte au reseau (cable ou Wi-Fi),`n" +
    " - le service GestionCouture est demarre sur le serveur.`n`n" +
    "Reessayez en double-cliquant sur le raccourci Gestion Couture.",
    "Gestion Couture",
    'OK',
    'Warning'
  ) | Out-Null
  exit 1
}

# Ouvre l'application en mode "application" (fenetre propre).
# Ordre de preference : CHROME d'abord, puis Edge, puis navigateur par defaut.
$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

$edge = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($chrome) {
  Start-Process $chrome -ArgumentList "--app=$cible"
} elseif ($edge) {
  Start-Process $edge -ArgumentList "--app=$cible"
} else {
  Start-Process $cible
}
