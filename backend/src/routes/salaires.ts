import express from "express";

import { pool }
from "../db";

const router =
  express.Router();

/**
 * =========================
 * LISTE SITUATION SALAIRES
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

              e.id as employe_id,

              e.nom_prenom as nom,

              e.type_remuneration as type,

              /**
               * SALAIRE BRUT
               */
              CASE

                WHEN
                  e.type_remuneration = 'fixe'

                THEN
                  COALESCE(
                    e.salaire_base,
                    0
                  )

                ELSE

                  COALESCE(
                    (
                      SELECT SUM(pr.total)

                      FROM prestations_realisees pr

                      WHERE
                        pr.employe_id = e.id
                    ),
                    0
                  )
              END as salaire_brut,

              /**
               * RETENUES = EMPRUNTS
               */
              COALESCE(
                (
                  SELECT SUM(em.montant)

                  FROM emprunts em

                  WHERE
                    em.employe_id = e.id
                    AND COALESCE(em.deduit, 0) = 0
                ),
                0
              ) as retenue,

              /**
               * TOTAL PAYE
               */
              COALESCE(
                (
                  SELECT SUM(s.montant_net)

                  FROM paiements_salaires s

                  WHERE
                    s.employe_id = e.id
                ),
                0
              ) as total_paye

          FROM employes e

          WHERE
            COALESCE(
              e.est_supprime,
              0
            ) = 0

          ORDER BY
            e.nom_prenom
          `
        );

      const rows =
        result.rows.map(r => {

          const brut =
            Number(
              r.salaire_brut || 0
            );

          const retenue =
            Number(
              r.retenue || 0
            );

          const paye =
            Number(
              r.total_paye || 0
            );

          const reste =

            brut
            -
            retenue
            -
            paye;

          return {

            ...r,

            salaire_brut:
              brut,

            retenue,

            total_paye:
              paye,

            reste_a_payer:

              reste > 0

                ? reste

                : 0
          };
        });

      res.json(
        rows
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur récupération salaires"
      });
    }
  }
);
/**
 * =========================
 * PAYER SALAIRE
 * =========================
 */
router.post(

  "/payer",

  async (req, res) => {

    try {

      const {

        employe_id,
        montant_net

      } = req.body;

      const result =
        await pool.query(
          `
          INSERT INTO paiements_salaires (

            employe_id,
            montant_net,
            montant_brut,
            retenue

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

            employe_id,

            montant_net,

            montant_net,

            0
          ]
        );

      res.json(
        result.rows[0]
      );

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
 * HISTORIQUE EMPLOYE
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
          SELECT

            id,
            montant_net,
            created_at
            as date_paiement

          FROM paiements_salaires

          WHERE employe_id = $1

          ORDER BY
            created_at DESC
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
          "Erreur historique salaires"
      });
    }
  }
);

/**
 * =========================
 * ANNULER PAIEMENT
 * =========================
 */
router.put(

  "/:id/annuler",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      await pool.query(
        `
        DELETE FROM paiements_salaires
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
          "Erreur annulation salaire"
      });
    }
  }
);

export default router;