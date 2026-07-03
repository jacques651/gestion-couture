import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.*,
        tt.nom AS type_tenue,  -- 🔥 Correction: nom au lieu de designation
        tt.categorie,
        t.libelle AS taille,
        c.nom_couleur AS couleur,
        c.code_hex,
        tx.nom_texture AS texture
      FROM articles a
      LEFT JOIN types_tenues tt ON a.type_tenue_id = tt.id
      LEFT JOIN tailles t ON a.taille_id = t.id
      LEFT JOIN couleurs c ON a.couleur_id = c.id
      LEFT JOIN textures tx ON a.texture_id = tx.id
      WHERE a.est_actif = 1
      ORDER BY a.id DESC
    `);

    res.json(result.rows.map(r => ({
      ...r,
      prix_achat: Number(r.prix_achat || 0),
      prix_vente: Number(r.prix_vente || 0),
      quantite_stock: Number(r.quantite_stock || 0),
      seuil_alerte: Number(r.seuil_alerte || 0)
    })));
  } catch (error) {
    console.error("❌ Erreur GET /articles:", error);
    res.status(500).json({ error: "Erreur récupération articles" });
  }
});

/**
 * GET ARTICLE BY ID - CORRIGÉ
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📊 Récupération de l'article ID: ${id}`);
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const result = await pool.query(`
      SELECT
        a.*,
        tt.nom AS type_tenue,  -- 🔥 Correction: nom au lieu de designation
        tt.categorie,
        t.libelle AS taille,
        c.nom_couleur AS couleur,
        c.code_hex,
        tx.nom_texture AS texture
      FROM articles a
      LEFT JOIN types_tenues tt ON a.type_tenue_id = tt.id
      LEFT JOIN tailles t ON a.taille_id = t.id
      LEFT JOIN couleurs c ON a.couleur_id = c.id
      LEFT JOIN textures tx ON a.texture_id = tx.id
      WHERE a.id = $1 AND a.est_actif = 1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    console.log(`✅ Article ${id} récupéré`);

    res.json({
      ...result.rows[0],
      prix_achat: Number(result.rows[0].prix_achat || 0),
      prix_vente: Number(result.rows[0].prix_vente || 0),
      quantite_stock: Number(result.rows[0].quantite_stock || 0),
      seuil_alerte: Number(result.rows[0].seuil_alerte || 0)
    });
  } catch (error) {
    console.error("❌ Erreur récupération article:", error);
    res.status(500).json({ 
      error: "Erreur récupération article",
      details: error.message 
    });
  }
});

/**
 * CREATE
 */
router.post("/", async (req, res) => {
  try {
    const {
      type_tenue_id,
      taille_id,
      couleur_id,
      texture_id,
      prix_achat,
      prix_vente,
      quantite_stock,
      seuil_alerte,
      emplacement,
      code_barre,
      notes,
      image_url,
      est_disponible,
      est_actif
    } = req.body;

    const code_article = `ART-${Date.now()}`;

    const result = await pool.query(
      `
      INSERT INTO articles (
        code_article,
        type_tenue_id,
        taille_id,
        couleur_id,
        texture_id,
        prix_achat,
        prix_vente,
        quantite_stock,
        seuil_alerte,
        emplacement,
        code_barre,
        notes,
        image_url,
        est_disponible,
        est_actif
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
      `,
      [
        code_article,
        type_tenue_id || null,
        taille_id || null,
        couleur_id || null,
        texture_id || null,
        prix_achat || 0,
        prix_vente || 0,
        quantite_stock || 0,
        seuil_alerte || 0,
        emplacement || null,
        code_barre || null,
        notes || null,
        image_url || null,
        est_disponible !== undefined ? est_disponible : 1,
        est_actif !== undefined ? est_actif : 1
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      prix_achat: Number(result.rows[0].prix_achat || 0),
      prix_vente: Number(result.rows[0].prix_vente || 0),
      quantite_stock: Number(result.rows[0].quantite_stock || 0),
      seuil_alerte: Number(result.rows[0].seuil_alerte || 0)
    });
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Cet article existe déjà (code_barre dupliqué)"
      });
    }
    res.status(500).json({
      error: "Erreur création article"
    });
  }
});

/**
 * UPDATE - CORRIGÉ
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type_tenue_id,
      taille_id,
      couleur_id,
      texture_id,
      prix_achat,
      prix_vente,
      quantite_stock,
      seuil_alerte,
      emplacement,
      code_barre,
      notes,
      image_url,
      est_disponible,
      est_actif
    } = req.body;

    console.log(`📊 Mise à jour article ID: ${id}, stock: ${quantite_stock}`);

    // Vérifier si l'article existe
    const checkResult = await pool.query(
      `SELECT id FROM articles WHERE id = $1 AND est_actif = 1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    const result = await pool.query(
      `
      UPDATE articles
      SET
        type_tenue_id = COALESCE($1, type_tenue_id),
        taille_id = COALESCE($2, taille_id),
        couleur_id = COALESCE($3, couleur_id),
        texture_id = COALESCE($4, texture_id),
        prix_achat = COALESCE($5, prix_achat),
        prix_vente = COALESCE($6, prix_vente),
        quantite_stock = COALESCE($7, quantite_stock),
        seuil_alerte = COALESCE($8, seuil_alerte),
        emplacement = COALESCE($9, emplacement),
        code_barre = COALESCE($10, code_barre),
        notes = COALESCE($11, notes),
        image_url = COALESCE($12, image_url),
        est_disponible = COALESCE($13, est_disponible),
        est_actif = COALESCE($14, est_actif),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15 AND est_actif = 1
      RETURNING *
      `,
      [
        type_tenue_id,
        taille_id,
        couleur_id,
        texture_id,
        prix_achat,
        prix_vente,
        quantite_stock,
        seuil_alerte,
        emplacement,
        code_barre,
        notes,
        image_url,
        est_disponible,
        est_actif,
        id
      ]
    );

    console.log(`✅ Article ${id} mis à jour, nouveau stock: ${quantite_stock}`);

    res.json({
      ...result.rows[0],
      prix_achat: Number(result.rows[0].prix_achat || 0),
      prix_vente: Number(result.rows[0].prix_vente || 0),
      quantite_stock: Number(result.rows[0].quantite_stock || 0),
      seuil_alerte: Number(result.rows[0].seuil_alerte || 0)
    });
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Cet article existe déjà (code_barre dupliqué)"
      });
    }
    res.status(500).json({
      error: "Erreur modification article"
    });
  }
});

