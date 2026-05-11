import { Router } from "express";

import { pool } from "../db";

const router = Router();


/**
 * =========================
 * CREATE VENTE
 * =========================
 */
router.post(
  "/",
  async (req, res) => {

    const client =
      await pool.connect();

    try {

      await client.query(
        "BEGIN"
      );

      const {

        code_vente,
        type_vente,
        date_vente,

        client_id,
        client_nom,

        mode_paiement,

        montant_total,
        montant_regle,

        statut,
        observation,

        details

      } = req.body;

      /**
       * Création vente
       */
      const venteResult =
        await client.query(
          `
          INSERT INTO ventes (

            code_vente,
            type_vente,
            date_vente,

            client_id,
            client_nom,

            mode_paiement,

            montant_total,
            montant_regle,

            statut,
            observation,

            est_supprime

          )

          VALUES (

            $1, $2, $3,
            $4, $5, $6,
            $7, $8, $9,
            $10,
            0

          )

          RETURNING *
          `,
          [

            code_vente,
            type_vente,
            date_vente,

            client_id,
            client_nom,

            mode_paiement,

            montant_total,
            montant_regle,

            statut,
            observation
          ]
        );

      const vente =
        venteResult.rows[0];

      /**
       * Détails vente
       */
      if (
        Array.isArray(details)
      ) {

        for (const item of details) {

          await client.query(
            `
            INSERT INTO vente_details (

              vente_id,

              article_id,
              matiere_id,

              designation,

              quantite,

              prix_unitaire,

              total,

              taille_libelle

            )

            VALUES (

              $1, $2, $3,
              $4, $5, $6,
              $7, $8

            )
            `,
            [

              vente.id,

              item.article_id || null,
              item.matiere_id || null,

              item.designation,

              item.quantite,

              item.prix_unitaire,

              item.total,

              item.taille_libelle || null
            ]
          );
        }
      }

      await client.query(
        "COMMIT"
      );

      res.json(
        vente
      );

    } catch (error: any) {

      await client.query(
        "ROLLBACK"
      );

      console.error(error);

      res.status(500).json({
        error:
          error.message
      });

    } finally {

      client.release();
    }
  }
);

/**
 * =========================
 * GET ALL VENTES
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
          FROM ventes
          WHERE COALESCE(est_supprime, 0) = 0
          ORDER BY date_vente DESC
          `
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Erreur récupération ventes"
      });
    }
  }
);

/**
 * =========================
 * DELETE VENTE
 * =========================
 */
router.delete(
  "/:id",
  async (req, res) => {

    try {

      const { id } =
        req.params;

      /**
       * Suppression logique
       */
      await pool.query(
        `
        UPDATE ventes
        SET est_supprime = 1
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
          "Erreur suppression vente"
      });
    }
  }
);

/**
 * =========================
 * PAIEMENT VENTE
 * =========================
 */
router.put(
  "/:id/paiement",
  async (req, res) => {

    const client =
      await pool.connect();

    try {

      const { id } =
        req.params;

      const {
        montant,
        mode_paiement
      } = req.body;

      await client.query(
        "BEGIN"
      );

      /**
       * Vente actuelle
       */
      const venteResult =
        await client.query(
          `
          SELECT
            montant_total,
            montant_regle
          FROM ventes
          WHERE id = $1
          `,
          [id]
        );

      if (
        venteResult.rows.length === 0
      ) {

        throw new Error(
          "Vente introuvable"
        );
      }

      const vente =
        venteResult.rows[0];

      const nouveauMontant =
        Number(
          vente.montant_regle || 0
        )
        +
        Number(montant);

      /**
       * Déterminer statut
       */
      let statut =
        "IMPAYEE";

      if (
        nouveauMontant >=
        Number(
          vente.montant_total
        )
      ) {

        statut =
          "PAYEE";

      } else if (
        nouveauMontant > 0
      ) {

        statut =
          "PARTIELLE";
      }

      /**
       * Mise à jour vente
       */
      await client.query(
        `
        UPDATE ventes
        SET
          montant_regle = $1,
          statut = $2,
          mode_paiement = $3
        WHERE id = $4
        `,
        [
          nouveauMontant,
          statut,
          mode_paiement,
          id
        ]
      );

      /**
       * Historique paiements
       */
      await client.query(
        `
        INSERT INTO paiements_ventes (
          vente_id,
          montant,
          mode_paiement
        )
        VALUES ($1, $2, $3)
        `,
        [
          id,
          montant,
          mode_paiement
        ]
      );

      await client.query(
        "COMMIT"
      );

      res.json({
        success: true
      });

    } catch (error: any) {

      await client.query(
        "ROLLBACK"
      );

      console.error(error);

      res.status(500).json({
        error:
          error.message
      });

    } finally {

      client.release();
    }
  }
);

/**
 * =========================
 * DETAILS VENTE
 * =========================
 */
router.get(
  "/:id/details",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const result =
        await pool.query(
          `
          SELECT

            vd.*,

            CASE

              WHEN vd.article_id
                IS NOT NULL
              THEN 'article'

              WHEN vd.matiere_id
                IS NOT NULL
              THEN 'matiere'

              ELSE 'prestation'

            END as type_ligne

          FROM vente_details vd

          WHERE vd.vente_id = $1
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
          "Erreur détails vente"
      });
    }
  }
);
export default router;