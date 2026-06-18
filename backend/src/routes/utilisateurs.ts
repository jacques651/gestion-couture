import express from "express";
import { pool } from "../db";

const router = express.Router();

/**
 * =========================
 * GET ROLES DISPONIBLES (DOIT ÊTRE AVANT /:id)
 * =========================
 */
router.get("/roles", async (_, res) => {
  try {
    // Liste statique des rôles disponibles
    const roles = [
      { value: 'admin', label: 'Administrateur', description: 'Accès total' },
      { value: 'caissier', label: 'Caissier', description: 'Gestion des ventes et paiements' },
      { value: 'couturier', label: 'Couturier', description: 'Gestion des commandes et production' },
      { value: 'superviseur', label: 'Superviseur', description: 'Supervision des opérations' }
    ];
    
    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur récupération rôles" });
  }
});

/**
 * =========================
 * GET MODULES DISPONIBLES
 * =========================
 */
router.get("/modules/disponibles", async (_, res) => {
  try {
    const modules = [
      { id: 'dashboard', label: 'Tableau de bord' },
      { id: 'clients', label: 'Clients' },
      { id: 'articles', label: 'Articles' },
      { id: 'matieres', label: 'Matières' },
      { id: 'ventes', label: 'Ventes' },
      { id: 'stock', label: 'Stock' },
      { id: 'employes', label: 'Employés' },
      { id: 'salaires', label: 'Salaires' },
      { id: 'emprunts', label: 'Emprunts' },
      { id: 'depenses', label: 'Dépenses' },
      { id: 'rapports', label: 'Rapports' },
      { id: 'parametres', label: 'Paramètres' },
      { id: 'utilisateurs', label: 'Utilisateurs' }
    ];
    
    res.json(modules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur récupération modules" });
  }
});

/**
 * =========================
 * GET USERS
 * =========================
 */
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
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
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération utilisateurs"
    });
  }
});

/**
 * =========================
 * CHECK LOGIN EXISTE
 * =========================
 */
router.get("/check-login/:login", async (req, res) => {
  try {
    const { login } = req.params;
    
    const result = await pool.query(
      `SELECT id FROM utilisateurs WHERE login = $1`,
      [login]
    );
    
    res.json({ exists: result.rows.length > 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur vérification login" });
  }
});

/**
 * =========================
 * GET ONE USER (DOIT ÊTRE APRÈS /roles ET /check-login)
 * =========================
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'ID est un nombre
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "ID invalide" });
    }
    
    const result = await pool.query(
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur récupération utilisateur"
    });
  }
});

/**
 * =========================
 * GET PERMISSIONS D'UN UTILISATEUR
 * =========================
 */
router.get("/:id/permissions", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'ID est un nombre
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "ID invalide" });
    }
    
    const result = await pool.query(
      `
      SELECT 
        module as fonctionnalite,
        peut_voir as lecture,
        peut_modifier as ecriture
      FROM permissions
      WHERE utilisateur_id = $1
      `,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur récupération permissions" });
  }
});

/**
 * =========================
 * CREATE USER
 * =========================
 */
router.post("/", async (req, res) => {
  try {
    const { nom, login, mot_de_passe, role } = req.body;

    if (!nom || !login || !mot_de_passe) {
      return res.status(400).json({
        error: "Champs obligatoires manquants"
      });
    }

    // Login déjà utilisé
    const exists = await pool.query(
      `SELECT id FROM utilisateurs WHERE login = $1`,
      [login]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "Login déjà utilisé" });
    }

    const result = await pool.query(
      `
      INSERT INTO utilisateurs (
        nom,
        login,
        mot_de_passe,
        role,
        est_actif
      )
      VALUES ($1, $2, $3, $4, 1)
      RETURNING id, nom, login, role, est_actif
      `,
      [nom, login, mot_de_passe, role || "couturier"]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur création utilisateur" });
  }
});

/**
 * =========================
 * UPDATE USER
 * =========================
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, login, role } = req.body;

    // Vérifier que l'ID est un nombre
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "ID invalide" });
    }

    // Vérifier si l'utilisateur existe
    const checkResult = await pool.query(
      `SELECT id FROM utilisateurs WHERE id = $1`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier si le nouveau login existe déjà
    if (login) {
      const loginExists = await pool.query(
        `SELECT id FROM utilisateurs WHERE login = $1 AND id != $2`,
        [login, id]
      );
      
      if (loginExists.rows.length > 0) {
        return res.status(400).json({ error: "Ce login est déjà utilisé" });
      }
    }

    await pool.query(
      `
      UPDATE utilisateurs
      SET
        nom = COALESCE($1, nom),
        login = COALESCE($2, login),
        role = COALESCE($3, role),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      `,
      [nom, login, role, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur modification utilisateur" });
  }
});

/**
 * =========================
 * UPDATE STATUS
 * =========================
 */
