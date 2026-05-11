import express from "express";

import { pool }
from "../db";

const router =
  express.Router();

/**
 * =========================
 * HISTORIQUE SALAIRES
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

            s.id,

            e.id
            as employe_id,

            s.created_at
            as date,

            e.nom_prenom
            as nom,

            s.montant_net
            as montant

          FROM paiements_salaires s

          LEFT JOIN employes e

            ON e.id =
              s.employe_id

          ORDER BY
            s.created_at DESC
          `
        );

      res.json(

        result.rows.map(r => ({

          ...r,

          montant:
            Number(
              r.montant || 0
            )
        }))
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

export default router;