import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * =========================
 * GET ALL DEPENSES
 * =========================
 */
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        designation,
        categorie,
        montant,
        mode_paiement,
        responsable,
        observation,
        date_depense,
        created_at,
        updated_at
      FROM depenses
      WHERE est_supprime = 0
      ORDER BY date_depense DESC
    `);

    res.json(
      result.rows.map(r => ({
        ...r,
        montant: Number(r.montant || 0)
      }))
    );
  } catch (error) {
    console.error("ERREUR GET /depenses:", error);
    res.status(500).json({ error: "Erreur récupération dépenses" });
  }
});

/**
 * =========================
 * GET ONE DEPENSE
 * =========================
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id,
        designation,
        categorie,
        montant,
        mode_paiement,
        responsable,
        observation,
        date_depense,
        created_at,
        updated_at
      FROM depenses
      WHERE id = $1 AND est_supprime = 0
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Dépense non trouvée" });
    }

    res.json({
      ...result.rows[0],
      montant: Number(result.rows[0].montant || 0)
    });
  } catch (error) {
    console.error("ERREUR GET /depenses/:id:", error);
    res.status(500).json({ error: "Erreur récupération dépense" });
  }
});

/**
 * =========================
 * CREATE DEPENSE
 * =========================
 */
router.post("/", async (req, res) => {
  try {
    const {
      designation,
      categorie,
      montant,
      mode_paiement,
      responsable,
      observation,
      date_depense
    } = req.body;

    // Validation
    if (!designation || !montant || montant <= 0) {
      return res.status(400).json({ 
        error: "La désignation et un montant valide sont requis" 
      });
    }

    if (!responsable || !responsable.trim()) {
      return res.status(400).json({ 
        error: "Le responsable est requis" 
      });
    }

    const result = await pool.query(
      `
      INSERT INTO depenses (
        designation,
        categorie,
        montant,
        mode_paiement,
        responsable,
        observation,
        date_depense,
        est_supprime
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
      RETURNING *
      `,
      [
        designation,
        categorie || 'AUTRE',
        montant,
        mode_paiement || 'ESPECES',
        responsable,
        observation || null,
        date_depense || new Date()
      ]
    );

    console.log(`✅ Dépense créée: ${designation} - ${montant} FCFA (Responsable: ${responsable})`);

    res.status(201).json({
      ...result.rows[0],
      montant: Number(result.rows[0].montant)
    });
  } catch (error: any) {
    console.error("ERREUR POST /depenses:", error);
    res.status(500).json({ error: "Erreur création dépense" });
  }
});

/**
 * =========================
 * UPDATE DEPENSE
 * =========================
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      designation,
      categorie,
      montant,
      mode_paiement,
      responsable,
      observation,
      date_depense
    } = req.body;

    // Vérifier si la dépense existe
    const checkResult = await pool.query(
      `SELECT id FROM depenses WHERE id = $1 AND est_supprime = 0`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Dépense non trouvée" });
    }

    const result = await pool.query(
      `
      UPDATE depenses
      SET
        designation = COALESCE($1, designation),
        categorie = COALESCE($2, categorie),
        montant = COALESCE($3, montant),
        mode_paiement = COALESCE($4, mode_paiement),
        responsable = COALESCE($5, responsable),
        observation = COALESCE($6, observation),
        date_depense = COALESCE($7, date_depense),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND est_supprime = 0
      RETURNING *
      `,
      [
        designation,
        categorie,
        montant,
        mode_paiement,
        responsable,
        observation,
        date_depense,
        id
      ]
    );

    res.json({
      ...result.rows[0],
      montant: Number(result.rows[0].montant)
    });
  } catch (error) {
    console.error("ERREUR PUT /depenses/:id:", error);
    res.status(500).json({ error: "Erreur modification dépense" });
  }
});

/**
 * =========================
 * DELETE DEPENSE (soft delete)
 * =========================
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE depenses
      SET est_supprime = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND est_supprime = 0
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Dépense non trouvée" });
    }

    res.json({ success: true, message: "Dépense supprimée avec succès" });
  } catch (error) {
    console.error("ERREUR DELETE /depenses/:id:", error);
    res.status(500).json({ error: "Erreur suppression dépense" });
  }
});

/**
 * =========================
 * GET STATISTIQUES DEPENSES
 * =========================
 */
router.get("/stats/resume", async (_, res) => {
  try {
    // Total des dépenses
    const totalResult = await pool.query(`
      SELECT COALESCE(SUM(montant), 0) as total
      FROM depenses
      WHERE est_supprime = 0
    `);

    // Dépenses par catégorie
    const categorieResult = await pool.query(`
      SELECT 
        COALESCE(categorie, 'AUTRE') as categorie,
        COALESCE(SUM(montant), 0) as total,
        COUNT(*) as nombre
      FROM depenses
      WHERE est_supprime = 0
      GROUP BY categorie
      ORDER BY total DESC
    `);

    // Dépenses par responsable
    const responsableResult = await pool.query(`
      SELECT 
        responsable,
        COALESCE(SUM(montant), 0) as total,
        COUNT(*) as nombre
      FROM depenses
      WHERE est_supprime = 0 AND responsable IS NOT NULL
      GROUP BY responsable
      ORDER BY total DESC
    `);

    // Dépenses du mois en cours
    const moisResult = await pool.query(`
      SELECT COALESCE(SUM(montant), 0) as total_mois
      FROM depenses
      WHERE est_supprime = 0 
        AND EXTRACT(YEAR FROM date_depense) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM date_depense) = EXTRACT(MONTH FROM CURRENT_DATE)
    `);

    // Dépenses du jour
    const jourResult = await pool.query(`
      SELECT COALESCE(SUM(montant), 0) as total_jour
      FROM depenses
      WHERE est_supprime = 0 
        AND DATE(date_depense) = CURRENT_DATE
    `);

    res.json({
      total: Number(totalResult.rows[0].total),
      total_mois: Number(moisResult.rows[0].total_mois),
      total_jour: Number(jourResult.rows[0].total_jour),
      par_categorie: categorieResult.rows.map(r => ({
        categorie: r.categorie,
        total: Number(r.total),
        nombre: Number(r.nombre)
      })),
      par_responsable: responsableResult.rows.map(r => ({
        responsable: r.responsable,
        total: Number(r.total),
        nombre: Number(r.nombre)
      }))
    });
  } catch (error) {
    console.error("ERREUR GET /depenses/stats/resume:", error);
    res.status(500).json({ error: "Erreur récupération statistiques" });
  }
});

/**
 * =========================
 * GET DEPENSES PAR PERIODE
 * =========================
 */
router.get("/periode/:debut/:fin", async (req, res) => {
  try {
    const { debut, fin } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id,
        designation,
        categorie,
        montant,
        mode_paiement,
        responsable,
        observation,
        date_depense
      FROM depenses
      WHERE est_supprime = 0 
        AND date_depense BETWEEN $1 AND $2
      ORDER BY date_depense DESC
      `,
      [debut, fin]
    );

    res.json(
      result.rows.map(r => ({
        ...r,
        montant: Number(r.montant || 0)
      }))
    );
  } catch (error) {
    console.error("ERREUR GET /depenses/periode/:debut/:fin:", error);
    res.status(500).json({ error: "Erreur récupération dépenses par période" });
  }
});

