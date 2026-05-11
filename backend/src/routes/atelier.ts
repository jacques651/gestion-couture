import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET CONFIGURATION ATELIER
 */
router.get("/", async (_, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM atelier
      ORDER BY id ASC
      LIMIT 1
    `);

    // =========================
    // Si aucune configuration
    // =========================
    if (result.rows.length === 0) {

      return res.json(null);
    }

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Erreur récupération paramètres atelier"
    });
  }
});

/**
 * SAVE / UPDATE CONFIGURATION
 */
router.put("/", async (req, res) => {

  try {

    const {
      nom_atelier,
      telephone,
      email,
      adresse,
      ville,
      pays,
      ifu,
      rccm,
      message_facture_defaut,
      logo_base64,
      devise
    } = req.body;

    // =========================
    // Vérifier existence
    // =========================
    const existing =
      await pool.query(`
        SELECT id
        FROM atelier
        LIMIT 1
      `);

    let result;

    // =========================
    // UPDATE
    // =========================
    if (existing.rows.length > 0) {

      const id =
        existing.rows[0].id;

      result = await pool.query(
        `
        UPDATE atelier
        SET
          nom_atelier = $1,
          telephone = $2,
          email = $3,
          adresse = $4,
          ville = $5,
          pays = $6,
          ifu = $7,
          rccm = $8,
          message_facture_defaut = $9,
          logo_base64 = $10,
          devise = $11,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
        `,
        [
          nom_atelier,
          telephone,
          email,
          adresse,
          ville,
          pays,
          ifu,
          rccm,
          message_facture_defaut,
          logo_base64,
          devise,
          id
        ]
      );

    } else {

      // =========================
      // INSERT
      // =========================
      result = await pool.query(
        `
        INSERT INTO atelier (
          nom_atelier,
          telephone,
          email,
          adresse,
          ville,
          pays,
          ifu,
          rccm,
          message_facture_defaut,
          logo_base64,
          devise
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,$10,$11
        )
        RETURNING *
        `,
        [
          nom_atelier,
          telephone,
          email,
          adresse,
          ville,
          pays,
          ifu,
          rccm,
          message_facture_defaut,
          logo_base64,
          devise
        ]
      );
    }

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Erreur sauvegarde paramètres atelier"
    });
  }
});

export default router;