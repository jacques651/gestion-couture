import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET ALL
 */
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM couleurs
      WHERE est_actif = 1
      ORDER BY nom_couleur
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération couleurs"
    });
  }
});

/**
 * CREATE
 */
router.post("/", async (req, res) => {
  try {
    const {
      nom_couleur,
      code_hex,
      code_rgb,
      code_cmyk,
      description,
      est_actif
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO couleurs (
        nom_couleur,
        code_hex,
        code_rgb,
        code_cmyk,
        description,
        est_actif
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        nom_couleur,
        code_hex || null,
        code_rgb || null,
        code_cmyk || null,
        description || null,
        est_actif !== undefined ? est_actif : 1
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Cette couleur existe déjà"
      });
    }
    res.status(500).json({
      error: "Erreur création couleur"
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
      nom_couleur,
      code_hex,
      code_rgb,
      code_cmyk,
      description,
      est_actif
    } = req.body;

    const result = await pool.query(
      `
      UPDATE couleurs
      SET
        nom_couleur = COALESCE($1, nom_couleur),
        code_hex = COALESCE($2, code_hex),
        code_rgb = COALESCE($3, code_rgb),
        code_cmyk = COALESCE($4, code_cmyk),
        description = COALESCE($5, description),
        est_actif = COALESCE($6, est_actif),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND est_actif = 1
      RETURNING *
      `,
      [
        nom_couleur,
        code_hex,
        code_rgb,
        code_cmyk,
        description,
        est_actif,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Couleur non trouvée" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Cette couleur existe déjà"
      });
    }
    res.status(500).json({
      error: "Erreur modification couleur"
    });
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
      UPDATE couleurs
      SET est_actif = 0
      WHERE id = $1 AND est_actif = 1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Couleur non trouvée" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur suppression couleur"
    });
  }
});

export default router;