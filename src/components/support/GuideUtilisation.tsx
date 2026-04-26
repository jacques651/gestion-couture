import React from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  ThemeIcon,
  Divider,
  Badge,
  SimpleGrid,
  Grid,
  Box,
  Paper,
  Button,
  Container,
  Avatar,
} from '@mantine/core';
import {
  IconHelpCircle,
  IconBook,
  IconUsers,
  IconShoppingBag,
  IconMoneybag,
  IconPackage,
  IconSettings,
  IconScissors,
  IconCheck,
  IconKeyboard,
  IconMail,
  IconPhone,
  IconBrandWhatsapp,
  IconExternalLink,
  IconCopy,
  IconStar,
  IconReceipt,
  IconBuildingStore,
  IconChartBar,
  IconFileText,
  IconNetwork,
  IconFileExcel,
  IconDatabase,
  IconArrowRight,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';

const GuideUtilisation: React.FC = () => {
  const navigate = useNavigate();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    notifications.show({
      title: 'Copié !',
      message: `${label} a été copié dans le presse-papier`,
      color: 'green',
      icon: <IconCheck size={16} />,
    });
  };

  const sections = [
    {
      icon: IconUsers,
      title: "Gestion des Clients",
      description: "Gérez efficacement votre base clients",
      gradient: { from: 'blue', to: 'cyan' },
      color: 'blue',
      content: [
        "📝 Créez des fiches clients détaillées avec photos",
        "📏 Enregistrez les mesures personnalisées",
        "📊 Consultez l'historique complet des commandes",
        "⭐ Gérez les recommandations et fidélité clients",
        "📥 Importez des clients depuis Excel"
      ]
    },
    {
      icon: IconShoppingBag,
      title: "Gestion des Commandes",
      description: "Suivez vos commandes de A à Z",
      gradient: { from: 'pink', to: 'orange' },
      color: 'orange',
      content: [
        "🆕 Créez des commandes avec designations détaillées",
        "📈 Suivez l'état d'avancement (En attente, En cours, Terminée)",
        "📅 Gérez les rendez-vous avec rappels",
        "🖨️ Imprimez les reçus et factures professionnels",
        "💰 Suivi des paiements et soldes"
      ]
    },
    {
      icon: IconMoneybag,
      title: "Gestion Financière",
      description: "Maîtrisez vos finances",
      gradient: { from: 'green', to: 'teal' },
      color: 'green',
      content: [
        "💵 Enregistrez les paiements des clients (multi-modes)",
        "📉 Gérez les dépenses de l'atelier par catégorie",
        "👥 Calculez les salaires (fixe ou à la prestation)",
        "📊 Consultez le journal de caisse en temps réel",
        "📈 Générez des rapports financiers"
      ]
    },
    {
      icon: IconPackage,
      title: "Gestion du Stock",
      description: "Optimisez votre inventaire",
      gradient: { from: 'yellow', to: 'orange' },
      color: 'yellow',
      content: [
        "🧵 Suivez les matières premières (tissus, fournitures)",
        "📥 Gérez les entrées et sorties de stock",
        "⚠️ Configurez les alertes de seuil minimal",
        "📊 Consultez le stock global en temps réel",
        "💰 Calculez la valeur du stock"
      ]
    },
    {
      icon: IconScissors,
      title: "Ressources Humaines",
      description: "Gérez votre équipe",
      gradient: { from: 'grape', to: 'violet' },
      color: 'grape',
      content: [
        "👥 Gérez les fiches complètes des employés",
        "✂️ Suivez les prestations réalisées",
        "💰 Enregistrez les emprunts et avances",
        "📊 Calculez les salaires (fixe ou à la prestation)",
        "📅 Historique des paiements"
      ]
    },
    {
      icon: IconSettings,
      title: "Configuration",
      description: "Personnalisez l'application",
      gradient: { from: 'gray', to: 'dark' },
      color: 'gray',
      content: [
        "🏪 Configurez les informations de l'atelier (logo, adresse)",
        "👤 Gérez les utilisateurs et leurs rôles",
        "📏 Personnalisez les types de mesures",
        "✂️ Configurez les types de prestations",
        "🌐 Configurez le partage réseau pour plusieurs postes",
        "📦 Exportez/Importez la configuration"
      ]
    }
  ];

  const outilsSection = [
    {
      icon: IconNetwork,
      title: "Configuration réseau",
      description: "Partagez la base de données sur plusieurs ordinateurs",
      path: "/config-reseau",
      color: "blue"
    },
    {
      icon: IconFileExcel,
      title: "Import Excel clients",
      description: "Importez vos clients depuis un fichier Excel",
      path: "/import-clients",
      color: "green"
    },
    {
      icon: IconDatabase,
      title: "Export configuration",
      description: "Sauvegardez et partagez vos types de mesures",
      path: "/export-config",
      color: "violet"
    }
  ];

  const raccourcis = [
    { keys: ["⌘/Ctrl", "N"], action: "Nouvelle commande", color: "blue", icon: <IconShoppingBag size={14} /> },
    { keys: ["⌘/Ctrl", "S"], action: "Sauvegarder", color: "green", icon: <IconFileText size={14} /> },
    { keys: ["⌘/Ctrl", "P"], action: "Imprimer", color: "grape", icon: <IconReceipt size={14} /> },
    { keys: ["F5"], action: "Actualiser", color: "orange", icon: <IconChartBar size={14} /> },
    { keys: ["⌘/Ctrl", "F"], action: "Rechercher", color: "cyan", icon: <IconStar size={14} /> },
    { keys: ["⌘/Ctrl", "D"], action: "Dashboard", color: "teal", icon: <IconBuildingStore size={14} /> },
    { keys: ["Esc"], action: "Fermer modal", color: "red", icon: <IconExternalLink size={14} /> },
  ];

  const tips = [
    { text: "Utilisez les raccourcis clavier pour gagner du temps", color: "blue" },
    { text: "Les graphiques sont interactifs - survolez-les pour plus de détails", color: "teal" },
    { text: "Exportez vos rapports en PDF pour les partager", color: "green" },
    { text: "Les mesures clients sont sauvegardées automatiquement", color: "orange" },
    { text: "Activez les notifications pour ne rien manquer", color: "violet" },
    { text: "Utilisez l'assistant IA pour des réponses rapides", color: "pink" },
    { text: "Pour plusieurs ordinateurs, utilisez la configuration réseau", color: "blue" },
    { text: "Exportez la configuration pour ne pas recréer les mesures", color: "grape" },
  ];

  return (
    <Container size="full" p="md">
      <Stack gap="lg">
        {/* Hero Section améliorée */}
        <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
          <Group justify="space-between" align="center">
            <Group gap="md">
              <Avatar size={70} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <IconBook size={35} color="white" />
              </Avatar>
              <Box>
                <Title order={1} c="white" size="h2">Guide d'utilisation</Title>
                <Text c="gray.3" size="sm" mt={4}>
                  Découvrez toutes les fonctionnalités de Gestion Couture
                </Text>
              </Box>
            </Group>
            <Group gap="xs">
              <Badge size="lg" variant="white" color="blue">Version 1.0.0</Badge>
              <Badge size="lg" variant="white" color="blue">Mise à jour 2026</Badge>
            </Group>
          </Group>
        </Card>

        {/* Tips Section modernisée */}
        <Card withBorder radius="lg" p="xl" shadow="sm">
          <Group mb="md">
            <ThemeIcon size="lg" radius="md" color="blue" variant="light">
              <IconStar size={20} />
            </ThemeIcon>
            <Title order={3} size="h4">💡 Astuces pour bien démarrer</Title>
          </Group>
          <Divider mb="md" />
          <Grid>
            {tips.map((tip, index) => (
              <Grid.Col key={index} span={{ base: 12, md: 6 }}>
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="xl" color={tip.color} variant="light">
                    <IconCheck size={12} />
                  </ThemeIcon>
                  <Text size="sm">{tip.text}</Text>
                </Group>
              </Grid.Col>
            ))}
          </Grid>
        </Card>

        {/* Sections Guide - Version améliorée */}
        <Card withBorder radius="lg" p="xl" shadow="sm">
          <Group mb="md">
            <ThemeIcon size="lg" radius="md" color="violet" variant="light">
              <IconBook size={20} />
            </ThemeIcon>
            <Title order={3} size="h4">📚 Fonctionnalités détaillées</Title>
          </Group>
          <Divider mb="md" />
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {sections.map((section, index) => (
              <Paper
                key={index}
                p="lg"
                radius="lg"
                withBorder
                style={{
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Group mb="md">
                  <ThemeIcon size="xl" radius="md" variant="gradient" gradient={section.gradient}>
                    <section.icon size={24} />
                  </ThemeIcon>
                  <Box>
                    <Title order={4} size="h5">{section.title}</Title>
                    <Text size="xs" c="dimmed">{section.description}</Text>
                  </Box>
                </Group>
                <Divider mb="md" />
                <Stack gap="xs">
                  {section.content.map((point, i) => (
                    <Group key={i} gap="xs" align="flex-start" wrap="nowrap">
                      <Text size="lg">•</Text>
                      <Text size="sm">{point}</Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Card>

        {/* Section OUTILS (Nouveau) */}
        <Card withBorder radius="lg" p="xl" shadow="sm">
          <Group mb="md">
            <ThemeIcon size="lg" radius="md" color="teal" variant="light">
              <IconTools size={20} />
            </ThemeIcon>
            <Title order={3} size="h4">🛠️ Outils de configuration</Title>
          </Group>
          <Divider mb="md" />
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            {outilsSection.map((outil, index) => (
              <Paper
                key={index}
                p="xl"
                radius="lg"
                withBorder
                style={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onClick={() => navigate(outil.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <ThemeIcon size="xl" radius="xl" color={outil.color} variant="light" mx="auto">
                  <outil.icon size={28} />
                </ThemeIcon>
                <Title order={4} size="h5" mt="md">{outil.title}</Title>
                <Text size="xs" c="dimmed" mt={4}>{outil.description}</Text>
                <Button
                  variant="subtle"
                  color={outil.color}
                  rightSection={<IconArrowRight size={14} />}
                  mt="md"
                >
                  Accéder
                </Button>
              </Paper>
            ))}
          </SimpleGrid>
        </Card>

        {/* Raccourcis clavier améliorés */}
        <Card withBorder radius="lg" p="xl" shadow="sm">
          <Group mb="md">
            <ThemeIcon size="lg" radius="md" color="gray" variant="light">
              <IconKeyboard size={20} />
            </ThemeIcon>
            <Title order={3} size="h4">⌨️ Raccourcis clavier</Title>
          </Group>
          <Divider mb="md" />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {raccourcis.map((item, index) => (
              <Paper key={index} p="sm" radius="md" withBorder bg="gray.0">
                <Group justify="space-between">
                  <Group gap="xs">
                    {item.keys.map((key, i) => (
                      <React.Fragment key={i}>
                        <Badge size="lg" variant="filled" color={item.color}>
                          {key}
                        </Badge>
                        {i < item.keys.length - 1 && <Text size="sm">+</Text>}
                      </React.Fragment>
                    ))}
                  </Group>
                  <Group gap="xs">
                    {item.icon}
                    <Text size="sm" fw={500}>{item.action}</Text>
                  </Group>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Card>

        {/* Section Support améliorée */}
        <Card withBorder radius="lg" p="xl" shadow="sm">
          <Group mb="md">
            <ThemeIcon size="lg" radius="md" color="red" variant="light">
              <IconHelpCircle size={20} />
            </ThemeIcon>
            <Title order={3} size="h4">❓ Besoin d'aide ?</Title>
          </Group>
          <Divider mb="md" />
          
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            <Paper withBorder radius="lg" p="xl" bg="blue.0" style={{ textAlign: 'center' }}>
              <ThemeIcon size={60} radius="xl" color="red" variant="light" mx="auto">
                <IconMail size={30} />
              </ThemeIcon>
              <Text fw={700} size="md" mt="md">Email</Text>
              <Text size="sm" c="dimmed" mt={4}>jacqueskorgo5@gmail.com</Text>
              <Button
                variant="light"
                color="red"
                size="xs"
                mt="sm"
                leftSection={<IconCopy size={14} />}
                onClick={() => copyToClipboard('jacqueskorgo5@gmail.com', 'Email')}
              >
                Copier l'email
              </Button>
            </Paper>

            <Paper withBorder radius="lg" p="xl" bg="blue.0" style={{ textAlign: 'center' }}>
              <ThemeIcon size={60} radius="xl" color="blue" variant="light" mx="auto">
                <IconPhone size={30} />
              </ThemeIcon>
              <Text fw={700} size="md" mt="md">Téléphone</Text>
              <Text size="sm" c="dimmed" mt={4}>+226 75 11 81 61</Text>
              <Text size="xs" c="dimmed">+226 72 44 24 85</Text>
              <Button
                variant="light"
                color="blue"
                size="xs"
                mt="sm"
                leftSection={<IconCopy size={14} />}
                onClick={() => copyToClipboard('+226 75 11 81 61', 'Téléphone')}
              >
                Copier le numéro
              </Button>
            </Paper>

            <Paper withBorder radius="lg" p="xl" bg="blue.0" style={{ textAlign: 'center' }}>
              <ThemeIcon size={60} radius="xl" color="green" variant="light" mx="auto">
                <IconBrandWhatsapp size={30} />
              </ThemeIcon>
              <Text fw={700} size="md" mt="md">WhatsApp</Text>
              <Text size="sm" c="dimmed" mt={4}>+226 75 11 81 61</Text>
              <Button
                component="a"
                href="https://wa.me/22675118161"
                target="_blank"
                size="xs"
                color="green"
                variant="light"
                rightSection={<IconExternalLink size={14} />}
                mt="sm"
              >
                Ouvrir WhatsApp
              </Button>
            </Paper>
          </SimpleGrid>

          <Divider my="lg" />

          <Paper p="md" radius="md" bg="gray.0" ta="center">
            <Text size="sm" fw={500}>📍 Horaires d'assistance</Text>
            <Group justify="center" gap="lg" mt="sm">
              <Group gap="xs">
                <Badge color="green" variant="light">Lun - Ven: 9h - 18h</Badge>
                <Badge color="orange" variant="light">Sam: 9h - 13h</Badge>
                <Badge color="red" variant="light">Dim: Fermé</Badge>
              </Group>
            </Group>
            <Text size="xs" c="dimmed" mt="md">
              Support technique inclus avec votre licence • Assistance prioritaire sur demande
            </Text>
          </Paper>
        </Card>

        {/* Footer */}
        <Card withBorder radius="lg" p="md" ta="center" bg="gray.0">
          <Text size="xs" c="dimmed">
            © {new Date().getFullYear()} KO-SOFT Couture - Tous droits réservés
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Application de gestion professionnelle pour atelier de couture - Version 1.0.0
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Support multi-postes • Import Excel • Partage réseau
          </Text>
        </Card>
      </Stack>
    </Container>
  );
};

// Import manquant pour IconTools
import { IconTools } from '@tabler/icons-react';

export default GuideUtilisation;