/**
 * =========================
 * GET DEPENSES PAR RESPONSABLE
 * =========================
 */
router.get("/responsable/:nom", async (req, res) => {
  try {
    const { nom } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id,
        designation,
        categorie,
        montant,
        mode_paiement,
        observation,
        date_depense
      FROM depenses
      WHERE est_supprime = 0 AND responsable ILIKE $1
      ORDER BY date_depense DESC
      `,
      [`%${nom}%`]
    );

    res.json(
      result.rows.map(r => ({
        ...r,
        montant: Number(r.montant || 0)
      }))
    );
  } catch (error) {
    console.error("ERREUR GET /depenses/responsable/:nom:", error);
    res.status(500).json({ error: "Erreur récupération dépenses par responsable" });
  }
});

/**
 * =========================
 * GET CATEGORIES DEPENSES
 * =========================
 */
router.get("/categories/liste", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT categorie
      FROM depenses
      WHERE est_supprime = 0 AND categorie IS NOT NULL
      ORDER BY categorie
    `);

    const categories = result.rows.map(r => r.categorie);
    
    // Ajouter les catégories par défaut si la liste est vide
    if (categories.length === 0) {
      res.json(['FOURNITURES', 'TISSU', 'ENTRETIEN', 'EAU_ELECTRICITE', 'LOYER', 'TRANSPORT', 'SALAIRE', 'AUTRE']);
    } else {
      res.json(categories);
    }
  } catch (error) {
    console.error("ERREUR GET /depenses/categories/liste:", error);
    res.status(500).json({ error: "Erreur récupération catégories" });
  }
});

export default router;