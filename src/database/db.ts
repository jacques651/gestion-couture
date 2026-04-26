// src/database/db.ts - Version complète avec toutes les exports

import Database from "@tauri-apps/plugin-sql";
import bcrypt from "bcryptjs";

let dbInstance: Database | null = null;

// ================= FONCTIONS DE GÉNÉRATION DE CODES =================

export const getNextClientCode = async (): Promise<string> => {
  const db = await getDb();
  const result = await db.select<{ code_client: string }[]>(`
    SELECT code_client FROM clients 
    WHERE code_client LIKE 'CL-%' 
    ORDER BY idClient DESC LIMIT 1
  `);

  if (result.length === 0) return 'CL-0001';
  const lastNumber = parseInt(result[0].code_client.split('-')[1]);
  return `CL-${(lastNumber + 1).toString().padStart(4, '0')}`;
};

export const getNextProductCode = async (): Promise<string> => {
  const db = await getDb();
  const result = await db.select<{ code_produit: string }[]>(`
    SELECT code_produit FROM products 
    WHERE code_produit LIKE 'PROD-%' 
    ORDER BY idProduit DESC LIMIT 1
  `);

  if (result.length === 0) return 'PROD-0001';
  const lastNumber = parseInt(result[0].code_produit.split('-')[1]);
  return `PROD-${(lastNumber + 1).toString().padStart(4, '0')}`;
};

export const getNextCommandeCode = async (): Promise<string> => {
  const db = await getDb();
  const result = await db.select<{ code_commande: string }[]>(`
    SELECT code_commande FROM commandes 
    WHERE code_commande LIKE 'CMD-%' 
    ORDER BY idCommande DESC LIMIT 1
  `);

  if (result.length === 0) return 'CMD-0001';
  const lastNumber = parseInt(result[0].code_commande.split('-')[1]);
  return `CMD-${(lastNumber + 1).toString().padStart(4, '0')}`;
};

export const getNextFactureCode = async (): Promise<string> => {
  const db = await getDb();
  const result = await db.select<{ code_facture: string }[]>(`
    SELECT code_facture FROM factures 
    WHERE code_facture LIKE 'FAC-%' 
    ORDER BY idFacture DESC LIMIT 1
  `);

  if (result.length === 0) return 'FAC-0001';
  const lastNumber = parseInt(result[0].code_facture.split('-')[1]);
  return `FAC-${(lastNumber + 1).toString().padStart(4, '0')}`;
};

export const getNextVenteCode = async (): Promise<string> => {
  const db = await getDb();
  const result = await db.select<{ code_vente: string }[]>(`
    SELECT code_vente FROM ventes 
    WHERE code_vente LIKE 'VTE-%' 
    ORDER BY id DESC LIMIT 1
  `);

  if (result.length === 0) return 'VTE-0001';
  const lastNumber = parseInt(result[0].code_vente.split('-')[1]);
  return `VTE-${(lastNumber + 1).toString().padStart(4, '0')}`;
};

export const getNextReglementCode = async (): Promise<string> => {
  const db = await getDb();
  const result = await db.select<{ code_reglement: string }[]>(`
    SELECT code_reglement FROM reglements 
    WHERE code_reglement LIKE 'REG-%' 
    ORDER BY idReglement DESC LIMIT 1
  `);

  if (result.length === 0) return 'REG-0001';
  const lastNumber = parseInt(result[0].code_reglement.split('-')[1]);
  return `REG-${(lastNumber + 1).toString().padStart(4, '0')}`;
};

export const getNextDecompteCode = async (): Promise<string> => {
  const db = await getDb();
  const result = await db.select<{ code_decompte: string }[]>(`
    SELECT code_decompte FROM decomptes 
    WHERE code_decompte LIKE 'DCP-%' 
    ORDER BY idDecompte DESC LIMIT 1
  `);

  if (result.length === 0) return 'DCP-0001';
  const lastNumber = parseInt(result[0].code_decompte.split('-')[1]);
  return `DCP-${(lastNumber + 1).toString().padStart(4, '0')}`;
};

export const getNextSortieCode = async (): Promise<string> => {
  const db = await getDb();
  const result = await db.select<{ code_sortie: string }[]>(`
    SELECT code_sortie FROM sorties_stock 
    WHERE code_sortie LIKE 'SOR-%' 
    ORDER BY id DESC LIMIT 1
  `);

  if (result.length === 0) return 'SOR-0001';
  const lastNumber = parseInt(result[0].code_sortie.split('-')[1]);
  return `SOR-${(lastNumber + 1).toString().padStart(4, '0')}`;
};

// ================= FONCTION GETDB =================

