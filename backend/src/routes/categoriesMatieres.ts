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
      FROM categories_matieres
      WHERE est_active = 1
      ORDER BY nom_categorie
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération catégories matières"
    });
  }
});

/**
 * CREATE
 */
router.post("/", async (req, res) => {
  try {
    const {
      nom_categorie,
      description,
      couleur_affichage,
      est_active
    } = req.body;

    // Validation
    if (!nom_categorie) {
      return res.status(400).json({
        error: "Le nom de la catégorie est requis"
      });
    }

    // Génération code auto
    const code_categorie = `CAT-${Date.now()}`;

    const result = await pool.query(
      `
      INSERT INTO categories_matieres (
        code_categorie,
        nom_categorie,
        description,
        couleur_affichage,
        est_active
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        code_categorie,
        nom_categorie,
        description || null,
        couleur_affichage || null,
        est_active !== undefined ? est_active : 1
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Cette catégorie existe déjà"
      });
    }
    res.status(500).json({
      error: "Erreur création catégorie matière"
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
      code_categorie,
      nom_categorie,
      description,
      couleur_affichage,
      est_active
    } = req.body;

    // Vérifier si la catégorie existe
    const checkResult = await pool.query(
      `SELECT id FROM categories_matieres WHERE id = $1 AND est_active = 1`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    const result = await pool.query(
      `
      UPDATE categories_matieres
      SET
        code_categorie = COALESCE($1, code_categorie),
        nom_categorie = COALESCE($2, nom_categorie),
        description = COALESCE($3, description),
        couleur_affichage = COALESCE($4, couleur_affichage),
        est_active = COALESCE($5, est_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
      `,
      [
        code_categorie,
        nom_categorie,
        description,
        couleur_affichage,
        est_active,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Cette catégorie existe déjà (code_categorie dupliqué)"
      });
    }
    res.status(500).json({
      error: "Erreur modification catégorie matière"
    });
  }
});

/**
 * DELETE LOGIQUE
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si la catégorie est utilisée par des matières
    const matieresResult = await pool.query(
      `SELECT COUNT(*) FROM matieres WHERE categorie_id = $1 AND est_supprime = 0`,
      [id]
    );
    
    const matieresCount = parseInt(matieresResult.rows[0].count);
    
    if (matieresCount > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer cette catégorie car elle est utilisée par ${matieresCount} matière(s)`,
        matieres_count: matieresCount
      });
    }
    
    const result = await pool.query(
      `
      UPDATE categories_matieres
      SET est_active = 0
      WHERE id = $1 AND est_active = 1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur suppression catégorie matière"
    });
  }
});

/**
 * GET CATEGORIE BY ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `
      SELECT *
      FROM categories_matieres
      WHERE id = $1 AND est_active = 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération catégorie"
    });
  }
});

/**
 * GET CATEGORIES AVEC NOMBRE DE MATIERES
 */
router.get("/stats/matieres", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.*,
        COUNT(m.id) as nombre_matieres
      FROM categories_matieres c
      LEFT JOIN matieres m ON m.categorie_id = c.id AND m.est_supprime = 0
      WHERE c.est_active = 1
      GROUP BY c.id
      ORDER BY c.nom_categorie
    `);

    res.json(
      result.rows.map(r => ({
        ...r,
        nombre_matieres: Number(r.nombre_matieres || 0)
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération statistiques"
    });
  }
});

/**
 * GET ACTIVE CATEGORIES ONLY
 */
router.get("/active", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM categories_matieres
      WHERE est_active = 1
      ORDER BY nom_categorie
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération catégories actives"
    });
  }
});

/**
 * BULK UPDATE ACTIVE STATUS
 */
router.put("/bulk/status", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { ids, est_active } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Liste d'IDs requise" });
    }
    
    const result = await client.query(
      `
      UPDATE categories_matieres
      SET est_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($2::int[])
      RETURNING id
      `,
      [est_active !== undefined ? est_active : 1, ids]
    );
    
    await client.query("COMMIT");
    
    res.json({
      success: true,
      updated_count: result.rows.length,
      ids: result.rows.map(r => r.id)
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({
      error: "Erreur mise à jour en masse"
    });
  } finally {
    client.release();
  }
});

export default router;