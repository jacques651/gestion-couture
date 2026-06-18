import express from "express";
import { pool } from "../db";

const router = express.Router();

/**
 * =========================
 * MOUVEMENTS STOCK - GET ALL
 * =========================
 */
router.get("/mouvements", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id,
        m.type_mouvement,
        m.code_mouvement,
        m.designation,
        m.quantite,
        m.cout_unitaire,
        m.date_mouvement,
        m.motif,
        m.observation,
        m.reference_id,
        m.reference_type,
        m.created_by,
        m.created_at,
        m.updated_at,
        u.nom as created_by_name
      FROM mouvements_stock m
      LEFT JOIN utilisateurs u ON u.id = m.created_by
      WHERE m.est_supprime = 0
      ORDER BY m.date_mouvement DESC
    `);

    res.json(
      result.rows.map(r => ({
        ...r,
        quantite: Number(r.quantite || 0),
        cout_unitaire: Number(r.cout_unitaire || 0),
        montant_total: Number(r.quantite || 0) * Number(r.cout_unitaire || 0)
      }))
    );
  } catch (error: any) {
    console.error("ERREUR GET /mouvements-stock/mouvements:", error);
    res.status(500).json({
      error: error.message,
      detail: error.detail || null
    });
  }
});

/**
 * =========================
 * MOUVEMENTS STOCK - GET BY ID
 * =========================
 */
router.get("/mouvements/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `
      SELECT
        m.*,
        u.nom as created_by_name
      FROM mouvements_stock m
      LEFT JOIN utilisateurs u ON u.id = m.created_by
      WHERE m.id = $1 AND m.est_supprime = 0
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mouvement non trouvé" });
    }

    res.json({
      ...result.rows[0],
      quantite: Number(result.rows[0].quantite || 0),
      cout_unitaire: Number(result.rows[0].cout_unitaire || 0),
      montant_total: Number(result.rows[0].quantite || 0) * Number(result.rows[0].cout_unitaire || 0)
    });
  } catch (error: any) {
    console.error("ERREUR GET /mouvements-stock/mouvements/:id:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * =========================
 * MOUVEMENTS STOCK - CREATE
 * =========================
 */
router.post("/mouvements", async (req, res) => {
  try {
    const {
      type_mouvement,
      code_mouvement,
      designation,
      quantite,
      cout_unitaire,
      date_mouvement,
      motif,
      observation,
      reference_id,
      reference_type,
      created_by
    } = req.body;

    // Validation
    if (!type_mouvement || !quantite || quantite <= 0) {
      return res.status(400).json({
        error: "Type de mouvement et quantité valide requis"
      });
    }

    // Génération du code mouvement si non fourni
    const finalCodeMouvement = code_mouvement || `MVT-${Date.now()}`;
    const finalDateMouvement = date_mouvement || new Date();

    const result = await pool.query(
      `
      INSERT INTO mouvements_stock (
        type_mouvement,
        code_mouvement,
        designation,
        quantite,
        cout_unitaire,
        date_mouvement,
        motif,
        observation,
        reference_id,
        reference_type,
        created_by,
        est_supprime
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0)
      RETURNING *
      `,
      [
        type_mouvement,
        finalCodeMouvement,
        designation || null,
        quantite,
        cout_unitaire || null,
        finalDateMouvement,
        motif || null,
        observation || null,
        reference_id || null,
        reference_type || null,
        created_by || null
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      quantite: Number(result.rows[0].quantite),
      cout_unitaire: Number(result.rows[0].cout_unitaire || 0)
    });
  } catch (error: any) {
    console.error("ERREUR POST /mouvements-stock/mouvements:", error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Ce code mouvement existe déjà"
      });
    }
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * =========================
 * MOUVEMENTS STOCK - UPDATE
 * =========================
 */
router.put("/mouvements/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type_mouvement,
      designation,
      quantite,
      cout_unitaire,
      date_mouvement,
      motif,
      observation
    } = req.body;

    // Vérifier si le mouvement existe
    const checkResult = await pool.query(
      `SELECT id FROM mouvements_stock WHERE id = $1 AND est_supprime = 0`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Mouvement non trouvé" });
    }

    const result = await pool.query(
      `
      UPDATE mouvements_stock
      SET
        type_mouvement = COALESCE($1, type_mouvement),
        designation = COALESCE($2, designation),
        quantite = COALESCE($3, quantite),
        cout_unitaire = COALESCE($4, cout_unitaire),
        date_mouvement = COALESCE($5, date_mouvement),
        motif = COALESCE($6, motif),
        observation = COALESCE($7, observation),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND est_supprime = 0
      RETURNING *
      `,
      [
        type_mouvement,
        designation,
        quantite,
        cout_unitaire,
        date_mouvement,
        motif,
        observation,
        id
      ]
    );

    res.json({
      ...result.rows[0],
      quantite: Number(result.rows[0].quantite),
      cout_unitaire: Number(result.rows[0].cout_unitaire || 0)
    });
  } catch (error: any) {
    console.error("ERREUR PUT /mouvements-stock/mouvements/:id:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * =========================
 * MOUVEMENTS STOCK - DELETE LOGIQUE
 * =========================
 */
router.delete("/mouvements/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `
      UPDATE mouvements_stock
      SET est_supprime = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND est_supprime = 0
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mouvement non trouvé" });
    }

    res.json({ success: true, message: "Mouvement supprimé avec succès" });
  } catch (error: any) {
    console.error("ERREUR DELETE /mouvements-stock/mouvements/:id:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * =========================
 * MOUVEMENTS STOCK - FILTRES
 * =========================
 */
router.get("/mouvements/filtre/type/:type", async (req, res) => {
  try {
    const { type } = req.params;
    
    const result = await pool.query(
      `
      SELECT *
      FROM mouvements_stock
      WHERE type_mouvement = $1 AND est_supprime = 0
      ORDER BY date_mouvement DESC
      `,
      [type]
    );

    res.json(
      result.rows.map(r => ({
        ...r,
        quantite: Number(r.quantite),
        cout_unitaire: Number(r.cout_unitaire || 0)
      }))
    );
  } catch (error: any) {
    console.error("ERREUR GET /mouvements-stock/mouvements/filtre/type/:type:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * =========================
 * MOUVEMENTS STOCK - FILTRE PAR DATE
 * =========================
 */
router.get("/mouvements/filtre/date", async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;
    
    let query = `
      SELECT *
      FROM mouvements_stock
      WHERE est_supprime = 0
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (date_debut) {
      query += ` AND date_mouvement >= $${paramIndex++}`;
      params.push(date_debut);
    }
    
    if (date_fin) {
      query += ` AND date_mouvement <= $${paramIndex++}`;
      params.push(date_fin);
    }
    
    query += ` ORDER BY date_mouvement DESC`;

    const result = await pool.query(query, params);

    res.json(
      result.rows.map(r => ({
        ...r,
        quantite: Number(r.quantite),
        cout_unitaire: Number(r.cout_unitaire || 0)
      }))
    );
  } catch (error: any) {
    console.error("ERREUR GET /mouvements-stock/mouvements/filtre/date:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * =========================
 * MOUVEMENTS STOCK - STATS
 * =========================
 */
router.get("/mouvements/stats/resume", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_mouvements,
        SUM(CASE WHEN type_mouvement = 'entree' THEN quantite ELSE 0 END) as total_entrees,
        SUM(CASE WHEN type_mouvement = 'sortie' THEN quantite ELSE 0 END) as total_sorties,
        SUM(CASE WHEN type_mouvement = 'entree' THEN quantite * cout_unitaire ELSE 0 END) as valeur_entrees,
        SUM(CASE WHEN type_mouvement = 'sortie' THEN quantite * cout_unitaire ELSE 0 END) as valeur_sorties,
        COUNT(DISTINCT DATE(date_mouvement)) as jours_activite
      FROM mouvements_stock
      WHERE est_supprime = 0
    `);

    res.json({
      total_mouvements: Number(result.rows[0].total_mouvements),
      total_entrees: Number(result.rows[0].total_entrees),
      total_sorties: Number(result.rows[0].total_sorties),
      valeur_entrees: Number(result.rows[0].valeur_entrees || 0),
      valeur_sorties: Number(result.rows[0].valeur_sorties || 0),
      jours_activite: Number(result.rows[0].jours_activite)
    });
  } catch (error: any) {
    console.error("ERREUR GET /mouvements-stock/mouvements/stats/resume:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * =========================
 * MOUVEMENTS STOCK - STATS PAR MOIS
 * =========================
 */
router.get("/mouvements/stats/par-mois", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM date_mouvement) as annee,
        EXTRACT(MONTH FROM date_mouvement) as mois,
        COUNT(*) as total_mouvements,
        SUM(CASE WHEN type_mouvement = 'entree' THEN quantite ELSE 0 END) as total_entrees,
        SUM(CASE WHEN type_mouvement = 'sortie' THEN quantite ELSE 0 END) as total_sorties,
        SUM(quantite * cout_unitaire) as valeur_totale
      FROM mouvements_stock
      WHERE est_supprime = 0
      GROUP BY EXTRACT(YEAR FROM date_mouvement), EXTRACT(MONTH FROM date_mouvement)
      ORDER BY annee DESC, mois DESC
    `);

    res.json(
      result.rows.map(r => ({
        annee: Number(r.annee),
        mois: Number(r.mois),
        total_mouvements: Number(r.total_mouvements),
        total_entrees: Number(r.total_entrees),
        total_sorties: Number(r.total_sorties),
        valeur_totale: Number(r.valeur_totale || 0)
      }))
    );
  } catch (error: any) {
    console.error("ERREUR GET /mouvements-stock/mouvements/stats/par-mois:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

export default router;