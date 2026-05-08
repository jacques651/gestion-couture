// src/database/db.ts
import Database from "@tauri-apps/plugin-sql";
import bcrypt from "bcryptjs";

let dbInstance: Database | null = null;

// ================= INTERFACES TYPES =================

export interface Taille {
  id: number;
  code_taille: string;
  libelle: string;
  ordre: number;
  categorie?: 'adulte' | 'enfant' | 'universel';
  description?: string;
  est_actif: number;
  created_at?: string;
}

export interface Couleur {
  id: number;
  nom_couleur: string;
  code_hex: string;
  code_rgb: string;
  code_cmyk?: string;
  description?: string;
  est_actif: number;
  created_at?: string;
}

export interface Texture {
  id: number;
  nom_texture: string;
  description: string;
  densite?: string;
  composition?: string;
  est_actif: number;
  created_at?: string;
}

export interface TypeMesure {
  id: number;
  nom: string;
  unite: string;
  ordre_affichage: number;
  est_active: number;
  created_at?: string;
}

export interface TypePrestation {
  id: number;
  code_prestation: string;
  nom: string;
  description: string;
  prix_par_defaut: number;
  unite: 'piece' | 'heure' | 'metre';
  est_active: number;
  created_at?: string;
}

export interface ModeleTenue {
  id: number;
  code_modele: string;
  designation: string;
  description: string;
  image_url: string;
  categorie: 'homme' | 'femme' | 'enfant' | 'accessoire';
  est_actif: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategorieMatiere {
  id: number;
  code_categorie: string;
  nom_categorie: string;
  description: string;
  couleur_associee?: string;
  est_actif: number;
  created_at?: string;
}

export interface ConfigurationAtelier {
  id: number;
  nom_atelier: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  pays: string;
  ifu: string;
  rccm: string;
  message_facture_defaut: string;
  logo_base64: string;
  devise?: string;
  updated_at?: string;
}

export interface Client {
  telephone_id: string;
  nom_prenom: string;
  adresse: string;
  email: string;
  date_enregistrement: string;
  observations: string;
  est_supprime: number;
}

export interface Article {
  id: number;
  code_article: string;
  modele_id: number;
  taille_id: number;
  couleur_id: number;
  texture_id: number | null;
  prix_achat: number | null;
  prix_vente: number;
  quantite_stock: number;
  seuil_alerte: number;
  emplacement: string | null;
  code_barre: string | null;
  notes: string | null;
  est_disponible: number;
  est_actif: number;
  created_at: string;
  updated_at: string | null;
}

export interface ArticleComplet {
  code_barre: string;
  notes: string;
  id: number;
  code_article: string;
  modele: string;
  modele_id: number;
  taille: string;
  taille_id: number;
  taille_libelle: string;
  couleur: string;
  couleur_id: number;
  texture: string | null;
  texture_id: number | null;
  prix_achat: number | null;
  prix_vente: number;
  quantite_stock: number;
  seuil_alerte: number;
  emplacement: string | null;
  est_disponible: number;
  statut_stock: string;
  created_at: string;
}

export interface Matiere {
  id: number;
  code_matiere: string;
  designation: string;
  categorie_id: number;
  unite: string;
  prix_achat: number;
  stock_actuel: number;
  seuil_alerte: number;
  reference_fournisseur?: string;
  emplacement?: string;
  est_supprime: number;
  created_at?: string;
  updated_at?: string;
}

export interface Vente {
  id: number;
  code_vente: string;
  type_vente: 'commande' | 'pret_a_porter' | 'matiere';
  date_vente: string;
  client_id: string | null;
  client_nom: string | null;
  mode_paiement: 'Espèces' | 'Orange money' | 'Moov money' | 'Telecel money' | 'Wave' | 'Sank Money' | 'Virement bancaire' | null;
  montant_total: number;
  montant_regle: number;
  montant_restant: number;
  statut: 'EN_ATTENTE' | 'PARTIEL' | 'PAYEE' | 'ANNULEE'; // ← Ajoute 'ANNULEE'
  observation: string | null;
  created_at: string;
  updated_at: string | null;
}
export interface VenteDetail {
  id: number;
  vente_id: number;
  matiere_id: number | null;
  article_id: number | null;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  taille_libelle: string | null;
}

export interface Employe {
  id: number;
  nom_prenom: string;
  telephone: string;
  personne_a_prevenir: string;
  lieu_residence: string;
  date_embauche: string;
  type_remuneration: 'fixe' | 'prestation';
  salaire_base: number;
  est_actif: number;
  est_supprime: number;
  created_at?: string;
  updated_at?: string;
}

export interface Depense {
  id: number;
  designation: string;
  montant: number;
  categorie?: string;
  responsable?: string;
  date_depense: string;
  observation?: string;
}

// ================= FONCTIONS DE GÉNÉRATION DE CODES =================

const generateCode = async (table: string, column: string, prefix: string): Promise<string> => {
  const db = await getDb();
  const result = await db.select<{ [key: string]: string }[]>(`
    SELECT ${column} FROM ${table} 
    WHERE ${column} LIKE '${prefix}-%' 
    ORDER BY id DESC LIMIT 1
  `);

  if (result.length === 0) return `${prefix}-0001`;
  const lastNumber = parseInt(result[0][column].split('-')[1]);
  return `${prefix}-${(lastNumber + 1).toString().padStart(4, '0')}`;
};

export const getNextClientId = async (): Promise<string> => {
  return generateCode('clients', 'telephone_id', 'CL');
};

export const getNextArticleCode = async (): Promise<string> => {
  return generateCode('articles', 'code_article', 'ART');
};

export const getNextVenteCode = async (): Promise<string> => {
  return generateCode('ventes', 'code_vente', 'VTE');
};

export const getNextModeleCode = async (): Promise<string> => {
  return generateCode('modeles_tenues', 'code_modele', 'MOD');
};

export const getNextCategorieCode = async (): Promise<string> => {
  return generateCode('categories_matieres', 'code_categorie', 'CAT');
};

export const getNextPrestationCode = async (): Promise<string> => {
  return generateCode('types_prestations', 'code_prestation', 'PRS');
};

export const getNextMatiereCode = async (): Promise<string> => {
  return generateCode('matieres', 'code_matiere', 'MAT');
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
    await initDatabase(dbInstance);

    console.log("✅ Base de données initialisée");
  } catch (error) {
    console.error("❌ ERREUR INITIALISATION DB:", error);
    throw error;
  }

  return dbInstance;
};

// ================= RÉFÉRENTIEL - TAILLES =================

export const getTailles = async (categorie?: string): Promise<Taille[]> => {
  const db = await getDb();
  let query = 'SELECT * FROM tailles WHERE est_actif = 1';
  const params: any[] = [];

  if (categorie) {
    query += ' AND categorie = ?';
    params.push(categorie);
  }

  query += ' ORDER BY ordre';
  return db.select(query, params);
};

export const getTailleById = async (id: number): Promise<Taille | null> => {
  const db = await getDb();
  const result = await db.select<Taille[]>(
    'SELECT * FROM tailles WHERE id = ? AND est_actif = 1',
    [id]
  );
  return result[0] || null;
};

export const getTailleByCode = async (code_taille: string): Promise<Taille | null> => {
  const db = await getDb();
  const result = await db.select<Taille[]>(
    'SELECT * FROM tailles WHERE code_taille = ? AND est_actif = 1',
    [code_taille]
  );
  return result[0] || null;
};

