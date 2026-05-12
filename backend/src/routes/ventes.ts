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

    const client = await pool.connect();

    try {

      await client.query("BEGIN");

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
        details,
        rendezvous  // 👈 AJOUT: Récupérer les données du rendez-vous
      } = req.body;

      /**
       * Création vente
       */
      const venteResult = await client.query(
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

      const vente = venteResult.rows[0];

      /**
       * Détails vente
       */
      if (Array.isArray(details)) {
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

          // Mouvement de stock
          await client.query(
            `
            INSERT INTO mouvements_stock (
              type_mouvement,
              code_mouvement,
              designation,
              quantite,
              cout_unitaire,
              motif,
              observation
            )
            VALUES (
              $1, $2, $3,
              $4, $5, $6,
              $7
            )
            `,
            [
              'sortie',
              code_vente,
              item.designation,
              item.quantite,
              item.prix_unitaire,
              'Vente produit',
              observation || null
            ]
          );
        }
      }

      /**
       * 👇 AJOUT: Création du rendez-vous pour les commandes
       */
      if (type_vente === 'commande' && rendezvous && rendezvous.date_rendezvous) {
        const rdvClientId = rendezvous.client_id || client_id;
        
        if (rdvClientId) {
          await client.query(
            `
            INSERT INTO rendezvous_commandes (
              vente_id,
              client_id,
              date_rendezvous,
              heure_rendezvous,
              type_rendezvous,
              statut
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [
              vente.id,
              rdvClientId,
              rendezvous.date_rendezvous,
              rendezvous.heure_rendezvous || null,
              rendezvous.type_rendezvous || 'essayage',
              'planifie'
            ]
          );
          
          console.log(`✅ Rendez-vous créé pour la vente ${vente.id}`);
        } else {
          console.log(`⚠️ Pas de client_id pour le rendez-vous de la vente ${vente.id}`);
        }
      }

      await client.query("COMMIT");
      res.json(vente);

    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("ERREUR CREATION VENTE:", error);
      res.status(500).json({ error: error.message });
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
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.*,
        c.nom_prenom AS client_nom,
        COALESCE(SUM(vd.quantite * vd.prix_unitaire), 0) AS montant_total
      FROM ventes v
      LEFT JOIN clients c ON c.id = v.client_id
      LEFT JOIN vente_details vd ON vd.vente_id = v.id
      WHERE COALESCE(v.est_supprime, 0) = 0
      GROUP BY v.id, c.nom_prenom
      ORDER BY v.date_vente DESC
    `);

    res.json(
      result.rows.map(r => ({
        ...r,
        montant_total: Number(r.montant_total || 0),
        montant_regle: Number(r.montant_regle || 0)
      }))
    );
  } catch (error: any) {
    console.error("❌ ERREUR SQL VENTES:", error);
    res.status(500).json({
      error: error.message,
      detail: error.detail || null,
      stack: error.stack || null
    });
  }
});

/**
 * =========================
 * GENERATE CODE
 * =========================
 */
router.get("/generate-code", async (_, res) => {
  try {
    const year = new Date().getFullYear();
    const result = await pool.query(`SELECT COUNT(*)::int AS total FROM ventes`);
    const total = result.rows[0].total + 1;
    const code = `VTE-${year}-${String(total).padStart(4, '0')}`;
    res.json({ code });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur génération code" });
  }
});

/**
 * =========================
 * DELETE VENTE (soft delete)
 * =========================
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE ventes SET est_supprime = 1 WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur suppression vente" });
  }
});

/**
 * =========================
 * PAIEMENT VENTE
 * =========================
 */
