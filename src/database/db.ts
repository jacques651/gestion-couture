// db.ts - VERSION COMPLÈTE CORRIGÉE (sans doublon)
import Database from "@tauri-apps/plugin-sql";
import bcrypt from "bcryptjs";

let dbInstance: Database | null = null;

const columnExists = async (db: any, table: string, column: string) => {
  const cols = await db.select(`PRAGMA table_info(${table})`);
  return cols.some((c: any) => c.name === column);
};


export const getDb = async (): Promise<Database> => {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = await Database.load("sqlite:gestion-couture.db");
    await dbInstance.execute(`PRAGMA foreign_keys = ON`);
    await dbInstance.execute(`PRAGMA journal_mode = WAL`);
    await initTables(dbInstance);
    console.log("✅ Base de données initialisée");
  } catch (error) {
    console.error("❌ ERREUR INITIALISATION DB:", error);
    throw error;
  }
  return dbInstance;
};

// ===============================
// CONFIGURATION ATELIER
// ===============================
export interface ConfigurationAtelier {
  id: number;
  nom_atelier: string;
  telephone: string;
  adresse: string;
  email: string;
  nif: string;
  message_facture: string;
  logo_base64: string;
}

export const getConfigurationAtelier = async (): Promise<ConfigurationAtelier | null> => {
  const res = await selectSafe<ConfigurationAtelier>(
    "SELECT * FROM configuration_atelier WHERE id = 1"
  );
  if (res?.length) return res[0];
  await executeSafe(`INSERT INTO configuration_atelier (id) VALUES (1)`);
  return {
    id: 1,
    nom_atelier: '',
    telephone: '',
    adresse: '',
    email: '',
    nif: '',
    message_facture: '',
    logo_base64: ''
  };
};

export const saveConfigurationAtelier = async (config: ConfigurationAtelier) => {
  return executeSafe(
    `INSERT INTO configuration_atelier (
      id, nom_atelier, telephone, adresse, email, nif, message_facture, logo_base64
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      nom_atelier=excluded.nom_atelier,
      telephone=excluded.telephone,
      adresse=excluded.adresse,
      email=excluded.email,
      nif=excluded.nif,
      message_facture=excluded.message_facture,
      logo_base64=excluded.logo_base64,
      updated_at=CURRENT_TIMESTAMP
    `,
    [
      config.nom_atelier,
      config.telephone,
      config.adresse,
      config.email,
      config.nif,
      config.message_facture,
      config.logo_base64
    ]
  );
};

// ==============================
// MIGRATIONS
// ==============================
const runMigrations = async (db: Database) => {
  const safeAddColumn = async (table: string, column: string, definition: string) => {
    const exists = await columnExists(db, table, column);
    if (!exists) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`✅ Ajout colonne ${table}.${column}`);
    }
  };

  await safeAddColumn(
    "salaires",
    "type",
    "TEXT CHECK(type IN ('fixe','prestation'))"
  );

  await safeAddColumn("salaires", "periode_debut", "DATE");
  await safeAddColumn("salaires", "periode_fin", "DATE");
  await safeAddColumn("salaires", "created_at", "DATETIME");
  await safeAddColumn("salaires", "mois", "TEXT");

  await safeAddColumn("emprunts", "salaire_id", "INTEGER");
  await safeAddColumn("clients", "recommandations", "TEXT");

  // 🔥 IMPORTANT : pas de DEFAULT
  await safeAddColumn(
    "employes",
    "type_remuneration",
    "TEXT CHECK(type_remuneration IN ('fixe','prestation'))"
  );

  // 🔥 IMPORTANT : pas de DEFAULT 0
  await safeAddColumn("employes", "salaire_base", "REAL");
};

export const safeAddColumn = async (
  table: string,
  column: string,
  definition: string
) => {
  const db = await getDb();

  const columns = await db.select<any[]>(
    `PRAGMA table_info(${table})`
  );

  const exists = columns.some((col: any) => col.name === column);

  if (!exists) {
    console.log(`Ajout colonne ${column} dans ${table}`);
    await db.execute(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
    );
  }
};

