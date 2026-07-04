# Gestion Couture — Guide d'installation (démarrage automatique)

Ce guide explique comment installer l'application pour qu'elle **démarre toute
seule** et que les utilisateurs n'aient **rien à faire** à part travailler.

L'application fonctionne en réseau local (câble Ethernet), **sans Internet**.
Un PC joue le rôle de **serveur** ; les autres postes s'y connectent avec un
simple navigateur.

**Connexion hybride (câble ou Wi-Fi).** Le serveur répond en même temps sur
toutes ses cartes réseau. Un poste peut donc se connecter via le **câble** ou
via le **Wi-Fi**, indifféremment. Le raccourci installé sur chaque poste teste
automatiquement les adresses du serveur et ouvre l'application sur celle qui
répond — l'utilisateur n'a rien à choisir.

---

## Vue d'ensemble

- **1 PC serveur** : héberge la base de données + l'application. On l'installe
  une seule fois avec `INSTALLER-SERVEUR.bat`. Ensuite, il démarre tout seul.
- **Les autres postes (clients)** : rien à installer. On lance une fois
  `INSTALLER-CLIENT.bat` pour créer un raccourci d'ouverture automatique.

---

## PARTIE 1 — Installer le PC serveur (à faire une seule fois)

### Pré-requis (à installer une seule fois sur le PC serveur)

1. **Node.js** (version LTS) : https://nodejs.org
2. **PostgreSQL** : https://www.postgresql.org/download/windows/
   - Lors de l'installation, notez le **mot de passe** du compte `postgres`.
   - Ce mot de passe doit correspondre à celui du fichier `backend/src/db.ts`.

### Installation

1. Copiez le dossier du projet sur le PC serveur (par exemple `C:\gestion-couture`).
2. **Clic droit** sur `INSTALLER-SERVEUR.bat` → **Exécuter en tant qu'administrateur**.
3. Laissez faire. Le script va tout préparer automatiquement :
   - construire l'application,
   - activer PostgreSQL au démarrage,
   - ouvrir le port 3001 dans le pare-feu,
   - installer le serveur comme **service Windows** (démarrage automatique),
   - créer un raccourci qui ouvre l'application.
4. À la fin, l'écran affiche les **adresses IP** du serveur (par exemple
   `http://192.168.1.10:3001`). **Notez-en une** : vous en aurez besoin pour
   les autres postes.

C'est terminé. À partir de maintenant, **le serveur démarre tout seul** à chaque
allumage du PC, avant même qu'une personne se connecte, et se relance
automatiquement en cas de problème.

> Conseil : donnez une **adresse IP fixe** au PC serveur pour que l'adresse ne
> change jamais. (Souvent réglable dans la box/routeur ou dans les paramètres
> réseau de Windows.)

---

## PARTIE 2 — Configurer les autres postes (clients)

Sur chaque autre PC :

1. Copiez au moins le fichier `INSTALLER-CLIENT.bat` **et** le dossier `outils`.
2. Double-cliquez sur `INSTALLER-CLIENT.bat` (pas besoin d'administrateur).
3. Saisissez les **adresses IP du serveur**, séparées par un espace. Mettez
   celle du **câble** et celle du **Wi-Fi** si vous utilisez les deux
   (ex. `192.168.100.151 192.168.11.114`).
4. C'est fait : un raccourci **Gestion Couture** apparaît sur le Bureau, et
   l'application **s'ouvrira automatiquement** à chaque démarrage du poste, en
   choisissant seule le réseau disponible (câble ou Wi-Fi).

> Le PC serveur doit être allumé pour que les postes clients puissent travailler.
> Pour modifier les adresses plus tard, éditez le fichier `outils\serveurs.txt`
> (une adresse par ligne).

---

## Utilisation au quotidien

- L'utilisateur allume son PC → l'application s'ouvre toute seule dans une
  fenêtre propre (comme un vrai logiciel).
- Rien d'autre à faire.

---

## Gestion du service (pour le technicien, si besoin)

Le serveur tourne en tant que service Windows nommé **GestionCouture**.

- Le voir : touche Windows → tapez « Services » → cherchez « GestionCouture ».
- Le désinstaller : dans le dossier `backend`, ouvrir une invite de commandes
  **administrateur** et lancer :
  ```
  node service\uninstall-service.js
  ```
- Le réinstaller : `node service\install-service.js` (administrateur).

---

## Mettre à jour l'application plus tard

Sur le PC serveur :

1. Remplacez les fichiers du projet par la nouvelle version.
2. Relancez `INSTALLER-SERVEUR.bat` en administrateur (il reconstruit et
   redémarre le service).

Tous les postes ont la nouvelle version au prochain rechargement — **rien à
réinstaller sur les clients**.

---

## En cas de souci

- **Un poste client n'affiche rien** : vérifiez que le PC serveur est allumé,
  et que l'adresse IP saisie est la bonne (elle a pu changer si l'IP n'est pas
  fixe).
- **L'application ne se charge pas sur le serveur** : vérifiez dans « Services »
  que **GestionCouture** est bien « En cours d'exécution », et que le service
  **PostgreSQL** l'est aussi.
- **Vérifier que le serveur répond** : ouvrez `http://localhost:3001/health`
  sur le PC serveur — vous devez voir un message indiquant que le serveur est
  actif.

---

## Note de sécurité (importante)

L'API du serveur est joignable par tout appareil du réseau local, **sur le câble
comme sur le Wi-Fi**. Tant qu'il n'y a pas d'authentification **côté serveur**,
n'importe quel appareil connecté à l'un de ces réseaux peut accéder aux données
via l'adresse du serveur.

- Le Wi-Fi utilisé donnant aussi accès à Internet, veillez à ce que ce Wi-Fi
  soit **privé et protégé par mot de passe** (pas un réseau ouvert/public).
- **N'exposez pas** le port 3001 sur Internet (pas de redirection de port sur la
  box/routeur) tant que l'authentification serveur n'est pas en place.
- Avant une mise en production réelle, il est fortement recommandé d'ajouter une
  authentification serveur et de hacher les mots de passe.