/**
 * UPDATE STOCK - CORRIGÉ
 */
router.put("/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantite, action } = req.body;

    console.log(`📊 Mise à jour stock article ID: ${id}, quantite: ${quantite}, action: ${action}`);

    const checkResult = await pool.query(
      `SELECT id, quantite_stock FROM articles WHERE id = $1 AND est_actif = 1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    const operator = action === "add" ? "+" : "-";
    const result = await pool.query(
      `
      UPDATE articles
      SET
        quantite_stock = quantite_stock ${operator} $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND est_actif = 1
      RETURNING *
      `,
      [quantite, id]
    );

    console.log(`✅ Stock article ${id} mis à jour: ${result.rows[0].quantite_stock}`);

    res.json({
      ...result.rows[0],
      quantite_stock: Number(result.rows[0].quantite_stock),
      prix_achat: Number(result.rows[0].prix_achat || 0),
      prix_vente: Number(result.rows[0].prix_vente || 0),
      seuil_alerte: Number(result.rows[0].seuil_alerte || 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur mise à jour du stock"
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
      UPDATE articles
      SET est_actif = 0
      WHERE id = $1 AND est_actif = 1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur suppression article"
    });
  }
});

/**
 * GET ARTICLE BY CODE BARRE
 */
router.get("/code-barre/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      `
      SELECT
        a.*,
        tt.nom AS type_tenue,  -- 🔥 Correction: nom au lieu de designation
        t.libelle AS taille,
        c.nom_couleur AS couleur,
        tx.nom_texture AS texture
      FROM articles a
      LEFT JOIN types_tenues tt ON a.type_tenue_id = tt.id
      LEFT JOIN tailles t ON a.taille_id = t.id
      LEFT JOIN couleurs c ON a.couleur_id = c.id
      LEFT JOIN textures tx ON a.texture_id = tx.id
      WHERE a.code_barre = $1 AND a.est_actif = 1
      `,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    res.json({
      ...result.rows[0],
      prix_achat: Number(result.rows[0].prix_achat || 0),
      prix_vente: Number(result.rows[0].prix_vente || 0),
      quantite_stock: Number(result.rows[0].quantite_stock || 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur recherche article"
    });
  }
});

/**
 * GET ARTICLES EN RUPTURE DE STOCK
 */
router.get("/rupture-stock", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.*,
        tt.nom AS type_tenue,  -- 🔥 Correction: nom au lieu de designation
        t.libelle AS taille
      FROM articles a
      LEFT JOIN types_tenues tt ON a.type_tenue_id = tt.id
      LEFT JOIN tailles t ON a.taille_id = t.id
      WHERE a.est_actif = 1 
        AND a.quantite_stock <= a.seuil_alerte
      ORDER BY a.quantite_stock ASC
    `);

    res.json(
      result.rows.map(r => ({
        ...r,
        quantite_stock: Number(r.quantite_stock || 0),
        seuil_alerte: Number(r.seuil_alerte || 0)
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération articles en rupture"
    });
  }
});

export default router;