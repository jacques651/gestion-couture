import express from "express";

import { pool }
from "../db";

const router =
  express.Router();

/**
 * =========================
 * LISTE EMPRUNTS
 * =========================
 */
router.get(

  "/",

  async (_, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT

            e.id,

            e.employe_id,

            e.montant,

            e.date_emprunt,

            e.deduit,

            e.salaire_id,

            e.date_deduction,

            emp.nom_prenom
            as employe_nom

          FROM emprunts e

          LEFT JOIN employes emp

            ON emp.id =
              e.employe_id

          ORDER BY
            e.date_emprunt DESC
          `
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur emprunts"
      });
    }
  }
);

/**
 * =========================
 * CREATE
 * =========================
 */
router.post(

  "/",

  async (req, res) => {

    try {

      const {

        employe_id,
        montant

      } = req.body;

      const result =
        await pool.query(
          `
          INSERT INTO emprunts (

            employe_id,
            montant,
            date_emprunt

          )

          VALUES (
            $1,
            $2,
            CURRENT_DATE
          )

          RETURNING *
          `,
          [

            employe_id,

            montant
          ]
        );

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur création emprunt"
      });
    }
  }
);

/**
 * =========================
 * UPDATE
 * =========================
 */
router.put(

  "/:id",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {

        employe_id,
        montant

      } = req.body;

      await pool.query(
        `
        UPDATE emprunts

        SET
          employe_id = $1,
          montant = $2

        WHERE
          id = $3
          AND deduit = 0
        `,
        [

          employe_id,

          montant,

          id
        ]
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur modification emprunt"
      });
    }
  }
);

/**
 * =========================
 * DELETE
 * =========================
 */
router.delete(

  "/:id",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      await pool.query(
        `
        DELETE FROM emprunts

        WHERE
          id = $1
          AND deduit = 0
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
          "Erreur suppression emprunt"
      });
    }
  }
);

/**
 * =========================
 * RESET
 * =========================
 */
router.put(

  "/reset",

  async (_, res) => {

    try {

      await pool.query(
        `
        UPDATE emprunts

        SET
          deduit = 0,
          salaire_id = NULL,
          date_deduction = NULL

        WHERE deduit = 1
        `
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur reset emprunts"
      });
    }
  }
);

/**
 * =========================
 * EMPRUNTS EMPLOYE
 * =========================
 */
router.get(

  "/employe/:id",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const result =
        await pool.query(
          `
          SELECT *

          FROM emprunts

          WHERE employe_id = $1

          ORDER BY
            date_emprunt DESC
          `,
          [id]
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur emprunts employé"
      });
    }
  }
);

export default router;