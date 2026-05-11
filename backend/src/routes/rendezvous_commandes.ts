import express from 'express';
import { pool } from '../db';

const router = express.Router();

/**
 * =========================
 * GET ALL RENDEZVOUS
 * =========================
 */
router.get(

  '/',

  async (_req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            r.id,

            DATE(r.date_rendezvous)
            AS date_rendezvous,

            r.heure_rendezvous,

            r.type_rendezvous,

            r.statut,

            c.nom_prenom,

            v.code_vente,

            r.client_id,

            r.vente_id

          FROM rendezvous_commandes r

          LEFT JOIN clients c
            ON c.id = r.client_id

          LEFT JOIN ventes v
            ON v.id = r.vente_id

          WHERE
            r.statut != 'archive'
            OR r.statut IS NULL

          ORDER BY
            r.date_rendezvous ASC,
            r.heure_rendezvous ASC
          `
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          'Erreur récupération rendez-vous'
      });
    }
  }
);

/**
 * =========================
 * UPDATE STATUT
 * =========================
 */
router.put(

  '/:id/statut',

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const { statut } =
        req.body;

      await pool.query(
        `
        UPDATE rendezvous_commandes

        SET statut = $1

        WHERE id = $2
        `,
        [statut, id]
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          'Erreur mise à jour statut'
      });
    }
  }
);

export default router;