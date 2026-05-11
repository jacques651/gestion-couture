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
        code_hex,
        code_rgb,
        code_cmyk,
        description,
        est_actif
      ]
    );

    res.json(result.rows[0]);

  } catch (error: any) {

    console.error(error);

    // =========================
    // Doublon PostgreSQL
    // =========================
    if (error.code === "23505") {

      return res.status(400).json({
        error:
          "Cette couleur existe déjà"
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
        nom_couleur = $1,
        code_hex = $2,
        code_rgb = $3,
        code_cmyk = $4,
        description = $5,
        est_actif = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
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

    res.json(result.rows[0]);

  } catch (error: any) {

    console.error(error);

    // =========================
    // Doublon PostgreSQL
    // =========================
    if (error.code === "23505") {

      return res.status(400).json({
        error:
          "Cette couleur existe déjà"
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

    await pool.query(
      `
      UPDATE couleurs
      SET est_actif = 0
      WHERE id = $1
      `,
      [id]
    );

    res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur suppression couleur"
    });
  }
});

export default router;