import express from "express";

import { pool }
from "../db";

const router =
  express.Router();

/**
 * =========================
 * LISTE PRESTATIONS
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

          FROM prestations_realisees

          ORDER BY
            date_prestation DESC
          `
        );

      res.json(

        result.rows.map(r => ({

          ...r,

          valeur:
            Number(
              r.valeur || 0
            ),

          nombre:
            Number(
              r.nombre || 0
            ),

          total:
            Number(
              r.total || 0
            )
        }))
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur récupération prestations"
      });
    }
  }
);

/**
 * =========================
 * CREATE PRESTATION
 * =========================
 */
router.post(

  "/",

  async (req, res) => {

    try {

      const {

        employe_id,
        designation,
        valeur,
        nombre,
        date_prestation

      } = req.body;

      const total =

        Number(valeur)
        *
        Number(nombre);

      const result =
        await pool.query(
          `
          INSERT INTO prestations_realisees (

            employe_id,
            designation,
            valeur,
            nombre,
            total,
            date_prestation

          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )

          RETURNING *
          `,
          [

            employe_id,

            designation,

            valeur,

            nombre,

            total,

            date_prestation
          ]
        );

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur création prestation"
      });
    }
  }
);

/**
 * =========================
 * UPDATE PRESTATION
 * =========================
 */
router.put(

  "/:id",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {

        employe_id,
        designation,
        valeur,
        nombre,
        date_prestation

      } = req.body;

      const total =

        Number(valeur)
        *
        Number(nombre);

      await pool.query(
        `
        UPDATE prestations_realisees

        SET
          employe_id = $1,
          designation = $2,
          valeur = $3,
          nombre = $4,
          total = $5,
          date_prestation = $6

        WHERE id = $7
        `,
        [

          employe_id,

          designation,

          valeur,

          nombre,

          total,

          date_prestation,

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
          "Erreur modification prestation"
      });
    }
  }
);

/**
 * =========================
 * DELETE PRESTATION
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
        DELETE FROM prestations_realisees
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
          "Erreur suppression prestation"
      });
    }
  }
);
router.get(

  "/employe/:id",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const result =
        await pool.query(
          `
          SELECT *

          FROM prestations_realisees

          WHERE employe_id = $1

          ORDER BY
            date_prestation DESC
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
          "Erreur prestations employé"
      });
    }
  }
);

export default router;