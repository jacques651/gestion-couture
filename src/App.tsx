// src/App.tsx
import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, BrowserRouter, useNavigate } from 'react-router-dom';
import { AppShell, Loader, Center, MantineProvider, Button, Text, Alert } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import AssistantIA from './components/AssistantIA';
import { apiGet } from './services/api';
import HistoriquePaiements from './components/ventes/HistoriquePaiements';

// ==================== AUTH ====================
const Login = lazy(() => import('./components/auth/Login'));

// ==================== DASHBOARD ====================
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));

// ==================== CLIENTS ====================
const ListeClientsAvecMesures = lazy(() => import('./components/clients/ListeClientsAvecMesures'));

// ==================== STOCK & INVENTAIRE ====================
const MatieresManager = lazy(() => import('./components/stock/MatieresManager'));
const ArticlesManager = lazy(() => import('./components/stock/ArticlesManager'));
const TypesTenuesManager = lazy(() => import('./components/stock/TypesTenuesManager')); const MouvementsStock = lazy(() => import('./components/stock/MouvementsStock'));

// ==================== VENTES ====================
const VentesManager = lazy(() => import('./components/ventes/VentesManager'));

// ==================== FACTURES & REÇUS ====================
const FacturesRecus = lazy(() => import('./components/factures/FacturesReçus'));

// ==================== RENDEZ-VOUS ====================
const SuiviRendezVous = lazy(() => import('./components/rendezvous/SuiviRendezVous'));

// ==================== FINANCES ====================
const BilanFinancier = lazy(() => import('./components/finances/BilanFinancier'));
const JournalCaisse = lazy(() => import('./components/finances/JournalCaisse'));
const ListeDepenses = lazy(() => import('./components/depenses/ListeDepenses'));
const GestionSalaires = lazy(() => import('./components/finances/GestionSalaires'));
const HistoriqueSalaires = lazy(() => import('./components/finances/HistoriqueSalaires'));

// ==================== RESSOURCES HUMAINES ====================
const ListeEmployes = lazy(() => import('./components/employes/ListeEmployes'));
const ListeEmprunts = lazy(() => import('./components/emprunts/ListeEmprunts'));
const ListePrestationsRealisees = lazy(() => import('./components/prestations/ListePrestationsRealisees'));

// ==================== RÉFÉRENTIELS ====================
const TaillesManager = lazy(() => import('./components/referentiels/TaillesManager'));
const CouleursManager = lazy(() => import('./components/referentiels/CouleursManager'));
const TexturesManager = lazy(() => import('./components/referentiels/TexturesManager'));
const CategoriesMatieresManager = lazy(() => import('./components/referentiels/CategoriesMatieresManager'));
const ListeTypesPrestations = lazy(() => import('./components/prestations/ListeTypesPrestations'));
const ConfigurationMesures = lazy(() => import('./components/parametres/ConfigurationMesures'));

// ==================== PARAMÈTRES ====================
const ParametresAtelier = lazy(() => import('./components/parametres/ParametresAtelier'));
const ListeUtilisateurs = lazy(() => import('./components/utilisateurs/ListeUtilisateurs'));
const JournalModifications = lazy(() => import('./components/parametres/JournalModifications'));

// ==================== OUTILS ====================
const ImportClientsExcel = lazy(() => import('./components/ImportClientsExcel'));
const ExportImportConfiguration = lazy(() => import('./components/ExportImportConfiguration'));

// ==================== SUPPORT & AIDE ====================
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

