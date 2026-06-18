// routes/clients.ts - Version corrigée (sans ordre_affichage)
import { Router } from "express";
import { pool } from "../db";

const router = Router();

// ============================================
// GET ALL CLIENTS AVEC MESURES - Version optimisée
// ============================================
router.get("/", async (_, res) => {
  try {
    console.log("📊 Récupération de tous les clients avec leurs mesures...");
    
    const result = await pool.query(`
      SELECT 
        c.id, 
        c.telephone_id, 
        c.nom_prenom, 
        c.profil, 
        c.adresse,
        c.email, 
        c.observations, 
        c.date_enregistrement, 
        c.est_supprime,
        COALESCE(
          json_agg(
            json_build_object(
              'type_mesure_id', tm.id,
              'nom', tm.nom,
              'valeur', mc.valeur,
              'unite', tm.unite
            )
          ) FILTER (WHERE mc.id IS NOT NULL),
          '[]'
        ) as mesures
      FROM clients c
      LEFT JOIN mesures_clients mc ON mc.client_id = c.id
      LEFT JOIN types_mesures tm ON tm.id = mc.type_mesure_id
      WHERE c.est_supprime = 0
      GROUP BY c.id, c.telephone_id, c.nom_prenom, c.profil, c.adresse,
        c.email, c.observations, c.date_enregistrement, c.est_supprime
      ORDER BY c.nom_prenom
    `);
    
    const clients = result.rows;
    console.log(`✅ ${clients.length} clients récupérés`);
    
    let totalMesures = 0;
    for (const client of clients) {
      if (client.mesures && Array.isArray(client.mesures)) {
        totalMesures += client.mesures.length;
      }
    }
    console.log(`✅ Total: ${totalMesures} mesures`);
    
    res.json(clients);
    
  } catch (error) {
    console.error("❌ Erreur récupération clients:", error);
    res.status(500).json({ 
      error: "Erreur récupération clients",
      message: error.message,
      stack: error.stack 
    });
  }
});

// ============================================
// GET MESURES D'UN CLIENT PAR TÉLÉPHONE - CORRIGÉ
// ============================================
router.get("/:telephone/mesures", async (req, res) => {
  try {
    const { telephone } = req.params;
    
    console.log(`📊 Récupération des mesures pour: ${telephone}`);
    
    if (!telephone) {
      return res.status(400).json({ error: 'Téléphone requis' });
    }

    // D'abord, récupérer l'ID du client
    const clientResult = await pool.query(
      "SELECT id FROM clients WHERE telephone_id = $1 AND est_supprime = 0",
      [telephone]
    );
    
    if (clientResult.rows.length === 0) {
      console.log(`⚠️ Client non trouvé: ${telephone}`);
      return res.json([]);
    }

    const clientId = clientResult.rows[0].id;
    console.log(`✅ Client trouvé avec ID: ${clientId}`);

    // Récupérer les mesures du client - SANS ordre_affichage
    const query = `
      SELECT 
        tm.id as type_mesure_id,
        tm.nom,
        mc.valeur,
        tm.unite
      FROM mesures_clients mc
      INNER JOIN types_mesures tm ON mc.type_mesure_id = tm.id
      WHERE mc.client_id = $1
      ORDER BY tm.id
    `;
    
    const result = await pool.query(query, [clientId]);
    
    console.log(`✅ ${result.rows.length} mesures trouvées pour ${telephone}`);
    if (result.rows.length > 0) {
      console.log(`📊 Première mesure: ${JSON.stringify(result.rows[0])}`);
    }
    
    res.json(result.rows);
    
  } catch (error) {
    console.error("❌ Erreur récupération mesures:", error);
    res.status(500).json({ 
      error: "Erreur récupération mesures",
      details: error.message 
    });
  }
});

// ============================================
// POST - Enregistrer les mesures d'un client
// ============================================
router.post("/:telephone/mesures", async (req, res) => {
  try {
    const { telephone } = req.params;
    const { mesures } = req.body;
    
    console.log(`📊 Enregistrement des mesures pour: ${telephone}`);
    console.log("📊 Mesures reçues:", JSON.stringify(mesures, null, 2));
    
    if (!telephone) {
      return res.status(400).json({ error: 'Téléphone requis' });
    }

    // D'abord, récupérer l'ID du client
    const clientResult = await pool.query(
      "SELECT id FROM clients WHERE telephone_id = $1 AND est_supprime = 0",
      [telephone]
    );
    
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ 
        error: "Client non trouvé",
        telephone: telephone
      });
    }

    const clientId = clientResult.rows[0].id;

    // Démarrer une transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Supprimer les anciennes mesures
      await client.query(
        'DELETE FROM mesures_clients WHERE client_id = $1',
        [clientId]
      );
      
      // Insérer les nouvelles mesures
      let insertedCount = 0;
      if (mesures && Array.isArray(mesures) && mesures.length > 0) {
        for (const mesure of mesures) {
          const typeId = mesure.type_mesure_id || mesure.typeMesureId;
          const valeur = mesure.valeur || mesure.value;
          
          if (typeId && valeur !== undefined && valeur !== null && valeur !== '') {
            await client.query(
              `INSERT INTO mesures_clients (client_id, type_mesure_id, valeur)
               VALUES ($1, $2, $3)`,
              [clientId, Number(typeId), String(valeur)]
            );
            insertedCount++;
          }
        }
      }
      
      await client.query('COMMIT');
      
      console.log(`✅ ${insertedCount} mesures enregistrées pour ${telephone}`);
      
      res.json({ 
        success: true, 
        message: `${insertedCount} mesures enregistrées`,
        count: insertedCount
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error("❌ Erreur enregistrement mesures:", error);
    res.status(500).json({ 
      error: "Erreur enregistrement mesures",
      details: error.message 
    });
  }
});

