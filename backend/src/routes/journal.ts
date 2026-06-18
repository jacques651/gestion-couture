import express from "express";
import { pool } from "../db";

const router = express.Router();

/**
 * =========================
 * LISTE JOURNAL
 * =========================
 */
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM journal_modifications
      ORDER BY date_modification DESC
      LIMIT 500
    `);

    res.json(
      result.rows.map(r => ({
        ...r,
        date_modification: r.date_modification,
        details: r.details || null
      }))
    );
  } catch (error) {
    console.error("ERREUR GET /journal-modifications:", error);
    res.status(500).json({
      error: "Erreur récupération journal"
    });
  }
});

/**
 * =========================
 * LISTE JOURNAL AVEC FILTRES
 * =========================
 */
router.get("/filtre", async (req, res) => {
  try {
    const { utilisateur, table, action, date_debut, date_fin } = req.query;
    
    let query = `
      SELECT *
      FROM journal_modifications
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (utilisateur) {
      query += ` AND utilisateur = $${paramIndex++}`;
      params.push(utilisateur);
    }
    
    if (table) {
      query += ` AND table_concernee = $${paramIndex++}`;
      params.push(table);
    }
    
    if (action) {
      query += ` AND action = $${paramIndex++}`;
      params.push(action);
    }
    
    if (date_debut) {
      query += ` AND date_modification >= $${paramIndex++}`;
      params.push(date_debut);
    }
    
    if (date_fin) {
      query += ` AND date_modification <= $${paramIndex++}`;
      params.push(date_fin);
    }
    
    query += ` ORDER BY date_modification DESC LIMIT 500`;

    const result = await pool.query(query, params);
    
    res.json(
      result.rows.map(r => ({
        ...r,
        date_modification: r.date_modification,
        details: r.details || null
      }))
    );
  } catch (error) {
    console.error("ERREUR GET /journal-modifications/filtre:", error);
    res.status(500).json({
      error: "Erreur récupération journal filtré"
    });
  }
});

/**
 * =========================
 * LISTE JOURNAL PAR TABLE
 * =========================
 */
router.get("/table/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    
    const result = await pool.query(
      `
      SELECT *
      FROM journal_modifications
      WHERE table_concernee = $1
      ORDER BY date_modification DESC
      LIMIT 500
      `,
      [tableName]
    );

    res.json(
      result.rows.map(r => ({
        ...r,
        details: r.details || null
      }))
    );
  } catch (error) {
    console.error("ERREUR GET /journal-modifications/table/:tableName:", error);
    res.status(500).json({
      error: "Erreur récupération journal par table"
    });
  }
});

/**
 * =========================
 * LISTE JOURNAL PAR UTILISATEUR
 * =========================
 */
router.get("/utilisateur/:nomUtilisateur", async (req, res) => {
  try {
    const { nomUtilisateur } = req.params;
    
    const result = await pool.query(
      `
      SELECT *
      FROM journal_modifications
      WHERE utilisateur = $1
      ORDER BY date_modification DESC
      LIMIT 500
      `,
      [nomUtilisateur]
    );

    res.json(
      result.rows.map(r => ({
        ...r,
        details: r.details || null
      }))
    );
  } catch (error) {
    console.error("ERREUR GET /journal-modifications/utilisateur/:nomUtilisateur:", error);
    res.status(500).json({
      error: "Erreur récupération journal par utilisateur"
    });
  }
});

/**
 * =========================
 * STATISTIQUES JOURNAL
 * =========================
 */
router.get("/stats/resume", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_modifications,
        COUNT(DISTINCT utilisateur) as nombre_utilisateurs,
        COUNT(DISTINCT table_concernee) as nombre_tables,
        MIN(date_modification) as premiere_modification,
        MAX(date_modification) as derniere_modification
      FROM journal_modifications
    `);

    res.json({
      total_modifications: Number(result.rows[0].total_modifications),
      nombre_utilisateurs: Number(result.rows[0].nombre_utilisateurs),
      nombre_tables: Number(result.rows[0].nombre_tables),
      premiere_modification: result.rows[0].premiere_modification,
      derniere_modification: result.rows[0].derniere_modification
    });
  } catch (error) {
    console.error("ERREUR GET /journal-modifications/stats/resume:", error);
    res.status(500).json({
      error: "Erreur récupération statistiques"
    });
  }
});

/**
 * =========================
 * STATISTIQUES PAR TABLE
 * =========================
 */
router.get("/stats/par-table", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        table_concernee,
        COUNT(*) as nombre_modifications,
        COUNT(DISTINCT utilisateur) as nombre_utilisateurs,
        MAX(date_modification) as derniere_modification
      FROM journal_modifications
      GROUP BY table_concernee
      ORDER BY nombre_modifications DESC
    `);

    res.json(
      result.rows.map(r => ({
        table_concernee: r.table_concernee,
        nombre_modifications: Number(r.nombre_modifications),
        nombre_utilisateurs: Number(r.nombre_utilisateurs),
        derniere_modification: r.derniere_modification
      }))
    );
  } catch (error) {
    console.error("ERREUR GET /journal-modifications/stats/par-table:", error);
    res.status(500).json({
      error: "Erreur récupération statistiques par table"
    });
  }
});

