import { getDb } from "../database/db";

// ==============================
// CREER COMMANDE (PRO)
// ==============================
export const createCommande = async (data: {
  client_id: string;
  designation: string;
  nombre: number;
  prix_unitaire: number;
  rendez_vous?: string;
  observation?: string;
}) => {
  const db = await getDb();

  const total = data.nombre * data.prix_unitaire;

  const result: any = await db.execute(
    `INSERT INTO commandes 
    (client_id, designation, nombre, prix_unitaire, total, rendez_vous, etat, observation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.client_id,
      data.designation,
      data.nombre,
      data.prix_unitaire,
      total,
      data.rendez_vous || null,
      "EN_COURS",
      data.observation || null
    ]
  );

  return {
    id: result?.lastInsertId || null,
    total
  };
};

// ==============================
// LISTE COMMANDES (PRO + FILTRAGE)
// ==============================
export const getCommandes = async () => {
  const db = await getDb();

  const rows = await db.select<any[]>(`
    SELECT 
      c.id,
      c.client_id,
      c.designation,
      c.nombre,
      c.prix_unitaire,
      c.total,
      c.rendez_vous,
      c.date_commande,
      c.etat,

      cl.nom_prenom as client_nom,

      IFNULL(SUM(p.montant), 0) as paye,
      (c.total - IFNULL(SUM(p.montant), 0)) as reste

    FROM commandes c

    LEFT JOIN clients cl 
      ON cl.telephone_id = c.client_id

    LEFT JOIN paiements_commandes p 
      ON p.commande_id = c.id

    WHERE c.est_supprime = 0

    GROUP BY c.id

    ORDER BY c.date_commande DESC
  `);

  return rows;
};

// ==============================
// DETAILS COMMANDE (AVEC CLIENT)
// ==============================
export const getCommandeById = async (id: number) => {
  const db = await getDb();

  const res = await db.select<any[]>(`
    SELECT 
      c.*,
      cl.nom_prenom as client_nom
    FROM commandes c
    LEFT JOIN clients cl 
      ON cl.telephone_id = c.client_id
    WHERE c.id = ?
  `, [id]);

  return res[0] || null;
};

// ==============================
// AJOUT PAIEMENT (NOUVEAU)
// ==============================
export const ajouterPaiement = async (data: {
  commande_id: number;
  montant: number;
  mode: string;
  observation?: string;
}) => {
  const db = await getDb();

  await db.execute(
    `INSERT INTO paiements_commandes 
    (commande_id, montant, mode, observation)
    VALUES (?, ?, ?, ?)`,
    [
      data.commande_id,
      data.montant,
      data.mode,
      data.observation || null
    ]
  );
};

// ==============================
// HISTORIQUE PAIEMENTS
// ==============================
export const getPaiementsCommande = async (commande_id: number) => {
  const db = await getDb();

  return db.select<any[]>(
    `SELECT 
        montant,
        mode,
        date_paiement
     FROM paiements_commandes
     WHERE commande_id = ?
     ORDER BY date_paiement ASC`,
    [commande_id]
  );
};

// ==============================
// SUPPRESSION LOGIQUE (PRO)
// ==============================
export const deleteCommande = async (id: number) => {
  const db = await getDb();

  await db.execute(
    `UPDATE commandes 
     SET est_supprime = 1 
     WHERE id = ?`,
    [id]
  );
};