import { Router } from "express";

const router = Router();

/**
 * GET ALL
 */
router.get(
  "/",
  async (_, res) => {

    try {

      res.json([]);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Erreur récupération dépenses"
      });
    }
  }
);

export default router;