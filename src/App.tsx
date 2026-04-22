import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, BrowserRouter, useNavigate, useParams } from 'react-router-dom';
import { AppShell, Loader, Center, MantineProvider, Button } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Database from '@tauri-apps/plugin-sql';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// ==================== AUTH ====================
const Login = lazy(() => import('./components/auth/Login'));

// ==================== DASHBOARD ====================
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));

// ==================== GESTION COMMERCIALE ====================
const ListeClientsAvecMesures = lazy(() => import('./components/clients/ListeClientsAvecMesures'));
const ListeCommandes = lazy(() => import('./components/commandes/ListeCommandes'));
const ListePaiements = lazy(() => import('./components/paiements/ListePaiements'));
const FacturesReçus = lazy(() => import('./components/factures/FacturesReçus'));

// ==================== STOCK & PRODUITS ====================
const StockGlobalPage = lazy(() => import('./components/stock/StockGlobalPage'));
const ListeMatieres = lazy(() => import('./components/matieres/ListeMatieres'));
const ListeVentes = lazy(() => import('./components/ventes/ListeVentes'));
const ListeEntreesStock = lazy(() => import('./components/stock/ListeEntreesStock'));
const ListeSortiesStock = lazy(() => import('./components/stock/ListeSortiesStock'));

// ==================== FINANCES ====================
const BilanFinancier = lazy(() => import('./components/finances/BilanFinancier'));
const JournalCaisse = lazy(() => import('./components/finances/JournalCaisse'));
const ListeDepenses = lazy(() => import('./components/depenses/ListeDepenses'));
const GestionSalaires = lazy(() => import('./components/finances/GestionSalaires'));
const HistoriqueSalaires = lazy(() => import('./components/finances/HistoriqueSalaires'));
const BulletinSalaire = lazy(() => import('./components/finances/BulletinSalaire'));

// ==================== RESSOURCES HUMAINES ====================
const ListeEmployes = lazy(() => import('./components/employes/ListeEmployes'));
const ListeEmprunts = lazy(() => import('./components/emprunts/ListeEmprunts'));
const ListePrestationsRealisees = lazy(() => import('./components/prestations/ListePrestationsRealisees'));

// ==================== RÉFÉRENTIELS ====================
const ListeTypesPrestations = lazy(() => import('./components/prestations/ListeTypesPrestations'));
const ConfigurationMesures = lazy(() => import('./components/parametres/ConfigurationMesures'));

// ==================== PARAMÈTRES ====================
const ParametresAtelier = lazy(() => import('./components/parametres/ParametresAtelier'));
const ListeUtilisateurs = lazy(() => import('./components/utilisateurs/ListeUtilisateurs'));

// ==================== AUTRES ====================
const ListeSortiesTenues = lazy(() => import('./components/tenues/ListeSortiesTenues'));

type PageKey = 
  | 'dashboard' | 'clients' | 'commandes' | 'paiements' | 'factures'
  | 'stock_global' | 'matieres' | 'ventes' | 'depenses' | 'salaires'
  | 'journal_caisse' | 'bilan' | 'utilisateurs' | 'mesures' | 'parametres'
  | 'employes' | 'prestations_types' | 'prestations_realisees' | 'emprunts' | 'sorties_tenues'
  | 'historique_salaires';  // ✅
// ==================== COMPOSANTS ====================
const LoadingFallback = () => (
  <Center style={{ height: '100vh' }}>
    <Loader size="xl" variant="dots" />
  </Center>
);