export const createTaille = async (taille: Omit<Taille, 'id' | 'created_at'>): Promise<number> => {
  const db = await getDb();
  const result = await db.execute(`
    INSERT INTO tailles (code_taille, libelle, ordre, categorie, description, est_actif)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    taille.code_taille,
    taille.libelle,
    taille.ordre || 0,
    taille.categorie || 'universel',
    taille.description || null,
    taille.est_actif ?? 1
  ]);
  return result.lastInsertId as number;
};

export const updateTaille = async (id: number, taille: Partial<Taille>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['code_taille', 'libelle', 'ordre', 'categorie', 'description', 'est_actif'];

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
  await db.execute(`UPDATE tailles SET est_actif = 0 WHERE id = ?`, [id]);
};

// ================= RÉFÉRENTIEL - COULEURS =================

export const getCouleurs = async (actif: boolean = true): Promise<Couleur[]> => {
  const db = await getDb();
  const query = actif
    ? 'SELECT * FROM couleurs WHERE est_actif = 1 ORDER BY nom_couleur'
    : 'SELECT * FROM couleurs ORDER BY nom_couleur';
  return db.select(query);
};

export const getCouleurById = async (id: number): Promise<Couleur | null> => {
  const db = await getDb();
  const result = await db.select<Couleur[]>(
    'SELECT * FROM couleurs WHERE id = ?',
    [id]
  );
  return result[0] || null;
};

export const getCouleurByNom = async (nom_couleur: string): Promise<Couleur | null> => {
  const db = await getDb();
  const result = await db.select<Couleur[]>(
    'SELECT * FROM couleurs WHERE nom_couleur = ?',
    [nom_couleur]
  );
  return result[0] || null;
};

// Récupérer les permissions d'un utilisateur
export const getPermissions = async (utilisateurId: number): Promise<any[]> => {
  const db = await getDb();
  return db.select(`SELECT * FROM permissions WHERE utilisateur_id = ?`, [utilisateurId]);
};

// Sauvegarder les permissions
export const savePermissions = async (utilisateurId: number, permissions: { fonctionnalite: string; lecture: boolean; ecriture: boolean }[]) => {
  const db = await getDb();
  await db.execute(`DELETE FROM permissions WHERE utilisateur_id = ?`, [utilisateurId]);
  for (const p of permissions) {
    if (p.lecture || p.ecriture) {
      await db.execute(
        `INSERT INTO permissions (utilisateur_id, fonctionnalite, lecture, ecriture) VALUES (?, ?, ?, ?)`,
        [utilisateurId, p.fonctionnalite, p.lecture ? 1 : 0, p.ecriture ? 1 : 0]
      );
    }
  }
};

export const createCouleur = async (couleur: Omit<Couleur, 'id' | 'created_at'>): Promise<number> => {
  const db = await getDb();

  const existing = await getCouleurByNom(couleur.nom_couleur);
  if (existing) throw new Error(`La couleur "${couleur.nom_couleur}" existe déjà`);

  const result = await db.execute(`
    INSERT INTO couleurs (nom_couleur, code_hex, code_rgb, code_cmyk, description, est_actif)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    couleur.nom_couleur,
    couleur.code_hex || null,
    couleur.code_rgb || null,
    couleur.code_cmyk || null,
    couleur.description || null,
    couleur.est_actif ?? 1
  ]);
  return result.lastInsertId as number;
};

export const updateCouleur = async (id: number, couleur: Partial<Couleur>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['nom_couleur', 'code_hex', 'code_rgb', 'code_cmyk', 'description', 'est_actif'];

  Object.entries(couleur).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return;

  values.push(id);
  await db.execute(`UPDATE couleurs SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteCouleur = async (id: number): Promise<void> => {
  const db = await getDb();
  const usage = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM articles WHERE couleur_id = ?',
    [id]
  );

  if (usage[0].count > 0) {
    throw new Error(`Impossible de supprimer cette couleur car elle est utilisée par ${usage[0].count} article(s)`);
  }

  await db.execute(`DELETE FROM couleurs WHERE id = ?`, [id]);
};

// ================= RÉFÉRENTIEL - TEXTURES =================

export const getTextures = async (actif: boolean = true): Promise<Texture[]> => {
  const db = await getDb();
  const query = actif
    ? 'SELECT * FROM textures WHERE est_actif = 1 ORDER BY nom_texture'
    : 'SELECT * FROM textures ORDER BY nom_texture';
  return db.select(query);
};

export const getTextureById = async (id: number): Promise<Texture | null> => {
  const db = await getDb();
  const result = await db.select<Texture[]>(
    'SELECT * FROM textures WHERE id = ?',
    [id]
  );
  return result[0] || null;
};

export const createTexture = async (texture: Omit<Texture, 'id' | 'created_at'>): Promise<number> => {
  const db = await getDb();
  const result = await db.execute(`
    INSERT INTO textures (nom_texture, description, densite, composition, est_actif)
    VALUES (?, ?, ?, ?, ?)
  `, [
    texture.nom_texture,
    texture.description || null,
    texture.densite || null,
    texture.composition || null,
    texture.est_actif ?? 1
  ]);
  return result.lastInsertId as number;
};

export const updateTexture = async (id: number, texture: Partial<Texture>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['nom_texture', 'description', 'densite', 'composition', 'est_actif'];

  Object.entries(texture).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return;

  values.push(id);
  await db.execute(`UPDATE textures SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteTexture = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE textures SET est_actif = 0 WHERE id = ?`, [id]);
};


// ================= RÉFÉRENTIEL - TYPES DE MESURES =================

export const getTypesMesures = async (): Promise<TypeMesure[]> => {
  const db = await getDb();
  return db.select('SELECT * FROM types_mesures WHERE est_active = 1 ORDER BY ordre_affichage');
};

export const getTypeMesureById = async (id: number): Promise<TypeMesure | null> => {
  const db = await getDb();
  const result = await db.select<TypeMesure[]>(
    'SELECT * FROM types_mesures WHERE id = ? AND est_active = 1',
    [id]
  );
  return result[0] || null;
};

export const createTypeMesure = async (typeMesure: Omit<TypeMesure, 'id' | 'created_at'>): Promise<number> => {
  const db = await getDb();
  const result = await db.execute(`
    INSERT INTO types_mesures (nom, unite, ordre_affichage, est_active)
    VALUES (?, ?, ?, ?)
  `, [
    typeMesure.nom,
    typeMesure.unite,
    typeMesure.ordre_affichage || 0,
    typeMesure.est_active ?? 1
  ]);
  return result.lastInsertId as number;
};

export const updateTypeMesure = async (id: number, typeMesure: Partial<TypeMesure>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['nom', 'unite', 'ordre_affichage', 'est_active'];

  Object.entries(typeMesure).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return;

  values.push(id);
  await db.execute(`UPDATE types_mesures SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteTypeMesure = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE types_mesures SET est_active = 0 WHERE id = ?`, [id]);
};

// ================= RÉFÉRENTIEL - TYPES DE PRESTATIONS =================

export const getTypesPrestations = async (actif: boolean = true): Promise<TypePrestation[]> => {
  const db = await getDb();
  const query = actif
    ? 'SELECT * FROM types_prestations WHERE est_active = 1 ORDER BY nom'
    : 'SELECT * FROM types_prestations ORDER BY nom';
  return db.select(query);
};

export const getTypePrestationById = async (id: number): Promise<TypePrestation | null> => {
  const db = await getDb();
  const result = await db.select<TypePrestation[]>(
    'SELECT * FROM types_prestations WHERE id = ?',
    [id]
  );
  return result[0] || null;
};

export const createTypePrestation = async (typePrestation: Omit<TypePrestation, 'id' | 'created_at' | 'code_prestation'>): Promise<number> => {
  const db = await getDb();
  const code_prestation = await getNextPrestationCode();

  const result = await db.execute(`
    INSERT INTO types_prestations (code_prestation, nom, description, prix_par_defaut, unite, est_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    code_prestation,
    typePrestation.nom,
    typePrestation.description || null,
    typePrestation.prix_par_defaut,
    typePrestation.unite,
    typePrestation.est_active ?? 1
  ]);
  return result.lastInsertId as number;
};

