import express from "express";
import { pool } from "../db";

const router =
  express.Router();

/**
 * =========================
 * GET USERS
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

            id,
            nom,
            login,
            role,
            est_actif,
            created_at,
            updated_at

          FROM utilisateurs

          ORDER BY nom
          `
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur récupération utilisateurs"
      });
    }
  }
);

/**
 * =========================
 * GET ONE USER
 * =========================
 */
router.get(

  "/:id",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const result =
        await pool.query(
          `
          SELECT

            id,
            nom,
            login,
            role,
            est_actif,
            created_at,
            updated_at

          FROM utilisateurs

          WHERE id = $1
          `,
          [id]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            "Utilisateur introuvable"
        });
      }

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur récupération utilisateur"
      });
    }
  }
);

/**
 * =========================
 * CREATE USER
 * =========================
 */
router.post(

  "/",

  async (req, res) => {

    try {

      const {

        nom,
        login,
        mot_de_passe,
        role

      } = req.body;

      /**
       * Validation
       */
      if (
        !nom ||
        !login ||
        !mot_de_passe
      ) {

        return res.status(400).json({

          error:
            "Champs obligatoires manquants"
        });
      }

      /**
       * Login déjà utilisé
       */
      const exists =
        await pool.query(
          `
          SELECT id
          FROM utilisateurs
          WHERE login = $1
          `,
          [login]
        );

      if (
        exists.rows.length > 0
      ) {

        return res.status(400).json({

          error:
            "Login déjà utilisé"
        });
      }

      /**
       * INSERT
       */
      const result =
        await pool.query(
          `
          INSERT INTO utilisateurs (

            nom,
            login,
            mot_de_passe,
            role

          )

          VALUES (
            $1,
            $2,
            $3,
            $4
          )

          RETURNING
            id,
            nom,
            login,
            role,
            est_actif
          `,
          [
            nom,
            login,
            mot_de_passe,
            role || "couturier"
          ]
        );

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur création utilisateur"
      });
    }
  }
);

/**
 * =========================
 * UPDATE USER
 * =========================
 */
router.put(

  "/:id",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {

        nom,
        login,
        role

      } = req.body;

      await pool.query(
        `
        UPDATE utilisateurs

        SET
          nom = $1,
          login = $2,
          role = $3,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $4
        `,
        [
          nom,
          login,
          role,
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
          "Erreur modification utilisateur"
      });
    }
  }
);

/**
 * =========================
 * UPDATE STATUS
 * =========================
 */
router.put(

  "/:id/statut",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {
        est_actif
      } = req.body;

      await pool.query(
        `
        UPDATE utilisateurs

        SET
          est_actif = $1,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $2
        `,
        [
          est_actif,
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
          "Erreur modification statut"
      });
    }
  }
);

/**
 * =========================
 * RESET PASSWORD
 * =========================
 */
router.put(

  "/:id/password",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {
        mot_de_passe
      } = req.body;

      if (
        !mot_de_passe
      ) {

        return res.status(400).json({

          error:
            "Mot de passe requis"
        });
      }

      await pool.query(
        `
        UPDATE utilisateurs

        SET
          mot_de_passe = $1,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $2
        `,
        [
          mot_de_passe,
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
          "Erreur modification mot de passe"
      });
    }
  }
);

/**
 * =========================
 * LOGIN
 * =========================
 */
router.post(

  "/login",

  async (req, res) => {

    try {

      const {

        login,
        mot_de_passe

      } = req.body;

      const result =
        await pool.query(
          `
          SELECT

            id,
            nom,
            login,
            role,
            est_actif

          FROM utilisateurs

          WHERE
            login = $1
            AND mot_de_passe = $2
            AND est_actif = 1
          `,
          [
            login,
            mot_de_passe
          ]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(401).json({

          error:
            "Login ou mot de passe incorrect"
        });
      }

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur connexion"
      });
    }
  }
);

/**
 * =========================
 * DELETE USER
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
        DELETE FROM utilisateurs
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
          "Erreur suppression utilisateur"
      });
    }
  }
);

export default router;