function RouteGuard({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return <Login />;
  if (roles && user && !roles.includes(user.role)) {
    return (
      <Center style={{ height: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>⛔ Accès non autorisé</h2>
          <p>Vous n'avez pas les permissions nécessaires.</p>
          <Button onClick={() => navigate('/')} mt="md">Retour au Dashboard</Button>
        </div>
      </Center>
    );
  }
  return <>{children}</>;
}

function BulletinPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) return <LoadingFallback />;
  return <BulletinSalaire employeId={Number(id)} onClose={() => navigate('/salaires')} />;
}

// ==================== APP AUTHENTIFIÉE ====================
function AuthenticatedApp() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const initSqlite = async () => {
      try {
        const db = await Database.load("sqlite:gestion-couture.db");
        await db.execute(`CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, telephone TEXT, adresse TEXT, date_creation DATETIME DEFAULT CURRENT_TIMESTAMP, est_supprime INTEGER DEFAULT 0);`);
        await db.execute(`CREATE TABLE IF NOT EXISTS matieres (id INTEGER PRIMARY KEY AUTOINCREMENT, designation TEXT NOT NULL, unite TEXT, est_supprime INTEGER DEFAULT 0);`);
        await db.execute(`CREATE TABLE IF NOT EXISTS entrees_stock (id INTEGER PRIMARY KEY AUTOINCREMENT, matiere_id INTEGER, quantite REAL, cout_unitaire REAL, date DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(matiere_id) REFERENCES matieres(id));`);
        await db.execute(`CREATE TABLE IF NOT EXISTS sorties_stock (id INTEGER PRIMARY KEY AUTOINCREMENT, matiere_id INTEGER, quantite REAL, date DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(matiere_id) REFERENCES matieres(id));`);
        console.log("✅ SQLite Initialisé");
      } catch (error) {
        console.error("❌ Erreur SQLite:", error);
      }
    };
    initSqlite();
  }, []);

  const handleLogout = () => {
    if (window.confirm("Voulez-vous vous déconnecter ?")) {
      logout();
      navigate('/login');
    }
  };

  const handleSetPage = (page: PageKey) => {
  const routeMap: Record<PageKey, string> = {
    dashboard: '/',
    clients: '/clients',
    commandes: '/commandes',
    paiements: '/paiements',
    factures: '/factures',
    stock_global: '/stock',
    matieres: '/matieres',
    ventes: '/ventes',
    depenses: '/depenses',
    salaires: '/salaires',
    journal_caisse: '/journal',
    bilan: '/bilan',
    utilisateurs: '/utilisateurs',
    mesures: '/mesures',
    parametres: '/parametres',
    employes: '/employes',
    prestations_types: '/prestations-types',
    prestations_realisees: '/prestations-realisees',
    emprunts: '/emprunts',
    sorties_tenues: '/sorties-tenues',
    historique_salaires: ''
  };
  navigate(routeMap[page] || '/');
};

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Login />;

  return (
    <AppShell padding="md" navbar={{ width: 280, breakpoint: 'sm' }} styles={{ main: { height: '100%', overflow: 'auto', backgroundColor: '#f5f7fa' } }}>
      <AppShell.Navbar>
        <Navbar userRole={user?.role} userName={user?.nom} onLogout={handleLogout} />
      </AppShell.Navbar>
      <AppShell.Main>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* DASHBOARD */}
            <Route path="/" element={<RouteGuard roles={['admin', 'gestionnaire']}><Dashboard setPage={handleSetPage} /></RouteGuard>} />

            {/* GESTION COMMERCIALE */}
            <Route path="/clients" element={<RouteGuard roles={['admin', 'gestionnaire']}><ListeClientsAvecMesures /></RouteGuard>} />
            <Route path="/commandes" element={<RouteGuard roles={['admin', 'gestionnaire']}><ListeCommandes /></RouteGuard>} />
            <Route path="/paiements" element={<RouteGuard roles={['admin', 'gestionnaire']}><ListePaiements /></RouteGuard>} />
            <Route path="/factures" element={<RouteGuard roles={['admin', 'gestionnaire']}><FacturesReçus /></RouteGuard>} />

            {/* STOCK & PRODUITS */}
            <Route path="/stock" element={<RouteGuard roles={['admin', 'gestionnaire']}><StockGlobalPage /></RouteGuard>} />
            <Route path="/matieres" element={<RouteGuard roles={['admin', 'gestionnaire']}><ListeMatieres /></RouteGuard>} />
            <Route path="/ventes" element={<RouteGuard roles={['admin', 'gestionnaire']}><ListeVentes /></RouteGuard>} />
            <Route path="/entrees-stock" element={<RouteGuard roles={['admin', 'gestionnaire']}><ListeEntreesStock /></RouteGuard>} />
            <Route path="/sorties-stock" element={<RouteGuard roles={['admin', 'gestionnaire']}><ListeSortiesStock /></RouteGuard>} />

            {/* FINANCES */}
            <Route path="/bilan" element={<RouteGuard roles={['admin']}><BilanFinancier /></RouteGuard>} />
            <Route path="/journal" element={<RouteGuard roles={['admin']}><JournalCaisse /></RouteGuard>} />
            <Route path="/depenses" element={<RouteGuard roles={['admin']}><ListeDepenses /></RouteGuard>} />
            <Route path="/salaires" element={<RouteGuard roles={['admin']}><GestionSalaires /></RouteGuard>} />
            <Route path="/historique-salaires" element={<RouteGuard roles={['admin']}><HistoriqueSalaires /></RouteGuard>} />
            
            {/* RESSOURCES HUMAINES */}
            <Route path="/employes" element={<RouteGuard roles={['admin']}><ListeEmployes /></RouteGuard>} />
            <Route path="/emprunts" element={<RouteGuard roles={['admin', 'gestionnaire']}><ListeEmprunts /></RouteGuard>} />
            <Route path="/prestations-realisees" element={<RouteGuard roles={['admin']}><ListePrestationsRealisees /></RouteGuard>} />

            {/* RÉFÉRENTIELS */}
            <Route path="/prestations-types" element={<RouteGuard roles={['admin']}><ListeTypesPrestations /></RouteGuard>} />
            <Route path="/mesures" element={<RouteGuard roles={['admin']}><ConfigurationMesures /></RouteGuard>} />

            {/* PARAMÈTRES */}
            <Route path="/utilisateurs" element={<RouteGuard roles={['admin']}><ListeUtilisateurs /></RouteGuard>} />
            <Route path="/parametres" element={<RouteGuard roles={['admin']}><ParametresAtelier /></RouteGuard>} />

            {/* AUTRES */}
            <Route path="/sorties-tenues" element={<RouteGuard roles={['admin', 'gestionnaire']}><ListeSortiesTenues onClose={() => navigate('/')} onSuccess={() => {}} /></RouteGuard>} />
            <Route path="/bulletin/:id" element={<BulletinPage />} />

            {/* 404 */}
            <Route path="*" element={<Center style={{ height: '50vh' }}><div style={{ textAlign: 'center' }}><h2>🔍 404 - Page non trouvée</h2><p>La page que vous recherchez n'existe pas.</p><Button onClick={() => navigate('/')} mt="md">Retour au Dashboard</Button></div></Center>} />
          </Routes>
        </Suspense>
      </AppShell.Main>
    </AppShell>
  );
}

// ==================== QUERY CLIENT ====================
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false } },
});

// ==================== APP PRINCIPALE ====================
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <Notifications position="top-right" zIndex={1000} />
        <BrowserRouter>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;