export const getDb = async (): Promise<Database> => {
  if (dbInstance) return dbInstance;

  try {
    const dbName = 'gestion-couture.db';
    console.log("📁 Base de données:", dbName);

    dbInstance = await Database.load(`sqlite:${dbName}`);
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

// ================= INTERFACES TYPES =================

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

export interface CategorieMatiere {
  id: number;
  code_categorie: string;
  nom_categorie: string;
  description: string;
  est_actif: number;
}

export interface Matiere {
  id: number;
  code_matiere: string;
  designation: string;
  categorie_id: number;
  unite: string;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  seuil_alerte: number;
  reference_fournisseur?: string;
  emplacement?: string;
  est_supprime: number;
}

export interface Taille {
  id: number;
  code_taille: string;
  libelle: string;
  ordre: number;
  est_actif: number;
}

export interface GammeTenue {
  id: number;
  code_tenue: string;
  designation: string;
  description?: string;
  prix_base: number;
  image_url?: string;
  est_actif: number;
}

export interface TenueVariante {
  id: number;
  tenue_id: number;
  taille_id: number;
  code_variante: string;
  stock_actuel: number;
  seuil_alerte: number;
  prix_vente?: number;
}

interface Vente {
  id: number;
  code_vente: string;
  type_vente: 'matiere' | 'tenue' | 'prestation';
  date_vente: string;
  client_id: string | null;
  client_nom: string | null;
  mode_paiement: string;
  montant_total: number;
  montant_regle: number;
  montant_restant: number;
  statut: string;
  observation: string | null;
  created_at: string;
}

export interface VenteDetail {
  id: number;
  vente_id: number;
  matiere_id?: number;
  tenue_variante_id?: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  taille_libelle?: string;
}

export interface Client {
  id: number;
  code_client: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  est_actif: number;
  created_at: string;
}

export interface Employe {
  id: number;
  nom_prenom: string;
  telephone: string;
  type_remuneration: 'fixe' | 'prestation';
  salaire_base: number;
  est_actif: number;
}

export interface Salaire {
  id: number;
  employe_id: number;
  montant_net: number;
  date_paiement: string;
  annule: number;
}

export interface Depense {
  id: number;
  designation: string;
  montant: number;
  categorie?: string;
  date_depense: string;
  observation?: string;
}

// ==============================
// CONFIGURATION ATELIER
// ==============================

export const getConfigurationAtelier = async (): Promise<ConfigurationAtelier> => {
  try {
    const db = await getDb();
    const res = await db.select<ConfigurationAtelier[]>(
      "SELECT * FROM configuration_atelier WHERE id = 1"
    );

    if (res && res.length > 0 && res[0]) {
      return res[0];
    }

    const defaultConfig: ConfigurationAtelier = {
      id: 1,
      nom_atelier: '',
      telephone: '',
      adresse: '',
      email: '',
      nif: '',
      message_facture: '',
      logo_base64: ''
    };

    await saveConfigurationAtelier(defaultConfig);
    return defaultConfig;

  } catch (error) {
    console.error("Erreur getConfigurationAtelier:", error);
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
  }
};

export const saveConfigurationAtelier = async (config: ConfigurationAtelier): Promise<void> => {
  const db = await getDb();

  await db.execute(
    `INSERT OR REPLACE INTO configuration_atelier (
      id, nom_atelier, telephone, adresse, email, nif, message_facture, logo_base64, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      config.id,
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
// FONCTIONS RÉSEAU
// ==============================

export const testerConnexionReseau = async (cheminReseau: string): Promise<{ success: boolean; message: string }> => {
  try {
    let cleanPath = cheminReseau.replace(/\\/g, '/');
    cleanPath = cleanPath.replace(/^file:\/\/\//, '');
    
    console.log("Test connexion avec:", cleanPath);
    
    const testDb = await Database.load(cleanPath);
    await testDb.execute("SELECT 1");
    await testDb.close();
    return { success: true, message: 'Connexion réussie ! La base est accessible.' };
  } catch (error: any) {
    console.error("Erreur test connexion:", error);
    return { 
      success: false, 
      message: `Erreur : ${error?.message || 'Base inaccessible. Vérifiez le chemin et les permissions.'}` 
    };
  }
};

export const configurerBaseReseau = async (cheminReseau: string) => {
  let cleanPath = cheminReseau.replace(/\\/g, '/');
  cleanPath = cleanPath.replace(/^file:\/\/\//, '');
  
  localStorage.setItem('use_network_db', 'true');
  localStorage.setItem('network_db_path', cleanPath);
  dbInstance = null;
  return await getDb();
};

export const utiliserBaseLocale = async () => {
  localStorage.setItem('use_network_db', 'false');
  localStorage.removeItem('network_db_path');
  dbInstance = null;
  return await getDb();
};

// ==============================
// FONCTIONS CLIENTS
// ==============================

export const getClients = async (): Promise<Client[]> => {
  const db = await getDb();
  return db.select('SELECT * FROM clients WHERE est_actif = 1 ORDER BY nom');
};

export const createClient = async (client: Omit<Client, 'id' | 'created_at' | 'code_client'>): Promise<number> => {
  const db = await getDb();
  const code_client = await getNextClientCode();
  
  const result = await db.execute(`
    INSERT INTO clients (code_client, nom, prenom, telephone, email, adresse, ville, est_actif)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `, [code_client, client.nom, client.prenom, client.telephone, client.email, client.adresse, client.ville]);
  
  return result.lastInsertId as number;
};

export const updateClient = async (id: number, client: Partial<Client>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  
  const allowedFields = ['nom', 'prenom', 'telephone', 'email', 'adresse', 'ville', 'est_actif'];
  
  Object.entries(client).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (fields.length === 0) return;
  
  values.push(id);
  await db.execute(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteClient = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE clients SET est_actif = 0 WHERE id = ?`, [id]);
};

// ==============================
// FONCTIONS MATIÈRES
// ==============================

export const getMatieres = async (): Promise<Matiere[]> => {
  const db = await getDb();
  return db.select(`
    SELECT m.*, c.nom_categorie as categorie_nom 
    FROM matieres m
    LEFT JOIN categories_matieres c ON m.categorie_id = c.id
    WHERE m.est_supprime = 0
    ORDER BY m.designation
  `);
};

export const getMatiereById = async (id: number): Promise<Matiere | null> => {
  const db = await getDb();
  const result = await db.select<Matiere[]>(`
    SELECT * FROM matieres WHERE id = ? AND est_supprime = 0
  `, [id]);
  return result[0] || null;
};

export const createMatiere = async (matiere: Omit<Matiere, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const db = await getDb();
  const result = await db.execute(`
    INSERT INTO matieres (code_matiere, designation, categorie_id, unite, prix_achat, prix_vente, stock_actuel, seuil_alerte, reference_fournisseur, emplacement, est_supprime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `, [matiere.code_matiere, matiere.designation, matiere.categorie_id, matiere.unite, matiere.prix_achat, matiere.prix_vente, matiere.stock_actuel || 0, matiere.seuil_alerte, matiere.reference_fournisseur, matiere.emplacement]);
  
  return result.lastInsertId as number;
};

export const updateMatiere = async (id: number, matiere: Partial<Matiere>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  
  const allowedFields = ['code_matiere', 'designation', 'categorie_id', 'unite', 'prix_achat', 'prix_vente', 'seuil_alerte', 'reference_fournisseur', 'emplacement'];
  
  Object.entries(matiere).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (fields.length === 0) return;
  
  values.push(id);
  await db.execute(`UPDATE matieres SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
};

export const deleteMatiere = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE matieres SET est_supprime = 1 WHERE id = ?`, [id]);
};

export const updateStockMatiere = async (id: number, quantite: number, type: 'add' | 'remove'): Promise<void> => {
  const db = await getDb();
  const operation = type === 'add' ? '+' : '-';
  await db.execute(`UPDATE matieres SET stock_actuel = stock_actuel ${operation} ? WHERE id = ?`, [quantite, id]);
};

// ==============================
// FONCTIONS GAMMES TENUES
// ==============================

export const getGammesTenues = async (): Promise<GammeTenue[]> => {
  const db = await getDb();
  return db.select('SELECT * FROM gammes_tenues WHERE est_actif = 1 ORDER BY designation');
};

export const getGammeTenueById = async (id: number): Promise<GammeTenue | null> => {
  const db = await getDb();
  const result = await db.select<GammeTenue[]>(`
    SELECT * FROM gammes_tenues WHERE id = ? AND est_actif = 1
  `, [id]);
  return result[0] || null;
};

export const createGammeTenue = async (tenue: Omit<GammeTenue, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const db = await getDb();
  const result = await db.execute(`
    INSERT INTO gammes_tenues (code_tenue, designation, description, prix_base, image_url, est_actif, stock_actuel)
    VALUES (?, ?, ?, ?, ?, 1, 0)
  `, [tenue.code_tenue, tenue.designation, tenue.description, tenue.prix_base, tenue.image_url]);
  
  return result.lastInsertId as number;
};

export const updateGammeTenue = async (id: number, tenue: Partial<GammeTenue>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  
  const allowedFields = ['code_tenue', 'designation', 'description', 'prix_base', 'image_url', 'est_actif'];
  
  Object.entries(tenue).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (fields.length === 0) return;
  
  values.push(id);
  await db.execute(`UPDATE gammes_tenues SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
};

export const deleteGammeTenue = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE gammes_tenues SET est_actif = 0 WHERE id = ?`, [id]);
};

// ==============================
// FONCTIONS VENTES
// ==============================

export const getVentes = async (): Promise<Vente[]> => {
  const db = await getDb();
  return db.select(`
    SELECT *, (montant_total - montant_regle) as montant_restant
    FROM ventes ORDER BY date_vente DESC
  `);
};

export const getVenteById = async (id: number): Promise<Vente | null> => {
  const db = await getDb();
  const result = await db.select<Vente[]>(`
    SELECT *, (montant_total - montant_regle) as montant_restant
    FROM ventes WHERE id = ?
  `, [id]);
  return result[0] || null;
};

export const createVente = async (vente: Omit<Vente, 'id' | 'montant_restant'>, details: Omit<VenteDetail, 'id'>[]): Promise<number> => {
  const db = await getDb();

  await db.execute('BEGIN TRANSACTION');

  try {
    const result = await db.execute(`
      INSERT INTO ventes (
        code_vente, type_vente, date_vente, client_id, client_nom,
        mode_paiement, montant_total, montant_regle, statut, observation
      ) VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
    `, [
      vente.code_vente, vente.type_vente, vente.client_id || null,
      vente.client_nom || null, vente.mode_paiement, vente.montant_total,
      vente.montant_regle, vente.statut, vente.observation || null
    ]);

    const venteId = result.lastInsertId as number;

    for (const detail of details) {
      await db.execute(`
        INSERT INTO vente_details (
          vente_id, matiere_id, tenue_variante_id, designation,
          quantite, prix_unitaire, total, taille_libelle
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        venteId, detail.matiere_id || null, detail.tenue_variante_id || null,
        detail.designation, detail.quantite, detail.prix_unitaire,
        detail.total, detail.taille_libelle || null
      ]);

      if (detail.matiere_id) {
        await db.execute(`
          UPDATE matieres SET stock_actuel = stock_actuel - ? WHERE id = ?
        `, [detail.quantite, detail.matiere_id]);
      }
      if (detail.tenue_variante_id) {
        await db.execute(`
          UPDATE tenues_variantes SET stock_actuel = stock_actuel - ? WHERE id = ?
        `, [detail.quantite, detail.tenue_variante_id]);
      }
    }

    await db.execute('COMMIT');
    return venteId;

  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
};

export const updateVentePaiement = async (id: number, montant_regle: number): Promise<void> => {
  const db = await getDb();
  
  const vente = await db.select<{ montant_total: number; montant_regle: number }[]>(
    'SELECT montant_total, montant_regle FROM ventes WHERE id = ?',
    [id]
  );
  
  if (vente.length === 0) throw new Error('Vente non trouvée');
  
  const nouveauRegle = vente[0].montant_regle + montant_regle;
  const nouveauStatut = nouveauRegle >= vente[0].montant_total ? 'PAYEE' : 'PARTIEL';
  
  await db.execute(`
    UPDATE ventes SET montant_regle = ?, statut = ? WHERE id = ?
  `, [nouveauRegle, nouveauStatut, id]);
};

export const annulerVente = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`DELETE FROM ventes WHERE id = ?`, [id]);
};

// ==============================
// FONCTIONS TAILLES
// ==============================

export const getTailles = async (): Promise<Taille[]> => {
  const db = await getDb();
  return db.select('SELECT * FROM tailles WHERE est_actif = 1 ORDER BY ordre');
};

export const createTaille = async (taille: Omit<Taille, 'id'>): Promise<number> => {
  const db = await getDb();
  const result = await db.execute(`
    INSERT INTO tailles (code_taille, libelle, ordre, est_actif)
    VALUES (?, ?, ?, 1)
  `, [taille.code_taille, taille.libelle, taille.ordre]);
  
  return result.lastInsertId as number;
};

export const updateTaille = async (id: number, taille: Partial<Taille>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  
  const allowedFields = ['code_taille', 'libelle', 'ordre', 'est_actif'];
  
  Object.entries(taille).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (fields.length === 0) return;
  
  values.push(id);
  await db.execute(`UPDATE tailles SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteTaille = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`DELETE FROM tailles WHERE id = ?`, [id]);
};

// ==============================
// FONCTIONS CATÉGORIES MATIÈRES
// ==============================

export const getCategoriesMatieres = async (): Promise<CategorieMatiere[]> => {
  const db = await getDb();
  return db.select('SELECT * FROM categories_matieres WHERE est_actif = 1');
};

export const createCategorieMatiere = async (categorie: Omit<CategorieMatiere, 'id' | 'created_at'>): Promise<number> => {
  const db = await getDb();
  const result = await db.execute(`
    INSERT INTO categories_matieres (code_categorie, nom_categorie, description, est_actif)
    VALUES (?, ?, ?, 1)
  `, [categorie.code_categorie, categorie.nom_categorie, categorie.description]);
  
  return result.lastInsertId as number;
};

// ==============================
// FONCTIONS TENUES VARIANTES
// ==============================

export const getTenuesVariantes = async (tenueId?: number): Promise<any[]> => {
  const db = await getDb();
  let query = `
    SELECT tv.*, t.libelle as taille_libelle, t.code_taille, gt.designation as tenue_designation, gt.prix_base
    FROM tenues_variantes tv
    JOIN tailles t ON tv.taille_id = t.id
    JOIN gammes_tenues gt ON tv.tenue_id = gt.id
    WHERE gt.est_actif = 1
  `;
  if (tenueId) {
    query += ` AND tv.tenue_id = ${tenueId}`;
  }
  query += ` ORDER BY t.ordre`;
  return db.select(query);
};

export const createTenueVariante = async (variante: Omit<TenueVariante, 'id'>): Promise<number> => {
  const db = await getDb();
  const result = await db.execute(`
    INSERT INTO tenues_variantes (tenue_id, taille_id, code_variante, stock_actuel, seuil_alerte, prix_vente)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [variante.tenue_id, variante.taille_id, variante.code_variante, variante.stock_actuel || 0, variante.seuil_alerte || 0, variante.prix_vente]);
  
  return result.lastInsertId as number;
};

export const updateTenueVariante = async (id: number, variante: Partial<TenueVariante>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  
  const allowedFields = ['stock_actuel', 'seuil_alerte', 'prix_vente'];
  
  Object.entries(variante).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (fields.length === 0) return;
  
  values.push(id);
  await db.execute(`UPDATE tenues_variantes SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteTenueVariante = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`DELETE FROM tenues_variantes WHERE id = ?`, [id]);
};

// ==============================
// FONCTIONS SALAIRES
// ==============================

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
  const emp = await db.select<Array<{ type_remuneration: string; salaire_base: number }>>(
    "SELECT type_remuneration, salaire_base FROM employes WHERE id = ?",
    [employe_id]
  );
  if (!emp.length) throw new Error("Employé introuvable");
  const typeEmploye = emp[0].type_remuneration;
  if (!typeEmploye) throw new Error("Type de rémunération non défini");
  if (type !== typeEmploye) throw new Error(`Paiement invalide: employé en ${typeEmploye}`);
  if (montant_net <= 0) throw new Error("Montant invalide");

  let retenue = 0;
  if (empruntIds.length > 0) {
    const placeholders = empruntIds.map(() => '?').join(',');
    const emprunts = await db.select<Array<{ id: number; montant: number }>>(
      `SELECT id, montant FROM emprunts 
       WHERE id IN (${placeholders}) AND deduit = 0`,
      empruntIds
    );
    retenue = emprunts.reduce((sum, e) => sum + e.montant, 0);
  }

  const montant_brut = montant_net + retenue;

  if (type === 'fixe') {
    const salaire = emp[0].salaire_base || 0;
    const totalDejaPaye = await db.select<Array<{ total: number }>>(
      `SELECT COALESCE(SUM(montant_net),0) as total 
       FROM salaires 
       WHERE employe_id = ? AND annule = 0`,
      [employe_id]
    );
    const deja = totalDejaPaye[0]?.total || 0;
    if (montant_net + deja > salaire) throw new Error("Dépassement du salaire fixe");
  }

  const result: any = await db.execute(
    `INSERT INTO salaires 
     (employe_id, type, montant_brut, montant_net, montant_emprunts, observation, mode)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [employe_id, type, montant_brut, montant_net, retenue, observation, mode]
  );

  const salaire_id = result?.lastInsertId;

  if (empruntIds.length > 0 && salaire_id) {
    const placeholders = empruntIds.map(() => '?').join(',');
    await db.execute(
      `UPDATE emprunts 
       SET deduit = 1, salaire_id = ?, date_deduction = CURRENT_TIMESTAMP
       WHERE id IN (${placeholders})`,
      [salaire_id, ...empruntIds]
    );
  }

  if (type === 'prestation') {
    await db.execute(
      `UPDATE prestations_realisees 
       SET paye = 1 
       WHERE employe_id = ? AND (paye = 0 OR paye IS NULL)`,
      [employe_id]
    );
  }

  return { success: true, salaire_id, montant_brut, montant_net, retenue };
};

export const payerSalaireSecurise = async (employe_id: number) => {
  const db = await getDb();
  const emp = await db.select<Array<{ type_remuneration: string; salaire_base: number }>>(
    "SELECT type_remuneration, salaire_base FROM employes WHERE id = ?",
    [employe_id]
  );
  if (!emp.length) throw new Error("Employé introuvable");
  const type = emp[0].type_remuneration;
  if (!type) throw new Error("Type de rémunération non défini");
  
  let montant_brut = 0;
  if (type === 'fixe') {
    montant_brut = emp[0].salaire_base || 0;
  }
  if (type === 'prestation') {
    const prestations = await db.select<Array<{ total: number }>>(
      `SELECT COALESCE(SUM(total),0) as total 
       FROM prestations_realisees 
       WHERE employe_id = ? AND (paye = 0 OR paye IS NULL)`,
      [employe_id]
    );
    montant_brut = prestations[0]?.total || 0;
  }
  
  const emprunts = await db.select<Array<{ id: number; montant: number }>>(
    "SELECT id, montant FROM emprunts WHERE employe_id = ? AND deduit = 0",
    [employe_id]
  );
  const retenue = emprunts.reduce((sum: number, e) => sum + e.montant, 0);
  const montant_net = Math.max(montant_brut - retenue, 0);
  
  return await payerSalaire({
    employe_id,
    type: type as 'fixe' | 'prestation',
    montant_net,
    mode: 'Espèce',
    observation: 'Paiement automatique',
    empruntIds: emprunts.map(e => e.id)
  });
};

export const getSalairesEmploye = async (employe_id: number) => {
  const db = await getDb();
  return db.select<Array<any>>(
    `SELECT * FROM salaires
     WHERE employe_id = ? AND annule = 0
     ORDER BY date_paiement DESC`,
    [employe_id]
  );
};

export const annulerPaiementSalaire = async (salaireId: number) => {
  const db = await getDb();
  const emprunts = await db.select<Array<{ id: number }>>(
    `SELECT id FROM emprunts WHERE salaire_id = ?`,
    [salaireId]
  );
  const sal = await db.select<Array<{ employe_id: number; type: string }>>(
    `SELECT employe_id, type FROM salaires WHERE id = ?`,
    [salaireId]
  );

  await db.execute(`DELETE FROM salaires WHERE id = ?`, [salaireId]);

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

// ==============================
// FONCTIONS DÉPENSES
// ==============================

export const getDepenses = async (): Promise<Depense[]> => {
  const db = await getDb();
  return db.select('SELECT * FROM depenses ORDER BY date_depense DESC');
};

export const createDepense = async (depense: Omit<Depense, 'id'>): Promise<number> => {
  const db = await getDb();
  const result = await db.execute(`
    INSERT INTO depenses (designation, montant, categorie, date_depense, observation)
    VALUES (?, ?, ?, datetime('now'), ?)
  `, [depense.designation, depense.montant, depense.categorie || null, depense.observation || null]);
  
  return result.lastInsertId as number;
};

export const deleteDepense = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`DELETE FROM depenses WHERE id = ?`, [id]);
};

// ==============================
// FONCTIONS RECU
// ==============================

export const getRecuData = async (venteId: number) => {
  const db = await getDb();
  const vente = await db.select<Array<{ 
    id: number; 
    total: number; 
    client_nom: string; 
    client_id: number; 
    date_vente: string;
    montant_regle: number;  // ← Ajout de cette colonne
  }>>(
    `SELECT id, total, client_nom, client_id, date_vente, montant_regle FROM ventes WHERE id = ?`,
    [venteId]
  );
  
  return {
    commande: vente[0] || null,
    paiements: [],
    totalPaye: vente[0]?.montant_regle || 0,
    reste: (vente[0]?.total || 0) - (vente[0]?.montant_regle || 0)
  };
};

// ==============================
// FONCTIONS RESET
// ==============================

export const resetAllData = async () => {
  const db = await getDb();
  const tables = [
    'ventes', 'vente_details', 'clients', 'matieres', 'gammes_tenues',
    'tailles', 'tenues_variantes', 'categories_matieres', 'depenses',
    'employes', 'salaires', 'emprunts', 'prestations_realisees'
  ];

  try {
    await db.execute('PRAGMA foreign_keys = OFF');
    for (const table of tables) {
      try {
        await db.execute(`DELETE FROM ${table}`);
        await db.execute(`DELETE FROM sqlite_sequence WHERE name=?`, [table]);
      } catch (err) {
        console.log(`Table ${table} non trouvée ou vide`);
      }
    }
    console.log("✅ Reset terminé");
  } catch (error) {
    console.error("❌ Reset échoué:", error);
    throw error;
  } finally {
    await db.execute('PRAGMA foreign_keys = ON');
  }
};

// ==============================
// FONCTIONS SEED
// ==============================

export const seedData = async () => {
  const db = await getDb();
  await db.execute(`INSERT OR IGNORE INTO configuration_atelier (id, nom_atelier, telephone, adresse) VALUES (1,'KO-SOFT Couture','70 00 00 00','Ouagadougou')`);
};

// ==============================
// INTERFACE DB
// ==============================

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

// ==============================
// INIT TABLES
// ==============================
const initTables = async (db: Database) => {
  await db.execute(`PRAGMA foreign_keys = ON`);

  // Utilisateurs
  await db.execute(`CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    login TEXT NOT NULL UNIQUE,
    mot_de_passe_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','caissier','couturier')),
    est_actif INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Configuration atelier
  await db.execute(`CREATE TABLE IF NOT EXISTS configuration_atelier (
    id INTEGER PRIMARY KEY,
    nom_atelier TEXT DEFAULT '',
    telephone TEXT DEFAULT '',
    adresse TEXT DEFAULT '',
    email TEXT DEFAULT '',
    nif TEXT DEFAULT '',
    message_facture TEXT DEFAULT '',
    logo_base64 TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

// Clients
  await db.execute(`CREATE TABLE IF NOT EXISTS clients (
    telephone_id TEXT PRIMARY KEY,
    nom_prenom TEXT NOT NULL,
    adresse TEXT, 
    email TEXT,
    date_enregistrement DATETIME DEFAULT CURRENT_TIMESTAMP,
    observations TEXT, 
    est_supprime INTEGER DEFAULT 0
  )`);

  // Types mesures
  await db.execute(`CREATE TABLE IF NOT EXISTS types_mesures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT, 
    unite TEXT, 
    ordre_affichage INTEGER, 
    categorie TEXT, 
    est_active INTEGER DEFAULT 1
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS mesures_clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT, 
    type_mesure_id INTEGER, 
    valeur REAL, 
    date_mesure DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(telephone_id),
    FOREIGN KEY (type_mesure_id) REFERENCES types_mesures(id)
  )`);

  // Catégories de matières
  await db.execute(`CREATE TABLE IF NOT EXISTS categories_matieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_categorie TEXT UNIQUE NOT NULL,
    nom_categorie TEXT NOT NULL,
    description TEXT,
    est_actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Matières
  await db.execute(`CREATE TABLE IF NOT EXISTS matieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_matiere TEXT UNIQUE NOT NULL,
    designation TEXT NOT NULL,
    categorie_id INTEGER,
    unite TEXT NOT NULL,
    prix_achat REAL DEFAULT 0,
    prix_vente REAL DEFAULT 0,
    stock_actuel REAL DEFAULT 0,
    seuil_alerte REAL DEFAULT 0,
    reference_fournisseur TEXT,
    emplacement TEXT,
    est_supprime INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (categorie_id) REFERENCES categories_matieres(id)
  )`);

  // Tailles
  await db.execute (`CREATE TABLE IF NOT EXISTS tailles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_taille TEXT UNIQUE NOT NULL,
    libelle TEXT NOT NULL,
    ordre INTEGER DEFAULT 0,
    est_actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);


  // Gammes tenues
  await db.execute(`CREATE TABLE IF NOT EXISTS gammes_tenues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_tenue TEXT UNIQUE NOT NULL,
    designation TEXT NOT NULL,
    description TEXT,
    prix_base REAL NOT NULL,
    image_url TEXT,
    est_actif INTEGER DEFAULT 1,
    stock_actuel INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
  )`);

  // Variantes tenues
  await db.execute (`CREATE TABLE IF NOT EXISTS tenues_variantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenue_id INTEGER NOT NULL,
    taille_id INTEGER NOT NULL,
    code_variante TEXT UNIQUE NOT NULL,
    stock_actuel INTEGER DEFAULT 0,
    seuil_alerte INTEGER DEFAULT 0,
    prix_vente REAL,
    FOREIGN KEY (tenue_id) REFERENCES gammes_tenues(id),
    FOREIGN KEY (taille_id) REFERENCES tailles(id),
    UNIQUE(tenue_id, taille_id)
  )`);

  // Ventes
  await db.execute(`CREATE TABLE IF NOT EXISTS ventes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_vente TEXT UNIQUE NOT NULL,
    type_vente TEXT NOT NULL CHECK(type_vente IN ('matiere', 'tenue', 'prestation')),
    date_vente DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_id TEXT,
    client_nom TEXT,
    mode_paiement TEXT CHECK(mode_paiement IN ('Espèces', 'Orange money', 'Moov money', 'Telecel money', 'Wave', 'Sank Money', 'Virement bancaire')),
    montant_total REAL NOT NULL,
    montant_regle REAL DEFAULT 0,
    statut TEXT DEFAULT 'COMPLETEE',
    observation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (client_id) REFERENCES clients(telephone_id)
  )`);

  // Détails ventes
  await db.execute(`CREATE TABLE IF NOT EXISTS vente_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vente_id INTEGER NOT NULL,
    matiere_id INTEGER,
    tenue_variante_id INTEGER,
    designation TEXT NOT NULL,
    quantite REAL NOT NULL,
    prix_unitaire REAL NOT NULL,
    total REAL NOT NULL,
    taille_libelle TEXT,
    FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_id) REFERENCES matieres(id),
    FOREIGN KEY (tenue_variante_id) REFERENCES tenues_variantes(id)
  )`);

  // Employes
  await db.execute(`CREATE TABLE IF NOT EXISTS employes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_prenom TEXT NOT NULL, 
    telephone TEXT, 
    personne_a_prevenir TEXT,
    lieu_residence TEXT, 
    date_embauche TEXT,
    type_remuneration TEXT CHECK(type_remuneration IN ('fixe','prestation')),
    salaire_base REAL DEFAULT 0,
    est_actif INTEGER NOT NULL DEFAULT 1, 
    est_supprime INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
    updated_at TEXT
  )`);

  // Prestations
  await db.execute(`CREATE TABLE IF NOT EXISTS types_prestations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL, 
    valeur_par_defaut REAL NOT NULL DEFAULT 0,
    est_active INTEGER NOT NULL DEFAULT 1, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  await db.execute(`CREATE TABLE IF NOT EXISTS prestations_realisees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employe_id INTEGER NOT NULL, 
    type_prestation_id INTEGER,
    date_prestation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    designation TEXT NOT NULL, 
    valeur REAL NOT NULL,
    nombre INTEGER NOT NULL DEFAULT 1, 
    total REAL NOT NULL,
    paye INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employe_id) REFERENCES employes(id)
  )`);

  // Emprunts
  await db.execute(`CREATE TABLE IF NOT EXISTS emprunts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employe_id INTEGER NOT NULL, 
    montant REAL NOT NULL,
    date_emprunt TEXT DEFAULT (DATE('now')),
    deduit INTEGER NOT NULL DEFAULT 0,
    salaire_id INTEGER,
    date_deduction TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
    updated_at TEXT,
    FOREIGN KEY (employe_id) REFERENCES employes(id)
  )`);

  // Salaires
  await db.execute(`CREATE TABLE IF NOT EXISTS salaires (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employe_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('fixe','prestation')),
    montant_brut REAL NOT NULL,
    montant_net REAL NOT NULL,
    montant_emprunts REAL DEFAULT 0,
    mode TEXT CHECK(mode IN ('Espèce', 'Orange money', 'Moov money', 'Telecel money', 'Wave', 'Sank Money', 'Virement bancaire')),
    periode_debut DATE,
    periode_fin DATE,
    date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP,
    observation TEXT,
    annule INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employe_id) REFERENCES employes(id)
  )`);

  // Dépenses
  await db.execute(`CREATE TABLE IF NOT EXISTS depenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categorie TEXT, 
    designation TEXT, 
    montant REAL,
    responsable TEXT, 
    date_depense DATETIME, 
    observation TEXT
  )`);


  // Entrées stock
  await db.execute(`CREATE TABLE IF NOT EXISTS entrees_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_entree TEXT UNIQUE NOT NULL,
    matiere_id INTEGER,
    tenue_variante_id INTEGER,
    quantite REAL NOT NULL,
    cout_unitaire REAL NOT NULL,
    fournisseur TEXT,
    lot_number TEXT,
    date_peremption DATE,
    date_entree DATETIME DEFAULT CURRENT_TIMESTAMP,
    observation TEXT,
    FOREIGN KEY (matiere_id) REFERENCES matieres(id),
    FOREIGN KEY (tenue_variante_id) REFERENCES tenues_variantes(id)
  )`);

  // Sorties stock
  await db.execute(`CREATE TABLE IF NOT EXISTS sorties_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_sortie TEXT UNIQUE NOT NULL,
    matiere_id INTEGER,
    tenue_variante_id INTEGER,
    commande_id INTEGER,
    quantite REAL NOT NULL,
    cout_unitaire REAL NOT NULL,
    motif TEXT,
    date_sortie DATETIME DEFAULT CURRENT_TIMESTAMP,
    observation TEXT,
    FOREIGN KEY (matiere_id) REFERENCES matieres(id),
    FOREIGN KEY (tenue_variante_id) REFERENCES tenues_variantes(id),
    FOREIGN KEY (commande_id) REFERENCES commandes(id)
  )`);

  // Logs
  await db.execute(`CREATE TABLE IF NOT EXISTS journal_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_action DATETIME, 
    utilisateur TEXT, 
    action TEXT,
    table_cible TEXT, 
    id_ligne INTEGER
  )`);

  // ================= DONNÉES PAR DÉFAUT =================

  const existing = await db.select<Array<{ id: number }>>(`SELECT * FROM configuration_atelier WHERE id = 1`);
  if (!existing || existing.length === 0) {
    await db.execute(`
      INSERT INTO configuration_atelier (id, nom_atelier, telephone, adresse, email, nif, message_facture, logo_base64)
      VALUES (1, 'Mon Atelier de Couture', '', '', '', '', '', '')
    `);
  }

  const taillesExist = await db.select<Array<{ id: number }>>(`SELECT * FROM tailles LIMIT 1`);
  if (!taillesExist || taillesExist.length === 0) {
    await db.execute(`
      INSERT INTO tailles (code_taille, libelle, ordre) VALUES
      ('XS', 'Extra Small', 1),
      ('S', 'Small', 2),
      ('M', 'Medium', 3),
      ('L', 'Large', 4),
      ('XL', 'Extra Large', 5),
      ('XXL', 'Double Extra Large', 6),
      ('XXXL', 'Triple Extra Large', 7),
      ('2XL', '2X Large', 8),
      ('3XL', '3X Large', 9)
    `);
    console.log("✅ Tailles par défaut créées");
  }

  const categoriesExist = await db.select<Array<{ id: number }>>(`SELECT * FROM categories_matieres LIMIT 1`);
  if (!categoriesExist || categoriesExist.length === 0) {
    await db.execute(`
      INSERT INTO categories_matieres (code_categorie, nom_categorie, description) VALUES
      ('TISSU', 'Tissus', 'Tissus pour confection'),
      ('DOUBLURE', 'Doublures', 'Doublures et doublons'),
      ('FOURNITURE', 'Fournitures', 'Boutons, fermetures, élastiques'),
      ('FIL', 'Fils', 'Fils de couture'),
      ('OUTIL', 'Outils', 'Outils de couture')
    `);
    console.log("✅ Catégories de matières par défaut créées");
  }

  const adminHash = bcrypt.hashSync("admin123", 10);
  const adminExists = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM utilisateurs WHERE login = 'admin'"
  );

  if (adminExists[0].count === 0) {
    await db.execute(
      `INSERT INTO utilisateurs (nom, login, mot_de_passe_hash, role, est_actif) 
       VALUES (?, ?, ?, ?, 1)`,
      ["Administrateur", "admin", adminHash, "admin"]
    );
    console.log("✅ Compte admin créé (login: admin, mot de passe: admin123)");
  }

  console.log("✅ Toutes les tables sont initialisées");
};

