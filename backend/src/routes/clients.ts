import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET ALL CLIENTS
 */
router.get("/", async (_, res) => {
  try {
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
        CASE
          WHEN mc.id IS NOT NULL THEN
            json_build_object(
              'type_mesure_id', mc.type_mesure_id,
              'nom', tm.nom,
              'unite', tm.unite,
              'valeur', mc.valeur
            )
        END
      ),
      '[]'
    ) as mesures

  FROM clients c

  LEFT JOIN mesures_clients mc
    ON mc.client_id = c.id

  LEFT JOIN types_mesures tm
    ON tm.id = mc.type_mesure_id

  WHERE c.est_supprime = 0

  GROUP BY
    c.id,
    c.telephone_id,
    c.nom_prenom,
    c.profil,
    c.adresse,
    c.email,
    c.observations,
    c.date_enregistrement,
    c.est_supprime

  ORDER BY c.nom_prenom
`);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erreur récupération clients",
    });
  }
});

/**
 * CREATE CLIENT
 */
router.post("/", async (req, res) => {
  try {
    const {
      telephone_id,
      nom_prenom,
      adresse,
      email,
      observations,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO clients (
        telephone_id,
        nom_prenom,
        adresse,
        email,
        observations
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        telephone_id,
        nom_prenom,
        adresse,
        email,
        observations,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erreur création client",
    });
  }
});

/**
 * DELETE CLIENT
 */
router.delete("/:telephone_id", async (req, res) => {
  try {

    const { telephone_id } = req.params;

    await pool.query(
      `
      UPDATE clients
      SET est_supprime = 1
      WHERE telephone_id = $1
      `,
      [telephone_id]
    );

    res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur suppression client",
    });
  }
});

/**
 * UPDATE CLIENT
 */
router.put("/:telephone_id", async (req, res) => {

  try {

    const { telephone_id } = req.params;

    const {
      nom_prenom,
      profil,
      adresse,
      email,
      observations
    } = req.body;

    const result = await pool.query(
      `
      UPDATE clients
      SET
        nom_prenom = $1,
        profil = $2,
        adresse = $3,
        email = $4,
        observations = $5
      WHERE telephone_id = $6
      RETURNING *
      `,
      [
        nom_prenom,
        profil,
        adresse,
        email,
        observations,
        telephone_id
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur modification client"
    });
  }
});
/**
 * GET TYPES MESURES
 */
router.get("/types/mesures", async (_, res) => {

  try {

    const result = await pool.query(
      `
      SELECT
        id,
        nom,
        unite
      FROM types_mesures
      WHERE est_active = 1
      ORDER BY ordre_affichage, nom
      `
    );

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur récupération types mesures"
    });
  }
});


/**
 * GET MESURES CLIENT
 */
router.get("/:telephone_id/mesures", async (req, res) => {

  try {

    const { telephone_id } = req.params;

    const clientResult = await pool.query(
      `
      SELECT id
      FROM clients
      WHERE telephone_id = $1
      `,
      [telephone_id]
    );

    if (clientResult.rows.length === 0) {
      return res.json([]);
    }

    const clientId = clientResult.rows[0].id;

    const result = await pool.query(
      `
      SELECT
        mc.type_mesure_id,
        mc.valeur,
        tm.nom,
        tm.unite
      FROM mesures_clients mc
      JOIN types_mesures tm
        ON tm.id = mc.type_mesure_id
      WHERE mc.client_id = $1
      ORDER BY tm.ordre_affichage
      `,
      [clientId]
    );

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur récupération mesures"
    });
  }
});

/**
 * SAVE MESURES CLIENT
 */
router.post("/:telephone_id/mesures", async (req, res) => {
  console.log("MESURES BODY =", req.body);
  try {

    const { telephone_id } = req.params;

    const { mesures } = req.body;

    const clientResult = await pool.query(
      `
      SELECT id
      FROM clients
      WHERE telephone_id = $1
      `,
      [telephone_id]
    );

    if (clientResult.rows.length === 0) {

      return res.status(404).json({
        error: "Client introuvable"
      });
    }

    const clientId = clientResult.rows[0].id;

    // =========================
    // Supprimer anciennes mesures
    // =========================
    await pool.query(
      `
      DELETE FROM mesures_clients
      WHERE client_id = $1
      `,
      [clientId]
    );

    // =========================
    // Réinsertion
    // =========================
    for (const mesure of mesures) {

      await pool.query(
        `
        INSERT INTO mesures_clients (
          client_id,
          type_mesure_id,
          valeur
        )
        VALUES ($1, $2, $3)
        `,
        [
          clientId,
          mesure.type_mesure_id,
          mesure.valeur
        ]
      );
    }

    res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur sauvegarde mesures"
    });
  }
});

export default router;