export const updateTypePrestation = async (id: number, typePrestation: Partial<TypePrestation>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['nom', 'description', 'prix_par_defaut', 'unite', 'est_active'];

  Object.entries(typePrestation).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return;

  values.push(id);
  await db.execute(`UPDATE types_prestations SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteTypePrestation = async (id: number): Promise<void> => {
  const db = await getDb();
  const usage = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM prestations_realisees WHERE type_prestation_id = ?',
    [id]
  );

  if (usage[0].count > 0) {
    throw new Error(`Impossible de supprimer ce type de prestation car il est utilisé par ${usage[0].count} prestation(s)`);
  }

  await db.execute(`DELETE FROM types_prestations WHERE id = ?`, [id]);
};

// ================= RÉFÉRENTIEL - MODÈLES DE TENUES =================

export const getModelesTenues = async (actif: boolean = true, categorie?: string): Promise<ModeleTenue[]> => {
  const db = await getDb();
  let query = 'SELECT * FROM modeles_tenues WHERE 1=1';
  const params: any[] = [];

  if (actif) {
    query += ' AND est_actif = 1';
  }
  if (categorie) {
    query += ' AND categorie = ?';
    params.push(categorie);
  }

  query += ' ORDER BY designation';
  return db.select(query, params);
};

export const getModeleTenueById = async (id: number): Promise<ModeleTenue | null> => {
  const db = await getDb();
  const result = await db.select<ModeleTenue[]>(
    'SELECT * FROM modeles_tenues WHERE id = ?',
    [id]
  );
  return result[0] || null;
};

export const getModeleTenueByCode = async (code_modele: string): Promise<ModeleTenue | null> => {
  const db = await getDb();
  const result = await db.select<ModeleTenue[]>(
    'SELECT * FROM modeles_tenues WHERE code_modele = ?',
    [code_modele]
  );
  return result[0] || null;
};

export const createModeleTenue = async (modele: Omit<ModeleTenue, 'id' | 'created_at' | 'updated_at' | 'code_modele'>): Promise<number> => {
  const db = await getDb();
  const code_modele = await getNextModeleCode();

  const result = await db.execute(`
    INSERT INTO modeles_tenues (
      code_modele, designation, description, image_url, categorie, est_actif
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [
    code_modele,
    modele.designation,
    modele.description || null,
    modele.image_url || null,
    modele.categorie,
    modele.est_actif ?? 1
  ]);
  return result.lastInsertId as number;
};

export const updateModeleTenue = async (id: number, modele: Partial<ModeleTenue>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['designation', 'description', 'image_url', 'categorie', 'est_actif'];

  Object.entries(modele).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  await db.execute(`UPDATE modeles_tenues SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteModeleTenue = async (id: number): Promise<void> => {
  const db = await getDb();
  const articlesCount = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM articles WHERE modele_id = ?',
    [id]
  );

  if (articlesCount[0].count > 0) {
    throw new Error(`Impossible de supprimer ce modèle car il est utilisé par ${articlesCount[0].count} article(s)`);
  }

  await db.execute(`UPDATE modeles_tenues SET est_actif = 0 WHERE id = ?`, [id]);
};

// ================= RÉFÉRENTIEL - CATÉGORIES DE MATIÈRES =================

export const getCategoriesMatieres = async (actif: boolean = true): Promise<CategorieMatiere[]> => {
  const db = await getDb();
  const query = actif
    ? 'SELECT * FROM categories_matieres WHERE est_actif = 1 ORDER BY nom_categorie'
    : 'SELECT * FROM categories_matieres ORDER BY nom_categorie';
  return db.select(query);
};

export const getCategorieMatiereById = async (id: number): Promise<CategorieMatiere | null> => {
  const db = await getDb();
  const result = await db.select<CategorieMatiere[]>(
    'SELECT * FROM categories_matieres WHERE id = ?',
    [id]
  );
  return result[0] || null;
};

export const createCategorieMatiere = async (categorie: Omit<CategorieMatiere, 'id' | 'created_at' | 'code_categorie'>): Promise<number> => {
  const db = await getDb();
  const code_categorie = await getNextCategorieCode();

  const result = await db.execute(`
    INSERT INTO categories_matieres (code_categorie, nom_categorie, description, couleur_associee, est_actif)
    VALUES (?, ?, ?, ?, ?)
  `, [
    code_categorie,
    categorie.nom_categorie,
    categorie.description || null,
    categorie.couleur_associee || null,
    categorie.est_actif ?? 1
  ]);
  return result.lastInsertId as number;
};

export const updateCategorieMatiere = async (id: number, categorie: Partial<CategorieMatiere>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['nom_categorie', 'description', 'couleur_associee', 'est_actif'];

  Object.entries(categorie).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return;

  values.push(id);
  await db.execute(`UPDATE categories_matieres SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteCategorieMatiere = async (id: number): Promise<void> => {
  const db = await getDb();
  const matieresCount = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM matieres WHERE categorie_id = ?',
    [id]
  );

  if (matieresCount[0].count > 0) {
    throw new Error(`Impossible de supprimer cette catégorie car elle contient ${matieresCount[0].count} matière(s)`);
  }

  await db.execute(`DELETE FROM categories_matieres WHERE id = ?`, [id]);
};

// ================= RÉFÉRENTIEL - ATELIER/CONFIGURATION =================

export const getConfigurationAtelier = async (): Promise<ConfigurationAtelier> => {
  const db = await getDb();
  const result = await db.select<ConfigurationAtelier[]>(
    'SELECT * FROM atelier WHERE id = 1'
  );

  if (result.length === 0) {
    const defaultConfig: ConfigurationAtelier = {
      id: 1,
      nom_atelier: 'Mon Atelier de Couture',
      telephone: '',
      email: '',
      adresse: '',
      ville: '',
      pays: '',
      ifu: '',
      rccm: '',
      message_facture_defaut: '',
      logo_base64: '',
      devise: 'XOF'
    };
    await saveConfigurationAtelier(defaultConfig);
    return defaultConfig;
  }

  return result[0];
};

export const saveConfigurationAtelier = async (config: Partial<ConfigurationAtelier>): Promise<void> => {
  const db = await getDb();

  await db.execute(`
    INSERT OR REPLACE INTO atelier (id, nom_atelier, telephone, email, adresse, ville, pays, ifu, rccm, message_facture_defaut, logo_base64, devise, updated_at)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [
    config.nom_atelier || '',
    config.telephone || '',
    config.email || '',
    config.adresse || '',
    config.ville || '',
    config.pays || '',
    config.ifu || '',
    config.rccm || '',
    config.message_facture_defaut || '',
    config.logo_base64 || '',
    config.devise || 'XOF'
  ]);
};

// ================= TABLES PRINCIPALES - ARTICLES =================

export const getArticles = async (filters?: {
  modele_id?: number;
  taille_id?: number;
  couleur_id?: number;
  texture_id?: number;
  est_disponible?: boolean;
}): Promise<ArticleComplet[]> => {
  const db = await getDb();
  let query = `SELECT * FROM v_articles_complet WHERE 1=1`;
  const params: any[] = [];

  if (filters?.modele_id) { query += ` AND modele_id = ?`; params.push(filters.modele_id); }
  if (filters?.taille_id) { query += ` AND taille_id = ?`; params.push(filters.taille_id); }
  if (filters?.couleur_id) { query += ` AND couleur_id = ?`; params.push(filters.couleur_id); }
  if (filters?.texture_id) { query += ` AND texture_id = ?`; params.push(filters.texture_id); }
  if (filters?.est_disponible !== undefined) { query += ` AND est_disponible = ?`; params.push(filters.est_disponible ? 1 : 0); }

  query += ` ORDER BY modele, taille, couleur`;
  return db.select(query, params);
};

export const getArticleById = async (id: number): Promise<ArticleComplet | null> => {
  const db = await getDb();
  const result = await db.select<ArticleComplet[]>(
    'SELECT * FROM v_articles_complet WHERE id = ?',
    [id]
  );
  return result[0] || null;
};

export const getArticleByCode = async (code_article: string): Promise<ArticleComplet | null> => {
  const db = await getDb();
  const result = await db.select<ArticleComplet[]>(
    'SELECT * FROM v_articles_complet WHERE code_article = ?',
    [code_article]
  );
  return result[0] || null;
};

export const createArticle = async (
  article: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'code_article'>
): Promise<number> => {
  const db = await getDb();
  const code_article = await getNextArticleCode();

  const result = await db.execute(`
    INSERT INTO articles (
      code_article, modele_id, taille_id, couleur_id, texture_id,
      prix_achat, prix_vente, quantite_stock, seuil_alerte,
      emplacement, code_barre, notes, est_disponible, est_actif
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    code_article, article.modele_id, article.taille_id, article.couleur_id,
    article.texture_id || null, article.prix_achat || null, article.prix_vente,
    article.quantite_stock || 0, article.seuil_alerte || 5,
    article.emplacement || null, article.code_barre || null,
    article.notes || null, article.est_disponible ?? 1, article.est_actif ?? 1
  ]);

  return result.lastInsertId as number;
};

export const updateArticle = async (id: number, article: Partial<Article>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    'modele_id', 'taille_id', 'couleur_id', 'texture_id', 'prix_achat',
    'prix_vente', 'quantite_stock', 'seuil_alerte', 'emplacement',
    'code_barre', 'notes', 'est_disponible', 'est_actif'
  ];

  Object.entries(article).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  await db.execute(`UPDATE articles SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteArticle = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE articles SET est_actif = 0 WHERE id = ?`, [id]);
};

export const updateStockArticle = async (id: number, quantite: number, type: 'add' | 'remove'): Promise<void> => {
  const db = await getDb();
  const operation = type === 'add' ? '+' : '-';
  await db.execute(
    `UPDATE articles SET quantite_stock = quantite_stock ${operation} ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [Math.abs(quantite), id]
  );
};

// ================= TABLES PRINCIPALES - MATIÈRES =================

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
  const result = await db.select<Matiere[]>(
    'SELECT * FROM matieres WHERE id = ? AND est_supprime = 0',
    [id]
  );
  return result[0] || null;
};

export const createMatiere = async (matiere: Omit<Matiere, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const db = await getDb();
  const code_matiere = await getNextMatiereCode();

  const result = await db.execute(`
    INSERT INTO matieres (
      code_matiere, designation, categorie_id, unite, prix_achat,
      stock_actuel, seuil_alerte, reference_fournisseur,
      emplacement, est_supprime
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `, [
    code_matiere, matiere.designation, matiere.categorie_id,
    matiere.unite, matiere.prix_achat,
    matiere.stock_actuel || 0, matiere.seuil_alerte || 0,
    matiere.reference_fournisseur || null, matiere.emplacement || null
  ]);

  return result.lastInsertId as number;
};

export const updateMatiere = async (id: number, matiere: Partial<Matiere>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    'designation', 'categorie_id', 'unite', 'prix_achat',
    'seuil_alerte', 'reference_fournisseur', 'emplacement'
  ];

  Object.entries(matiere).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  await db.execute(`UPDATE matieres SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteMatiere = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE matieres SET est_supprime = 1 WHERE id = ?`, [id]);
};

export const updateStockMatiere = async (id: number, quantite: number, type: 'add' | 'remove'): Promise<void> => {
  const db = await getDb();
  const operation = type === 'add' ? '+' : '-';
  await db.execute(
    `UPDATE matieres SET stock_actuel = stock_actuel ${operation} ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [Math.abs(quantite), id]
  );
};

// ================= TABLES PRINCIPALES - CLIENTS =================

export const getClients = async (): Promise<Client[]> => {
  const db = await getDb();
  return db.select('SELECT * FROM clients WHERE est_supprime = 0 ORDER BY nom_prenom');
};

export const getClientById = async (telephone_id: string): Promise<Client | null> => {
  const db = await getDb();
  const result = await db.select<Client[]>(
    'SELECT * FROM clients WHERE telephone_id = ? AND est_supprime = 0',
    [telephone_id]
  );
  return result[0] || null;
};

export const createClient = async (client: Omit<Client, 'telephone_id' | 'date_enregistrement' | 'est_supprime'>): Promise<string> => {
  const db = await getDb();
  const telephone_id = await getNextClientId();

  await db.execute(`
    INSERT INTO clients (telephone_id, nom_prenom, adresse, email, observations, est_supprime)
    VALUES (?, ?, ?, ?, ?, 0)
  `, [telephone_id, client.nom_prenom, client.adresse || null, client.email || null, client.observations || null]);

  return telephone_id;
};

export const updateClient = async (telephone_id: string, client: Partial<Client>): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['nom_prenom', 'adresse', 'email', 'observations'];

  Object.entries(client).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return;

  values.push(telephone_id);
  await db.execute(`UPDATE clients SET ${fields.join(', ')} WHERE telephone_id = ?`, values);
};

export const deleteClient = async (telephone_id: string): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE clients SET est_supprime = 1 WHERE telephone_id = ?`, [telephone_id]);
};

// ================= TABLES PRINCIPALES - VENTES =================

export const getVentes = async (): Promise<Vente[]> => {
  const db = await getDb();
  return db.select(`
    SELECT *, (montant_total - montant_regle) as montant_restant
    FROM ventes 
    ORDER BY date_vente DESC
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

export const getVenteDetails = async (venteId: number): Promise<VenteDetail[]> => {
  const db = await getDb();
  return db.select(`SELECT * FROM vente_details WHERE vente_id = ?`, [venteId]);
};

export const getVenteWithDetails = async (id: number): Promise<any> => {
  const db = await getDb();
  const vente = await db.select<any[]>(`SELECT * FROM ventes WHERE id = ?`, [id]);
  const details = await db.select<any[]>(`
    SELECT vd.*, 
      CASE 
        WHEN vd.article_id IS NOT NULL THEN 'article'
        WHEN vd.matiere_id IS NOT NULL THEN 'matiere'
        ELSE 'prestation'
      END as type_ligne
    FROM vente_details vd WHERE vd.vente_id = ?
  `, [id]);
  return { ...vente[0], details };
};

export const createVenteComplete = async (
  vente: Omit<Vente, 'id' | 'created_at' | 'updated_at' | 'montant_restant'>,
  details: Omit<VenteDetail, 'id'>[]
): Promise<number> => {
  const db = await getDb();
  await db.execute('BEGIN TRANSACTION');
  try {
    const result = await db.execute(`
      INSERT INTO ventes (code_vente, type_vente, date_vente, client_id, client_nom,
        mode_paiement, montant_total, montant_regle, statut, observation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [vente.code_vente, vente.type_vente, vente.date_vente, vente.client_id,
    vente.client_nom, vente.mode_paiement, vente.montant_total,
    vente.montant_regle || 0, vente.statut, vente.observation]);

    const venteId = result.lastInsertId as number;
    for (const detail of details) {
      await db.execute(`
        INSERT INTO vente_details (vente_id, matiere_id, article_id, designation,
          quantite, prix_unitaire, total, taille_libelle)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [venteId, detail.matiere_id || null, detail.article_id || null,
        detail.designation, detail.quantite, detail.prix_unitaire,
        detail.total, detail.taille_libelle || null]);
    }
    await db.execute('COMMIT');
    return venteId;
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
};

export const updateVenteComplete = async (
  id: number,
  data: {
    client_id?: string | null;
    client_nom?: string;
    date_vente?: string;
    observation?: string;
    type_vente?: string;
    montant_total?: number;
    montant_regle?: number;
    details?: Array<{
      id?: number;
      designation: string;
      quantite: number;
      prix_unitaire: number;
      total: number;
      article_id?: number;
      matiere_id?: number;
      taille_libelle?: string;
    }>;
  }
): Promise<void> => {
  const db = await getDb();
  await db.execute('BEGIN TRANSACTION');
  try {
    await db.execute(`
      UPDATE ventes 
      SET client_id = ?, client_nom = ?, date_vente = ?, observation = ?, 
          type_vente = ?, montant_total = ?, montant_regle = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [data.client_id || null, data.client_nom || null, data.date_vente,
    data.observation || null, data.type_vente || 'commande',
    data.montant_total || 0, data.montant_regle || 0, id]);

    await db.execute(`DELETE FROM vente_details WHERE vente_id = ?`, [id]);

    for (const detail of data.details || []) {
      await db.execute(`
        INSERT INTO vente_details (vente_id, article_id, matiere_id, designation, quantite, prix_unitaire, total, taille_libelle)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, detail.article_id || null, detail.matiere_id || null, detail.designation,
        detail.quantite, detail.prix_unitaire, detail.total, detail.taille_libelle || null]);
    }
    await db.execute('COMMIT');
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
};

