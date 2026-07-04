// src/App.tsx
import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { Loader, Center, MantineProvider, Button, Text, Alert, Group, Stack } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import AssistantIA from './components/AssistantIA';
import MenuUtilisateur from './components/MenuUtilisateur';
import { resolveApiBase } from './utils/backend';

// ==================== IMPORTS DES PAGES ====================
const Login = lazy(() => import('./components/auth/Login'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const ListeClientsAvecMesures = lazy(() => import('./components/clients/ListeClientsAvecMesures'));
const ConfigurationMesures = lazy(() => import('./components/parametres/ConfigurationMesures'));
const MatieresManager = lazy(() => import('./components/stock/MatieresManager'));
const ArticlesManager = lazy(() => import('./components/stock/ArticlesManager'));
const TypesTenuesManager = lazy(() => import('./components/stock/TypesTenuesManager'));
const MouvementsStock = lazy(() => import('./components/stock/MouvementsStock'));
const VentesManager = lazy(() => import('./components/ventes/VentesManager'));
const HistoriquePaiements = lazy(() => import('./components/ventes/HistoriquePaiements'));
const FacturesRecus = lazy(() => import('./components/factures/FacturesReçus'));
const SuiviRendezVous = lazy(() => import('./components/rendezvous/SuiviRendezVous'));
const BilanFinancier = lazy(() => import('./components/finances/BilanFinancier'));
const JournalCaisse = lazy(() => import('./components/finances/JournalCaisse'));
const ListeDepenses = lazy(() => import('./components/depenses/ListeDepenses'));
const GestionSalaires = lazy(() => import('./components/finances/GestionSalaires'));
const HistoriqueSalaires = lazy(() => import('./components/finances/HistoriqueSalaires'));
const ListeEmployes = lazy(() => import('./components/employes/ListeEmployes'));
const ListeEmprunts = lazy(() => import('./components/emprunts/ListeEmprunts'));
const ListePrestationsRealisees = lazy(() => import('./components/prestations/ListePrestationsRealisees'));
const TaillesManager = lazy(() => import('./components/referentiels/TaillesManager'));
const CouleursManager = lazy(() => import('./components/referentiels/CouleursManager'));
const TexturesManager = lazy(() => import('./components/referentiels/TexturesManager'));
const CategoriesMatieresManager = lazy(() => import('./components/referentiels/CategoriesMatieresManager'));
const ListeTypesPrestations = lazy(() => import('./components/prestations/ListeTypesPrestations'));
const ParametresAtelier = lazy(() => import('./components/parametres/ParametresAtelier'));
const ListeUtilisateurs = lazy(() => import('./components/utilisateurs/ListeUtilisateurs'));
const JournalModifications = lazy(() => import('./components/parametres/JournalModifications'));
const ImportClientsExcel = lazy(() => import('./components/ImportClientsExcel'));
const ExportImportConfiguration = lazy(() => import('./components/ExportImportConfiguration'));
const SupportTechnique = lazy(() => import('./components/support/SupportTechnique'));
const ExportSupport = lazy(() => import('./components/support/ExportSupport'));
const GuideUtilisation = lazy(() => import('./components/support/GuideUtilisation'));
const ConfigurationServeur = lazy(() => import('./components/ConfigurationServeur'));

// ==================== COMPOSANTS ====================
const LoadingFallback = () => (
  <Center style={{ height: '100vh' }}>
    <Loader size="xl" variant="dots" />
  </Center>
);

const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Login />;
  return <>{children}</>;
};

// ==================== LAYOUT PRINCIPAL ====================

function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Fermer la navbar quand on change de page
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    if (window.confirm("Voulez-vous vous déconnecter ?")) {
      logout();
      navigate('/login');
    }
  };

  const routeMap: Record<string, string> = {
    accueil: '/',
    dashboard: '/',
    clients: '/clients',
    'types-mesures': '/types-mesures',
    articles: '/articles',
    matieres: '/matieres',
    'mouvements-stock': '/mouvements-stock',
    'types-tenues': '/types-tenues',
    'modeles-tenues': '/modeles-tenues',
    tailles: '/tailles',
    couleurs: '/couleurs',
    textures: '/textures',
    'categories-matieres': '/categories-matieres',
    'ListeTypesPrestations': '/ListeTypesPrestations',
    atelier: '/atelier',
    ventes: '/ventes',
    'factures-recus': '/factures-recus',
    rendezvous: '/rendezvous',
    'historique-paiements': '/historique-paiements',
    depenses: '/depenses',
    bilan: '/bilan',
    journal: '/journal',
    employes: '/employes',
    'prestations-realisees': '/prestations-realisees',
    salaires: '/salaires',
    'historiques-salaires': '/historiques-salaires',
    emprunts: '/emprunts',
    utilisateurs: '/utilisateurs',
    'config-serveur': '/config-serveur',
    'import-export': '/import-export',
    'export-config': '/export-config',
    'journal-modifications': '/journal-modifications',
    aide: '/aide',
    support: '/support',
    'export-support': '/export-support',
    login: '/login',
  };

  const handleNavigate = (page: string) => {
    const route = routeMap[page] || page;
    navigate(route.startsWith('/') ? route : `/${route}`);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f7fa' }}>
      
      {/* HEADER AVEC BOUTON HAMBURGER */}
      <div style={{
        backgroundColor: '#1b365d',
        height: '56px',
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        
        {/* 🔴 BOUTON HAMBURGER */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '28px',
            width: '44px',
            height: '44px',
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {isOpen ? '✕' : '☰'}
        </button>

        <span style={{ color: '#ffd700', fontWeight: 700, fontSize: '18px', marginLeft: '8px' }}>
          GESTION COUTURE
        </span>

        {/* Utilisateur connecté : clic → Profil / Mot de passe / Déconnexion */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <MenuUtilisateur onLogout={handleLogout} variante="header" />
        </div>
      </div>

      {/* OVERLAY - Fond sombre derrière la navbar */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* NAVBAR - S'ouvre/ferme avec animation */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '280px',
        backgroundColor: '#1b365d',
        zIndex: 1001,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out',
        overflow: 'auto',
        paddingTop: '56px', // Pour ne pas être sous le header
        boxShadow: '2px 0 12px rgba(0,0,0,0.3)',
      }}>
        <Navbar
          userRole={user?.role}
          userName={user?.nom}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          onClose={() => setIsOpen(false)} // Le CloseButton de Navbar ferme aussi
        />
      </div>

      {/* CONTENU PRINCIPAL */}
      <div style={{
        marginTop: '56px',
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        backgroundColor: '#f5f7fa',
        width: '100%',
      }}>
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
        <AssistantIA />
      </div>
    </div>
  );
}

// ==================== APP AUTHENTIFIÉE ====================
function AuthenticatedApp() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Login />;

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<RouteGuard><Dashboard setPage={() => {}} /></RouteGuard>} />
        <Route path="/clients" element={<RouteGuard><ListeClientsAvecMesures /></RouteGuard>} />
        <Route path="/types-mesures" element={<RouteGuard><ConfigurationMesures /></RouteGuard>} />
        <Route path="/articles" element={<RouteGuard><ArticlesManager /></RouteGuard>} />
        <Route path="/matieres" element={<RouteGuard><MatieresManager /></RouteGuard>} />
        <Route path="/mouvements-stock" element={<RouteGuard><MouvementsStock /></RouteGuard>} />
        <Route path="/types-tenues" element={<RouteGuard><TypesTenuesManager /></RouteGuard>} />
        <Route path="/modeles-tenues" element={<RouteGuard><TypesTenuesManager /></RouteGuard>} />
        <Route path="/tailles" element={<RouteGuard><TaillesManager /></RouteGuard>} />
        <Route path="/couleurs" element={<RouteGuard><CouleursManager /></RouteGuard>} />
        <Route path="/textures" element={<RouteGuard><TexturesManager /></RouteGuard>} />
        <Route path="/categories-matieres" element={<RouteGuard><CategoriesMatieresManager /></RouteGuard>} />
        <Route path="/ListeTypesPrestations" element={<RouteGuard><ListeTypesPrestations /></RouteGuard>} />
        <Route path="/atelier" element={<RouteGuard><ParametresAtelier /></RouteGuard>} />
        <Route path="/ventes" element={<RouteGuard><VentesManager /></RouteGuard>} />
        <Route path="/factures-recus" element={<RouteGuard><FacturesRecus /></RouteGuard>} />
        <Route path="/rendezvous" element={<RouteGuard><SuiviRendezVous /></RouteGuard>} />
        <Route path="/historique-paiements" element={<RouteGuard><HistoriquePaiements /></RouteGuard>} />
        <Route path="/depenses" element={<RouteGuard><ListeDepenses /></RouteGuard>} />
        <Route path="/bilan" element={<RouteGuard><BilanFinancier /></RouteGuard>} />
        <Route path="/journal" element={<RouteGuard><JournalCaisse /></RouteGuard>} />
        <Route path="/employes" element={<RouteGuard><ListeEmployes /></RouteGuard>} />
        <Route path="/prestations-realisees" element={<RouteGuard><ListePrestationsRealisees /></RouteGuard>} />
        <Route path="/salaires" element={<RouteGuard><GestionSalaires /></RouteGuard>} />
        <Route path="/historiques-salaires" element={<RouteGuard><HistoriqueSalaires /></RouteGuard>} />
        <Route path="/emprunts" element={<RouteGuard><ListeEmprunts /></RouteGuard>} />
        <Route path="/utilisateurs" element={<RouteGuard><ListeUtilisateurs /></RouteGuard>} />
        <Route path="/config-serveur" element={<RouteGuard><ConfigurationServeur /></RouteGuard>} />
        <Route path="/import-export" element={<RouteGuard><ImportClientsExcel /></RouteGuard>} />
        <Route path="/export-config" element={<RouteGuard><ExportImportConfiguration /></RouteGuard>} />
        <Route path="/journal-modifications" element={<RouteGuard><JournalModifications /></RouteGuard>} />
        <Route path="/aide" element={<RouteGuard><GuideUtilisation /></RouteGuard>} />
        <Route path="/support" element={<RouteGuard><SupportTechnique /></RouteGuard>} />
        <Route path="/export-support" element={<RouteGuard><ExportSupport /></RouteGuard>} />
        <Route path="*" element={<RouteGuard><Center style={{ height: '50vh' }}><div><h2>🔍 404</h2><Button onClick={() => window.location.href = '/'}>Accueil</Button></div></Center></RouteGuard>} />
      </Routes>
    </MainLayout>
  );
}

