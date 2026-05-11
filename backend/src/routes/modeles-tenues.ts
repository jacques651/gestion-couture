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

export default router;