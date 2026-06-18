import express from "express";
import { pool } from "../db";

const router = express.Router();

/**
 * =========================
 * LISTE SITUATION SALAIRES
 * =========================
 */
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.id as employe_id,
        e.nom_prenom as nom,
        e.type_remuneration as type,
        e.salaire_base,
        /**
         * SALAIRE BRUT
         */
        CASE
          WHEN e.type_remuneration = 'fixe' THEN COALESCE(e.salaire_base, 0)
          ELSE COALESCE(
            (SELECT SUM(pr.total) FROM prestations_realisees pr WHERE pr.employe_id = e.id),
            0
          )
        END as salaire_brut,
        /**
         * RETENUES = EMPRUNTS
         */
        COALESCE(
          (SELECT SUM(em.montant) FROM emprunts em WHERE em.employe_id = e.id AND COALESCE(em.deduit, 0) = 0),
          0
        ) as retenue,
        /**
         * TOTAL PAYE
         */
        COALESCE(
          (SELECT SUM(s.montant_net) FROM paiements_salaires s WHERE s.employe_id = e.id),
          0
        ) as total_paye
      FROM employes e
      WHERE COALESCE(e.est_supprime, 0) = 0
      ORDER BY e.nom_prenom
    `);

    const rows = result.rows.map(r => {
      const brut = Number(r.salaire_brut || 0);
      const retenue = Number(r.retenue || 0);
      const paye = Number(r.total_paye || 0);
      const reste = brut - retenue - paye;

      return {
        ...r,
        salaire_brut: brut,
        retenue: retenue,
        total_paye: paye,
        salaire_base: Number(r.salaire_base || 0),
        reste_a_payer: reste > 0 ? reste : 0
      };
    });

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération salaires"
    });
  }
});

/**
 * =========================
 * PAYER SALAIRE
 * =========================
 */
router.post("/payer", async (req, res) => {
  try {
    const { employe_id, montant_net, periode_mois, periode_annee } = req.body;

    // Validation
    if (!employe_id || !montant_net) {
      return res.status(400).json({
        error: "employe_id et montant_net sont requis"
      });
    }

    // Vérifier si l'employé existe
    const employeResult = await pool.query(
      `SELECT id, nom_prenom, type_remuneration FROM employes WHERE id = $1 AND est_supprime = 0`,
      [employe_id]
    );
    
    if (employeResult.rows.length === 0) {
      return res.status(404).json({ error: "Employé non trouvé" });
    }

    // Récupérer les dettes (emprunts non déduits)
    const empruntsResult = await pool.query(
      `SELECT COALESCE(SUM(montant), 0) as total_emprunts
       FROM emprunts
       WHERE employe_id = $1 AND deduit = 0`,
      [employe_id]
    );
    
    const totalEmprunts = Number(empruntsResult.rows[0].total_emprunts);
    
    // Calculer la retenue
    let retenue = 0;
    if (totalEmprunts > 0) {
      retenue = Math.min(totalEmprunts, montant_net * 0.5); // Max 50% du salaire pour les emprunts
    }

    const montantFinal = montant_net - retenue;
    const mois = periode_mois || new Date().getMonth() + 1;
    const annee = periode_annee || new Date().getFullYear();

    const result = await pool.query(
      `
      INSERT INTO paiements_salaires (
        employe_id,
        montant_brut,
        retenue,
        montant_net,
        periode_mois,
        periode_annee
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [employe_id, montant_net, retenue, montantFinal, mois, annee]
    );

    // Marquer les emprunts comme déduits
    if (retenue > 0) {
      await pool.query(
        `
        UPDATE emprunts
        SET deduit = 1, date_deduction = CURRENT_DATE
        WHERE employe_id = $1 AND deduit = 0
        LIMIT 1
        `,
        [employe_id]
      );
    }

    res.status(201).json({
      ...result.rows[0],
      montant_brut: Number(result.rows[0].montant_brut),
      retenue: Number(result.rows[0].retenue),
      montant_net: Number(result.rows[0].montant_net)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur paiement salaire"
    });
  }
});

