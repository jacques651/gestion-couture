// src/App.tsx
import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, BrowserRouter, useNavigate } from 'react-router-dom';
import { AppShell, Loader, Center, MantineProvider, Button } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { initDatabase } from './database/db'; 
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import AssistantIA from './components/AssistantIA';

// ==================== AUTH ====================
const Login = lazy(() => import('./components/auth/Login'));

// ==================== DASHBOARD ====================
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));

// ==================== CLIENTS ====================
const ListeClientsAvecMesures = lazy(() => import('./components/clients/ListeClientsAvecMesures'));

// ==================== STOCK ====================
const ListeMatieres = lazy(() => import('./components/matieres/ListeMatieres'));
const ListeGammesTenues = lazy(() => import('./components/tenues/ListeGammesTenues'));
const MouvementsStock = lazy(() => import('./components/stock/MouvementsStock'));

// ==================== VENTES (UNIFIÉ) ====================
const FormulaireVente = lazy(() => import('./components/ventes/FormulaireVente'));
const ListeVentes = lazy(() => import('./components/ventes/ListeVentes'));

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
const ListeTypesPrestations = lazy(() => import('./components/prestations/ListeTypesPrestations'));
const ConfigurationMesures = lazy(() => import('./components/parametres/ConfigurationMesures'));

// ==================== PARAMÈTRES ====================
const ParametresAtelier = lazy(() => import('./components/parametres/ParametresAtelier'));
const ListeUtilisateurs = lazy(() => import('./components/utilisateurs/ListeUtilisateurs'));

// ==================== OUTILS ====================
const ImportClientsExcel = lazy(() => import('./components/ImportClientsExcel'));
const ConfigurationReseau = lazy(() => import('./components/ConfigurationReseau'));

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

// ==================== APP AUTHENTIFIÉE ====================
function AuthenticatedApp() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Initialisation de la base de données
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
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
      matieres: '/matieres',
      gammes_tenues: '/gammes-tenues',
      mouvements_stock: '/mouvements-stock',
      nouvelle_vente: '/ventes/nouvelle',
      ventes: '/ventes',
      bilan: '/bilan',
      journal: '/journal',
      depenses: '/depenses',
      salaires: '/salaires',
      HistoriqueSalaires: '/historiques-salaires',
      employes: '/employes',
      emprunts: '/emprunts',
      prestations_realisees: '/prestations-realisees',
      prestations_types: '/prestations-types',
      mesures: '/mesures',
      utilisateurs: '/utilisateurs',
      parametres: '/parametres',
      import_clients: '/import-clients',
      config_reseau: '/config-reseau',
      support: '/support',
      export_support: '/export-support',
      aide: '/aide'
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

            {/* STOCK */}
            <Route path="/matieres" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <ListeMatieres />
              </RouteGuard>
            } />
            <Route path="/gammes-tenues" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <ListeGammesTenues />
              </RouteGuard>
            } />
            <Route path="/mouvements-stock" element={
              <RouteGuard roles={['admin']}>
                <MouvementsStock />
              </RouteGuard>
            } />

            {/* VENTES (UNIFIÉ) */}
            <Route path="/ventes/nouvelle" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <FormulaireVente onSuccess={() => navigate('/ventes')} onCancel={() => navigate('/ventes')} />
              </RouteGuard>
            } />
            <Route path="/ventes" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <ListeVentes />
              </RouteGuard>
            } />

            {/* FINANCES */}
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
            <Route path="/depenses" element={
              <RouteGuard roles={['admin']}>
                <ListeDepenses />
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

            {/* RESSOURCES HUMAINES */}
            <Route path="/employes" element={
              <RouteGuard roles={['admin']}>
                <ListeEmployes />
              </RouteGuard>
            } />
            <Route path="/emprunts" element={
              <RouteGuard roles={['admin']}>
                <ListeEmprunts />
              </RouteGuard>
            } />
            <Route path="/prestations-realisees" element={
              <RouteGuard roles={['admin']}>
                <ListePrestationsRealisees />
              </RouteGuard>
            } />

            {/* RÉFÉRENTIELS */}
            <Route path="/prestations-types" element={
              <RouteGuard roles={['admin']}>
                <ListeTypesPrestations />
              </RouteGuard>
            } />
            <Route path="/mesures" element={
              <RouteGuard roles={['admin']}>
                <ConfigurationMesures />
              </RouteGuard>
            } />

            {/* PARAMÈTRES */}
            <Route path="/utilisateurs" element={
              <RouteGuard roles={['admin']}>
                <ListeUtilisateurs />
              </RouteGuard>
            } />
            <Route path="/parametres" element={
              <RouteGuard roles={['admin']}>
                <ParametresAtelier />
              </RouteGuard>
            } />

            {/* OUTILS */}
            <Route path="/import-clients" element={
              <RouteGuard roles={['admin']}>
                <ImportClientsExcel />
              </RouteGuard>
            } />
            <Route path="/config-reseau" element={
              <RouteGuard roles={['admin']}>
                <ConfigurationReseau />
              </RouteGuard>
            } />

            {/* SUPPORT & AIDE */}
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
            <Route path="/aide" element={
              <RouteGuard roles={['admin', 'caissier', 'couturier']}>
                <GuideUtilisation />
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