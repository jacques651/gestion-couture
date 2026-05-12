import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * STATS
 */
router.get(
  "/stats",
  async (_, res) => {

    try {

      const ventes =
        await pool.query(
          `
          SELECT
            COALESCE(
              SUM(montant_total),
              0
            ) AS total
          FROM ventes
          `
        );

      const paiements =
        await pool.query(
          `
          SELECT
            COALESCE(
              SUM(montant_regle),
              0
            ) AS total
          FROM ventes
          `
        );

      const depenses =
        await pool.query(
          `
          SELECT
            COALESCE(
              SUM(montant),
              0
            ) AS total
          FROM depenses
          `
        );

      const ca =
        Number(
          ventes.rows[0].total
        );

      const dep =
        Number(
          depenses.rows[0].total
        );

      res.json({

        chiffreAffaires:
          ca,

        paiements:
          Number(
            paiements.rows[0].total
          ),

        depenses:
          dep,

        benefice:
          ca - dep
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error:
          "Erreur finances"
      });
    }
  }
);

/**
 * JOURNAL
 */
router.get(
  "/journal",
  async (_, res) => {

    try {

      const ventes =
        await pool.query(
          `
          SELECT
            date_vente AS date,
            montant_total AS montant,
            client_nom AS description
          FROM ventes
          `
        );

      const depenses =
        await pool.query(
          `
          SELECT
            date_depense AS date,
            montant,
            designation AS description
          FROM depenses
          `
        );

      let transactions: any[] = [];

      ventes.rows.forEach(v => {

        transactions.push({

          date:
            v.date,

          montant:
            Number(v.montant),

          type:
            'entree',

          description:
            v.description
            || 'Vente'
        });
      });

      depenses.rows.forEach(d => {

        transactions.push({

          date:
            d.date,

          montant:
            Number(d.montant),

          type:
            'sortie',

          description:
            d.description
        });
      });

      transactions.sort(
        (a, b) =>

          new Date(a.date)
            .getTime()

          -

          new Date(b.date)
            .getTime()
      );

      let solde = 0;

      const journal =

        transactions.map(t => {

          const entree =

            t.type === 'entree'
              ? t.montant
              : 0;

          const sortie =

            t.type === 'sortie'
              ? t.montant
              : 0;

          solde +=
            entree - sortie;

          return {

            ...t,

            entree,

            sortie,

            solde
          };
        });

      res.json(
        journal
      );

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error:
          "Erreur journal"
      });
    }
  }
);

export default router;