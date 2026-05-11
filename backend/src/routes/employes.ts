import express from "express";

import { pool }
from "../db";

const router =
  express.Router();

/**
 * =========================
 * LISTE EMPLOYES
 * =========================
 */
router.get(

  "/",

  async (_, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT *

          FROM employes

          WHERE
            COALESCE(
              est_supprime,
              0
            ) = 0

          ORDER BY
            nom_prenom
          `
        );

      res.json(

        result.rows.map(r => ({

          ...r,

          salaire_base:
            Number(
              r.salaire_base || 0
            )
        }))
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur récupération employés"
      });
    }
  }
);

/**
 * =========================
 * DELETE EMPLOYE
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
        UPDATE employes

        SET
          est_supprime = 1

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
          "Erreur suppression employé"
      });
    }
  }
);

/**
 * =========================
 * PAYER SALAIRE
 * =========================
 */
router.put(

  "/:id/payer",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      /**
       * EMPLOYE
       */
      const employeResult =
        await pool.query(
          `
          SELECT *

          FROM employes

          WHERE id = $1
          `,
          [id]
        );

      if (
        employeResult.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            "Employé introuvable"
        });
      }

      const employe =
        employeResult.rows[0];

      const montant_brut =
        Number(
          employe.salaire_base || 0
        );

      const retenue = 0;

      const montant_net =
        montant_brut - retenue;

      /**
       * HISTORIQUE
       */
      await pool.query(
        `
        INSERT INTO paiements_salaires (

          employe_id,
          montant_brut,
          retenue,
          montant_net

        )

        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        `,
        [

          id,

          montant_brut,

          retenue,

          montant_net
        ]
      );

      res.json({

        montant_brut,

        retenue,

        montant_net
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur paiement salaire"
      });
    }
  }
);
/**
 * =========================
 * CREATE EMPLOYE
 * =========================
 */
router.post(

  "/",

  async (req, res) => {

    try {

      const {

        nom_prenom,
        telephone,
        type_remuneration,
        salaire_base

      } = req.body;

      const result =
        await pool.query(
          `
          INSERT INTO employes (

            nom_prenom,
            telephone,
            type_remuneration,
            salaire_base

          )

          VALUES (
            $1,
            $2,
            $3,
            $4
          )

          RETURNING *
          `,
          [

            nom_prenom,

            telephone,

            type_remuneration,

            salaire_base || 0
          ]
        );

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur création employé"
      });
    }
  }
);

/**
 * =========================
 * UPDATE EMPLOYE
 * =========================
 */
router.put(

  "/:id",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {

        nom_prenom,
        telephone,
        type_remuneration,
        salaire_base

      } = req.body;

      await pool.query(
        `
        UPDATE employes

        SET
          nom_prenom = $1,
          telephone = $2,
          type_remuneration = $3,
          salaire_base = $4

        WHERE id = $5
        `,
        [

          nom_prenom,

          telephone,

          type_remuneration,

          salaire_base || 0,

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
          "Erreur modification employé"
      });
    }
  }
);
router.get(

  "/:id",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const result =
        await pool.query(
          `
          SELECT *

          FROM employes

          WHERE id = $1
          `,
          [id]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            "Employé introuvable"
        });
      }

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur employé"
      });
    }
  }
);

export default router;