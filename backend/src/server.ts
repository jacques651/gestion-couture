import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { pool } from "./db";

// Routes
import clientsRoutes from "./routes/clients";
import taillesRoutes from "./routes/tailles";
import typesMesuresRoutes from "./routes/types-mesures";
import modelesTenuesRoutes from "./routes/modelesTenues";
import typesTenuesRoutes from "./routes/types-tenues";
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

dotenv.config({
  path: path.join(path.dirname(process.execPath), ".env")
});

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Logger middleware pour déboguer
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// Routes API - UNIQUEMENT ICI, PAS DE ROUTES DIRECTES
app.use("/clients", clientsRoutes);
app.use("/modeles-tenues", modelesTenuesRoutes);
app.use("/types-tenues", typesTenuesRoutes);
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
app.use("/journal-modifications", journalRoutes);
app.use("/employes", employesRoutes);
app.use("/prestations-realisees", prestationsRoutes);
app.use("/salaires", salairesRoutes);
app.use("/historique-salaires", historiqueSalairesRoutes);
app.use("/emprunts", empruntsRoutes);
app.use('/admin', adminRoutes);
app.use("/finances", financesRoutes);
app.use("/mouvements-stock", stockRoutes);
app.use("/stock", stockRoutes);

// Routes de test
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
    message: "Serveur actif",
    timestamp: new Date().toISOString()
  });
});

// ============================================
// INITIALISATION DE LA BASE DE DONNÉES
// ============================================

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
    const sqlPath = path.join(__dirname, "..", "init.sql");
    
    // Alternative pour l'exécutable compilé
    let finalPath = sqlPath;
    if (!fs.existsSync(sqlPath)) {
      finalPath = path.join(path.dirname(process.execPath), "init.sql");
    }

    // Vérifier si le fichier existe
    if (!fs.existsSync(finalPath)) {
      console.warn("⚠️ Fichier init.sql non trouvé, création des tables ignorée");
      console.warn(`   Recherché à: ${finalPath}`);
      return;
    }

    const sql = fs.readFileSync(finalPath, "utf-8");
    await pool.query(sql);
    console.log("✅ Tables PostgreSQL initialisées avec succès");
  } catch (error) {
    console.error("❌ Erreur initialisation DB :", error);
  }
}

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route non trouvée: ${req.method} ${req.url}`
  });
});

// Gestion des erreurs globales
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Erreur globale:", err);
  res.status(500).json({
    success: false,
    error: "Erreur interne du serveur",
    message: err.message
  });
});

// Convertir le port en nombre
const PORT = parseInt(process.env.PORT || "3001", 10);

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Backend lancé sur le port ${PORT}`);
  console.log(`📡 Accessible sur http://0.0.0.0:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  await initDatabase();
});

export default app;