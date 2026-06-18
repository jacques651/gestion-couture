import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET ALL - Récupérer tous les modèles actifs
 */
router.get("/", async (_, res) => {
  try {
    console.log("📦 Récupération des modèles...");
    
    const result = await pool.query(`
      SELECT *
      FROM modeles_tenues
      WHERE est_actif = 1
      ORDER BY designation
    `);
    
    console.log(`✅ ${result.rows.length} modèles récupérés`);
    res.json(result.rows);
  } catch (error: any) {
    console.error("❌ Erreur récupération modèles:", error.message);
    res.status(500).json({ 
      error: "Erreur récupération modèles",
      details: error.message
    });
  }
});

/**
 * GET BY ID - Récupérer un modèle spécifique
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT *
      FROM modeles_tenues
      WHERE id = $1 AND est_actif = 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Modèle non trouvé" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("❌ Erreur récupération modèle:", error.message);
    res.status(500).json({ error: "Erreur récupération modèle" });
  }
});

/**
 * CREATE - Créer un nouveau modèle
 */
router.post("/", async (req, res) => {
  try {
    const {
      designation,
      description,
      image_url,
      categorie,
      est_actif
    } = req.body;

    // Vérification des champs requis
    if (!designation) {
      return res.status(400).json({ error: "La désignation est requise" });
    }

    // Génération code unique
    const prefix = categorie && categorie !== 'GENERAL' 
      ? categorie.substring(0, 3).toUpperCase() 
      : "MOD";
    const code_type = `${prefix}-${Date.now()}`;
    
    // Valeur par défaut pour la catégorie si non fournie
    const categorieValue = categorie || null;

    console.log("📝 Création modèle:", { designation, code_type, categorieValue });

    const result = await pool.query(
      `
      INSERT INTO modeles_tenues (
        code_type,
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
        code_type,
        designation,
        description || null,
        image_url || null,
        categorieValue,
        est_actif !== undefined ? (est_actif ? 1 : 0) : 1
      ]
    );

    console.log("✅ Modèle créé avec succès");
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("❌ Erreur création modèle:", error.message);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Ce modèle existe déjà"
      });
    }
    res.status(500).json({
      error: "Erreur création modèle",
      details: error.message
    });
  }
});

/**
 * UPDATE - Modifier un modèle existant
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

    // Vérifier si le modèle existe
    const checkExists = await pool.query(
      "SELECT id FROM modeles_tenues WHERE id = $1",
      [id]
    );

    if (checkExists.rows.length === 0) {
      return res.status(404).json({ error: "Modèle non trouvé" });
    }

    const result = await pool.query(
      `
      UPDATE modeles_tenues
      SET
        designation = COALESCE($1, designation),
        description = $2,
        image_url = $3,
        categorie = $4,
        est_actif = COALESCE($5, est_actif),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
      `,
      [
        designation,
        description || null,
        image_url || null,
        categorie || null,
        est_actif !== undefined ? (est_actif ? 1 : 0) : null,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("❌ Erreur modification modèle:", error.message);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Ce modèle existe déjà"
      });
    }
    res.status(500).json({
      error: "Erreur modification modèle"
    });
  }
});

/**
 * DELETE LOGIQUE - Désactiver un modèle
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le modèle existe et est actif
    const checkExists = await pool.query(
      "SELECT id FROM modeles_tenues WHERE id = $1 AND est_actif = 1",
      [id]
    );

    if (checkExists.rows.length === 0) {
      return res.status(404).json({ error: "Modèle non trouvé ou déjà désactivé" });
    }
    
    const result = await pool.query(
      `
      UPDATE modeles_tenues
      SET est_actif = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    res.json({ 
      success: true, 
      message: "Modèle désactivé avec succès",
      id: result.rows[0]?.id 
    });
  } catch (error: any) {
    console.error("❌ Erreur suppression modèle:", error.message);
    res.status(500).json({
      error: "Erreur suppression modèle"
    });
  }
});

export default router;