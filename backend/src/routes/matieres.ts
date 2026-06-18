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
      error: "Erreur récupération matières"
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

    const code_matiere = `MAT-${Date.now()}`;

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
        emplacement,
        est_supprime
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
      RETURNING *
      `,
      [
        code_matiere,
        designation,
        categorie_id || null,
        unite || null,
        prix_achat || 0,
        stock_actuel || 0,
        seuil_alerte || 0,
        reference_fournisseur || null,
        emplacement || null
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Cette matière existe déjà"
      });
    }
    res.status(500).json({
      error: "Erreur création matière"
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
        designation = COALESCE($1, designation),
        categorie_id = COALESCE($2, categorie_id),
        unite = COALESCE($3, unite),
        prix_achat = COALESCE($4, prix_achat),
        stock_actuel = COALESCE($5, stock_actuel),
        seuil_alerte = COALESCE($6, seuil_alerte),
        reference_fournisseur = COALESCE($7, reference_fournisseur),
        emplacement = COALESCE($8, emplacement),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND est_supprime = 0
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Matière non trouvée" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur modification matière"
    });
  }
});

/**
 * UPDATE STOCK
 */
router.put("/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantite, action } = req.body;

    // Vérifier que la matière existe
    const checkResult = await pool.query(
      `SELECT id FROM matieres WHERE id = $1 AND est_supprime = 0`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Matière non trouvée" });
    }

    const operator = action === "add" ? "+" : "-";
    const result = await pool.query(
      `
      UPDATE matieres
      SET
        stock_actuel = stock_actuel ${operator} $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND est_supprime = 0
      RETURNING *
      `,
      [quantite, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur mise à jour stock"
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
      UPDATE matieres
      SET est_supprime = 1
      WHERE id = $1 AND est_supprime = 0
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Matière non trouvée" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur suppression matière"
    });
  }
});

export default router;