/**
 * =========================
 * HISTORIQUE EMPLOYE
 * =========================
 */
router.get("/employe/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        ps.id,
        ps.montant_net,
        ps.montant_brut,
        ps.retenue,
        ps.created_at as date_paiement,
        ps.periode_mois,
        ps.periode_annee
      FROM paiements_salaires ps
      WHERE ps.employe_id = $1
      ORDER BY ps.created_at DESC
      `,
      [id]
    );

    res.json(
      result.rows.map(r => ({
        ...r,
        montant_net: Number(r.montant_net || 0),
        montant_brut: Number(r.montant_brut || 0),
        retenue: Number(r.retenue || 0)
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur historique salaires"
    });
  }
});

/**
 * =========================
 * ANNULER PAIEMENT
 * =========================
 */
router.put("/:id/annuler", async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le paiement existe
    const checkResult = await pool.query(
      `SELECT id, employe_id FROM paiements_salaires WHERE id = $1`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Paiement non trouvé" });
    }

    await pool.query(`DELETE FROM paiements_salaires WHERE id = $1`, [id]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur annulation salaire"
    });
  }
});

/**
 * =========================
 * DÉTAIL EMPLOYÉ
 * =========================
 */
router.get("/employe/:id/detail", async (req, res) => {
  try {
    const { id } = req.params;

    const employeResult = await pool.query(
      `
      SELECT
        e.id,
        e.nom_prenom,
        e.type_remuneration,
        e.salaire_base,
        e.telephone,
        e.est_actif
      FROM employes e
      WHERE e.id = $1 AND e.est_supprime = 0
      `,
      [id]
    );

    if (employeResult.rows.length === 0) {
      return res.status(404).json({ error: "Employé non trouvé" });
    }

    const prestationsResult = await pool.query(
      `
      SELECT
        id,
        designation,
        nombre,
        valeur,
        total,
        date_prestation
      FROM prestations_realisees
      WHERE employe_id = $1
      ORDER BY date_prestation DESC
      LIMIT 10
      `,
      [id]
    );

    const empruntsResult = await pool.query(
      `
      SELECT
        id,
        montant,
        date_emprunt,
        deduit,
        date_deduction
      FROM emprunts
      WHERE employe_id = $1
      ORDER BY date_emprunt DESC
      `,
      [id]
    );

    res.json({
      employe: employeResult.rows[0],
      prestations: prestationsResult.rows.map(p => ({
        ...p,
        nombre: Number(p.nombre),
        valeur: Number(p.valeur),
        total: Number(p.total)
      })),
      emprunts: empruntsResult.rows.map(e => ({
        ...e,
        montant: Number(e.montant)
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération détail employé"
    });
  }
});

/**
 * =========================
 * STATISTIQUES SALAIRES
 * =========================
 */
router.get("/stats/global", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT employe_id) as nombre_employes_payes,
        COALESCE(SUM(montant_net), 0) as total_masse_salariale,
        COALESCE(SUM(montant_brut), 0) as total_brut,
        COALESCE(SUM(retenue), 0) as total_retenues,
        COUNT(*) as nombre_paiements,
        EXTRACT(YEAR FROM created_at) as annee,
        EXTRACT(MONTH FROM created_at) as mois
      FROM paiements_salaires
      GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
      ORDER BY annee DESC, mois DESC
    `);

    res.json(
      result.rows.map(r => ({
        nombre_employes_payes: Number(r.nombre_employes_payes),
        total_masse_salariale: Number(r.total_masse_salariale),
        total_brut: Number(r.total_brut),
        total_retenues: Number(r.total_retenues),
        nombre_paiements: Number(r.nombre_paiements),
        annee: Number(r.annee),
        mois: Number(r.mois)
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération statistiques"
    });
  }
});

export default router;