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
      FROM modeles_tenues
      WHERE est_actif = 1
      ORDER BY designation
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur récupération modèles"
    });
  }
});

/**
 * CREATE
 */
router.post("/", async (req, res) => {
  try {

    const {
      code_modele,
      designation,
      description,
      image_url,
      categorie,
      est_actif
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO modeles_tenues (
        code_modele,
        designation,
        description,
        image_url,
        categorie,
        est_actif
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        code_modele,
        designation,
        description,
        image_url,
        categorie,
        est_actif
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur création modèle"
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
      designation,
      description,
      image_url,
      categorie,
      est_actif
    } = req.body;

    const result = await pool.query(
      `
      UPDATE modeles_tenues
      SET
        designation = $1,
        description = $2,
        image_url = $3,
        categorie = $4,
        est_actif = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
      `,
      [
        designation,
        description,
        image_url,
        categorie,
        est_actif,
        id
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur modification modèle"
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
      UPDATE modeles_tenues
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
      error: "Erreur suppression modèle"
    });
  }
});

export default router;