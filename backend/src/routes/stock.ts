import express from "express";
import { pool } from "../db";

const router = express.Router();

/**
 * =========================
 * MOUVEMENTS STOCK
 * =========================
 */

router.get(

    "/mouvements",

    async (_req, res) => {

        try {

            const result =
                await pool.query(
                    `
          SELECT

            id,

            type_mouvement,

            code_mouvement,

            designation,

            quantite,

            cout_unitaire,

            date_mouvement,

            motif,

            observation

          FROM mouvements_stock

          ORDER BY
            date_mouvement DESC
          `
                );

            res.json(
                result.rows
            );

        } catch (error: any) {

            console.error(
                "ERREUR STOCK:",
                error
            );

            res.status(500).json({

                error:
                    error.message,

                detail:
                    error.detail || null
            });
        }
    }
);

export default router;