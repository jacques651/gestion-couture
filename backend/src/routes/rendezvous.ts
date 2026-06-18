import express from 'express';
import { pool } from '../db';

const router = express.Router();

/**
 * =========================
 * GET ALL RENDEZVOUS
 * =========================
 */
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.date_rendezvous,
        r.heure_rendezvous,
        r.type_rendezvous,
        r.statut,
        c.nom_prenom,
        v.code_vente,
        r.client_id,
        r.vente_id,
        r.observation,
        r.created_at,
        r.updated_at
      FROM rendezvous_commandes r
      LEFT JOIN clients c ON c.id = r.client_id
      LEFT JOIN ventes v ON v.id = r.vente_id
      WHERE r.statut != 'archive' OR r.statut IS NULL
      ORDER BY r.date_rendezvous ASC, r.heure_rendezvous ASC
    `);

    // Formater les dates pour le frontend
    const formattedRows = result.rows.map(row => ({
      ...row,
      date_rendezvous: row.date_rendezvous instanceof Date 
        ? row.date_rendezvous.toISOString().split('T')[0] 
        : row.date_rendezvous
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Erreur récupération rendez-vous'
    });
  }
});

/**
 * =========================
 * GET RENDEZVOUS BY VENTE ID
 * =========================
 */
router.get('/vente/:venteId', async (req, res) => {
  try {
    const { venteId } = req.params;
    
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.date_rendezvous,
        r.heure_rendezvous,
        r.type_rendezvous,
        r.statut,
        r.client_id,
        r.vente_id,
        r.observation,
        c.nom_prenom
      FROM rendezvous_commandes r
      LEFT JOIN clients c ON c.id = r.client_id
      WHERE r.vente_id = $1
      ORDER BY r.date_rendezvous DESC
      `,
      [venteId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Erreur récupération rendez-vous par vente'
    });
  }
});

/**
 * =========================
 * GET RENDEZVOUS BY CLIENT ID
 * =========================
 */
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.date_rendezvous,
        r.heure_rendezvous,
        r.type_rendezvous,
        r.statut,
        r.vente_id,
        v.code_vente,
        r.observation
      FROM rendezvous_commandes r
      LEFT JOIN ventes v ON v.id = r.vente_id
      WHERE r.client_id = $1
      ORDER BY r.date_rendezvous DESC
      `,
      [clientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Erreur récupération rendez-vous par client'
    });
  }
});

/**
 * =========================
 * GET RENDEZVOUS BY DATE
 * =========================
 */
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.date_rendezvous,
        r.heure_rendezvous,
        r.type_rendezvous,
        r.statut,
        c.nom_prenom,
        v.code_vente,
        r.client_id,
        r.vente_id
      FROM rendezvous_commandes r
      LEFT JOIN clients c ON c.id = r.client_id
      LEFT JOIN ventes v ON v.id = r.vente_id
      WHERE DATE(r.date_rendezvous) = $1
      ORDER BY r.heure_rendezvous ASC
      `,
      [date]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Erreur récupération rendez-vous par date'
    });
  }
});

/**
 * =========================
 * UPDATE STATUT
 * =========================
 */