router.put("/:id/statut", async (req, res) => {
  try {
    const { id } = req.params;
    const { est_actif } = req.body;

    // Vérifier que l'ID est un nombre
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "ID invalide" });
    }

    await pool.query(
      `
      UPDATE utilisateurs
      SET
        est_actif = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [est_actif, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur modification statut" });
  }
});

/**
 * =========================
 * UPDATE PERMISSIONS
 * =========================
 */
router.put("/:id/permissions", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { id } = req.params;
    const { permissions } = req.body;
    
    // Vérifier que l'ID est un nombre
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "ID invalide" });
    }
    
    // Vérifier si l'utilisateur existe
    const userExists = await client.query(
      `SELECT id FROM utilisateurs WHERE id = $1`,
      [id]
    );
    
    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    
    // Supprimer les anciennes permissions
    await client.query(`DELETE FROM permissions WHERE utilisateur_id = $1`, [id]);
    
    // Insérer les nouvelles permissions
    for (const perm of permissions) {
      // S'assurer que le module n'est pas null ou undefined
      if (!perm.fonctionnalite) {
        console.error("Module manquant pour permission:", perm);
        continue;
      }
      
      await client.query(
        `
        INSERT INTO permissions (
          utilisateur_id,
          module,
          peut_voir,
          peut_creer,
          peut_modifier,
          peut_supprimer
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          id,
          perm.fonctionnalite,  // ← CHANGÉ: utiliser fonctionnalite comme module
          perm.lecture ? 1 : 0,
          0,  // peut_creer
          perm.ecriture ? 1 : 0,
          0   // peut_supprimer
        ]
      );
    }
    
    await client.query("COMMIT");
    
    res.json({ success: true, message: "Permissions mises à jour avec succès" });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("ERREUR UPDATE PERMISSIONS:", error);
    res.status(500).json({ 
      error: "Erreur mise à jour des permissions",
      details: error.message 
    });
  } finally {
    client.release();
  }
});

/**
 * =========================
 * LOGIN
 * =========================
 */
router.post("/login", async (req, res) => {
  try {
    const { login, mot_de_passe } = req.body;

    const result = await pool.query(
      `
      SELECT
        id,
        nom,
        login,
        role,
        est_actif
      FROM utilisateurs
      WHERE login = $1 AND mot_de_passe = $2 AND est_actif = 1
      `,
      [login, mot_de_passe]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Login ou mot de passe incorrect" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur connexion" });
  }
});

/**
 * =========================
 * DELETE USER
 * =========================
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'ID est un nombre
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const checkResult = await pool.query(
      `SELECT id FROM utilisateurs WHERE id = $1`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Supprimer d'abord les permissions
    await pool.query(`DELETE FROM permissions WHERE utilisateur_id = $1`, [id]);
    
    // Puis supprimer l'utilisateur
    await pool.query(`DELETE FROM utilisateurs WHERE id = $1`, [id]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur suppression utilisateur" });
  }
});

/**
 * =========================
 * CHANGER SON PROPRE MOT DE PASSE
 * =========================
 */
router.post("/change-password", async (req, res) => {
  try {
    const { userId, ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!userId || !ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({
        error: "Tous les champs sont requis"
      });
    }

    // Vérifier l'ancien mot de passe
    const userResult = await pool.query(
      `SELECT id, mot_de_passe FROM utilisateurs WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier l'ancien mot de passe (en clair pour l'instant)
    if (userResult.rows[0].mot_de_passe !== ancienMotDePasse) {
      return res.status(401).json({ error: "Ancien mot de passe incorrect" });
    }

    // Mettre à jour le mot de passe
    await pool.query(
      `
      UPDATE utilisateurs
      SET mot_de_passe = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [nouveauMotDePasse, userId]
    );

    // Journaliser l'action
    console.log(`✅ Mot de passe modifié pour l'utilisateur ${userId}`);

    res.json({ success: true, message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur modification mot de passe" });
  }
});

/**
 * =========================
 * RESET PASSWORD (PAR ADMIN)
 * =========================
 */
router.put("/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { nouveauMotDePasse } = req.body;

    // Vérifier que l'ID est un nombre
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "ID invalide" });
    }

    if (!nouveauMotDePasse) {
      return res.status(400).json({ error: "Nouveau mot de passe requis" });
    }

    // Vérifier si l'utilisateur existe
    const checkResult = await pool.query(
      `SELECT id FROM utilisateurs WHERE id = $1`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    await pool.query(
      `
      UPDATE utilisateurs
      SET mot_de_passe = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [nouveauMotDePasse, id]
    );

    res.json({ success: true, message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur réinitialisation mot de passe" });
  }
});

export default router;