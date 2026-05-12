import { Router } from "express";

import { pool } from "../db";

const router = Router();

router.get(
  "/",
  async (_, res) => {

    try {

      const result =
        await pool.query(`
          SELECT *
          FROM modeles_tenues
          WHERE est_actif = 1
          ORDER BY designation
        `);

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Erreur récupération modèles"
      });
    }
  }
);
router.post(

  "/",

  async (req, res) => {

    try {

      const {

        designation,
        description,
        image_url,
        categorie,
        est_actif

      } = req.body;

      const code_modele =
        `MOD-${
          Date.now()
        }`;

      const result =
        await pool.query(
          `
          INSERT INTO modeles_tenues (

            designation,
            description,
            code_modele,
            image_url,
            categorie,
            est_actif

          )

          VALUES (

            $1, $2, $3,
            $4, $5, $6

          )

          RETURNING *
          `,
          [

            designation,
            description,
            code_modele,
            image_url,
            categorie,
            est_actif
          ]
        );

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur création modèle"
      });
    }
  }
);
export default router;