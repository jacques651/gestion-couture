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
 * CREATE
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
        ordre,
        categorie,
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
          "Ce code taille existe déjà"
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

    res.json(result.rows[0]);

  } catch (error: any) {

    console.error(error);

    // =========================
    // Doublon PostgreSQL
    // =========================
    if (error.code === "23505") {

      return res.status(400).json({
        error:
          "Ce code taille existe déjà"
      });
    }

    res.status(500).json({
      error: "Erreur modification taille"
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
      UPDATE tailles
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
      error: "Erreur suppression taille"
    });
  }
});

export default router;