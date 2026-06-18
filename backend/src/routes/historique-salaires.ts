import express from "express";
import { pool } from "../db";

const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        e.id as employe_id,
        s.created_at as date,
        e.nom_prenom as nom,
        s.montant_net as montant,
        s.periode_mois,
        s.periode_annee,
        s.montant_brut,
        s.avantages,
        s.charges_sociales
      FROM paiements_salaires s
      LEFT JOIN employes e ON e.id = s.employe_id
      WHERE s.est_supprime = 0
      ORDER BY s.created_at DESC
    `);

    res.json(
      result.rows.map(r => ({
        ...r,
        montant: Number(r.montant || 0),
        montant_brut: Number(r.montant_brut || 0),
        avantages: Number(r.avantages || 0),
        charges_sociales: Number(r.charges_sociales || 0)
      }))
    );
  } catch (error) {
    console.error("Erreur GET /historique-salaires:", error);
    res.status(500).json({ error: "Erreur historique salaires" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT s.*, e.nom_prenom as employe_nom, e.poste as employe_poste
       FROM paiements_salaires s
       LEFT JOIN employes e ON e.id = s.employe_id
       WHERE s.id = $1 AND s.est_supprime = 0`, [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paiement non trouvé" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur GET /historique-salaires/:id:", error);
    res.status(500).json({ error: "Erreur récupération du paiement" });
  }
});

router.get("/employe/:employeId", async (req, res) => {
  try {
    const { employeId } = req.params;
    const result = await pool.query(
      `SELECT s.id, s.created_at as date, s.montant_net as montant,
              s.periode_mois, s.periode_annee, s.montant_brut, s.avantages
       FROM paiements_salaires s
       WHERE s.employe_id = $1 AND s.est_supprime = 0
       ORDER BY s.created_at DESC`, [employeId]
    );
    res.json(
      result.rows.map(r => ({
        ...r,
        montant: Number(r.montant || 0),
        montant_brut: Number(r.montant_brut || 0),
        avantages: Number(r.avantages || 0)
      }))
    );
  } catch (error) {
    console.error("Erreur GET /historique-salaires/employe:", error);
    res.status(500).json({ error: "Erreur récupération" });
  }
});

router.get("/stats/total", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(montant_net), 0) as total_salaires,
             COALESCE(SUM(montant_brut), 0) as total_brut,
             COALESCE(SUM(avantages), 0) as total_avantages,
             COUNT(*) as nombre_paiements,
             COUNT(DISTINCT employe_id) as nombre_employes
      FROM paiements_salaires
      WHERE est_supprime = 0
    `);
    res.json({
      total_salaires: Number(result.rows[0].total_salaires),
      total_brut: Number(result.rows[0].total_brut),
      total_avantages: Number(result.rows[0].total_avantages),
      nombre_paiements: Number(result.rows[0].nombre_paiements),
      nombre_employes: Number(result.rows[0].nombre_employes)
    });
  } catch (error) {
    console.error("Erreur GET stats:", error);
    res.status(500).json({ error: "Erreur statistiques" });
  }
});

router.get("/periode/:annee/:mois", async (req, res) => {
  try {
    const { annee, mois } = req.params;
    const result = await pool.query(
      `SELECT s.*, e.nom_prenom as employe_nom, e.poste as employe_poste
       FROM paiements_salaires s
       LEFT JOIN employes e ON e.id = s.employe_id
       WHERE s.periode_annee = $1 AND s.periode_mois = $2 AND s.est_supprime = 0
       ORDER BY e.nom_prenom`, [annee, mois]
    );
    res.json(
      result.rows.map(r => ({
        ...r,
        montant: Number(r.montant_net || 0),
        montant_brut: Number(r.montant_brut || 0),
        avantages: Number(r.avantages || 0),
        charges_sociales: Number(r.charges_sociales || 0)
      }))
    );
  } catch (error) {
    console.error("Erreur GET periode:", error);
    res.status(500).json({ error: "Erreur récupération" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE paiements_salaires SET est_supprime = 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND est_supprime = 0 RETURNING id`, [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paiement non trouvé" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE:", error);
    res.status(500).json({ error: "Erreur suppression" });
  }
});

export default router;