router.put("/:id/paiement", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { montant, mode_paiement } = req.body;

    await client.query("BEGIN");

    const venteResult = await client.query(
      `SELECT montant_total, montant_regle FROM ventes WHERE id = $1`,
      [id]
    );

    if (venteResult.rows.length === 0) {
      throw new Error("Vente introuvable");
    }

    const vente = venteResult.rows[0];
    const nouveauMontant = Number(vente.montant_regle || 0) + Number(montant);

    let statut = "IMPAYEE";
    if (nouveauMontant >= Number(vente.montant_total)) {
      statut = "PAYEE";
    } else if (nouveauMontant > 0) {
      statut = "PARTIEL";
    }

    await client.query(
      `UPDATE ventes SET montant_regle = $1, statut = $2, mode_paiement = $3 WHERE id = $4`,
      [nouveauMontant, statut, mode_paiement, id]
    );

    await client.query(
      `INSERT INTO paiements_ventes (vente_id, montant, mode_paiement) VALUES ($1, $2, $3)`,
      [id, montant, mode_paiement]
    );

    await client.query("COMMIT");
    res.json({ success: true });

  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

/**
 * =========================
 * DETAILS VENTE
 * =========================
 */
router.get("/:id/details", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT
        vd.id,
        vd.vente_id,
        vd.article_id,
        vd.matiere_id,
        vd.designation,
        vd.quantite,
        vd.prix_unitaire,
        vd.total,
        vd.taille_libelle,
        CASE
          WHEN vd.article_id IS NOT NULL THEN 'article'
          WHEN vd.matiere_id IS NOT NULL THEN 'matiere'
          ELSE 'prestation'
        END AS type_ligne
      FROM vente_details vd
      WHERE vd.vente_id = $1
      ORDER BY vd.id ASC
      `,
      [id]
    );

    res.json(
      result.rows.map(r => ({
        ...r,
        quantite: Number(r.quantite || 0),
        prix_unitaire: Number(r.prix_unitaire || 0),
        total: Number(r.total || 0)
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur détails vente" });
  }
});

/**
 * =========================
 * GET ONE VENTE
 * =========================
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT
        v.*,
        c.nom_prenom AS client_nom,
        c.telephone_id AS client_telephone
      FROM ventes v
      LEFT JOIN clients c ON c.id = v.client_id
      WHERE v.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vente introuvable" });
    }

    const vente = result.rows[0];
    res.json({
      ...vente,
      montant_total: Number(vente.montant_total),
      montant_regle: Number(vente.montant_regle)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur récupération vente" });
  }
});

/**
 * =========================
 * UPDATE VENTE
 * =========================
 */
router.put("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const {
      date_vente,
      type_vente,
      client_id,
      client_nom,
      observation,
      montant_regle,
      lignes = [],
      rendezvous  // 👈 AJOUT: Récupérer les données du rendez-vous pour la mise à jour
    } = req.body;

    // Calcul du total
    const montant_total = (lignes || []).reduce(
      (sum: number, l: any) => sum + (Number(l.quantite) * Number(l.prix_unitaire)),
      0
    );

    // Déterminer le statut
    let statut = "EN_ATTENTE";
    if (Number(montant_regle) >= montant_total) {
      statut = "PAYEE";
    } else if (Number(montant_regle) > 0) {
      statut = "PARTIEL";
    }

    // UPDATE VENTE
    await client.query(
      `
      UPDATE ventes
      SET
        date_vente = $1,
        type_vente = $2,
        client_id = $3,
        client_nom = $4,
        observation = $5,
        montant_total = $6,
        montant_regle = $7,
        statut = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      `,
      [date_vente, type_vente, client_id, client_nom, observation, montant_total, montant_regle, statut, id]
    );

    // SUPPRIMER LES ANCIENS DÉTAILS
    await client.query(`DELETE FROM vente_details WHERE vente_id = $1`, [id]);

    // RECRÉER LES DÉTAILS
    for (const ligne of lignes) {
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          id,
          ligne.designation,
          ligne.quantite,
          ligne.prix_unitaire,
          Number(ligne.quantite) * Number(ligne.prix_unitaire),
          ligne.article_id || null,
          ligne.matiere_id || null,
          ligne.taille_libelle || null
        ]
      );
    }

    /**
     * 👇 AJOUT: Mise à jour du rendez-vous pour les commandes
     */
    if (type_vente === 'commande' && rendezvous && rendezvous.date_rendezvous) {
      const rdvClientId = rendezvous.client_id || client_id;
      
      // Vérifier si un rendez-vous existe déjà
      const existingRdv = await client.query(
        `SELECT id FROM rendezvous_commandes WHERE vente_id = $1`,
        [id]
      );
      
      if (existingRdv.rows.length > 0) {
        // Mettre à jour le rendez-vous existant
        await client.query(
          `
          UPDATE rendezvous_commandes
          SET
            client_id = $1,
            date_rendezvous = $2,
            heure_rendezvous = $3,
            type_rendezvous = $4,
            statut = $5
          WHERE vente_id = $6
          `,
          [
            rdvClientId,
            rendezvous.date_rendezvous,
            rendezvous.heure_rendezvous || null,
            rendezvous.type_rendezvous || 'essayage',
            'planifie',
            id
          ]
        );
        console.log(`✅ Rendez-vous mis à jour pour la vente ${id}`);
      } else if (rdvClientId) {
        // Créer un nouveau rendez-vous
        await client.query(
          `
          INSERT INTO rendezvous_commandes (
            vente_id,
            client_id,
            date_rendezvous,
            heure_rendezvous,
            type_rendezvous,
            statut
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            id,
            rdvClientId,
            rendezvous.date_rendezvous,
            rendezvous.heure_rendezvous || null,
            rendezvous.type_rendezvous || 'essayage',
            'planifie'
          ]
        );
        console.log(`✅ Rendez-vous créé pour la vente ${id}`);
      }
    } else {
      // Si ce n'est plus une commande ou pas de rendez-vous, supprimer l'ancien rendez-vous
      await client.query(`DELETE FROM rendezvous_commandes WHERE vente_id = $1`, [id]);
    }

    await client.query("COMMIT");
    res.json({ success: true, montant_total, montant_regle, statut });

  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("ERREUR UPDATE VENTE:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});
router.get("/paiements-ventes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        v.code_vente,
        v.client_nom,
        v.client_id,
        (v.montant_total - v.montant_regle) as restant
      FROM paiements_ventes p
      LEFT JOIN ventes v ON v.id = p.vente_id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur récupération paiements" });
  }
});

export default router;