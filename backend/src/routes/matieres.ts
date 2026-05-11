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
      FROM matieres
      WHERE est_supprime = 0
      ORDER BY designation
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Erreur récupération matières"
    });
  }
});

/**
 * CREATE
 */
router.post("/", async (req, res) => {

  try {

    const {
      designation,
      categorie_id,
      unite,
      prix_achat,
      stock_actuel,
      seuil_alerte,
      reference_fournisseur,
      emplacement
    } = req.body;

    const code_matiere =
      `MAT-${Date.now()}`;

    const result = await pool.query(
      `
      INSERT INTO matieres (
        code_matiere,
        designation,
        categorie_id,
        unite,
        prix_achat,
        stock_actuel,
        seuil_alerte,
        reference_fournisseur,
        emplacement
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9
      )
      RETURNING *
      `,
      [
        code_matiere,
        designation,
        categorie_id,
        unite,
        prix_achat,
        stock_actuel,
        seuil_alerte,
        reference_fournisseur,
        emplacement
      ]
    );

    res.json(result.rows[0]);

  } catch (error: any) {

    console.error(error);

    if (error.code === "23505") {

      return res.status(400).json({
        error:
          "Cette matière existe déjà"
      });
    }

    res.status(500).json({
      error:
        "Erreur création matière"
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
      categorie_id,
      unite,
      prix_achat,
      stock_actuel,
      seuil_alerte,
      reference_fournisseur,
      emplacement
    } = req.body;

    const result = await pool.query(
      `
      UPDATE matieres
      SET
        designation = $1,
        categorie_id = $2,
        unite = $3,
        prix_achat = $4,
        stock_actuel = $5,
        seuil_alerte = $6,
        reference_fournisseur = $7,
        emplacement = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
      `,
      [
        designation,
        categorie_id,
        unite,
        prix_achat,
        stock_actuel,
        seuil_alerte,
        reference_fournisseur,
        emplacement,
        id
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Erreur modification matière"
    });
  }
});

/**
 * UPDATE STOCK
 */
router.put("/:id/stock", async (req, res) => {

  try {

    const { id } = req.params;

    const {
      quantite,
      action
    } = req.body;

    const operator =
      action === "add"
        ? "+"
        : "-";

    const result = await pool.query(
      `
      UPDATE matieres
      SET
        stock_actuel =
          stock_actuel ${operator} $1,

        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [
        quantite,
        id
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Erreur mise à jour stock"
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
      UPDATE matieres
      SET est_supprime = 1
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
        "Erreur suppression matière"
    });
  }
});

export default router;