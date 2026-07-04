param(
  [int]$Port = 3001
)

# ================================================================
#  Lanceur "hybride" de Gestion Couture.
#  Teste les adresses connues du serveur (cable + Wi-Fi) et ouvre
#  l'application sur la premiere qui repond. Ainsi, que le poste
#  soit branche en cable ou connecte en Wi-Fi, ca marche tout seul.
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

$cible = $null
foreach ($h in $hotes) {
  if (Test-Serveur $h $Port) {
    $cible = "http://${h}:$Port"
    break
  }
}

if (-not $cible) {
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show(
    "Impossible de joindre le serveur Gestion Couture.`n`n" +
    "Verifiez que :`n" +
    " - le PC serveur est allume,`n" +
    " - vous etes bien connecte au reseau (cable ou Wi-Fi).",
    "Gestion Couture",
    'OK',
    'Warning'
  ) | Out-Null
  exit 1
}

# Ouvre l'application en mode "application" (fenetre propre) via Edge si dispo
$edge = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($edge) {
  Start-Process $edge -ArgumentList "--app=$cible"
} else {
  Start-Process $cible
}