router.put('/:id/statut', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // Vérifier si le rendez-vous existe
    const checkResult = await pool.query(
      `SELECT id FROM rendezvous_commandes WHERE id = $1`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    await pool.query(
      `
      UPDATE rendezvous_commandes
      SET statut = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [statut, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Erreur mise à jour statut'
    });
  }
});

/**
 * =========================
 * UPDATE RENDEZVOUS
 * =========================
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date_rendezvous,
      heure_rendezvous,
      type_rendezvous,
      statut,
      observation
    } = req.body;

    // Vérifier si le rendez-vous existe
    const checkResult = await pool.query(
      `SELECT id FROM rendezvous_commandes WHERE id = $1`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    const result = await pool.query(
      `
      UPDATE rendezvous_commandes
      SET
        date_rendezvous = COALESCE($1, date_rendezvous),
        heure_rendezvous = COALESCE($2, heure_rendezvous),
        type_rendezvous = COALESCE($3, type_rendezvous),
        statut = COALESCE($4, statut),
        observation = COALESCE($5, observation),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
      `,
      [date_rendezvous, heure_rendezvous, type_rendezvous, statut, observation, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Erreur mise à jour rendez-vous'
    });
  }
});

/**
 * =========================
 * DELETE RENDEZVOUS
 * =========================
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le rendez-vous existe
    const checkResult = await pool.query(
      `SELECT id FROM rendezvous_commandes WHERE id = $1`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    await pool.query(`DELETE FROM rendezvous_commandes WHERE id = $1`, [id]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Erreur suppression rendez-vous'
    });
  }
});

/**
 * =========================
 * CREATE RENDEZVOUS (manuel)
 * =========================
 */
router.post('/', async (req, res) => {
  try {
    const {
      vente_id,
      client_id,
      date_rendezvous,
      heure_rendezvous,
      type_rendezvous,
      statut,
      observation
    } = req.body;

    // Validation
    if (!client_id || !date_rendezvous) {
      return res.status(400).json({
        error: 'client_id et date_rendezvous sont requis'
      });
    }

    const result = await pool.query(
      `
      INSERT INTO rendezvous_commandes (
        vente_id,
        client_id,
        date_rendezvous,
        heure_rendezvous,
        type_rendezvous,
        statut,
        observation
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        vente_id || null,
        client_id,
        date_rendezvous,
        heure_rendezvous || null,
        type_rendezvous || 'essayage',
        statut || 'planifie',
        observation || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Erreur création rendez-vous'
    });
  }
});

/**
 * =========================
 * GET STATISTIQUES RENDEZVOUS
 * =========================
 */
router.get('/stats/resume', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_rendezvous,
        SUM(CASE WHEN statut = 'planifie' THEN 1 ELSE 0 END) as planifies,
        SUM(CASE WHEN statut = 'effectue' THEN 1 ELSE 0 END) as effectues,
        SUM(CASE WHEN statut = 'annule' THEN 1 ELSE 0 END) as annules,
        SUM(CASE WHEN statut = 'archive' THEN 1 ELSE 0 END) as archives,
        COUNT(DISTINCT DATE(date_rendezvous)) as jours_avec_rendezvous
      FROM rendezvous_commandes
    `);

    res.json({
      total_rendezvous: Number(result.rows[0].total_rendezvous),
      planifies: Number(result.rows[0].planifies),
      effectues: Number(result.rows[0].effectues),
      annules: Number(result.rows[0].annules),
      archives: Number(result.rows[0].archives),
      jours_avec_rendezvous: Number(result.rows[0].jours_avec_rendezvous)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Erreur récupération statistiques'
    });
  }
});

/**
 * ANNULER UN RENDEZ-VOUS
 * PUT /rendezvous/:id/annuler
 */
router.put("/:id/annuler", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE rendezvous_commandes SET statut = 'annule' WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rendez-vous non trouvé" });
    }
    res.json({ success: true, rendezvous: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur annulation rendez-vous" });
  }
});
/**
 * GÉNÉRER UN CODE DE VENTE
 * POST /ventes/generate-code
 */
router.post("/generate-code", async (_, res) => {
  try {
    const date = new Date();
    const prefix = `V${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const result = await pool.query(
      `SELECT code_vente FROM ventes WHERE code_vente LIKE $1 ORDER BY code_vente DESC LIMIT 1`,
      [`${prefix}%`]
    );
    
    let numero = 1;
    if (result.rows.length > 0) {
      const lastCode = result.rows[0].code_vente;
      const lastNum = parseInt(lastCode.replace(prefix, ''), 10);
      if (!isNaN(lastNum)) numero = lastNum + 1;
    }
    
    const code = `${prefix}${String(numero).padStart(4, '0')}`;
    res.json({ code });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur génération code" });
  }
});

export default router;