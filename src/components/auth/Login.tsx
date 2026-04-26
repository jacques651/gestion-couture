import React, { useState, useEffect } from "react";
import {
  Stack,
  Card,
  Title,
  Text,
  Button,
  TextInput,
  PasswordInput,
  Divider,
  Alert,
  LoadingOverlay,
  Badge,
  Group,
  Avatar,
  Container,
  Center,
} from "@mantine/core";
import {
  IconUserPlus,
  IconUser,
  IconLock,
  IconUserCircle,
  IconAlertCircle,
  IconScissors,
  IconSeeding,
  IconBuildingStore,
  IconArrowRight,
} from "@tabler/icons-react";
import { getDb } from "../../database/db";
import { useAuth } from "../../contexts/AuthContext";

interface ConfigurationAtelier {
  id: number;
  nom_atelier: string;
  telephone: string;
  adresse: string;
  email: string;
  nif: string;
  message_facture: string;
  logo_base64: string;
}

const Login: React.FC = () => {
  const { login, register } = useAuth();

  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [config, setConfig] = useState<ConfigurationAtelier | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [nom, setNom] = useState("");
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkUserTable = async () => {
      try {
        const db = await getDb();
        const result = await db.select<any[]>("SELECT id FROM utilisateurs LIMIT 1");
        setIsFirstUser(result.length === 0);
      } catch (err) {
        console.error("Erreur vérification utilisateurs:", err);
        setIsFirstUser(false);
      }
    };
    checkUserTable();
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const db = await getDb();
        const conf = await db.select<ConfigurationAtelier[]>(
          "SELECT * FROM configuration_atelier WHERE id = 1"
        );
        setConfig(conf[0] || null);
      } catch (err) {
        console.error("Erreur chargement configuration:", err);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isFirstUser) {
        await register(nom, loginValue, password, "admin");
        alert("✅ Administrateur créé avec succès ! Connectez-vous maintenant.");
        setIsFirstUser(false);
        setPassword("");
        setNom("");
        setLoginValue("");
      } else {
        const success = await login(loginValue, password);
        if (!success) setError("❌ Identifiants incorrects. Veuillez réessayer.");
      }
    } catch (err: any) {
      setError("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const atelierNom = config?.nom_atelier || "GESTION COUTURE";
  const atelierSlogan = config?.adresse ? `Atelier situé à ${config.adresse.split(',')[0]}` : "Gestion professionnelle d'atelier de couture";

  if (isFirstUser === null || loadingConfig) {
    return (
      <Center style={{ height: '100vh', background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
        <Card withBorder radius="lg" p="xl" style={{ backgroundColor: 'white', minWidth: 320 }}>
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconSeeding size={40} style={{ animation: 'spin 2s linear infinite', color: '#1b365d' }} />
            <Text ta="center" fw={500} size="lg">Chargement...</Text>
            <Text ta="center" size="xs" c="dimmed">{atelierNom}</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Center style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
      <Container size={480} p="md">
        <Card
          shadow="xl"
          radius="lg"
          p="xl"
          withBorder
          style={{
            backgroundColor: '#ffffff',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          <LoadingOverlay visible={loading} />

          {/* En-tête avec logo/nom dynamique */}
          <Stack align="center" gap="md" mb="xl">
            {config?.logo_base64 ? (
              <Avatar
                size={80}
                radius="xl"
                src={config.logo_base64}
                style={{
                  animation: 'pulse 2s infinite',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  border: '2px solid #1b365d',
                }}
              />
            ) : (
              <Avatar
                size={80}
                radius="xl"
                variant="gradient"
                gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                style={{
                  animation: 'pulse 2s infinite',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                }}
              >
                {isFirstUser ? (
                  <IconUserPlus size={40} color="white" stroke={1.5} />
                ) : (
                  <IconBuildingStore size={40} color="white" stroke={1.5} />
                )}
              </Avatar>
            )}

            <Stack align="center" gap={4}>
              <Title order={2} ta="center" c="#1b365d" size="h2" fw={800}>
                {isFirstUser ? "Configuration Initiale" : atelierNom}
              </Title>
              <Text size="sm" c="dimmed" ta="center">
                {isFirstUser
                  ? "Créez votre compte administrateur pour démarrer"
                  : atelierSlogan}
              </Text>
            </Stack>

            <Badge color={isFirstUser ? "pink" : "blue"} variant="light" size="lg" radius="xl">
              {isFirstUser ? "Premier utilisateur" : "Atelier de couture"}
            </Badge>
          </Stack>

          {/* Message d'erreur */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={18} />}
              color="red"
              variant="filled"
              mb="md"
              withCloseButton
              onClose={() => setError("")}
              radius="md"
              style={{ animation: 'shake 0.5s' }}
            >
              {error}
            </Alert>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {isFirstUser && (
                <TextInput
                  label="Nom complet"
                  placeholder="Nom et prénom du responsable"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  leftSection={<IconUser size={18} />}
                  size="md"
                  required
                  radius="md"
                  autoComplete="name"
                  styles={{
                    input: {
                      transition: 'all 0.2s',
                      '&:focus': {
                        borderColor: '#1b365d',
                        boxShadow: '0 0 0 3px rgba(27,54,93,0.1)',
                      },
                    },
                  }}
                />
              )}

              <TextInput
                label="Identifiant"
                placeholder="Nom d'utilisateur"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                leftSection={<IconUserCircle size={18} />}
                size="md"
                required
                radius="md"
                autoComplete="username"
                styles={{
                  input: {
                    transition: 'all 0.2s',
                    '&:focus': {
                      borderColor: '#1b365d',
                      boxShadow: '0 0 0 3px rgba(27,54,93,0.1)',
                    },
                  },
                }}
              />

              <PasswordInput
                label="Mot de passe"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftSection={<IconLock size={18} />}
                size="md"
                required
                radius="md"
                autoComplete={isFirstUser ? "new-password" : "current-password"}
                styles={{
                  input: {
                    transition: 'all 0.2s',
                    '&:focus': {
                      borderColor: '#1b365d',
                      boxShadow: '0 0 0 3px rgba(27,54,93,0.1)',
                    },
                  },
                }}
              />

              <Button
                type="submit"
                loading={loading}
                size="lg"
                fullWidth
                radius="md"
                variant="gradient"
                gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                rightSection={<IconArrowRight size={18} />}
                styles={{
                  root: {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(27,54,93,0.3)',
                    },
                  },
                }}
              >
                {loading
                  ? "Traitement en cours..."
                  : isFirstUser
                  ? "Créer l'administrateur"
                  : "Se connecter"}
              </Button>
            </Stack>
          </form>

          <Divider my="xl" label="À propos" labelPosition="center" />

          {/* Footer avec infos atelier */}
          <Stack gap="xs" align="center">
            <Group gap="xs" c="dimmed">
              <IconScissors size={14} />
              <Text size="xs">{atelierNom}</Text>
              <IconSeeding size={14} />
            </Group>
            <Text size="xs" c="gray.5" ta="center">
              © 2026 – {config?.nom_atelier || "Solution pour atelier de couture"}
            </Text>
            <Text size="xs" c="gray.5" ta="center">
              {config?.telephone && `📞 ${config.telephone}`}
              {config?.adresse && config?.telephone && " • "}
              {config?.adresse && `📍 ${config.adresse.split(',')[0]}`}
            </Text>
          </Stack>
        </Card>

        {/* Styles d'animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Container>
    </Center>
  );
};

export default Login;