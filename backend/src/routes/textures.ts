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
      FROM textures
      WHERE est_actif = 1
      ORDER BY nom_texture
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération textures"
    });
  }
});

/**
 * CREATE
 */
router.post("/", async (req, res) => {
  try {
    const {
      nom_texture,
      description,
      densite,
      composition,
      est_actif
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO textures (
        nom_texture,
        description,
        densite,
        composition,
        est_actif
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        nom_texture,
        description || null,
        densite || null,
        composition || null,
        est_actif !== undefined ? est_actif : 1
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Cette texture existe déjà"
      });
    }
    res.status(500).json({
      error: "Erreur création texture"
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
      nom_texture,
      description,
      densite,
      composition,
      est_actif
    } = req.body;

    const result = await pool.query(
      `
      UPDATE textures
      SET
        nom_texture = $1,
        description = $2,
        densite = $3,
        composition = $4,
        est_actif = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
      `,
      [
        nom_texture,
        description,
        densite,
        composition,
        est_actif,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Texture non trouvée" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Cette texture existe déjà"
      });
    }
    res.status(500).json({
      error: "Erreur modification texture"
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
      UPDATE textures
      SET est_actif = 0
      WHERE id = $1 AND est_actif = 1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Texture non trouvée" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur suppression texture"
    });
  }
});

export default router;