// src/services/backend.ts
// En mode application web, le backend tourne sur la machine serveur.

let backendStarted = false;

export async function startBackend() {
  if (backendStarted) {
    return;
  }
  backendStarted = true;
  console.log('Mode web : le backend est hébergé sur le serveur.');
}
