import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET ALL
 */
router.get("/", async (_, res) => {

  try {

    const result = await pool.query(`
      SELECT
        id,
        nom,
        unite,
        ordre_affichage,
        est_active
      FROM types_mesures
      WHERE est_active = 1
      ORDER BY ordre_affichage ASC
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Erreur récupération types mesures"
    });
  }
});

/**
 * CREATE
 */
router.post("/", async (req, res) => {

  try {

    const {
      nom,
      unite,
      ordre_affichage,
      est_active
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO types_mesures (
        nom,
        unite,
        ordre_affichage,
        est_active
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        nom,
        unite,
        ordre_affichage,
        est_active ?? 1
      ]
    );

    res.json(result.rows[0]);

  } catch (error: any) {

    console.error(error);

    if (error.code === "23505") {

      return res.status(400).json({
        error:
          "Ce type de mesure existe déjà"
      });
    }

    res.status(500).json({
      error:
        "Erreur création type mesure"
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
      nom,
      unite,
      ordre_affichage,
      est_active
    } = req.body;

    const result = await pool.query(
      `
      UPDATE types_mesures
      SET
        nom = $1,
        unite = $2,
        ordre_affichage = $3,
        est_active = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
      `,
      [
        nom,
        unite,
        ordre_affichage,
        est_active,
        id
      ]
    );

    res.json(result.rows[0]);

  } catch (error: any) {

    console.error(error);

    if (error.code === "23505") {

      return res.status(400).json({
        error:
          "Ce type de mesure existe déjà"
      });
    }

    res.status(500).json({
      error:
        "Erreur modification type mesure"
    });
  }
});

/**
 * UPDATE ORDRE
 */
router.put("/:id/ordre", async (req, res) => {

  try {

    const { id } = req.params;

    const {
      ordre_affichage,
      ancien_ordre
    } = req.body;

    // =========================
    // Échanger les ordres
    // =========================
    await pool.query(
      `
      UPDATE types_mesures
      SET ordre_affichage = $1
      WHERE ordre_affichage = $2
      `,
      [
        ancien_ordre,
        ordre_affichage
      ]
    );

    const result = await pool.query(
      `
      UPDATE types_mesures
      SET
        ordre_affichage = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [
        ordre_affichage,
        id
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Erreur modification ordre"
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
      UPDATE types_mesures
      SET est_active = 0
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
      error:
        "Erreur suppression type mesure"
    });
  }
});

export default router;