// ==============================
// INIT DATABASE
// ==============================

export const initDatabase = async (): Promise<void> => {
  try {
    await getDb();
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    throw error;
  }
};

// ================= EXPORT DEFAULT =================

export default {
  // Initialisation
  getDb,
  initDatabase,
  
  // Configuration
  getConfigurationAtelier,
  saveConfigurationAtelier,
  
  // Codes
  getNextClientCode,
  getNextProductCode,
  getNextCommandeCode,
  getNextFactureCode,
  getNextVenteCode,
  getNextReglementCode,
  getNextDecompteCode,
  getNextSortieCode,
  
  // Clients
  getClients,
  createClient,
  updateClient,
  deleteClient,
  
  // Matières
  getMatieres,
  getMatiereById,
  createMatiere,
  updateMatiere,
  deleteMatiere,
  updateStockMatiere,
  
  // Gammes tenues
  getGammesTenues,
  getGammeTenueById,
  createGammeTenue,
  updateGammeTenue,
  deleteGammeTenue,
  
  // Ventes
  getVentes,
  getVenteById,
  createVente,
  updateVentePaiement,
  annulerVente,
  
  // Tailles
  getTailles,
  createTaille,
  updateTaille,
  deleteTaille,
  
  // Catégories matières
  getCategoriesMatieres,
  createCategorieMatiere,
  
  // Variantes tenues
  getTenuesVariantes,
  createTenueVariante,
  updateTenueVariante,
  deleteTenueVariante,
  
  // Salaires
  payerSalaire,
  payerSalaireSecurise,
  getSalairesEmploye,
  annulerPaiementSalaire,
  
  // Dépenses
  getDepenses,
  createDepense,
  deleteDepense,
  
  // Recu
  getRecuData,
  
  // Utilitaires
  resetAllData,
  seedData,
  
  // Réseau
  testerConnexionReseau,
  configurerBaseReseau,
  utiliserBaseLocale,
  
  // Interface DB
  dbInterface,
  selectSafe,
  executeSafe
};