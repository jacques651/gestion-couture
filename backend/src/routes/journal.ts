import express from "express";

import { pool }
from "../db";

const router =
  express.Router();

/**
 * =========================
 * LISTE JOURNAL
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

          FROM journal_modifications

          ORDER BY
            date_modification DESC

          LIMIT 500
          `
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur récupération journal"
      });
    }
  }
);

/**
 * =========================
 * VIDER JOURNAL
 * =========================
 */
router.delete(

  "/",

  async (_, res) => {

    try {

      await pool.query(
        `
        DELETE FROM journal_modifications
        `
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur suppression journal"
      });
    }
  }
);

export default router;