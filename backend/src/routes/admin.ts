import express from 'express';

import {
  pool
} from '../db';

const router =
  express.Router();

/**
 * RESET TOTAL
 */
router.post(

  '/reset',

  async (_, res) => {

    try {

      await pool.query(

        `
        TRUNCATE TABLE

          ventes,
          paiements,
          clients,
          mesures,
          depenses,
          paiements_salaires,
          emprunts,
          prestations_realisees

        RESTART IDENTITY

        CASCADE
        `
      );

      res.json({

        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          'Erreur reset'
      });
    }
  }
);

export default router;