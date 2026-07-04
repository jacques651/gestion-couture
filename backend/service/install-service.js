// backend/service/install-service.js
//
// Installe le backend Gestion Couture comme SERVICE WINDOWS.
// Un service démarre automatiquement au démarrage de Windows (avant même
// qu'un utilisateur se connecte) et se relance tout seul en cas de plantage.
//
// À exécuter UNE SEULE FOIS, en tant qu'administrateur :
//   node service/install-service.js

const path = require('path');
const { Service } = require('node-windows');

// Chemins absolus (indépendants du dossier depuis lequel on lance le script)
const scriptPath = path.resolve(__dirname, '..', 'dist', 'server.js');
const workingDir = path.resolve(__dirname, '..');

const svc = new Service({
  name: 'GestionCouture',
  description: 'Serveur de l\'application Gestion Couture (interface web + API + base de donnees).',
  script: scriptPath,
  workingDirectory: workingDir,
  // Redémarrage automatique en cas d'arrêt inattendu
  wait: 2,          // attendre 2s avant de retenter
  grow: 0.5,        // augmenter progressivement le délai entre tentatives
  maxRestarts: 10,  // nombre de tentatives dans une fenêtre de 60s
  env: [
    { name: 'NODE_ENV', value: 'production' },
    { name: 'PORT', value: '3001' }
  ]
});

svc.on('install', () => {
  console.log('OK - Service "GestionCouture" installe.');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('INFO - Le service est deja installe. Rien a faire.');
});

svc.on('start', () => {
  console.log('OK - Service demarre.');
  console.log('     L\'application est accessible sur http://<ip-du-serveur>:3001');
  console.log('     Le serveur redemarrera automatiquement a chaque allumage de Windows.');
});

svc.on('error', (err) => {
  console.error('ERREUR du service :', err);
});

svc.on('invalidinstallation', () => {
  console.error('ERREUR - Installation invalide (droits administrateur requis ?).');
});

console.log('Installation du service Windows "GestionCouture"...');
console.log('Script serveur :', scriptPath);
svc.install();
