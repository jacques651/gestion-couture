import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET ALL CLIENTS
 */
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM clients
      WHERE est_supprime = 0
      ORDER BY nom_prenom
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erreur récupération clients",
    });
  }
});

/**
 * CREATE CLIENT
 */
router.post("/", async (req, res) => {
  try {
    const {
      telephone_id,
      nom_prenom,
      adresse,
      email,
      observations,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO clients (
        telephone_id,
        nom_prenom,
        adresse,
        email,
        observations
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        telephone_id,
        nom_prenom,
        adresse,
        email,
        observations,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erreur création client",
    });
  }
});

/**
 * DELETE CLIENT
 */
router.delete("/:telephone_id", async (req, res) => {
  try {

    const { telephone_id } = req.params;

    await pool.query(
      `
      UPDATE clients
      SET est_supprime = 1
      WHERE telephone_id = $1
      `,
      [telephone_id]
    );

    res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur suppression client",
    });
  }
});

export default router;