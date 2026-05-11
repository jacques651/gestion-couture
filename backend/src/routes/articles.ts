import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET ARTICLES
 */
router.get("/", async (_, res) => {

  try {

    const result = await pool.query(`
      SELECT
        a.*,

        m.designation AS modele,
        m.categorie,

        t.libelle AS taille,

        c.nom_couleur AS couleur,
        c.code_hex,

        tx.nom_texture AS texture

      FROM articles a

      LEFT JOIN modeles_tenues m
        ON a.modele_id = m.id

      LEFT JOIN tailles t
        ON a.taille_id = t.id

      LEFT JOIN couleurs c
        ON a.couleur_id = c.id

      LEFT JOIN textures tx
        ON a.texture_id = tx.id

      WHERE a.est_actif = 1

      ORDER BY a.id DESC
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur récupération articles"
    });
  }
});

/**
 * CREATE
 */
router.post("/", async (req, res) => {

  try {

    const {
      modele_id,
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
      est_disponible,
      est_actif
    } = req.body;

    const code_article =
      `ART-${Date.now()}`;

    const result = await pool.query(
      `
      INSERT INTO articles (
        code_article,
        modele_id,
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
        est_disponible,
        est_actif
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14
      )
      RETURNING *
      `,
      [
        code_article,
        modele_id,
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
        est_disponible,
        est_actif
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur création article"
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
      modele_id,
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
      est_disponible,
      est_actif
    } = req.body;

    const result = await pool.query(
      `
      UPDATE articles
      SET
        modele_id = $1,
        taille_id = $2,
        couleur_id = $3,
        texture_id = $4,
        prix_achat = $5,
        prix_vente = $6,
        quantite_stock = $7,
        seuil_alerte = $8,
        emplacement = $9,
        code_barre = $10,
        notes = $11,
        est_disponible = $12,
        est_actif = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
      `,
      [
        modele_id,
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
        est_disponible,
        est_actif,
        id
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur modification article"
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
      UPDATE articles
      SET est_actif = 0
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
      error: "Erreur suppression article"
    });
  }
});

export default router;