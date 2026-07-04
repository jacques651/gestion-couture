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

// Chargement du .env : on cherche au bon endroit selon le contexte
// - exe empaqueté (pkg)     → à côté de l'exécutable
// - dev / node dist/server  → dossier backend
const envCandidates = [
  path.join(path.dirname(process.execPath), ".env"), // exe pkg
  path.join(__dirname, "..", ".env"),                // backend/.env (dev et dist)
  path.join(process.cwd(), ".env"),                  // dossier courant
];
const envPath = envCandidates.find(p => fs.existsSync(p));
dotenv.config(envPath ? { path: envPath } : {});

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

// ============================================
// SERVIR LE FRONTEND STATIQUE
// ============================================

// Résolution intelligente du dossier frontend :
// - production (dist/server.js ou exe) → dist/public
// - développement (ts-node depuis src) → backend/public (sortie de vite build)
const publicCandidates = [
  path.join(__dirname, 'public'),        // backend/dist/public (production)
  path.join(__dirname, '..', 'public'),  // backend/public (sortie vite build)
];
const publicPath = publicCandidates.find(p => fs.existsSync(p)) || publicCandidates[0];

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  console.log(`✅ Frontend statique servi depuis: ${publicPath}`);
} else {
  console.warn(`⚠️ Dossier public non trouvé: ${publicPath}`);
  console.warn('   Construis le frontend avec: npm run build (en mode dev, utilisez plutôt http://localhost:1420)');
}

// ============================================
// 🔥 ROUTE SPÉCIFIQUE - DOIT ÊTRE AVANT LA ROUTE GENERIQUE
// ============================================

// GET /api/clients/details/:telephone_id - Récupérer un client avec ses mesures
app.get('/api/clients/details/:telephone_id', async (req, res) => {
  try {
    const { telephone_id } = req.params;
    
    console.log(`🔍 Recherche client avec telephone_id: ${telephone_id}`);
    
    // Décoder l'URL si nécessaire
    const decodedTelephone = decodeURIComponent(telephone_id);
    console.log(`🔍 Téléphone décodé: ${decodedTelephone}`);
    
    // Récupérer le client
    const clientResult = await pool.query(`
      SELECT * FROM clients 
      WHERE telephone_id = $1 AND est_supprime = 0
    `, [decodedTelephone]);
    
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    const client = clientResult.rows[0];
    
    // Récupérer les mesures
    const mesuresResult = await pool.query(`
      SELECT 
        tm.nom,
        mc.valeur,
        tm.unite
      FROM mesures_clients mc
      JOIN types_mesures tm ON tm.id = mc.type_mesure_id
      WHERE mc.client_id = $1
      ORDER BY tm.id
    `, [client.id]);
    
    client.mesures = mesuresResult.rows;
    
    console.log(`✅ Client trouvé: ${client.nom_prenom}, ${mesuresResult.rows.length} mesures`);
    
    res.json(client);
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du client', 
      details: error.message 
    });
  }
});

// ============================================
// ROUTES API (préfixées par /api)
// ============================================

const API_PREFIX = '/api';

app.use(`${API_PREFIX}/clients`, clientsRoutes);
app.use(`${API_PREFIX}/modeles-tenues`, modelesTenuesRoutes);
app.use(`${API_PREFIX}/types-tenues`, typesTenuesRoutes);
app.use(`${API_PREFIX}/tailles`, taillesRoutes);
app.use(`${API_PREFIX}/types-mesures`, typesMesuresRoutes);
app.use(`${API_PREFIX}/couleurs`, couleursRoutes);
app.use(`${API_PREFIX}/textures`, texturesRoutes);
app.use(`${API_PREFIX}/articles`, articlesRoutes);
app.use(`${API_PREFIX}/categories-matieres`, categoriesMatieresRoutes);
app.use(`${API_PREFIX}/matieres`, matieresRoutes);
app.use(`${API_PREFIX}/atelier`, atelierRoutes);
app.use(`${API_PREFIX}/types-prestations`, typesPrestationsRoutes);
app.use(`${API_PREFIX}/ventes`, ventesRoutes);
app.use(`${API_PREFIX}/depenses`, depensesRoutes);
app.use(`${API_PREFIX}/rendezvous`, rendezVousRoutes);
app.use(`${API_PREFIX}/utilisateurs`, utilisateursRoutes);
app.use(`${API_PREFIX}/journal`, journalRoutes);
app.use(`${API_PREFIX}/journal-modifications`, journalRoutes);
app.use(`${API_PREFIX}/employes`, employesRoutes);
app.use(`${API_PREFIX}/prestations-realisees`, prestationsRoutes);
app.use(`${API_PREFIX}/salaires`, salairesRoutes);
app.use(`${API_PREFIX}/historique-salaires`, historiqueSalairesRoutes);
app.use(`${API_PREFIX}/emprunts`, empruntsRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/finances`, financesRoutes);
app.use(`${API_PREFIX}/mouvements-stock`, stockRoutes);
app.use(`${API_PREFIX}/stock`, stockRoutes);

// Route de test API
app.get(`${API_PREFIX}/test`, async (_, res) => {
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
// SPA FALLBACK - Toutes les routes non-API
// ============================================

// IMPORTANT: Ce middleware doit être APRÈS toutes les routes API
// Utiliser app.use au lieu de app.get pour capturer toutes les méthodes HTTP
app.use((req, res, next) => {
  // Ignorer les routes API
  if (req.path.startsWith(API_PREFIX) || req.path === '/health' || req.path === '/test') {
    return next();
  }
  
  // Servir index.html pour le SPA
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Frontend not built. Run npm run build first.' });
  }
});

// ============================================
// INITIALISATION DE LA BASE DE DONNÉES
// ============================================

async function initDatabase() {
  try {
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

    const sqlPath = path.join(__dirname, "..", "init.sql");
    let finalPath = sqlPath;
    if (!fs.existsSync(sqlPath)) {
      finalPath = path.join(path.dirname(process.execPath), "init.sql");
    }

    if (!fs.existsSync(finalPath)) {
      console.warn("⚠️ Fichier init.sql non trouvé");
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

// Gestion des erreurs 404 (API uniquement)
app.use((req, res, next) => {
  if (req.path.startsWith(API_PREFIX) || req.path === '/health') {
    res.status(404).json({
      success: false,
      error: `Route non trouvée: ${req.method} ${req.url}`
    });
  } else {
    next();
  }
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
  console.log(`🌐 Application web: http://localhost:${PORT}`);
  
  await initDatabase();
});

export default app;