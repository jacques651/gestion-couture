import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { pool } from "./db";
import clientsRoutes from "./routes/clients";
import modelesRoutes from "./routes/modeles";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/clients", clientsRoutes);
app.use("/modeles", modelesRoutes);

async function initDatabase() {
  try {
    const sqlPath = path.join(__dirname, "init.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    await pool.query(sql);

    console.log("✅ Tables PostgreSQL initialisées");
  } catch (error) {
    console.error("❌ Erreur initialisation DB :", error);
  }
}

app.get("/test", async (_, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      server_time: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error,
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🚀 Backend lancé sur le port ${PORT}`);

  await initDatabase();
});
app.delete("/clients/:telephone_id", async (req, res) => {
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
      success: false,
      error: "Erreur suppression client"
    });
  }
});