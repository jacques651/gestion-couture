import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider, Box, Text, Center, Stack, ThemeIcon } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { IconDatabase, IconAlertCircle, IconSeeding } from '@tabler/icons-react';
import App from "./App";
import { getDb } from "./database/db";
import { theme } from "./theme";

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";

// Composant d'écran de chargement
function LoadingScreen() {
  return (
    <Box style={{ 
      height: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <IconSeeding size={200} style={{ position: 'absolute', top: '10%', left: '5%', opacity: 0.1, transform: 'rotate(-15deg)' }} />
        <IconSeeding size={150} style={{ position: 'absolute', bottom: '10%', right: '5%', opacity: 0.1, transform: 'rotate(10deg)' }} />
      </Box>

      <Center>
        <Stack align="center" gap="lg" style={{ backgroundColor: 'rgba(255,255,255,0.95)', padding: '40px', borderRadius: '20px', minWidth: 350, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <ThemeIcon size={60} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconDatabase size={35} />
          </ThemeIcon>
          
          <Stack align="center" gap="xs">
            <Text size="xl" fw={700} c="#1b365d">KO-SOFT Couture</Text>
            <Text size="sm" c="dimmed">Gestion Professionnelle d'Atelier</Text>
          </Stack>
          
          <Box style={{ width: '100%' }}>
            <div style={{ margin: '0 auto', width: 40, height: 40, border: '3px solid #e9ecef', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </Box>
          
          <Stack align="center" gap="xs">
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <span style={{ width: 8, height: 8, backgroundColor: '#3b82f6', borderRadius: '50%', animation: 'bounce 1.4s ease-in-out infinite both' }}></span>
              <span style={{ width: 8, height: 8, backgroundColor: '#3b82f6', borderRadius: '50%', animation: 'bounce 1.4s ease-in-out infinite both', animationDelay: '-0.16s' }}></span>
              <span style={{ width: 8, height: 8, backgroundColor: '#3b82f6', borderRadius: '50%', animation: 'bounce 1.4s ease-in-out infinite both', animationDelay: '-0.32s' }}></span>
            </div>
            <Text size="xs" c="dimmed">Initialisation...</Text>
          </Stack>
        </Stack>
      </Center>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </Box>
  );
}

// Composant d'écran d'erreur
function ErrorScreen({ message }: { message: string }) {
  return (
    <Box style={{ 
      height: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Center>
        <Stack align="center" gap="lg" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', minWidth: 350, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <ThemeIcon size={60} radius="md" color="red">
            <IconAlertCircle size={35} />
          </ThemeIcon>
          
          <Stack align="center" gap="xs">
            <Text size="xl" fw={700} c="red">Erreur d'initialisation</Text>
            <Text size="sm" c="dimmed" ta="center">{message}</Text>
          </Stack>
          
          <Text size="xs" c="dimmed" ta="center">
            Veuillez vérifier les logs de la console<br />
            et redémarrer l'application.
          </Text>
        </Stack>
      </Center>
    </Box>
  );
}

// Composant racine avec la logique d'initialisation
function RootContent() {
  const [pret, setPret] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("🚀 Démarrage de l'application...");
        
        const db = await getDb();
        console.log("✅ Base de données chargée avec succès");
        
        // Vérifier si la table utilisateurs existe
        const tables = await db.select<{ name: string }[]>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='utilisateurs'"
        );
        
        if (tables.length === 0) {
          console.log("⚠️ Table utilisateurs non trouvée");
        } else {
          // Vérifier si l'admin existe déjà
          const adminExists = await db.select<{ count: number }[]>(
            "SELECT COUNT(*) as count FROM utilisateurs WHERE login = 'admin'"
          );
          
          console.log("📊 Vérification admin:", adminExists[0]?.count || 0);
          
          if (adminExists[0]?.count === 0) {
            // Insérer l'admin seulement s'il n'existe pas
            await db.execute(`
              INSERT INTO utilisateurs 
              (nom, login, mot_de_passe_hash, role, est_actif)
              VALUES (?, ?, ?, ?, 1)
            `, [
              'Administrateur',
              'admin',
              '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
              'admin'
            ]);
            console.log("✅ Compte administrateur créé (login: admin, password: password)");
          } else {
            console.log("✅ Compte administrateur existe déjà");
          }
        }

        setPret(true);
      } catch (err) {
        console.error("❌ Erreur détaillée:", err);
        
        let errorMessage = "Erreur inconnue";
        if (err instanceof Error) {
          errorMessage = err.message;
          console.error("Stack:", err.stack);
        }
        
        setError(errorMessage);
      }
    };

    init();
  }, []);

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (!pret) {
    return <LoadingScreen />;
  }

  return <App />;
}

// Point d'entrée principal - AVEC AuthProvider
function Root() {
  return (
    <React.StrictMode>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <Notifications position="top-right" zIndex={1000} />
        <AuthProvider> {/* 👈 AJOUT DE AuthProvider ICI */}
          <RootContent />
        </AuthProvider>
      </MantineProvider>
    </React.StrictMode>
  );
}

// Rendu de l'application
if (import.meta.hot) {
  // En développement avec HMR
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<Root />);
} else {
  // En production
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<Root />);
}