// ==================== QUERY CLIENT ====================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false
    }
  },
});

// ==================== SERVER STATUS ====================
type ServerStatus = 'checking' | 'ready' | 'error';

const ServerStartupScreen = ({ attempt }: { attempt: number }) => (
  <Center style={{ height: '100vh', backgroundColor: '#f5f7fa' }}>
    <Stack align="center" gap="md" p="xl">
      <Loader size="xl" />
      <Text fw={600} size="lg" c="#1b365d">Démarrage...</Text>
      <Text size="sm" c="dimmed">Tentative {attempt}</Text>
    </Stack>
  </Center>
);

const ServerErrorScreen = ({ onRetry, onManualConfig }: { onRetry: () => void; onManualConfig: () => void }) => (
  <Center style={{ height: '100vh', backgroundColor: '#f5f7fa', padding: 16 }}>
    <Alert color="red" title="⚠️ Serveur introuvable" style={{ maxWidth: 500 }}>
      <Text size="sm">Le serveur ne répond pas.</Text>
      <Group mt="md">
        <Button onClick={onRetry}>🔄 Réessayer</Button>
        <Button variant="subtle" onClick={onManualConfig}>🔧 Configurer</Button>
      </Group>
    </Alert>
  </Center>
);

// ==================== APP ====================
function App() {
  const [status, setStatus] = useState<ServerStatus>('checking');
  const [attempt, setAttempt] = useState(0);
  const [manualConfig, setManualConfig] = useState(false);

  const detecterServeur = async () => {
    setStatus('checking');
    setAttempt(0);
    const base = await resolveApiBase({
      maxWaitMs: 45000,
      onProgress: (a) => setAttempt(a),
    });
    setStatus(base ? 'ready' : 'error');
  };

  useEffect(() => { detecterServeur(); }, []);

  if (status === 'checking') {
    return <MantineProvider theme={theme}><ServerStartupScreen attempt={attempt} /></MantineProvider>;
  }

  if (status === 'error') {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme}>
          <Notifications />
          {manualConfig ? (
            <BrowserRouter>
              <Routes><Route path="*" element={<Suspense><ConfigurationServeur /></Suspense>} /></Routes>
            </BrowserRouter>
          ) : (
            <ServerErrorScreen onRetry={detecterServeur} onManualConfig={() => setManualConfig(true)} />
          )}
        </MantineProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Notifications />
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