export const updateVentePaiement = async (id: number, montant: number, mode?: string): Promise<void> => {
  const db = await getDb();
  const vente = await getVenteById(id);
  if (!vente) throw new Error('Vente non trouvée');

  const nouveauRegle = vente.montant_regle + montant;
  const nouveauStatut = nouveauRegle >= vente.montant_total ? 'PAYEE' : 'PARTIEL';

  await db.execute(`
    UPDATE ventes 
    SET montant_regle = ?, statut = ?, mode_paiement = COALESCE(?, mode_paiement), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [nouveauRegle, nouveauStatut, mode, id]);
};

export const annulerVente = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE ventes SET statut = 'ANNULEE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
};

// ================= INITIALISATION DE LA BASE =================

const initDatabase = async (db: Database) => {
  await db.execute(`PRAGMA foreign_keys = ON`);

  // 1. Types de mesures
  await db.execute(`CREATE TABLE IF NOT EXISTS types_mesures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    unite TEXT NOT NULL,
    ordre_affichage INTEGER DEFAULT 0,
    est_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 2. Tailles
  await db.execute(`CREATE TABLE IF NOT EXISTS tailles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_taille TEXT UNIQUE NOT NULL,
    libelle TEXT NOT NULL,
    ordre INTEGER DEFAULT 0,
    categorie TEXT CHECK(categorie IN ('adulte', 'enfant', 'universel')) DEFAULT 'universel',
    description TEXT,
    est_actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 3. Couleurs
  await db.execute(`CREATE TABLE IF NOT EXISTS couleurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_couleur TEXT UNIQUE NOT NULL,
    code_hex TEXT,
    code_rgb TEXT,
    code_cmyk TEXT,
    description TEXT,
    est_actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 4. Textures
  await db.execute(`CREATE TABLE IF NOT EXISTS textures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_texture TEXT UNIQUE NOT NULL,
    description TEXT,
    densite TEXT,
    composition TEXT,
    est_actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 5. Types de prestations
  await db.execute(`CREATE TABLE IF NOT EXISTS types_prestations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_prestation TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    description TEXT,
    prix_par_defaut REAL NOT NULL DEFAULT 0,
    unite TEXT CHECK(unite IN ('piece', 'heure', 'metre')) DEFAULT 'piece',
    est_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 6. Configuration atelier
  await db.execute(`CREATE TABLE IF NOT EXISTS atelier (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    nom_atelier TEXT NOT NULL,
    telephone TEXT,
    email TEXT,
    adresse TEXT,
    ville TEXT,
    pays TEXT,
    ifu TEXT,
    rccm TEXT,
    message_facture_defaut TEXT,
    logo_base64 TEXT,
    devise TEXT DEFAULT 'XOF',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 7. Catégories de matières
  await db.execute(`CREATE TABLE IF NOT EXISTS categories_matieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_categorie TEXT UNIQUE NOT NULL,
    nom_categorie TEXT NOT NULL,
    description TEXT,
    couleur_associee TEXT,
    est_actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 8. Modèles de tenues
  await db.execute(`CREATE TABLE IF NOT EXISTS modeles_tenues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_modele TEXT UNIQUE NOT NULL,
    designation TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    categorie TEXT CHECK(categorie IN ('homme', 'femme', 'enfant', 'accessoire')) DEFAULT 'femme',
    est_actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
  )`);

  // 9. Utilisateurs
  await db.execute(`CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    login TEXT NOT NULL UNIQUE,
    mot_de_passe_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    est_actif INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

  // 10. Clients
  await db.execute(`CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telephone_id TEXT NOT NULL,
  nom_prenom TEXT NOT NULL,
  profil TEXT DEFAULT 'principal',  -- 'principal', 'enfant', 'conjoint', etc.
  adresse TEXT,
  email TEXT,
  date_enregistrement DATETIME DEFAULT CURRENT_TIMESTAMP,
  observations TEXT,
  est_supprime INTEGER DEFAULT 0
)`);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_clients_telephone ON clients(telephone_id)`);

  // 11. Mesures clients

  await db.execute(`CREATE TABLE IF NOT EXISTS mesures_clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    type_mesure_id INTEGER NOT NULL,
    valeur REAL NOT NULL,
    date_mesure DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (type_mesure_id) REFERENCES types_mesures(id)
)`);

  await db.execute(`
  CREATE INDEX IF NOT EXISTS idx_mesures_client
  ON mesures_clients(client_id)
`);

  await db.execute(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_mesure_unique
  ON mesures_clients(client_id, type_mesure_id)
`);

  // 12. Matières
  await db.execute(`CREATE TABLE IF NOT EXISTS matieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_matiere TEXT UNIQUE NOT NULL,
    designation TEXT NOT NULL,
    categorie_id INTEGER,
    unite TEXT NOT NULL,
    prix_achat REAL DEFAULT 0,
    stock_actuel REAL DEFAULT 0,
    seuil_alerte REAL DEFAULT 0,
    reference_fournisseur TEXT,
    emplacement TEXT,
    est_supprime INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (categorie_id) REFERENCES categories_matieres(id)
  )`);

  // 13. Articles
  await db.execute(`CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_article TEXT UNIQUE NOT NULL,
    modele_id INTEGER NOT NULL,
    taille_id INTEGER NOT NULL,
    couleur_id INTEGER NOT NULL,
    texture_id INTEGER,
    prix_achat REAL,
    prix_vente REAL NOT NULL,
    quantite_stock INTEGER DEFAULT 0,
    seuil_alerte INTEGER DEFAULT 5,
    emplacement TEXT,
    code_barre TEXT,
    notes TEXT,
    est_disponible INTEGER DEFAULT 1,
    est_actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (modele_id) REFERENCES modeles_tenues(id),
    FOREIGN KEY (taille_id) REFERENCES tailles(id),
    FOREIGN KEY (couleur_id) REFERENCES couleurs(id),
    FOREIGN KEY (texture_id) REFERENCES textures(id),
    UNIQUE(modele_id, taille_id, couleur_id, texture_id)
  )`);

  // 14. Vue articles complets
  await db.execute(`CREATE VIEW IF NOT EXISTS v_articles_complet AS
    SELECT 
        a.id, a.code_article,
        m.designation AS modele, m.id AS modele_id,
        t.code_taille AS taille, t.id AS taille_id, t.libelle AS taille_libelle,
        c.nom_couleur AS couleur, c.id AS couleur_id,
        tx.nom_texture AS texture, tx.id AS texture_id,
        a.prix_achat, a.prix_vente, a.quantite_stock, a.seuil_alerte,
        a.emplacement, a.est_disponible, a.code_barre, a.notes,
        CASE 
            WHEN a.quantite_stock <= 0 THEN 'Rupture'
            WHEN a.quantite_stock <= a.seuil_alerte THEN 'Alerte stock'
            ELSE 'Disponible'
        END AS statut_stock,
        a.created_at
    FROM articles a
    LEFT JOIN modeles_tenues m ON a.modele_id = m.id
    LEFT JOIN tailles t ON a.taille_id = t.id
    LEFT JOIN couleurs c ON a.couleur_id = c.id
    LEFT JOIN textures tx ON a.texture_id = tx.id
    WHERE a.est_actif = 1`);

  // 15. Ventes
  await db.execute(`CREATE TABLE IF NOT EXISTS ventes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_vente TEXT UNIQUE NOT NULL,
    type_vente TEXT NOT NULL CHECK(type_vente IN ('commande', 'pret_a_porter', 'matiere')),
    date_vente DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_id INTEGER,  -- ← Changé de TEXT à INTEGER (référence clients.id)
    client_nom TEXT,
    mode_paiement TEXT CHECK(mode_paiement IN ('Espèces', 'Orange money', 'Moov money', 'Telecel money', 'Wave', 'Sank Money', 'Virement bancaire')),
    montant_total REAL NOT NULL,
    montant_regle REAL DEFAULT 0,
    statut TEXT DEFAULT 'EN_ATTENTE',
    observation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (client_id) REFERENCES clients(id)  -- ← Référence maintenant clients.id
)`);

  // 16. Détails ventes
  await db.execute(`CREATE TABLE IF NOT EXISTS vente_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vente_id INTEGER NOT NULL,
    matiere_id INTEGER,
    article_id INTEGER,
    designation TEXT NOT NULL,
    quantite REAL NOT NULL,
    prix_unitaire REAL NOT NULL,
    total REAL NOT NULL,
    taille_libelle TEXT,
    FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_id) REFERENCES matieres(id),
    FOREIGN KEY (article_id) REFERENCES articles(id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS rendezvous_commandes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vente_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    type_rendezvous TEXT NOT NULL,
    date_rendezvous TEXT NOT NULL,
    heure_rendezvous TEXT,
    statut TEXT DEFAULT 'planifie',
    observation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 17. Employés
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

  // 18. Prestations réalisées
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
    FOREIGN KEY (employe_id) REFERENCES employes(id),
    FOREIGN KEY (type_prestation_id) REFERENCES types_prestations(id)
  )`);

  // 19. Emprunts
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

  // 20. Salaires
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

  // 21. Dépenses
  await db.execute(`CREATE TABLE IF NOT EXISTS depenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categorie TEXT, 
    designation TEXT, 
    montant REAL,
    responsable TEXT, 
    date_depense DATETIME DEFAULT CURRENT_TIMESTAMP, 
    observation TEXT
  )`);

  // 22. Entrées stock
  await db.execute(`CREATE TABLE IF NOT EXISTS entrees_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_entree TEXT UNIQUE NOT NULL,
    matiere_id INTEGER,
    article_id INTEGER,
    quantite REAL NOT NULL,
    cout_unitaire REAL NOT NULL,
    fournisseur TEXT,
    lot_number TEXT,
    date_peremption DATE,
    date_entree DATETIME DEFAULT CURRENT_TIMESTAMP,
    observation TEXT,
    FOREIGN KEY (matiere_id) REFERENCES matieres(id),
    FOREIGN KEY (article_id) REFERENCES articles(id)
  )`);

  // 23. Sorties stock
  await db.execute(`CREATE TABLE IF NOT EXISTS sorties_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_sortie TEXT UNIQUE NOT NULL,
    matiere_id INTEGER,
    article_id INTEGER,
    quantite REAL NOT NULL,
    cout_unitaire REAL NOT NULL,
    motif TEXT,
    date_sortie DATETIME DEFAULT CURRENT_TIMESTAMP,
    observation TEXT,
    FOREIGN KEY (matiere_id) REFERENCES matieres(id),
    FOREIGN KEY (article_id) REFERENCES articles(id)
  )`);

  // 24. Journal des logs
  await db.execute(`CREATE TABLE IF NOT EXISTS journal_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_action DATETIME DEFAULT CURRENT_TIMESTAMP, 
    utilisateur TEXT, 
    action TEXT,
    table_cible TEXT, 
    id_ligne INTEGER
  )`);

  // 25. Table permissions
  await db.execute(`CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER NOT NULL,
  fonctionnalite TEXT NOT NULL,
  lecture INTEGER DEFAULT 1,
  ecriture INTEGER DEFAULT 0,
  UNIQUE(utilisateur_id, fonctionnalite),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
)`);

  // Index
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_articles_modele ON articles(modele_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_articles_taille ON articles(taille_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_articles_couleur ON articles(couleur_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_articles_disponible ON articles(est_disponible)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_ventes_client ON ventes(client_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_ventes_date ON ventes(date_vente)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_ventes_code ON ventes(code_vente)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_matieres_code ON matieres(code_matiere)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_articles_code ON articles(code_article)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_modeles_code ON modeles_tenues(code_modele)`);

  // Données par défaut
  await seedDefaultData(db);

  console.log("✅ Toutes les tables sont initialisées");

  // ==================== JOURNAL DES MODIFICATIONS (TOUTES LES TABLES) ====================

  // Table journal
  await db.execute(`CREATE TABLE IF NOT EXISTS journal_modifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur TEXT NOT NULL DEFAULT 'Admin',
 action TEXT NOT NULL CHECK(
  action IN (
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'IMPORT',
    'EXPORT',
    'PRINT'
  )
),
  table_concernee TEXT NOT NULL,
  id_enregistrement TEXT,
  details TEXT,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

  // ========== RÉFÉRENTIELS ==========
  // Tailles
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_tailles_insert AFTER INSERT ON tailles BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'tailles', NEW.code_taille, 'Création taille: ' || NEW.libelle); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_tailles_update AFTER UPDATE ON tailles BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'tailles', NEW.code_taille, 'Modification taille: ' || NEW.libelle); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_tailles_delete AFTER DELETE ON tailles BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'tailles', OLD.code_taille, 'Suppression taille: ' || OLD.libelle); END`);

  // Couleurs
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_couleurs_insert AFTER INSERT ON couleurs BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'couleurs', NEW.nom_couleur, 'Création couleur: ' || NEW.nom_couleur); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_couleurs_update AFTER UPDATE ON couleurs BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'couleurs', NEW.nom_couleur, 'Modification couleur: ' || NEW.nom_couleur); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_couleurs_delete AFTER DELETE ON couleurs BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'couleurs', OLD.nom_couleur, 'Suppression couleur: ' || OLD.nom_couleur); END`);

  // Textures
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_textures_insert AFTER INSERT ON textures BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'textures', NEW.nom_texture, 'Création texture: ' || NEW.nom_texture); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_textures_update AFTER UPDATE ON textures BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'textures', NEW.nom_texture, 'Modification texture: ' || NEW.nom_texture); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_textures_delete AFTER DELETE ON textures BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'textures', OLD.nom_texture, 'Suppression texture: ' || OLD.nom_texture); END`);

  // Types de mesures
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_types_mesures_insert AFTER INSERT ON types_mesures BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'types_mesures', NEW.nom, 'Création type mesure: ' || NEW.nom); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_types_mesures_update AFTER UPDATE ON types_mesures BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'types_mesures', NEW.nom, 'Modification type mesure: ' || NEW.nom); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_types_mesures_delete AFTER DELETE ON types_mesures BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'types_mesures', OLD.nom, 'Suppression type mesure: ' || OLD.nom); END`);

  // Types de prestations
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_types_prestations_insert AFTER INSERT ON types_prestations BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'types_prestations', NEW.code_prestation, 'Création prestation: ' || NEW.nom); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_types_prestations_update AFTER UPDATE ON types_prestations BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'types_prestations', NEW.code_prestation, 'Modification prestation: ' || NEW.nom); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_types_prestations_delete AFTER DELETE ON types_prestations BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'types_prestations', OLD.code_prestation, 'Suppression prestation: ' || OLD.nom); END`);

  // Catégories de matières
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_categories_matieres_insert AFTER INSERT ON categories_matieres BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'categories_matieres', NEW.code_categorie, 'Création catégorie: ' || NEW.nom_categorie); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_categories_matieres_update AFTER UPDATE ON categories_matieres BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'categories_matieres', NEW.code_categorie, 'Modification catégorie: ' || NEW.nom_categorie); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_categories_matieres_delete AFTER DELETE ON categories_matieres BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'categories_matieres', OLD.code_categorie, 'Suppression catégorie: ' || OLD.nom_categorie); END`);

  // Modèles de tenues
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_modeles_tenues_insert AFTER INSERT ON modeles_tenues BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'modeles_tenues', NEW.code_modele, 'Création modèle: ' || NEW.designation); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_modeles_tenues_update AFTER UPDATE ON modeles_tenues BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'modeles_tenues', NEW.code_modele, 'Modification modèle: ' || NEW.designation); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_modeles_tenues_delete AFTER DELETE ON modeles_tenues BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'modeles_tenues', OLD.code_modele, 'Suppression modèle: ' || OLD.designation); END`);

  // ========== TABLES PRINCIPALES ==========
  // Clients
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_clients_insert AFTER INSERT ON clients BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'clients', NEW.telephone_id, 'Création client: ' || NEW.nom_prenom); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_clients_update AFTER UPDATE ON clients BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'clients', NEW.telephone_id, 'Modification client: ' || NEW.nom_prenom); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_clients_delete AFTER DELETE ON clients BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'clients', OLD.telephone_id, 'Suppression client: ' || OLD.nom_prenom); END`);

  // Mesures clients
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_mesures_clients_insert AFTER INSERT ON mesures_clients BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'mesures_clients', NEW.client_id, 'Ajout mesure client'); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_mesures_clients_update AFTER UPDATE ON mesures_clients BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'mesures_clients', NEW.client_id, 'Modification mesure client'); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_mesures_clients_delete AFTER DELETE ON mesures_clients BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'mesures_clients', OLD.client_id, 'Suppression mesure client'); END`);

  // Articles
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_articles_insert AFTER INSERT ON articles BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'articles', NEW.code_article, 'Création article: ' || NEW.code_article); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_articles_update AFTER UPDATE ON articles BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'articles', NEW.code_article, 'Modification article: ' || NEW.code_article || ', Stock: ' || NEW.quantite_stock); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_articles_delete AFTER DELETE ON articles BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'articles', OLD.code_article, 'Suppression article: ' || OLD.code_article); END`);

  // Matières
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_matieres_insert AFTER INSERT ON matieres BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'matieres', NEW.code_matiere, 'Création matière: ' || NEW.designation); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_matieres_update AFTER UPDATE ON matieres BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'matieres', NEW.code_matiere, 'Modification matière: ' || NEW.designation || ', Stock: ' || NEW.stock_actuel); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_matieres_delete AFTER DELETE ON matieres BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'matieres', OLD.code_matiere, 'Suppression matière: ' || OLD.designation); END`);

  // Ventes
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_ventes_insert AFTER INSERT ON ventes BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'ventes', NEW.code_vente, 'Création vente: ' || NEW.code_vente || ' (' || NEW.montant_total || ' FCFA)'); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_ventes_update AFTER UPDATE ON ventes BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'ventes', NEW.code_vente, 'Modification vente: ' || NEW.code_vente || ', Statut: ' || NEW.statut); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_ventes_delete AFTER DELETE ON ventes BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'ventes', OLD.code_vente, 'Suppression vente: ' || OLD.code_vente); END`);

  // Vente details
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_vente_details_insert AFTER INSERT ON vente_details BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'vente_details', NEW.vente_id, 'Ajout détail vente: ' || NEW.designation); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_vente_details_delete AFTER DELETE ON vente_details BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'vente_details', OLD.vente_id, 'Suppression détail vente: ' || OLD.designation); END`);

  // Employés
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_employes_insert AFTER INSERT ON employes BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'employes', NEW.id, 'Création employé: ' || NEW.nom_prenom); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_employes_update AFTER UPDATE ON employes BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'employes', NEW.id, 'Modification employé: ' || NEW.nom_prenom); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_employes_delete AFTER DELETE ON employes BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'employes', OLD.id, 'Suppression employé: ' || OLD.nom_prenom); END`);

  // Prestations réalisées
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_prestations_insert AFTER INSERT ON prestations_realisees BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'prestations_realisees', NEW.id, 'Création prestation: ' || NEW.designation); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_prestations_delete AFTER DELETE ON prestations_realisees BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'prestations_realisees', OLD.id, 'Suppression prestation: ' || OLD.designation); END`);

  // Emprunts
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_emprunts_insert AFTER INSERT ON emprunts BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'emprunts', NEW.id, 'Création emprunt: ' || NEW.montant || ' FCFA'); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_emprunts_update AFTER UPDATE ON emprunts BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'emprunts', NEW.id, 'Remboursement emprunt'); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_emprunts_delete AFTER DELETE ON emprunts BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'emprunts', OLD.id, 'Suppression emprunt: ' || OLD.montant || ' FCFA'); END`);

  // Salaires
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_salaires_insert AFTER INSERT ON salaires BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'salaires', NEW.id, 'Paiement salaire: ' || NEW.montant_net || ' FCFA'); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_salaires_delete AFTER DELETE ON salaires BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'salaires', OLD.id, 'Annulation salaire'); END`);

  // Dépenses
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_depenses_insert AFTER INSERT ON depenses BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'depenses', NEW.id, 'Création dépense: ' || NEW.designation || ' (' || NEW.montant || ' FCFA)'); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_depenses_update AFTER UPDATE ON depenses BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'depenses', NEW.id, 'Modification dépense: ' || NEW.designation); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_depenses_delete AFTER DELETE ON depenses BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'depenses', OLD.id, 'Suppression dépense: ' || OLD.designation); END`);

  // Entrées stock
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_entrees_stock_insert AFTER INSERT ON entrees_stock BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'entrees_stock', NEW.code_entree, 'Entrée stock: ' || NEW.quantite || ' unités'); END`);

  // Sorties stock
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_sorties_stock_insert AFTER INSERT ON sorties_stock BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'sorties_stock', NEW.code_sortie, 'Sortie stock: ' || NEW.quantite || ' unités'); END`);

  // Utilisateurs
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_utilisateurs_insert AFTER INSERT ON utilisateurs BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'CREATE', 'utilisateurs', NEW.login, 'Création utilisateur: ' || NEW.nom); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_utilisateurs_update AFTER UPDATE ON utilisateurs BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'UPDATE', 'utilisateurs', NEW.login, 'Modification utilisateur: ' || NEW.nom); END`);
  await db.execute(`CREATE TRIGGER IF NOT EXISTS trg_utilisateurs_delete AFTER DELETE ON utilisateurs BEGIN INSERT INTO journal_modifications (utilisateur, action, table_concernee, id_enregistrement, details) VALUES ('Admin', 'DELETE', 'utilisateurs', OLD.login, 'Suppression utilisateur: ' || OLD.nom); END`);

  console.log("✅ Triggers journal modifications créés pour toutes les tables");

};

