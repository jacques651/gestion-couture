import { Router } from "express";
import { pool } from "../db";

const router = Router();

// ============================================
// GET ALL
// ============================================
router.get("/", async (_, res) => {
  try {
    // CORRECTION : Utiliser 'nom' directement
    const result = await pool.query(`
      SELECT id, nom, description, code_type, 
             image_url, categorie, est_actif, created_at, updated_at
      FROM types_tenues
      WHERE est_actif = 1
      ORDER BY nom
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur GET:", error);
    res.status(500).json({ error: "Erreur récupération types" });
  }
});

// ============================================
// GET BY ID
// ============================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM types_tenues WHERE id = $1 AND est_actif = 1`, [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Type de tenue non trouvé" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Erreur GET/:id:", error);
    res.status(500).json({ error: "Erreur récupération" });
  }
});

// ============================================
// CREATE
// ============================================
router.post("/", async (req, res) => {
  try {
    console.log("📝 POST /types-tenues - body:", JSON.stringify(req.body));

    const { nom, designation, description, image_url, categorie, est_actif } = req.body;
    
    // Accepter 'nom' ou 'designation' pour la compatibilité
    const name = (nom || designation || '').trim();

    if (!name) {
      return res.status(400).json({ error: "Le nom est requis" });
    }

    // Générer T-01, T-02...
    const lastResult = await pool.query(
      `SELECT code_type FROM types_tenues WHERE code_type LIKE 'T-%' ORDER BY id DESC LIMIT 1`
    );

    let code_type = 'T-01';
    if (lastResult.rows.length > 0) {
      const lastNum = parseInt(lastResult.rows[0].code_type.replace('T-', ''), 10);
      if (!isNaN(lastNum)) {
        code_type = `T-${String(lastNum + 1).padStart(2, '0')}`;
      }
    }

    console.log("📝 Code généré:", code_type);

    const result = await pool.query(
      `INSERT INTO types_tenues (nom, description, code_type, image_url, categorie, est_actif)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description || '', code_type, image_url || '', categorie || 'femme', est_actif !== undefined ? est_actif : 1]
    );

    console.log("✅ Créé:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("❌ Erreur POST:", error.message, error.detail);
    if (error.code === "23505") {
      return res.status(400).json({ error: `Le type "${req.body.nom || req.body.designation}" existe déjà` });
    }
    res.status(500).json({ error: "Erreur création", details: error.message });
  }
});

// ============================================
// UPDATE
// ============================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, designation, description, code_type, image_url, categorie, est_actif } = req.body;
    
    const name = (nom || designation || null);

    const result = await pool.query(
      `UPDATE types_tenues SET
        nom = COALESCE($1, nom),
        description = COALESCE($2, description),
        code_type = COALESCE($3, code_type),
        image_url = COALESCE($4, image_url),
        categorie = COALESCE($5, categorie),
        est_actif = COALESCE($6, est_actif),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND est_actif = 1 RETURNING *`,
      [name, description, code_type, image_url, categorie, est_actif, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Type non trouvé" });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("❌ Erreur PUT:", error.message);
    if (error.code === "23505") {
      return res.status(400).json({ error: "Ce code existe déjà" });
    }
    res.status(500).json({ error: "Erreur modification" });
  }
});

// ============================================
// DELETE (soft delete)
// ============================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE types_tenues SET est_actif = 0 WHERE id = $1 AND est_actif = 1 RETURNING id`, [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Type non trouvé" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur DELETE:", error);
    res.status(500).json({ error: "Erreur suppression" });
  }
});

export default router;