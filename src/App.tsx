// src/App.tsx
import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, BrowserRouter, useNavigate } from 'react-router-dom';
import { AppShell, Loader, Center, MantineProvider, Button } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getDb } from './database/db';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import AssistantIA from './components/AssistantIA';


// ==================== AUTH ====================
const Login = lazy(() => import('./components/auth/Login'));

// ==================== DASHBOARD ====================
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));

// ==================== CLIENTS ====================
const ListeClientsAvecMesures = lazy(() => import('./components/clients/ListeClientsAvecMesures'));

// ==================== STOCK & INVENTAIRE ====================
const MatieresManager = lazy(() => import('./components/stock/MatieresManager'));
const ArticlesManager = lazy(() => import('./components/stock/ArticlesManager'));
const ModelesTenuesManager = lazy(() => import('./components/stock/ModelesTenuesManager'));
const MouvementsStock = lazy(() => import('./components/stock/MouvementsStock'));

// ==================== VENTES ====================
const VentesManager = lazy(() => import('./components/ventes/VentesManager'));

// ==================== FACTURES & REÇUS ====================
const FacturesRecus = lazy(() => import('./components/factures/FacturesReçus'));

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
const ConfigurationReseau = lazy(() => import('./components/ConfigurationReseau'));
const ExportImportConfiguration = lazy(() => import('./components/ExportImportConfiguration'));

// ==================== SUPPORT & AIDE ====================
const SupportTechnique = lazy(() => import('./components/support/SupportTechnique'));
const ExportSupport = lazy(() => import('./components/support/ExportSupport'));
const GuideUtilisation = lazy(() => import('./components/support/GuideUtilisation'));

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
      if (fonctionnalite && user?.role !== 'admin') {
       const { getPermissions } = await import('./database/db');
        const perms = await getPermissions(user?.id || 0);
        const p = perms.find((x: any) => x.fonctionnalite === fonctionnalite);
        setHasAccess(p?.lecture === 1);
      }
      setChecking(false);
    };
    if (isAuthenticated) check();
    else setChecking(false);
  }, [fonctionnalite, user, isAuthenticated]);

  if (!isAuthenticated) return <Login />;
  if (checking) return <LoadingFallback />;
  if (!hasAccess) {
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

// ==================== APP AUTHENTIFIÉE ====================
function AuthenticatedApp() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        await getDb();
        console.log('✅ Base de données initialisée');
      } catch (error) {
        console.error('❌ Erreur initialisation base:', error);
      }
    };
    init();
  }, []);

  const handleLogout = () => {
    if (window.confirm("Voulez-vous vous déconnecter ?")) {
      logout();
      navigate('/login');
    }
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
      modeles_tenues: '/modeles-tenues',
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
      config_reseau: '/config-reseau',
      import_export: '/import-export',
      export_config: '/export-config',
      journal_modifications: '/journal-modifications',
      aide: '/aide',
      support: '/support',
      export_support: '/export-support',
    };
    navigate(routeMap[page] || '/');
  };

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Login />;

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
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <Dashboard setPage={handleSetPage} />
              </RouteGuard>
            } />

            {/* CLIENTS */}
            <Route path="/clients" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <ListeClientsAvecMesures />
              </RouteGuard>
            } />
            <Route path="/types-mesures" element={
              <RouteGuard roles={['admin']}>
                <ConfigurationMesures />
              </RouteGuard>
            } />

            {/* STOCK & INVENTAIRE */}
            <Route path="/articles" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <ArticlesManager />
              </RouteGuard>
            } />
            <Route path="/matieres" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <MatieresManager />
              </RouteGuard>
            } />
            <Route path="/mouvements-stock" element={
              <RouteGuard roles={['admin']}>
                <MouvementsStock />
              </RouteGuard>
            } />

            {/* RÉFÉRENTIELS */}
            <Route path="/tailles" element={
              <RouteGuard roles={['admin']}>
                <TaillesManager />
              </RouteGuard>
            } />
            <Route path="/couleurs" element={
              <RouteGuard roles={['admin']}>
                <CouleursManager />
              </RouteGuard>
            } />
            <Route path="/textures" element={
              <RouteGuard roles={['admin']}>
                <TexturesManager />
              </RouteGuard>
            } />
            <Route path="/modeles-tenues" element={
              <RouteGuard roles={['admin']}>
                <ModelesTenuesManager />
              </RouteGuard>
            } />
            <Route path="/categories-matieres" element={
              <RouteGuard roles={['admin']}>
                <CategoriesMatieresManager />
              </RouteGuard>
            } />
            <Route path="/ListeTypesPrestations" element={
              <RouteGuard roles={['admin']}>
                <ListeTypesPrestations />
              </RouteGuard>
            } />
            <Route path="/atelier" element={
              <RouteGuard roles={['admin']}>
                <ParametresAtelier />
              </RouteGuard>
            } />

            {/* VENTES */}
            <Route path="/ventes" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <VentesManager />
              </RouteGuard>
            } />

            {/* FACTURES & REÇUS */}
            <Route path="/factures-recus" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <FacturesRecus />
              </RouteGuard>
            } />

            {/* FINANCES */}
            <Route path="/depenses" element={
              <RouteGuard roles={['admin']}>
                <ListeDepenses />
              </RouteGuard>
            } />
            <Route path="/bilan" element={
              <RouteGuard roles={['admin', 'caissier']}>
                <BilanFinancier />
              </RouteGuard>
            } />
            <Route path="/journal" element={
              <RouteGuard roles={['admin', 'caissier']}>
                <JournalCaisse />
              </RouteGuard>
            } />

            {/* RESSOURCES HUMAINES */}
            <Route path="/employes" element={
              <RouteGuard roles={['admin']}>
                <ListeEmployes />
              </RouteGuard>
            } />
            <Route path="/prestations-realisees" element={
              <RouteGuard roles={['admin']}>
                <ListePrestationsRealisees />
              </RouteGuard>
            } />
            <Route path="/salaires" element={
              <RouteGuard roles={['admin']}>
                <GestionSalaires />
              </RouteGuard>
            } />
            <Route path="/historiques-salaires" element={
              <RouteGuard roles={['admin']}>
                <HistoriqueSalaires />
              </RouteGuard>
            } />
            <Route path="/emprunts" element={
              <RouteGuard roles={['admin']}>
                <ListeEmprunts />
              </RouteGuard>
            } />

            {/* PARAMÈTRES */}
            <Route path="/utilisateurs" element={
              <RouteGuard roles={['admin']}>
                <ListeUtilisateurs />
              </RouteGuard>
            } />
            <Route path="/config-reseau" element={
              <RouteGuard roles={['admin']}>
                <ConfigurationReseau />
              </RouteGuard>
            } />
            <Route path="/import-export" element={
              <RouteGuard roles={['admin']}>
                <ImportClientsExcel />
              </RouteGuard>
            } />
            <Route path="/export-config" element={
              <RouteGuard roles={['admin']}>
                <ExportImportConfiguration />
              </RouteGuard>
            } />

            <Route path="/journal-modifications" element={
              <RouteGuard roles={['admin']}>
                <JournalModifications />
              </RouteGuard>
            } />

            {/* SUPPORT */}
            <Route path="/aide" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <GuideUtilisation />
              </RouteGuard>
            } />
            <Route path="/support" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <SupportTechnique onNavigate={handleSetPage} />
              </RouteGuard>
            } />
            <Route path="/export-support" element={
              <RouteGuard roles={['admin']}>
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