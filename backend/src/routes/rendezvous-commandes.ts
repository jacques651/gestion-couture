import { Router } from "express";

import { pool } from "../db";

const router = Router();

/**
 * GET ALL
 */
router.get(
  "/",
  async (_, res) => {

    try {

      const result =
        await pool.query(`
          SELECT *
          FROM rendezvous_commandes
          ORDER BY date_rendezvous ASC
        `);

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Erreur récupération rendez-vous"
      });
    }
  }
);

/**
 * TERMINER
 */
router.put(
  "/:id/terminer",
  async (req, res) => {

    try {

      const { id } =
        req.params;

      await pool.query(
        `
        UPDATE rendezvous_commandes
        SET statut = 'termine'
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
          "Erreur mise à jour rendez-vous"
      });
    }
  }
);

/**
 * ANNULER
 */
router.put(
  "/:id/annuler",
  async (req, res) => {

    try {

      const { id } =
        req.params;

      await pool.query(
        `
        UPDATE rendezvous_commandes
        SET statut = 'annule'
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
          "Erreur annulation rendez-vous"
      });
    }
  }
);

export default router;