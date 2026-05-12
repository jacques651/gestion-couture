// backend/src/routes/paiements.ts
import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET all paiements
 * Récupère tous les paiements avec les informations des ventes associées
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.vente_id,
        p.montant,
        p.mode_paiement,
        p.created_at,
        v.code_vente,
        v.client_nom,
        v.client_id,
        v.montant_total,
        v.montant_regle,
        CAST(v.montant_total - v.montant_regle AS NUMERIC) as restant,
        v.statut,
        v.observation as vente_observation
      FROM paiements_ventes p
      LEFT JOIN ventes v ON v.id = p.vente_id
      WHERE (v.est_supprime = 0 OR v.est_supprime IS NULL)
      ORDER BY p.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération paiements:", error);
    res.status(500).json({ error: "Erreur récupération historique paiements", details: error.message });
  }
});

/**
 * GET paiements by client
 * Récupère tous les paiements d'un client spécifique
 */
router.get("/client/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const result = await pool.query(`
      SELECT 
        p.id,
        p.vente_id,
        p.montant,
        p.mode_paiement,
        p.created_at,
        v.code_vente,
        v.client_nom,
        v.montant_total,
        v.montant_regle,
        CAST(v.montant_total - v.montant_regle AS NUMERIC) as restant,
        v.statut
      FROM paiements_ventes p
      LEFT JOIN ventes v ON v.id = p.vente_id
      WHERE v.client_id = $1 
        AND (v.est_supprime = 0 OR v.est_supprime IS NULL)
      ORDER BY p.created_at DESC
    `, [clientId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération paiements client:", error);
    res.status(500).json({ error: "Erreur récupération paiements client", details: error.message });
  }
});

/**
 * GET paiements by vente
 * Récupère tous les paiements d'une vente spécifique
 */
router.get("/vente/:venteId", async (req, res) => {
  try {
    const { venteId } = req.params;
    const result = await pool.query(`
      SELECT 
        p.id,
        p.vente_id,
        p.montant,
        p.mode_paiement,
        p.created_at
      FROM paiements_ventes p
      WHERE p.vente_id = $1
      ORDER BY p.created_at ASC
    `, [venteId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération paiements vente:", error);
    res.status(500).json({ error: "Erreur récupération paiements vente", details: error.message });
  }
});

/**
 * POST create paiement
 * Crée un nouveau paiement pour une vente
 */
router.post("/", async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { vente_id, montant, mode_paiement } = req.body;
    
    await client.query("BEGIN");
    
    // Insérer le paiement
    const result = await client.query(
      `INSERT INTO paiements_ventes (vente_id, montant, mode_paiement)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [vente_id, montant, mode_paiement]
    );
    
    // Mettre à jour le montant réglé de la vente
    await client.query(
      `UPDATE ventes 
       SET montant_regle = montant_regle + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [montant, vente_id]
    );
    
    await client.query("COMMIT");
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erreur création paiement:", error);
    res.status(500).json({ error: "Erreur création paiement" });
  } finally {
    client.release();
  }
});

/**
 * DELETE paiement
 * Supprime un paiement (annule la transaction)
 */
router.delete("/:id", async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    await client.query("BEGIN");
    
    // Récupérer le paiement avant suppression
    const paiementResult = await client.query(
      `SELECT vente_id, montant FROM paiements_ventes WHERE id = $1`,
      [id]
    );
    
    if (paiementResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Paiement non trouvé" });
    }
    
    const paiement = paiementResult.rows[0];
    
    // Supprimer le paiement
    await client.query(`DELETE FROM paiements_ventes WHERE id = $1`, [id]);
    
    // Mettre à jour le montant réglé de la vente
    await client.query(
      `UPDATE ventes 
       SET montant_regle = montant_regle - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [paiement.montant, paiement.vente_id]
    );
    
    await client.query("COMMIT");
    
    res.json({ success: true, message: "Paiement supprimé" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erreur suppression paiement:", error);
    res.status(500).json({ error: "Erreur suppression paiement" });
  } finally {
    client.release();
  }
});

export default router;