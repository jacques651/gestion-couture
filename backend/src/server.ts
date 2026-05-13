import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { pool } from "./db";
import clientsRoutes from "./routes/clients";
import modelesRoutes from "./routes/modeles-tenues";
import taillesRoutes from "./routes/tailles";
import typesMesuresRoutes from "./routes/types-mesures";
import couleursRoutes from "./routes/couleurs";
import texturesRoutes from "./routes/textures";
import articlesRoutes from "./routes/articles";
import categoriesMatieresRoutes from "./routes/categoriesMatieres";
import matieresRoutes from "./routes/matieres";
import atelierRoutes from "./routes/atelier";
import typesPrestationsRoutes from "./routes/typesPrestations";
import ventesRoutes from "./routes/ventes";
import depensesRoutes from "./routes/depenses";
import rendezVousRoutes from "./routes/rendezvous";
import utilisateursRoutes from "./routes/utilisateurs";
import journalRoutes from "./routes/journal";
import employesRoutes from "./routes/employes";
import prestationsRoutes from "./routes/prestations-realisees";
import salairesRoutes from "./routes/salaires";
import historiqueSalairesRoutes from "./routes/historique-salaires";
import empruntsRoutes from "./routes/emprunts";
import adminRoutes from './routes/admin';
import financesRoutes from "./routes/finances";
import stockRoutes from "./routes/stock";
import paiementsRoutes from './routes/paiements';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Routes
app.use("/clients", clientsRoutes);
app.use("/modeles-tenues", modelesRoutes);
app.use("/tailles", taillesRoutes);
app.use("/types-mesures", typesMesuresRoutes);
app.use("/couleurs", couleursRoutes);
app.use("/textures", texturesRoutes);
app.use("/articles", articlesRoutes);
app.use("/categories-matieres", categoriesMatieresRoutes);
app.use("/matieres", matieresRoutes);
app.use("/atelier", atelierRoutes);
app.use("/types-prestations", typesPrestationsRoutes);
app.use("/ventes", ventesRoutes);
app.use("/depenses", depensesRoutes);
app.use("/rendezvous", rendezVousRoutes);
app.use("/utilisateurs", utilisateursRoutes);
app.use("/journal", journalRoutes);
app.use("/employes", employesRoutes);
app.use("/prestations-realisees", prestationsRoutes);
app.use("/salaires", salairesRoutes);
app.use("/historique-salaires", historiqueSalairesRoutes);
app.use("/emprunts", empruntsRoutes);
app.use('/admin', adminRoutes);
app.use("/finances", financesRoutes);
app.use("/stock", stockRoutes);
app.use('/api/paiements-ventes', paiementsRoutes);
app.use("/paiements-ventes", paiementsRoutes); // Ajout pour compatibilité

async function initDatabase() {
  try {
    // Vérifier si les tables existent déjà
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clients'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log("✅ Base de données déjà initialisée");
      return;
    }
    
    // Si les tables n'existent pas, les créer
    const sqlPath = path.join(__dirname, "init.sql");
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(sqlPath)) {
      console.warn("⚠️ Fichier init.sql non trouvé, création des tables ignorée");
      return;
    }
    
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

app.get("/health", (_, res) => {
  res.json({
    success: true,
    message: "Serveur actif"
  });
});

// Route pour supprimer un client
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
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Erreur suppression client"
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🚀 Backend lancé sur le port ${PORT}`);
  
  // Ne pas exécuter initDatabase en production si elle échoue
  if (process.env.NODE_ENV !== 'production') {
    await initDatabase();
  } else {
    console.log("🔧 Mode production - Initialisation DB ignorée");
  }
});