// backend/service/uninstall-service.js
//
// Désinstalle le service Windows "GestionCouture".
// À exécuter en tant qu'administrateur :
//   node service/uninstall-service.js

const path = require('path');
const { Service } = require('node-windows');

const svc = new Service({
  name: 'GestionCouture',
  script: path.resolve(__dirname, '..', 'dist', 'server.js')
});

svc.on('uninstall', () => {
  console.log('OK - Service "GestionCouture" desinstalle.');
});

svc.on('alreadyuninstalled', () => {
  console.log('INFO - Le service n\'etait pas installe.');
});

svc.on('error', (err) => {
  console.error('ERREUR :', err);
});

console.log('Desinstallation du service "GestionCouture"...');
svc.uninstall();
