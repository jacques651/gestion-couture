import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET ALL - Uniquement les tailles actives
 */
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM tailles
      WHERE est_actif = 1
      ORDER BY ordre, libelle
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération tailles"
    });
  }
});

/**
 * CREATE - Avec réactivation si le code existe déjà mais est désactivé
 */
router.post("/", async (req, res) => {
  try {
    const {
      code_taille,
      libelle,
      ordre,
      categorie,
      description,
      est_actif
    } = req.body;

    // Vérifier si le code existe déjà (actif ou inactif)
    const existing = await pool.query(
      `SELECT id, est_actif FROM tailles WHERE code_taille = $1`,
      [code_taille]
    );

    // Si la taille existe déjà
    if (existing.rows.length > 0) {
      const existingTaille = existing.rows[0];
      
      // Si elle est désactivée (est_actif = 0), on la réactive
      if (existingTaille.est_actif === 0) {
        const result = await pool.query(
          `
          UPDATE tailles
          SET
            libelle = $1,
            ordre = $2,
            categorie = $3,
            description = $4,
            est_actif = 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING *
          `,
          [
            libelle,
            ordre || 0,
            categorie || null,
            description || null,
            existingTaille.id
          ]
        );
        return res.json(result.rows[0]);
      }
      
      // Si elle est active, c'est un vrai doublon
      return res.status(400).json({
        error: `Le code taille "${code_taille}" existe déjà et est actif.`
      });
    }

    // Création normale (code inexistant)
    const result = await pool.query(
      `
      INSERT INTO tailles (
        code_taille,
        libelle,
        ordre,
        categorie,
        description,
        est_actif
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        code_taille,
        libelle,
        ordre || 0,
        categorie || null,
        description || null,
        est_actif !== undefined ? est_actif : 1
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: `Ce code taille "${req.body.code_taille}" existe déjà`
      });
    }
    res.status(500).json({
      error: "Erreur création taille"
    });
  }
});

/**
 * UPDATE
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code_taille,
      libelle,
      ordre,
      categorie,
      description,
      est_actif
    } = req.body;

    const result = await pool.query(
      `
      UPDATE tailles
      SET
        code_taille = $1,
        libelle = $2,
        ordre = $3,
        categorie = $4,
        description = $5,
        est_actif = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
      `,
      [
        code_taille,
        libelle,
        ordre,
        categorie,
        description,
        est_actif,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Taille non trouvée" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Ce code taille existe déjà"
      });
    }
    res.status(500).json({
      error: "Erreur modification taille"
    });
  }
});

/**
 * DELETE LOGIQUE - Désactive la taille
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE tailles
      SET est_actif = 0
      WHERE id = $1 AND est_actif = 1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Taille non trouvée" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur suppression taille"
    });
  }
});

export default router;