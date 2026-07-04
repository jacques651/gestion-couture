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

/**
 * BACKUP / EXPORT COMPLET (JSON)
 */
router.get(
  '/backup',
  async (_, res) => {
    try {
      const tablesRes = await pool.query(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_type = 'BASE TABLE'
         ORDER BY table_name`
      );
      const data: Record<string, any[]> = {};
      for (const row of tablesRes.rows) {
        const table = row.table_name as string;
        const content = await pool.query(`SELECT * FROM "${table}"`);
        data[table] = content.rows;
      }
      res.json({
        exported_at: new Date().toISOString(),
        tables: Object.keys(data).length,
        data
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
  }
);

export default router;