const seedDefaultData = async (db: Database) => {
  // Tailles par défaut
  const taillesCount = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM tailles");
  if (taillesCount[0].count === 0) {
    const tailles = [
      { code: 'XS', libelle: 'Extra Small', ordre: 1, categorie: 'adulte' },
      { code: 'S', libelle: 'Small', ordre: 2, categorie: 'adulte' },
      { code: 'M', libelle: 'Medium', ordre: 3, categorie: 'adulte' },
      { code: 'L', libelle: 'Large', ordre: 4, categorie: 'adulte' },
      { code: 'XL', libelle: 'Extra Large', ordre: 5, categorie: 'adulte' },
      { code: 'XXL', libelle: 'Double Extra Large', ordre: 6, categorie: 'adulte' },
      { code: 'XXXL', libelle: 'Triple Extra Large', ordre: 7, categorie: 'adulte' },
      { code: '2T', libelle: '2 ans', ordre: 1, categorie: 'enfant' },
      { code: '3T', libelle: '3 ans', ordre: 2, categorie: 'enfant' },
      { code: '4T', libelle: '4 ans', ordre: 3, categorie: 'enfant' },
      { code: '5T', libelle: '5 ans', ordre: 4, categorie: 'enfant' },
      { code: '6T', libelle: '6 ans', ordre: 5, categorie: 'enfant' }
    ];
    for (const t of tailles) {
      await db.execute(`INSERT INTO tailles (code_taille, libelle, ordre, categorie, est_actif) VALUES (?, ?, ?, ?, 1)`, [t.code, t.libelle, t.ordre, t.categorie]);
    }
    console.log("✅ Tailles par défaut créées");
  }

  // Couleurs par défaut
  const couleursCount = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM couleurs");
  if (couleursCount[0].count === 0) {
    const couleurs = [
      { nom: 'Noir', hex: '#000000', rgb: '(0,0,0)' },
      { nom: 'Blanc', hex: '#FFFFFF', rgb: '(255,255,255)' },
      { nom: 'Rouge', hex: '#FF0000', rgb: '(255,0,0)' },
      { nom: 'Bleu', hex: '#0000FF', rgb: '(0,0,255)' },
      { nom: 'Vert', hex: '#00FF00', rgb: '(0,255,0)' },
      { nom: 'Jaune', hex: '#FFFF00', rgb: '(255,255,0)' },
      { nom: 'Marron', hex: '#8B4513', rgb: '(139,69,19)' },
      { nom: 'Gris', hex: '#808080', rgb: '(128,128,128)' },
      { nom: 'Beige', hex: '#F5F5DC', rgb: '(245,245,220)' },
      { nom: 'Bordeaux', hex: '#800000', rgb: '(128,0,0)' },
      { nom: 'Rose', hex: '#FFC0CB', rgb: '(255,192,203)' },
      { nom: 'Orange', hex: '#FFA500', rgb: '(255,165,0)' },
      { nom: 'Violet', hex: '#800080', rgb: '(128,0,128)' },
      { nom: 'Turquoise', hex: '#40E0D0', rgb: '(64,224,208)' }
    ];
    for (const c of couleurs) {
      await db.execute(`INSERT INTO couleurs (nom_couleur, code_hex, code_rgb, est_actif) VALUES (?, ?, ?, 1)`, [c.nom, c.hex, c.rgb]);
    }
    console.log("✅ Couleurs par défaut créées");
  }
  // Mesures d'exemple pour première utilisation.
  // Le couturier peut ensuite personnaliser complètement ses mesures.
  const mesuresCount = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM types_mesures");
  if (mesuresCount[0].count === 0) {
    const mesures = [
      { nom: 'Tour de poitrine', unite: 'cm', ordre: 1 },
      { nom: 'Tour de taille', unite: 'cm', ordre: 2 },
      { nom: 'Tour de hanches', unite: 'cm', ordre: 3 },
      { nom: 'Longueur totale', unite: 'cm', ordre: 4 },
      { nom: 'Longueur manche', unite: 'cm', ordre: 5 },
      { nom: 'Tour de cou', unite: 'cm', ordre: 6 },
      { nom: 'Largeur épaule', unite: 'cm', ordre: 7 },
      { nom: 'Longueur jambe', unite: 'cm', ordre: 8 },
      { nom: 'Tour de cuisse', unite: 'cm', ordre: 9 },
      { nom: 'Tour de bras', unite: 'cm', ordre: 10 }
    ];
    for (const m of mesures) {
      await db.execute(
        `INSERT INTO types_mesures (nom, unite, ordre_affichage, est_active) VALUES (?, ?, ?, 1)`,
        [m.nom, m.unite, m.ordre]
      );
    }
    // ✅ SUPPRIME la deuxième boucle qui suit
    console.log("✅ Types de mesures par défaut créés");
  }

  // Catégories de matières par défaut
  const categoriesCount = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM categories_matieres");
  if (categoriesCount[0].count === 0) {
    const categories = [
      { code: 'TISSU', nom: 'Tissus', desc: 'Tissus pour confection', couleur: '#4CAF50' },
      { code: 'DOUBLURE', nom: 'Doublures', desc: 'Doublures et doublons', couleur: '#2196F3' },
      { code: 'FOURNITURE', nom: 'Fournitures', desc: 'Boutons, fermetures, élastiques', couleur: '#FF9800' },
      { code: 'FIL', nom: 'Fils', desc: 'Fils de couture', couleur: '#9C27B0' },
      { code: 'OUTIL', nom: 'Outils', desc: 'Outils de couture', couleur: '#607D8B' }
    ];
    for (const cat of categories) {
      await db.execute(`INSERT INTO categories_matieres (code_categorie, nom_categorie, description, couleur_associee, est_actif) VALUES (?, ?, ?, ?, 1)`, [cat.code, cat.nom, cat.desc, cat.couleur]);
    }
    console.log("✅ Catégories de matières par défaut créées");
  }

  // Types de prestations par défaut
  const prestationsCount = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM types_prestations");
  if (prestationsCount[0].count === 0) {
    const prestations = [
      { nom: 'Confection simple - Robe', duree: 180, prix: 5000, unite: 'piece' },
      { nom: 'Confection simple - Chemise', duree: 120, prix: 4000, unite: 'piece' },
      { nom: 'Confection simple - Pantalon', duree: 150, prix: 4500, unite: 'piece' },
      { nom: 'Confection complexe - Boubou', duree: 240, prix: 10000, unite: 'piece' },
      { nom: 'Retouche - Ourlet', duree: 20, prix: 1000, unite: 'piece' },
      { nom: 'Réparation - Fermeture éclair', duree: 30, prix: 2000, unite: 'piece' }
    ];
    for (const p of prestations) {
      const code = await getNextPrestationCode();
      await db.execute(`INSERT INTO types_prestations (code_prestation, nom, prix_par_defaut, unite, est_active) VALUES (?, ?, ?, ?, 1)`, [code, p.nom, p.prix, p.unite]);
    }
    console.log("✅ Types de prestations par défaut créés");
  }

  // Configuration atelier par défaut
  const atelierCount = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM atelier");
  if (atelierCount[0].count === 0) {
    await db.execute(`INSERT INTO atelier (id, nom_atelier, telephone, adresse, email, ifu, rccm, message_facture_defaut, logo_base64, devise) VALUES (1, 'Mon Atelier de Couture', '', '', '', '', '', '', '', 'XOF')`);
    console.log("✅ Configuration atelier par défaut créée");
  }

  // Admin par défaut
  const adminHash = bcrypt.hashSync("admin123", 10);
  const adminExists = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM utilisateurs WHERE login = 'admin'");
  if (adminExists[0].count === 0) {
    await db.execute(`INSERT INTO utilisateurs (nom, login, mot_de_passe_hash, role, est_actif) VALUES (?, ?, ?, ?, 1)`, ["Administrateur", "admin", adminHash, "admin"]);
    console.log("✅ Compte admin créé (login: admin, mot de passe: admin123)");
  }
};