// ==============================
// INIT TABLES
// ==============================
const initTables = async (db: Database) => {
  await db.execute(`PRAGMA foreign_keys = ON`);

  // utilisateurs
  await db.execute(`CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    login TEXT NOT NULL UNIQUE,
    mot_de_passe_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','caissier','couturier')),
    est_actif INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // configuration
  await db.execute(`
  INSERT INTO configuration_atelier (
    id, nom_atelier, telephone, adresse, email, nif, message_facture, logo_base64
  )
  VALUES (1, ?, ?, ?, ?, ?, ?, ?)

  ON CONFLICT(id) DO UPDATE SET
    nom_atelier = excluded.nom_atelier,
    telephone = excluded.telephone,
    adresse = excluded.adresse,
    email = excluded.email,
    nif = excluded.nif,
    message_facture = excluded.message_facture,
    logo_base64 = excluded.logo_base64,
    updated_at = CURRENT_TIMESTAMP
`);

  // clients
  await db.execute(`CREATE TABLE IF NOT EXISTS clients (
    telephone_id TEXT PRIMARY KEY,
    nom_prenom TEXT NOT NULL,
    adresse TEXT, email TEXT,
    date_enregistrement DATETIME DEFAULT CURRENT_TIMESTAMP,
    observations TEXT, est_supprime INTEGER DEFAULT 0
  )`);

  // mesures
  await db.execute(`CREATE TABLE IF NOT EXISTS types_mesures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT, unite TEXT, ordre_affichage INTEGER, categorie TEXT, est_active INTEGER DEFAULT 1
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS mesures_clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT, type_mesure_id INTEGER, valeur REAL, date_mesure DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // commandes
  await db.execute(`CREATE TABLE IF NOT EXISTS commandes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT REFERENCES clients(telephone_id),
    date_commande DATETIME DEFAULT CURRENT_TIMESTAMP,
    designation TEXT, nombre INTEGER, prix_unitaire REAL, total REAL,
    rendez_vous DATE, etat TEXT, observation TEXT, est_supprime INTEGER DEFAULT 0
  )`);

  // paiements
  await db.execute(`CREATE TABLE IF NOT EXISTS paiements_commandes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commande_id INTEGER,
    date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP,
    montant REAL, mode TEXT, observation TEXT
  )`);

  // ventes
  await db.execute(`CREATE TABLE IF NOT EXISTS ventes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('tenue','tissu')),
    designation TEXT NOT NULL, quantite REAL NOT NULL,
    prix_unitaire REAL NOT NULL, total REAL NOT NULL,
    date_vente DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observation TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // employes
  await db.execute(`CREATE TABLE IF NOT EXISTS employes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_prenom TEXT NOT NULL, telephone TEXT, personne_a_prevenir TEXT,
    lieu_residence TEXT, date_embauche TEXT,
    est_actif INTEGER NOT NULL DEFAULT 1, est_supprime INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT
  )`);

  // prestations
  await db.execute(`CREATE TABLE IF NOT EXISTS types_prestations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL, valeur_par_defaut REAL NOT NULL DEFAULT 0,
    est_active INTEGER NOT NULL DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS prestations_realisees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employe_id INTEGER NOT NULL, type_prestation_id INTEGER,
    date_prestation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    designation TEXT NOT NULL, valeur REAL NOT NULL,
    nombre INTEGER NOT NULL DEFAULT 1, total REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // emprunts
  await db.execute(`CREATE TABLE IF NOT EXISTS emprunts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employe_id INTEGER NOT NULL, montant REAL NOT NULL,
    date_emprunt TEXT DEFAULT (DATE('now')),
    deduit INTEGER NOT NULL DEFAULT 0,
    salaire_id INTEGER,
    date_deduction TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT
  )`);

  // salaires
  await db.execute(`CREATE TABLE IF NOT EXISTS salaires (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employe_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('fixe','prestation')),
    montant_brut REAL NOT NULL,
    montant_net REAL NOT NULL,
    mode TEXT CHECK(mode IN ('Espèce', 'Orange money', 'Moov money', 'Telecel money', 'Wave', 'Sank Money', 'Virement bancaire')),
    periode_debut DATE,
    periode_fin DATE,
    date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP,
    observation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  const columns = await selectSafe<any[]>(`PRAGMA table_info(salaires)`);

  const hasAnnule = columns.some((col: any) => col.name === 'annule');

  if (!hasAnnule) {
    await db.execute(`ALTER TABLE salaires ADD COLUMN annule INTEGER DEFAULT 0`);
  }
  await safeAddColumn("salaires", "montant_emprunts", "REAL DEFAULT 0");
  await safeAddColumn("salaires", "montant_emprunts", "REAL DEFAULT 0");
  await safeAddColumn("salaires", "annule", "INTEGER DEFAULT 0");
  // depenses
  await db.execute(`CREATE TABLE IF NOT EXISTS depenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categorie TEXT, designation TEXT, montant REAL,
    responsable TEXT, date_depense DATETIME, observation TEXT
  )`);

  // stock
  await db.execute(`CREATE TABLE IF NOT EXISTS matieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL, categorie TEXT, unite TEXT NOT NULL,
    seuil_alerte REAL DEFAULT 0, est_supprime INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS entrees_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matiere_id INTEGER NOT NULL, date_entree TEXT DEFAULT (DATE('now')),
    quantite REAL NOT NULL, cout_unitaire REAL NOT NULL, observation TEXT
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS sorties_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matiere_id INTEGER NOT NULL, commande_id INTEGER,
    date_sortie TEXT DEFAULT (DATE('now')), quantite REAL NOT NULL,
    cout_unitaire REAL NOT NULL, observation TEXT
  )`);

  // tenues
  await db.execute(`CREATE TABLE IF NOT EXISTS sorties_tenues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_sortie DATETIME, nombre INTEGER, motif TEXT, employe_id INTEGER
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS retours_tenues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sortie_id INTEGER, date_retour DATETIME, nombre INTEGER
  )`);

  // logs
  await db.execute(`CREATE TABLE IF NOT EXISTS journal_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_action DATETIME, utilisateur TEXT, action TEXT,
    table_cible TEXT, id_ligne INTEGER
  )`);

  await runMigrations(db);

  // admin
  const adminHash = bcrypt.hashSync("admin123", 10);
  await db.execute(`DELETE FROM utilisateurs WHERE login='admin'`);
  await db.execute(`INSERT INTO utilisateurs (nom, login, mot_de_passe_hash, role, est_actif) VALUES (?,?,?,?,1)`, ["Admin", "admin", adminHash, "admin"]);
};

// ================= GET RECU DATA =================
export const getRecuData = async (commandeId: number) => {
  const db = await getDb();
  const commande = await db.select<any[]>(
    `SELECT c.id, c.total, cl.nom_prenom, cl.telephone_id
     FROM commandes c
     JOIN clients cl ON cl.telephone_id = c.client_id
     WHERE c.id = ?`,
    [commandeId]
  );
  const paiements = await db.select<any[]>(
    `SELECT montant, date_paiement, mode
     FROM paiements_commandes
     WHERE commande_id = ?
     ORDER BY date_paiement ASC`,
    [commandeId]
  );
  const totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);
  const reste = (commande[0]?.total || 0) - totalPaye;
  return {
    commande: commande[0] || null,
    paiements,
    totalPaye,
    reste
  };
};

// ================= DB INTERFACE =================
export const dbInterface = {
  async select<T>(query: string, params: any[] = []): Promise<T[]> {
    const db = await getDb();
    try {
      const res = await db.select(query, params);
      return Array.isArray(res) ? (res as T[]) : [];
    } catch (e) {
      console.error('❌ SELECT ERROR:', e);
      return [];
    }
  },
  async execute(query: string, params: any[] = []) {
    const db = await getDb();
    try {
      return await db.execute(query, params);
    } catch (e) {
      console.error('❌ EXECUTE ERROR:', e);
      throw e;
    }
  },
  async getFirst<T>(query: string, params: any[] = []): Promise<T | null> {
    const db = await getDb();
    try {
      const res = await db.select(query, params);
      return Array.isArray(res) && res.length > 0 ? (res[0] as T) : null;
    } catch (e) {
      console.error('❌ GET FIRST ERROR:', e);
      return null;
    }
  }
};

export const selectSafe = async <T>(q: string, p: any[] = []) => dbInterface.select<T>(q, p);
export const executeSafe = async (q: string, p: any[] = []) => dbInterface.execute(q, p);


export const getResumeEmploye = async (employe_id: number) => {
  const db = await getDb();

  const [prestations]: any = await db.select(
    `SELECT IFNULL(SUM(total),0) as total
     FROM prestations_realisees
     WHERE employe_id = ? AND (paye = 0 OR paye IS NULL)`,
    [employe_id]
  );

  const [paiements]: any = await db.select(
    `SELECT IFNULL(SUM(montant_net),0) as total
     FROM salaires
     WHERE employe_id = ? AND type = 'prestation'`,
    [employe_id]
  );

  return {
    totalPrestations: prestations?.total || 0,
    totalPaye: paiements?.total || 0,
    reste: (prestations?.total || 0) - (paiements?.total || 0)
  };
};

// ================= MARQUER PRESTATIONS PAYEES =================
export const marquerPrestationsPayees = async (employe_id: number) => {
  const db = await getDb();

  await db.execute(
    `UPDATE prestations_realisees 
     SET paye = 1 
     WHERE employe_id = ? AND (paye = 0 OR paye IS NULL)`,
    [employe_id]
  );
};

// ================= HISTORIQUE SALAIRES =================
export const getSalairesEmploye = async (employe_id: number) => {
  const db = await getDb();

  return db.select(
    `SELECT * FROM salaires
     WHERE employe_id = ?
     ORDER BY date_paiement DESC`,
    [employe_id]
  );
};
// ================= ANNULER PAIEMENT =================
export const annulerPaiementSalaire = async (salaireId: number) => {
  const db = await getDb();

  // récupérer emprunts liés
  const emprunts = await db.select<{ id: number }[]>(
    `SELECT id FROM emprunts WHERE salaire_id = ?`,
    [salaireId]
  );

  // récupérer info salaire
  const sal = await db.select<any[]>(
    `SELECT employe_id, type FROM salaires WHERE id = ?`,
    [salaireId]
  );

  // supprimer paiement
  await db.execute(`DELETE FROM salaires WHERE id = ?`, [salaireId]);

  // réactiver emprunts
  if (emprunts.length > 0) {
    const ids = emprunts.map(e => e.id);
    const placeholders = ids.map(() => '?').join(',');

    await db.execute(
      `UPDATE emprunts 
       SET deduit = 0, salaire_id = NULL, date_deduction = NULL
       WHERE id IN (${placeholders})`,
      ids
    );
  }

  // remettre prestations non payées
  if (sal.length && sal[0].type === 'prestation') {
    await db.execute(
      `UPDATE prestations_realisees 
       SET paye = 0 
       WHERE employe_id = ?`,
      [sal[0].employe_id]
    );
  }

  return { success: true };
};

// ================= TYPES =================
export interface Utilisateur {
  id: number;
  nom: string;
  login: string;
  role: 'admin' | 'caissier' | 'couturier';
  est_actif: number;
}
export interface Client {
  telephone_id: string;
  nom_prenom: string;
  adresse?: string;
  email?: string;
}
export interface Commande {
  id: number;
  client_id: string;
  total: number;
}
export interface PaiementCommande {
  id: number;
  commande_id: number;
  montant: number;
  mode: string;
  date_paiement: string;
}
export interface Vente {
  id: number;
  type: 'tenue' | 'tissu';
  total: number;
}
export interface Employe {
  id: number;
  nom_prenom: string;
}
export interface Emprunt {
  id: number;
  employe_id: number;
  montant: number;
  deduit: number;
  salaire_id?: number;
  date_emprunt: string;
}
export interface Salaire {
  id: number;
  employe_id: number;
  type: 'fixe' | 'prestation';
  montant_brut: number;
  montant_net: number;
  date_paiement: string;
}
export interface Depense {
  id: number;
  designation: string;
  montant: number;
}

// ================= RESET =================
export const resetAllData = async () => {
  const db = await getDb();

  const tables = [
    'paiements_commandes',
    'commandes',
    'mesures_clients',
    'clients',
    'employes',
    'ventes',
    'depenses',
    'salaires',
    'emprunts',
    'prestations_realisees',
    'sorties_stock',
    'entrees_stock',
    'matieres',
    'types_mesures',
    'configuration_atelier',
    'sorties_tenues',
    'retours_tenues',
    'journal_logs'
  ];

  try {
    // 🔥 éviter conflits FK
    await db.execute('PRAGMA foreign_keys = OFF');

    for (const table of tables) {
      let success = false;
      let attempts = 0;

      while (!success && attempts < 5) {
        try {
          console.log("Reset table:", table);

          await db.execute(`DELETE FROM ${table}`);
          await db.execute(`DELETE FROM sqlite_sequence WHERE name=?`, [table]);

          success = true;
        } catch (err) {
          attempts++;

          console.warn(`Retry ${attempts} for ${table}`);

          // attendre un peu avant retry
          await new Promise(res => setTimeout(res, 200));
        }
      }

      if (!success) {
        throw new Error(`Impossible de vider la table ${table}`);
      }
    }

    await db.execute('PRAGMA foreign_keys = ON');

    console.log("✅ Reset terminé");

  } catch (error) {
    console.error("❌ Reset échoué:", error);
    throw error;
  }
};

// ================= PAIEMENT AUTOMATIQUE =================
export const payerSalaireSecurise = async (employe_id: number) => {
  const db = await getDb();

  // 🔎 Récupérer employé
  const emp = await db.select<any[]>(
    "SELECT type_remuneration, salaire_base FROM employes WHERE id = ?",
    [employe_id]
  );

  if (!emp.length) throw new Error("Employé introuvable");

  const type = emp[0].type_remuneration;

  if (!type) throw new Error("Type de rémunération non défini");

  let montant_brut = 0;

  // ================= FIXE =================
  if (type === 'fixe') {
    montant_brut = emp[0].salaire_base || 0;
  }

  // ================= PRESTATION =================
  if (type === 'prestation') {
    const prestations = await db.select<any[]>(
      `SELECT COALESCE(SUM(total),0) as total 
       FROM prestations_realisees 
       WHERE employe_id = ? AND (paye = 0 OR paye IS NULL)`,
      [employe_id]
    );

    montant_brut = prestations[0]?.total || 0;
  }

  // ================= EMPRUNTS =================
  const emprunts = await db.select<any[]>(
    "SELECT id, montant FROM emprunts WHERE employe_id = ? AND deduit = 0",
    [employe_id]
  );

  const retenue = emprunts.reduce((sum: number, e: any) => sum + e.montant, 0);
  const montant_net = Math.max(montant_brut - retenue, 0);
  const empruntIds = emprunts.map((e: any) => e.id);

  // 🔥 appel fonction principale
  const result = await payerSalaire({
    employe_id,
    type,
    montant_net,
    mode: 'Espèce',
    observation: 'Paiement automatique',
    empruntIds
  });

  return result;
};

// ================= SEED DATA =================
export const seedData = async () => {
  const db = await getDb();
  await db.execute(`INSERT OR IGNORE INTO configuration_atelier (id, nom_atelier, telephone, adresse) VALUES (1,'KO-SOFT Couture','70 00 00 00','Ouagadougou')`);
  await db.execute(`INSERT OR IGNORE INTO clients (telephone_id, nom_prenom) VALUES ('70000001','Client Test 1'), ('70000002','Client Test 2')`);
  await db.execute(`INSERT OR IGNORE INTO employes (id, nom_prenom) VALUES (1,'Couturier A'), (2,'Couturier B')`);
  await db.execute(`INSERT INTO commandes (client_id, designation, nombre, prix_unitaire, total) VALUES ('70000001','Tenue homme',1,15000,15000)`);
  await db.execute(`INSERT INTO paiements_commandes (commande_id, montant, mode) VALUES (1,10000,'cash')`);
  await db.execute(`INSERT INTO ventes (type, designation, quantite, prix_unitaire, total) VALUES ('tissu','Wax',2,5000,10000)`);
  await db.execute(`INSERT INTO depenses (designation, montant) VALUES ('Achat tissu',8000)`);
  await db.execute(`INSERT INTO prestations_realisees (employe_id, designation, valeur, nombre, total) VALUES (1,'Couture tenue',3000,2,6000)`);
  await db.execute(`INSERT INTO emprunts (employe_id, montant) VALUES (1,2000)`);
};


// ================= PAYER SALAIRE (SECURISE) =================
export const payerSalaire = async ({
  employe_id,
  type,
  montant_net,
  mode,
  observation = '',
  empruntIds = []
}: {
  employe_id: number;
  type: 'fixe' | 'prestation';
  montant_net: number;
  mode: string;
  observation?: string;
  empruntIds?: number[];
}) => {
  const db = await getDb();

  // 🔒 Vérifier employé
  const emp: any[] = await db.select(
    "SELECT type_remuneration, salaire_base FROM employes WHERE id = ?",
    [employe_id]
  );

  if (!emp.length) throw new Error("Employé introuvable");

  const typeEmploye = emp[0].type_remuneration;

  if (!typeEmploye) {
    throw new Error("Type de rémunération non défini");
  }

  // 🔒 Bloquer incohérence
  if (type !== typeEmploye) {
    throw new Error(`Paiement invalide: employé en ${typeEmploye}`);
  }

  // 🔒 Vérifier montant
  if (montant_net <= 0) {
    throw new Error("Montant invalide");
  }

  let retenue = 0;

  // ================= EMPRUNTS =================
  if (empruntIds.length > 0) {
    const placeholders = empruntIds.map(() => '?').join(',');

    const emprunts: any[] = await db.select(
      `SELECT id, montant FROM emprunts 
       WHERE id IN (${placeholders}) AND deduit = 0`,
      empruntIds
    );

    retenue = emprunts.reduce((sum, e) => sum + e.montant, 0);
  }

  const montant_brut = montant_net + retenue;

  // ================= SECURITE FIXE =================
  if (type === 'fixe') {
    const salaire = emp[0].salaire_base || 0;

    const totalDejaPaye = await db.select<any[]>(
      `SELECT COALESCE(SUM(montant_net),0) as total 
       FROM salaires 
       WHERE employe_id = ? AND annule = 0`,
      [employe_id]
    );

    const deja = totalDejaPaye[0]?.total || 0;

    if (montant_net + deja > salaire) {
      throw new Error("Dépassement du salaire fixe");
    }
  }

  // ================= INSERT CORRIGÉ =================
  const result: any = await db.execute(
    `INSERT INTO salaires 
     (employe_id, type, montant_brut, montant_net, montant_emprunts, observation, mode)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [employe_id, type, montant_brut, montant_net, retenue, observation, mode]
  );

  const salaire_id = result?.lastInsertId;

  // ================= EMPRUNTS =================
  if (empruntIds.length > 0 && salaire_id) {
    await db.execute(
      `UPDATE emprunts 
       SET deduit = 1, salaire_id = ?, date_deduction = CURRENT_TIMESTAMP
       WHERE id IN (${empruntIds.map(() => '?').join(',')})`,
      [salaire_id, ...empruntIds]
    );
  }

  // ================= PRESTATIONS =================
  if (type === 'prestation') {
    await db.execute(
      `UPDATE prestations_realisees 
       SET paye = 1 
       WHERE employe_id = ? AND (paye = 0 OR paye IS NULL)`,
      [employe_id]
    );
  }

  return {
    success: true,
    salaire_id,
    montant_brut,
    montant_net,
    retenue
  };
};