function RouteGuard({ children, roles, fonctionnalite }: { children: React.ReactNode; roles?: string[]; fonctionnalite?: string }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        console.log("🔍 USER:", JSON.stringify(user));
        console.log("🔍 FONCTIONNALITE:", fonctionnalite);

        if (user?.role === 'admin') {
          console.log("🔍 Admin détecté - accès total");
          setHasAccess(true);
          setChecking(false);
          return;
        }

        if (fonctionnalite) {
          console.log("🔍 Vérification permissions pour:", fonctionnalite);
          const perms = await apiGet(`/utilisateurs/${user?.id || 0}/permissions`);
          console.log("🔍 PERMS reçues:", perms.length, "lignes");
          console.log("🔍 PERMS:", JSON.stringify(perms));
          const p = perms.find((x: any) => x.fonctionnalite === fonctionnalite);
          console.log("🔍 Permission trouvée:", p);
          console.log("🔍 p?.lecture:", p?.lecture, "| p?.lecture === 1:", p?.lecture === 1);
          setHasAccess(p?.lecture === 1 || p?.lecture === true);
        } else {
          console.log("🔍 Pas de fonctionnalite - accès accordé");
        }
      } catch (error) {
        console.error("❌ Erreur:", error);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    if (isAuthenticated) {
      check();
    } else {
      setChecking(false);
    }
  }, [fonctionnalite, user, isAuthenticated]);

  if (!isAuthenticated) return <Login />;
  if (checking) return <LoadingFallback />;

  if (!hasAccess) {
    return (
      <Center style={{ height: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>⛔ Accès non autorisé</h2>
          <p>Permissions insuffisantes.</p>
          <Button onClick={() => navigate('/')} mt="md">Retour au Dashboard</Button>
        </div>
      </Center>
    );
  }

  // ✅ Si fonctionnalite est définie, on se fie aux permissions (pas aux rôles)
  if (fonctionnalite) {
    return <>{children}</>;
  }

  // ✅ Sinon, on vérifie les rôles (compatibilité)
  if (roles && user && !roles.includes(user.role)) {
    return (
      <Center style={{ height: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>⛔ Accès non autorisé</h2>
          <p>Rôle non autorisé.</p>
          <Button onClick={() => navigate('/')} mt="md">Retour au Dashboard</Button>
        </div>
      </Center>
    );
  }

  return <>{children}</>;
}

// ==================== APP AUTHENTIFIÉE ====================
function AuthenticatedApp() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // ✅ TOUS LES HOOKS D'ABORD (avant tout return conditionnel)
  const [erreurAPI, setErreurAPI] = useState(false);
  const [verificationFaite, setVerificationFaite] = useState(false);
  const [] = useState(false);

  // Vérifier la connexion au démarrage
  useEffect(() => {
    const verifierConnexion = async () => {
      try {
        const url = localStorage.getItem('api_url') || '';
        console.log('🔍 Vérification connexion à:', url);

        // Ajouter un timeout de 5 secondes
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${url}/health`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log('✅ Serveur accessible');
          setErreurAPI(false);
        } else {
          console.log('❌ Serveur non accessible');
          setErreurAPI(true);
        }
      } catch (error) {
        console.error('❌ Erreur de connexion:', error);
        setErreurAPI(true);
      } finally {
        setVerificationFaite(true);
      }
    };

    verifierConnexion();
  }, []);

  useEffect(() => {
    if (!erreurAPI && verificationFaite) {
      console.log('✅ API PostgreSQL prête');
    }
  }, [erreurAPI, verificationFaite]);

  // ⚠️ LES RETOURS CONDITIONNELS VIENNENT APRÈS TOUS LES HOOKS
  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Login />;

  // Affichage de l'alerte API si erreur
  if (verificationFaite && erreurAPI) {
    return (
      <Center style={{ height: '100vh' }}>
        <Alert
          color="red"
          title="⚠️ Connexion impossible"
          variant="filled"
          style={{ maxWidth: 500 }}
        >
          <Text>L'application ne parvient pas à contacter le serveur.</Text>
          <Text mt="sm" fw={500}>Assurez-vous que :</Text>
          <Text>• Le serveur (ordinateur principal) est allumé</Text>
          <Text>• Le backend Express est démarré sur le serveur</Text>
          <Text>• Les deux ordinateurs sont sur le même réseau</Text>
          <Text>• Le firewall autorise le port 3001</Text>

          <Button
            mt="md"
            onClick={() => {
              console.log('🔧 Navigation vers configuration serveur');
              // Utiliser window.location pour forcer la navigation
              window.location.href = '/config-serveur';
            }}
            variant="white"
          >
            🔧 Configurer le serveur
          </Button>

          <Button
            mt="md"
            onClick={() => {
              window.location.reload();
            }}
            variant="subtle"
            style={{ marginLeft: '10px' }}
          >
            🔄 Réessayer
          </Button>
        </Alert>
      </Center>
    );
  }


  const handleLogout = () => {
    const confirmed = globalThis.confirm("Voulez-vous vous déconnecter ?");
    if (!confirmed) return;
    logout();
    navigate('/login');
  };

  const handleSetPage = (page: string) => {
    const routeMap: Record<string, string> = {
      dashboard: '/',
      clients: '/clients',
      types_mesures: '/types-mesures',
      articles: '/articles',
      matieres: '/matieres',
      mouvements_stock: '/mouvements-stock',
      tailles: '/tailles',
      couleurs: '/couleurs',
      textures: '/textures',
      types_tenues: '/types-tenues',
      categories_matieres: '/categories-matieres',
      ListeTypesPrestations: '/ListeTypesPrestations',
      atelier: '/atelier',
      ventes: '/ventes',
      factures_recus: '/factures-recus',
      depenses: '/depenses',
      bilan: '/bilan',
      journal: '/journal',
      employes: '/employes',
      prestations_realisees: '/prestations-realisees',
      salaires: '/salaires',
      emprunts: '/emprunts',
      utilisateurs: '/utilisateurs',
      ConfigurationServeur: '/config-serveur',
      import_export: '/import-export',
      export_config: '/export-config',
      journal_modifications: '/journal-modifications',
      aide: '/aide',
      support: '/support',
      SuiviRendezVous: '/SuiviRendezVous',
      HistoriquePaiements: '/HistoriquePaiements',
      export_support: '/export-support',
    };
    navigate(routeMap[page] || '/');
  };

  return (
    <AppShell
      padding="md"
      navbar={{ width: 280, breakpoint: 'sm' }}
      styles={{ main: { height: '100%', overflow: 'auto', backgroundColor: '#f5f7fa' } }}
    >
      <AppShell.Navbar>
        <Navbar userRole={user?.role} userName={user?.nom} onLogout={handleLogout} onNavigate={handleSetPage} />
      </AppShell.Navbar>
      <AppShell.Main>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* DASHBOARD */}
            <Route path="/" element={
              <RouteGuard fonctionnalite="dashboard">
                <Dashboard setPage={handleSetPage} />
              </RouteGuard>
            } />

            {/* CLIENTS */}
            <Route path="/clients" element={
              <RouteGuard fonctionnalite="clients">
                <ListeClientsAvecMesures />
              </RouteGuard>
            } />
            <Route path="/types-mesures" element={
              <RouteGuard fonctionnalite="types_mesures">
                <ConfigurationMesures />
              </RouteGuard>
            } />

            {/* STOCK & INVENTAIRE */}
            <Route path="/articles" element={
              <RouteGuard fonctionnalite="articles">
                <ArticlesManager />
              </RouteGuard>
            } />
            <Route path="/matieres" element={
              <RouteGuard fonctionnalite="matieres">
                <MatieresManager />
              </RouteGuard>
            } />
            <Route path="/mouvements-stock" element={
              <RouteGuard fonctionnalite="mouvements_stock">
                <MouvementsStock />
              </RouteGuard>
            } />

            {/* RÉFÉRENTIELS */}
            <Route path="/tailles" element={
              <RouteGuard fonctionnalite="tailles">
                <TaillesManager />
              </RouteGuard>
            } />
            <Route path="/couleurs" element={
              <RouteGuard fonctionnalite="couleurs">
                <CouleursManager />
              </RouteGuard>
            } />
            <Route path="/textures" element={
              <RouteGuard fonctionnalite="textures">
                <TexturesManager />
              </RouteGuard>
            } />
            <Route path="/types-tenues" element={
              <RouteGuard fonctionnalite="types_tenues">
                <TypesTenuesManager />
              </RouteGuard>
            } />
            <Route path="/modeles-tenues" element={
              <RouteGuard fonctionnalite="types_tenues">
                <TypesTenuesManager />
              </RouteGuard>
            } />
            <Route path="/categories-matieres" element={
              <RouteGuard fonctionnalite="categories_matieres">
                <CategoriesMatieresManager />
              </RouteGuard>
            } />
            <Route path="/ListeTypesPrestations" element={
              <RouteGuard fonctionnalite="types_prestations">
                <ListeTypesPrestations />
              </RouteGuard>
            } />
            <Route path="/atelier" element={
              <RouteGuard fonctionnalite="atelier">
                <ParametresAtelier />
              </RouteGuard>
            } />

            {/* VENTES */}
            <Route path="/ventes" element={
              <RouteGuard fonctionnalite="ventes">
                <VentesManager />
              </RouteGuard>
            } />

            {/* FACTURES & REÇUS */}
            <Route path="/factures-recus" element={
              <RouteGuard fonctionnalite="factures_recus">
                <FacturesRecus />
              </RouteGuard>
            } />

            {/* RENDEZ-VOUS */}
            <Route path="/rendezvous" element={
              <RouteGuard fonctionnalite="rendezvous">
                <SuiviRendezVous />
              </RouteGuard>
            } />

            <Route path="/historique-paiements" element={
              <RouteGuard fonctionnalite="historique_paiements">
                <HistoriquePaiements />
              </RouteGuard>
            } />

            {/* FINANCES */}
            <Route path="/depenses" element={
              <RouteGuard fonctionnalite="depenses">
                <ListeDepenses />
              </RouteGuard>
            } />
            <Route path="/bilan" element={
              <RouteGuard fonctionnalite="bilan">
                <BilanFinancier />
              </RouteGuard>
            } />
            <Route path="/journal" element={
              <RouteGuard fonctionnalite="journal">
                <JournalCaisse />
              </RouteGuard>
            } />

            {/* RESSOURCES HUMAINES */}
            <Route path="/employes" element={
              <RouteGuard fonctionnalite="employes">
                <ListeEmployes />
              </RouteGuard>
            } />
            <Route path="/prestations-realisees" element={
              <RouteGuard fonctionnalite="prestations_realisees">
                <ListePrestationsRealisees />
              </RouteGuard>
            } />
            <Route path="/salaires" element={
              <RouteGuard fonctionnalite="salaires">
                <GestionSalaires />
              </RouteGuard>
            } />
            <Route path="/historiques-salaires" element={
              <RouteGuard fonctionnalite="historique_salaires">
                <HistoriqueSalaires />
              </RouteGuard>
            } />
            <Route path="/emprunts" element={
              <RouteGuard fonctionnalite="emprunts">
                <ListeEmprunts />
              </RouteGuard>
            } />

            {/* PARAMÈTRES */}
            <Route path="/utilisateurs" element={
              <RouteGuard fonctionnalite="utilisateurs">
                <ListeUtilisateurs />
              </RouteGuard>
            } />
            <Route path="/config-serveur" element={
              <RouteGuard fonctionnalite="config_serveur">
                <ConfigurationServeur />
              </RouteGuard>
            } />
            <Route path="/import-export" element={
              <RouteGuard fonctionnalite="import_export">
                <ImportClientsExcel />
              </RouteGuard>
            } />
            <Route path="/export-config" element={
              <RouteGuard fonctionnalite="import_export">
                <ExportImportConfiguration />
              </RouteGuard>
            } />

            <Route path="/journal-modifications" element={
              <RouteGuard fonctionnalite="journal_modifications">
                <JournalModifications />
              </RouteGuard>
            } />

            {/* SUPPORT */}
            <Route path="/aide" element={
              <RouteGuard fonctionnalite="aide">
                <GuideUtilisation />
              </RouteGuard>
            } />
            <Route path="/support" element={
              <RouteGuard fonctionnalite="support">
                <SupportTechnique />
              </RouteGuard>
            } />
            <Route path="/export-support" element={
              <RouteGuard fonctionnalite="export_support">
                <ExportSupport />
              </RouteGuard>
            } />

            {/* 404 */}
            <Route path="*" element={
              <Center style={{ height: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                  <h2>🔍 404 - Page non trouvée</h2>
                  <p>La page que vous recherchez n'existe pas.</p>
                  <Button onClick={() => navigate('/')} mt="md">Retour au Dashboard</Button>
                </div>
              </Center>
            } />
          </Routes>
        </Suspense>
        <AssistantIA />
      </AppShell.Main>
    </AppShell>
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

// ==================== APP PRINCIPALE ====================
function App() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const url = localStorage.getItem('api_url');
    setIsConfigured(!!url);
  }, []);

  if (isConfigured === null) {
    return <LoadingFallback />;
  }

  if (!isConfigured) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications position="top-right" zIndex={1000} />
          <BrowserRouter>
            <Routes>
              <Route path="*" element={<ConfigurationServeur />} />
            </Routes>
          </BrowserRouter>
        </MantineProvider>
      </QueryClientProvider>
    );
  }

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