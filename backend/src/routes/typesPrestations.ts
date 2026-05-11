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
        prix_par_defaut,
        est_active
      FROM types_prestations
      WHERE est_active = 1
      ORDER BY nom
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Erreur récupération types prestations"
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
      prix_par_defaut,
      est_active
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO types_prestations (
        nom,
        prix_par_defaut,
        est_active
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [
        nom,
        prix_par_defaut,
        est_active ?? 1
      ]
    );

    res.json(result.rows[0]);

  } catch (error: any) {

    console.error(error);

    if (error.code === "23505") {

      return res.status(400).json({
        error:
          "Ce type existe déjà"
      });
    }

    res.status(500).json({
      error:
        "Erreur création type prestation"
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
      prix_par_defaut,
      est_active
    } = req.body;

    const result = await pool.query(
      `
      UPDATE types_prestations
      SET
        nom = $1,
        prix_par_defaut = $2,
        est_active = $3
      WHERE id = $4
      RETURNING *
      `,
      [
        nom,
        prix_par_defaut,
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
          "Ce type existe déjà"
      });
    }

    res.status(500).json({
      error:
        "Erreur modification type prestation"
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
      UPDATE types_prestations
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
        "Erreur suppression type prestation"
    });
  }
});

export default router;