// ============================================
// GET CLIENT BY TELEPHONE
// ============================================
router.get("/telephone/:telephone_id", async (req, res) => {
  try {
    const { telephone_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM clients WHERE telephone_id = $1 AND est_supprime = 0`,
      [telephone_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client non trouvé" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur récupération client" });
  }
});

// ============================================
// GET CLIENT BY ID
// ============================================
router.get("/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM clients WHERE id = $1 AND est_supprime = 0`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client non trouvé" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur récupération client" });
  }
});

// ============================================
// POST - Créer ou mettre à jour un client
// ============================================
router.post("/", async (req, res) => {
  try {
    const { telephone_id, nom_prenom, profil, adresse, email, observations } = req.body;

    if (!telephone_id || !nom_prenom) {
      return res.status(400).json({ error: "Les champs telephone_id et nom_prenom sont obligatoires" });
    }

    const result = await pool.query(
      `INSERT INTO clients (telephone_id, nom_prenom, profil, adresse, email, observations, est_supprime)
       VALUES ($1, $2, $3, $4, $5, $6, 0)
       ON CONFLICT (telephone_id) 
       DO UPDATE SET
         nom_prenom = EXCLUDED.nom_prenom,
         profil = EXCLUDED.profil,
         adresse = EXCLUDED.adresse,
         email = EXCLUDED.email,
         observations = EXCLUDED.observations,
         est_supprime = 0
       RETURNING *`,
      [telephone_id, nom_prenom, profil || 'principal', adresse || '', email || '', observations || '']
    );

    console.log("✅ Client sauvegardé:", result.rows[0]);

    res.json({
      success: true,
      client: result.rows[0],
      id: result.rows[0].id,
      message: "Client enregistré avec succès"
    });

  } catch (error: any) {
    console.error("❌ Erreur POST /clients:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PUT - Mettre à jour un client par ID
// ============================================
router.put("/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_prenom, profil, adresse, email, observations, telephone_id } = req.body;
    
    const result = await pool.query(
      `UPDATE clients 
       SET nom_prenom = COALESCE($1, nom_prenom), 
           profil = COALESCE($2, profil),
           adresse = COALESCE($3, adresse), 
           email = COALESCE($4, email),
           observations = COALESCE($5, observations), 
           telephone_id = COALESCE($6, telephone_id)
       WHERE id = $7 AND est_supprime = 0 
       RETURNING *`,
      [nom_prenom, profil, adresse, email, observations, telephone_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client non trouvé" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur modification client" });
  }
});

// ============================================
// PUT - Mettre à jour un client par téléphone
// ============================================
router.put("/:telephone", async (req, res) => {
  try {
    const { telephone } = req.params;
    const { nom_prenom, profil, adresse, email, observations } = req.body;
    
    const result = await pool.query(
      `UPDATE clients 
       SET nom_prenom = $1, 
           profil = $2,
           adresse = $3, 
           email = $4,
           observations = $5
       WHERE telephone_id = $6 AND est_supprime = 0 
       RETURNING *`,
      [nom_prenom, profil || 'principal', adresse || '', email || '', observations || '', telephone]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client non trouvé" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur modification client" });
  }
});

// ============================================
// DELETE - Supprimer un client (soft delete)
// ============================================
router.delete("/:telephone", async (req, res) => {
  try {
    const { telephone } = req.params;
    const result = await pool.query(
      `UPDATE clients SET est_supprime = 1 WHERE telephone_id = $1 AND est_supprime = 0 RETURNING id`,
      [telephone]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client non trouvé" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur suppression client" });
  }
});

// ============================================
// VIDER TOUTES LES MESURES
// ============================================
router.delete("/mesures/all", async (_, res) => {
  try {
    const result = await pool.query(`DELETE FROM mesures_clients`);
    res.json({
      success: true,
      message: `${result.rowCount} mesure(s) supprimée(s)`,
      count: result.rowCount
    });
  } catch (error) {
    console.error("Erreur suppression mesures:", error);
    res.status(500).json({ error: "Erreur lors de la suppression des mesures" });
  }
});

// ============================================
// VIDER TOUS LES CLIENTS
// ============================================
router.delete("/all", async (_, res) => {
  try {
    await pool.query(`DELETE FROM mesures_clients`);
    const result = await pool.query(`
      UPDATE clients SET est_supprime = 1 WHERE est_supprime = 0 RETURNING id
    `);
    res.json({
      success: true,
      message: `${result.rowCount} client(s) supprimé(s)`,
      count: result.rowCount
    });
  } catch (error) {
    console.error("Erreur suppression clients:", error);
    res.status(500).json({ error: "Erreur lors de la suppression des clients" });
  }
});

export default router;