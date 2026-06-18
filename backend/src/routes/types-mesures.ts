import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET ALL - Version corrigée sans ordre_affichage
 */
router.get("/", async (_, res) => {
  try {
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'types_mesures'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      return res.status(500).json({ 
        error: "La table types_mesures n'existe pas",
        solution: "Exécutez le script SQL d'initialisation"
      });
    }

    // ✅ CORRECTION: Supprimer ordre_affichage et ORDER BY ordre_affichage
    const result = await pool.query(`
      SELECT
        id,
        nom,
        unite,
        est_active
      FROM types_mesures
      WHERE est_active = 1
      ORDER BY id ASC
    `);

    console.log(`✅ ${result.rows.length} types de mesures chargés`);
    res.json(result.rows);
  } catch (error: any) {
    console.error("ERREUR GET /types-mesures:", error);
    res.status(500).json({ 
      error: "Erreur récupération types mesures",
      message: error.message,
      code: error.code
    });
  }
});

/**
 * CREATE - Version corrigée sans ordre_affichage
 */
router.post("/", async (req, res) => {
  try {
    const {
      nom,
      unite,
      est_active
    } = req.body;

    // Validation
    if (!nom) {
      return res.status(400).json({ error: "Le nom est requis" });
    }

    // Vérifier si le nom existe déjà
    const existing = await pool.query(
      `SELECT id FROM types_mesures WHERE nom = $1`,
      [nom]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        error: `Le type de mesure "${nom}" existe déjà` 
      });
    }

    // ✅ CORRECTION: Supprimer ordre_affichage de l'INSERT
    const result = await pool.query(
      `
      INSERT INTO types_mesures (nom, unite, est_active)
      VALUES ($1, $2, $3)
      RETURNING id, nom, unite, est_active, created_at, updated_at
      `,
      [
        nom,
        unite || 'cm',
        est_active !== undefined ? est_active : 1
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("ERREUR POST /types-mesures:", error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: `Le type de mesure "${req.body.nom}" existe déjà`
      });
    }
    res.status(500).json({ error: "Erreur création type mesure" });
  }
});

/**
 * UPDATE - Version corrigée sans ordre_affichage
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, unite, est_active } = req.body;

    // ✅ CORRECTION: Supprimer ordre_affichage de l'UPDATE
    const result = await pool.query(
      `
      UPDATE types_mesures
      SET
        nom = COALESCE($1, nom),
        unite = COALESCE($2, unite),
        est_active = COALESCE($3, est_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, nom, unite, est_active, created_at, updated_at
      `,
      [nom, unite, est_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Type de mesure non trouvé" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("ERREUR PUT /types-mesures:", error);
    res.status(500).json({ error: "Erreur modification type mesure" });
  }
});

/**
 * DELETE LOGIQUE
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE types_mesures
      SET est_active = 0
      WHERE id = $1 AND est_active = 1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Type de mesure non trouvé" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("ERREUR DELETE /types-mesures:", error);
    res.status(500).json({ error: "Erreur suppression type mesure" });
  }
});

export default router;