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
            error:
                "Erreur récupération catégories matières"
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

        // =========================
        // Génération code auto
        // =========================
        const code_categorie =
            `CAT-${Date.now()}`;

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
                description,
                couleur_affichage,
                est_active
            ]
        );

        res.json(result.rows[0]);

    } catch (error: any) {

        console.error(error);

        if (error.code === "23505") {

            return res.status(400).json({
                error:
                    "Cette catégorie existe déjà"
            });
        }

        res.status(500).json({
            error:
                "Erreur création catégorie matière"
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

        const result = await pool.query(
            `
      UPDATE categories_matieres
      SET
        code_categorie = $1,
        nom_categorie = $2,
        description = $3,
        couleur_affichage = $4,
        est_active = $5,
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

        res.json(result.rows[0]);

    } catch (error: any) {

        console.error(error);

        if (error.code === "23505") {

            return res.status(400).json({
                error:
                    "Cette catégorie existe déjà"
            });
        }

        res.status(500).json({
            error:
                "Erreur modification catégorie matière"
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
      UPDATE categories_matieres
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
                "Erreur suppression catégorie matière"
        });
    }
});

export default router;