// ================= FONCTIONS SUPPLÉMENTAIRES =================

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

export const testerConnexionReseau = async (cheminReseau: string): Promise<{ success: boolean; message: string }> => {
  try {
    let cleanPath = cheminReseau.replace(/\\/g, '/');
    cleanPath = cleanPath.replace(/^file:\/\/\//, '');
    const testDb = await Database.load(cleanPath);
    await testDb.execute("SELECT 1");
    await testDb.close();
    return { success: true, message: 'Connexion réussie ! La base est accessible.' };
  } catch (error: any) {
    return { success: false, message: `Erreur : ${error?.message || 'Base inaccessible.'}` };
  }
};

export const executeSafe = async (query: string, params: any[] = []) => {
  const db = await getDb();
  try { return await db.execute(query, params); } catch (e) { console.error('❌ EXECUTE ERROR:', e); throw e; }
};

export const selectSafe = async <T>(query: string, params: any[] = []): Promise<T[]> => {
  const db = await getDb();
  try { const res = await db.select(query, params); return Array.isArray(res) ? (res as T[]) : []; } catch (e) { console.error('❌ SELECT ERROR:', e); return []; }
};

export const payerSalaire = async ({
  employe_id, type, montant_net, mode, observation = '', empruntIds = []
}: {
  employe_id: number; type: 'fixe' | 'prestation'; montant_net: number; mode: string; observation?: string; empruntIds?: number[];
}) => {
  const db = await getDb();
  const emp = await db.select<Array<{ type_remuneration: string; salaire_base: number }>>("SELECT type_remuneration, salaire_base FROM employes WHERE id = ?", [employe_id]);
  if (!emp.length) throw new Error("Employé introuvable");
  const typeEmploye = emp[0].type_remuneration;
  if (!typeEmploye) throw new Error("Type de rémunération non défini");
  if (type !== typeEmploye) throw new Error(`Paiement invalide: employé en ${typeEmploye}`);
  if (montant_net <= 0) throw new Error("Montant invalide");

  let retenue = 0;
  if (empruntIds.length > 0) {
    const placeholders = empruntIds.map(() => '?').join(',');
    const emprunts = await db.select<Array<{ id: number; montant: number }>>(`SELECT id, montant FROM emprunts WHERE id IN (${placeholders}) AND deduit = 0`, empruntIds);
    retenue = emprunts.reduce((sum, e) => sum + e.montant, 0);
  }

  const montant_brut = montant_net + retenue;

  if (type === 'fixe') {
    const salaire = emp[0].salaire_base || 0;
    const totalDejaPaye = await db.select<Array<{ total: number }>>(`SELECT COALESCE(SUM(montant_net),0) as total FROM salaires WHERE employe_id = ? AND annule = 0`, [employe_id]);
    const deja = totalDejaPaye[0]?.total || 0;
    if (montant_net + deja > salaire) throw new Error("Dépassement du salaire fixe");
  }

  const result: any = await db.execute(`INSERT INTO salaires (employe_id, type, montant_brut, montant_net, montant_emprunts, observation, mode, date_paiement) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`, [employe_id, type, montant_brut, montant_net, retenue, observation, mode]);
  const salaire_id = result?.lastInsertId;

  if (empruntIds.length > 0 && salaire_id) {
    const placeholders = empruntIds.map(() => '?').join(',');
    await db.execute(`UPDATE emprunts SET deduit = 1, salaire_id = ?, date_deduction = datetime('now') WHERE id IN (${placeholders})`, [salaire_id, ...empruntIds]);
  }

  if (type === 'prestation') {
    await db.execute(`UPDATE prestations_realisees SET paye = 1 WHERE employe_id = ? AND (paye = 0 OR paye IS NULL)`, [employe_id]);
  }

  return { success: true, salaire_id, montant_brut, montant_net, retenue };
};

export const payerSalaireSecurise = async (employe_id: number) => {
  const db = await getDb();
  const emp = await db.select<Array<{ type_remuneration: string; salaire_base: number }>>("SELECT type_remuneration, salaire_base FROM employes WHERE id = ?", [employe_id]);
  if (!emp.length) throw new Error("Employé introuvable");
  const type = emp[0].type_remuneration;
  if (!type) throw new Error("Type de rémunération non défini");

  let montant_brut = 0;
  if (type === 'fixe') montant_brut = emp[0].salaire_base || 0;
  if (type === 'prestation') {
    const prestations = await db.select<Array<{ total: number }>>(`SELECT COALESCE(SUM(total),0) as total FROM prestations_realisees WHERE employe_id = ? AND (paye = 0 OR paye IS NULL)`, [employe_id]);
    montant_brut = prestations[0]?.total || 0;
  }

  const emprunts = await db.select<Array<{ id: number; montant: number }>>("SELECT id, montant FROM emprunts WHERE employe_id = ? AND deduit = 0", [employe_id]);
  const retenue = emprunts.reduce((sum: number, e) => sum + e.montant, 0);
  const montant_net = Math.max(montant_brut - retenue, 0);

  return await payerSalaire({ employe_id, type: type as 'fixe' | 'prestation', montant_net, mode: 'Espèce', observation: 'Paiement automatique', empruntIds: emprunts.map(e => e.id) });
};

export const annulerPaiementSalaire = async (salaireId: number) => {
  const db = await getDb();
  const emprunts = await db.select<Array<{ id: number }>>(`SELECT id FROM emprunts WHERE salaire_id = ?`, [salaireId]);
  const sal = await db.select<Array<{ employe_id: number; type: string }>>(`SELECT employe_id, type FROM salaires WHERE id = ?`, [salaireId]);

  await db.execute(`DELETE FROM salaires WHERE id = ?`, [salaireId]);

  if (emprunts.length > 0) {
    const ids = emprunts.map(e => e.id);
    const placeholders = ids.map(() => '?').join(',');
    await db.execute(`UPDATE emprunts SET deduit = 0, salaire_id = NULL, date_deduction = NULL WHERE id IN (${placeholders})`, ids);
  }

  if (sal.length && sal[0].type === 'prestation') {
    await db.execute(`UPDATE prestations_realisees SET paye = 0 WHERE employe_id = ?`, [sal[0].employe_id]);
  }

  return { success: true };
};

export const resetAllData = async () => {
  const db = await getDb();
  const tables = ['vente_details', 'ventes', 'clients', 'matieres', 'articles', 'modeles_tenues', 'tailles', 'couleurs', 'textures', 'categories_matieres', 'depenses', 'employes', 'salaires', 'emprunts', 'prestations_realisees', 'types_prestations', 'entrees_stock', 'sorties_stock'];
  try {
    await db.execute('PRAGMA foreign_keys = OFF');
    for (const table of tables) {
      try { await db.execute(`DELETE FROM ${table}`); await db.execute(`DELETE FROM sqlite_sequence WHERE name=?`, [table]); } catch (err) { console.log(`Table ${table} non trouvée ou vide`); }
    }
    console.log("✅ Reset terminé");
  } catch (error) { console.error("❌ Reset échoué:", error); throw error; } finally { await db.execute('PRAGMA foreign_keys = ON'); }
};

// ================= EXPORT PAR DÉFAUT =================

export default {
  getDb,
  getTailles, getTailleById, getTailleByCode, createTaille, updateTaille, deleteTaille,
  getCouleurs, getCouleurById, getCouleurByNom, createCouleur, updateCouleur, deleteCouleur,
  getTextures, getTextureById, createTexture, updateTexture, deleteTexture,
  getTypesMesures, getTypeMesureById, createTypeMesure, updateTypeMesure, deleteTypeMesure,
  getTypesPrestations, getTypePrestationById, createTypePrestation, updateTypePrestation, deleteTypePrestation,
  getModelesTenues, getModeleTenueById, getModeleTenueByCode, createModeleTenue, updateModeleTenue, deleteModeleTenue,
  getCategoriesMatieres, getCategorieMatiereById, createCategorieMatiere, updateCategorieMatiere, deleteCategorieMatiere,
  getConfigurationAtelier, saveConfigurationAtelier,
  getArticles, getArticleById, getArticleByCode, createArticle, updateArticle, deleteArticle, updateStockArticle,
  getMatieres, getMatiereById, createMatiere, updateMatiere, deleteMatiere, updateStockMatiere,
  getClients, getClientById, createClient, updateClient, deleteClient,
  getVentes, getVenteById, getVenteDetails, getVenteWithDetails, createVenteComplete, updateVenteComplete, updateVentePaiement, annulerVente,
  getNextClientId, getNextArticleCode, getNextVenteCode, getNextModeleCode, getNextCategorieCode, getNextPrestationCode, getNextMatiereCode,
  configurerBaseReseau, utiliserBaseLocale, testerConnexionReseau,
  executeSafe, selectSafe,
  payerSalaire, payerSalaireSecurise, annulerPaiementSalaire,
  resetAllData,
  getPermissions,
  savePermissions
};