/**
 * =========================
 * AJOUT JOURNAL
 * =========================
 */
router.post("/", async (req, res) => {
  try {
    const {
      utilisateur,
      action,
      table_concernee,
      id_enregistrement,
      details
    } = req.body;

    // Validation des champs requis
    if (!action || !table_concernee) {
      return res.status(400).json({
        error: "Champs requis: action, table_concernee"
      });
    }

    // Garder details comme texte, ne pas essayer de parser
    const detailsText = details && typeof details === 'object' 
      ? JSON.stringify(details) 
      : details || null;

    const result = await pool.query(
      `
      INSERT INTO journal_modifications (
        utilisateur,
        action,
        table_concernee,
        id_enregistrement,
        details,
        date_modification
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
      `,
      [
        utilisateur || 'systeme',
        action,
        table_concernee,
        id_enregistrement || null,
        detailsText
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("ERREUR POST /journal-modifications:", error);
    res.status(500).json({
      error: "Erreur ajout journal"
    });
  }
});

/**
 * =========================
 * VIDER TOUT LE JOURNAL (AVEC CONFIRMATION)
 * =========================
 */
router.delete("/vider-tout", async (req, res) => {
  try {
    // Vérifier le paramètre de confirmation
    const { confirm } = req.query;
    
    if (confirm !== 'yes') {
      return res.status(400).json({
        success: false,
        error: "Confirmation requise. Ajoutez ?confirm=yes à l'URL",
        instruction: "DELETE /journal-modifications/vider-tout?confirm=yes"
      });
    }
    
    // Compter le nombre d'entrées avant suppression
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM journal_modifications
    `);
    const totalCount = parseInt(countResult.rows[0].total);
    
    if (totalCount === 0) {
      return res.json({
        success: true,
        message: "Le journal est déjà vide",
        deleted_count: 0
      });
    }
    
    // Supprimer toutes les entrées
    const result = await pool.query(`
      DELETE FROM journal_modifications
      RETURNING id
    `);
    
    res.json({
      success: true,
      message: `${result.rows.length} entrées supprimées du journal`,
      deleted_count: result.rows.length,
      deleted_ids: result.rows.map(r => r.id)
    });
  } catch (error) {
    console.error("ERREUR DELETE /journal-modifications/vider-tout:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du vidage du journal"
    });
  }
});

/**
 * =========================
 * VIDER JOURNAL ANCIEN (garder les N derniers jours)
 * =========================
 */
router.delete("/ancien", async (req, res) => {
  try {
    const { jours = 30, confirm } = req.query;
    
    if (confirm !== 'yes') {
      return res.status(400).json({
        success: false,
        error: "Confirmation requise. Ajoutez ?confirm=yes&jours=30 à l'URL",
        instruction: "DELETE /journal-modifications/ancien?confirm=yes&jours=30"
      });
    }
    
    // Compter les entrées à supprimer
    const countResult = await pool.query(
      `
      SELECT COUNT(*) as total 
      FROM journal_modifications 
      WHERE date_modification < NOW() - INTERVAL '1 day' * $1
      `,
      [jours]
    );
    const totalCount = parseInt(countResult.rows[0].total);
    
    if (totalCount === 0) {
      return res.json({
        success: true,
        message: `Aucune entrée plus ancienne que ${jours} jours`,
        deleted_count: 0
      });
    }
    
    // Supprimer les entrées anciennes
    const result = await pool.query(
      `
      DELETE FROM journal_modifications
      WHERE date_modification < NOW() - INTERVAL '1 day' * $1
      RETURNING id
      `,
      [jours]
    );
    
    res.json({
      success: true,
      message: `${result.rows.length} entrées plus anciennes que ${jours} jours supprimées`,
      deleted_count: result.rows.length,
      jours_gardes: Number(jours)
    });
  } catch (error) {
    console.error("ERREUR DELETE /journal-modifications/ancien:", error);
    res.status(500).json({
      success: false,
      error: "Erreur suppression journal ancien"
    });
  }
});

/**
 * =========================
 * VIDER JOURNAL PAR TABLE
 * =========================
 */
router.delete("/table/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const { confirm } = req.query;
    
    if (confirm !== 'yes') {
      return res.status(400).json({
        success: false,
        error: "Confirmation requise. Ajoutez ?confirm=yes à l'URL",
        instruction: `DELETE /journal-modifications/table/${tableName}?confirm=yes`
      });
    }
    
    // Compter les entrées à supprimer
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM journal_modifications WHERE table_concernee = $1`,
      [tableName]
    );
    const totalCount = parseInt(countResult.rows[0].total);
    
    if (totalCount === 0) {
      return res.json({
        success: true,
        message: `Aucune entrée pour la table ${tableName}`,
        deleted_count: 0
      });
    }
    
    // Supprimer les entrées de la table spécifiée
    const result = await pool.query(
      `
      DELETE FROM journal_modifications
      WHERE table_concernee = $1
      RETURNING id
      `,
      [tableName]
    );
    
    res.json({
      success: true,
      message: `${result.rows.length} entrées de la table ${tableName} supprimées`,
      deleted_count: result.rows.length,
      table: tableName
    });
  } catch (error) {
    console.error("ERREUR DELETE /journal-modifications/table/:tableName:", error);
    res.status(500).json({
      success: false,
      error: "Erreur suppression par table"
    });
  }
});

/**
 * =========================
 * VIDER JOURNAL PAR UTILISATEUR
 * =========================
 */
router.delete("/utilisateur/:nomUtilisateur", async (req, res) => {
  try {
    const { nomUtilisateur } = req.params;
    const { confirm } = req.query;
    
    if (confirm !== 'yes') {
      return res.status(400).json({
        success: false,
        error: "Confirmation requise. Ajoutez ?confirm=yes à l'URL",
        instruction: `DELETE /journal-modifications/utilisateur/${nomUtilisateur}?confirm=yes`
      });
    }
    
    // Compter les entrées à supprimer
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM journal_modifications WHERE utilisateur = $1`,
      [nomUtilisateur]
    );
    const totalCount = parseInt(countResult.rows[0].total);
    
    if (totalCount === 0) {
      return res.json({
        success: true,
        message: `Aucune entrée pour l'utilisateur ${nomUtilisateur}`,
        deleted_count: 0
      });
    }
    
    // Supprimer les entrées de l'utilisateur spécifié
    const result = await pool.query(
      `
      DELETE FROM journal_modifications
      WHERE utilisateur = $1
      RETURNING id
      `,
      [nomUtilisateur]
    );
    
    res.json({
      success: true,
      message: `${result.rows.length} entrées de l'utilisateur ${nomUtilisateur} supprimées`,
      deleted_count: result.rows.length,
      utilisateur: nomUtilisateur
    });
  } catch (error) {
    console.error("ERREUR DELETE /journal-modifications/utilisateur/:nomUtilisateur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur suppression par utilisateur"
    });
  }
});

/**
 * =========================
 * EXPORTER JOURNAL
 * =========================
 */
router.get("/export", async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const result = await pool.query(`
      SELECT *
      FROM journal_modifications
      ORDER BY date_modification DESC
    `);

    if (format === 'csv') {
      const csvRows = [];
      const headers = ['id', 'utilisateur', 'action', 'table_concernee', 'id_enregistrement', 'details', 'date_modification'];
      csvRows.push(headers.join(','));
      
      for (const row of result.rows) {
        const values = headers.map(header => {
          let value = row[header];
          if (value === null) return '';
          if (typeof value === 'object') value = JSON.stringify(value);
          if (value && typeof value === 'string') {
            value = value.replace(/"/g, '""');
          }
          return `"${value || ''}"`;
        });
        csvRows.push(values.join(','));
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=journal_modifications.csv');
      res.send(csvRows.join('\n'));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=journal_modifications.json');
      res.json(result.rows);
    }
  } catch (error) {
    console.error("ERREUR GET /journal-modifications/export:", error);
    res.status(500).json({
      error: "Erreur export journal"
    });
  }
});

export default router;