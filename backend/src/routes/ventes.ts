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

      console.error(
        "ERREUR UPDATE VENTE:",
        error
      );

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

        result.rows.map(r => ({

          ...r,

          quantite:
            Number(r.quantite),

          prix_unitaire:
            Number(r.prix_unitaire),

          total:
            Number(r.total)
        }))
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

/**
 * =========================
 * GET ONE VENTE
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
            v.*,

            c.nom_prenom
            AS client_nom,

            c.telephone_id
            AS client_telephone

          FROM ventes v

          LEFT JOIN clients c
            ON c.id = v.client_id

          WHERE v.id = $1
          `,
          [id]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            "Vente introuvable"
        });
      }

      const vente =
        result.rows[0];

      res.json({

        ...vente,

        montant_total:
          Number(
            vente.montant_total
          ),

        montant_regle:
          Number(
            vente.montant_regle
          )
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erreur récupération vente"
      });
    }
  }
);

/**
 * =========================
 * UPDATE VENTE
 * =========================
 */
router.put(

  "/:id",

  async (req, res) => {

    const client =
      await pool.connect();

    try {

      await client.query(
        "BEGIN"
      );

      const { id } =
        req.params;

      const {

        date_vente,
        type_vente,
        client_id,
        observation,
        montant_regle,

        lignes = []

      } = req.body;

      /**
       * TOTAL
       */
      const montant_total =

        (lignes || []).reduce(

          (
            sum: number,
            l: any
          ) =>

            sum +
            (
              Number(l.quantite)
              *
              Number(l.prix_unitaire)
            ),

          0
        );

      /**
       * Statut
       */
      let statut =
        "EN_ATTENTE";

      if (
        Number(montant_regle) >=
        montant_total
      ) {

        statut =
          "PAYEE";

      } else if (
        Number(montant_regle) > 0
      ) {

        statut =
          "PARTIEL";
      }

      /**
       * UPDATE VENTE
       */
      await client.query(
        `
        UPDATE ventes

        SET
          date_vente = $1,
          type_vente = $2,
          client_id = $3,
          observation = $4,
          montant_total = $5,
          montant_regle = $6,
          statut = $7,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $8
        `,
        [
          date_vente,
          type_vente,
          client_id,
          observation,
          montant_total,
          montant_regle,
          statut,
          id
        ]
      );

      /**
       * SUPPRIMER DETAILS
       */
      await client.query(
        `
        DELETE FROM vente_details
        WHERE vente_id = $1
        `,
        [id]
      );

      /**
       * RECREER DETAILS
       */
      for (
        const ligne
        of lignes
      ) {

        await client.query(
          `
          INSERT INTO vente_details (

            vente_id,

            designation,

            quantite,

            prix_unitaire,

            total,

            article_id,

            matiere_id,

            taille_libelle

          )

          VALUES (

            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )
          `,
          [

            id,

            ligne.designation,

            ligne.quantite,

            ligne.prix_unitaire,

            Number(ligne.quantite)
            *
            Number(ligne.prix_unitaire),

            ligne.article_id || null,

            ligne.matiere_id || null,

            ligne.taille_libelle || null
          ]
        );
      }

      await client.query(
        "COMMIT"
      );

      res.json({

        success: true,

        montant_total,

        montant_regle,

        statut
      });

    } catch (error: any) {

      await client.query(
        "ROLLBACK"
      );

      console.error(
        "ERREUR UPDATE VENTE:",
        error
      );

      res.status(500).json({

        error:
          error.message
      });

    } finally {

      client.release();
    }
  }
);
export default router;