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
  IconBook,
  IconUsers,
  IconShoppingBag,
  IconMoneybag,
  IconPackage,
  IconSettings,
  IconScissors,
  IconCheck,
  IconMail,
  IconPhone,
  IconExternalLink,
  IconCopy,
  IconNetwork,
  IconFileExcel,
  IconDatabase,
  IconArrowRight,
  IconBrandWhatsapp,
} from '@tabler/icons-react';

import {
  notifications
} from '@mantine/notifications';

import {
  useNavigate
} from 'react-router-dom';

/**
 * =========================
 * VERSION APP
 * =========================
 */
const APP_VERSION =
  '1.0.0';

const GuideUtilisation:
React.FC = () => {

  const navigate =
    useNavigate();

  /**
   * =========================
   * COPY
   * =========================
   */
  const copyToClipboard = (

    text: string,

    label: string

  ) => {

    navigator.clipboard.writeText(
      text
    );

    notifications.show({

      title:
        'Copié !',

      message:

        `${label} a été copié dans le presse-papier`,

      color:
        'green',

      icon:
        <IconCheck size={16} />,
    });
  };

  /**
   * =========================
   * MODULES
   * =========================
   */
  const sections = [

    {

      icon:
        IconUsers,

      title:
        "Gestion des Clients",

      description:
        "Gérez efficacement votre base clients",

      gradient: {

        from:
          'blue',

        to:
          'cyan'
      },

      color:
        'blue',

      content: [

        "Créez des fiches clients détaillées",

        "Enregistrez les mesures personnalisées",

        "Consultez l'historique complet des commandes",

        "Importez des clients depuis Excel"
      ]
    },

    {

      icon:
        IconShoppingBag,

      title:
        "Gestion des Ventes",

      description:
        "Suivez vos ventes de A à Z",

      gradient: {

        from:
          'pink',

        to:
          'orange'
      },

      color:
        'orange',

      content: [

        "Ventes sur mesure, prêt-à-porter ou matières",

        "Génération de factures et reçus",

        "Suivi des paiements (Espèces, Mobile Money)",

        "Historique complet des transactions"
      ]
    },

    {

      icon:
        IconMoneybag,

      title:
        "Gestion Financière",

      description:
        "Maîtrisez vos finances",

      gradient: {

        from:
          'green',

        to:
          'teal'
      },

      color:
        'green',

      content: [

        "Enregistrez les dépenses par catégorie",

        "Calculez les salaires (fixe ou prestation)",

        "Consultez le journal de caisse",

        "Analysez le bilan financier"
      ]
    },

    {

      icon:
        IconPackage,

      title:
        "Gestion du Stock",

      description:
        "Optimisez votre inventaire",

      gradient: {

        from:
          'yellow',

        to:
          'orange'
      },

      color:
        'yellow',

      content: [

        "Inventaire des tenues (modèle + taille + couleur)",

        "Gestion des matières premières",

        "Alertes de seuil minimal",

        "Historique des mouvements de stock"
      ]
    },

    {

      icon:
        IconScissors,

      title:
        "Ressources Humaines",

      description:
        "Gérez votre équipe",

      gradient: {

        from:
          'grape',

        to:
          'violet'
      },

      color:
        'grape',

      content: [

        "Fiches complètes des employés",

        "Suivi des prestations réalisées",

        "Gestion des emprunts et avances",

        "Calcul automatique des salaires"
      ]
    },

    {

      icon:
        IconSettings,

      title:
        "Configuration",

      description:
        "Personnalisez l'application",

      gradient: {

        from:
          'gray',

        to:
          'dark'
      },

      color:
        'gray',

      content: [

        "Paramètres de l'atelier (logo, IFU, RCCM)",

        "Gestion des utilisateurs et rôles",

        "Référentiels (tailles, couleurs, textures)",

        "Configuration serveur PostgreSQL"
      ]
    }
  ];

  /**
   * =========================
   * OUTILS
   * =========================
   */
  const outilsSection = [

    {

      icon:
        IconNetwork,

      title:
        "Configuration serveur",

      description:

        "Configurez la connexion au serveur PostgreSQL",

      path:
        "/config-serveur",

      color:
        "blue"
    },

    {

      icon:
        IconFileExcel,

      title:
        "Import Excel clients",

      description:
        "Importez vos clients depuis Excel",

      path:
        "/import-export",

      color:
        "green"
    },

    {

      icon:
        IconDatabase,

      title:
        "Export support PostgreSQL",

      description:

        "Générez un export serveur pour assistance technique",

      path:
        "/export-support",

      color:
        "violet"
    }
  ];

  /**
   * =========================
   * RACCOURCIS
   * =========================
   */
  const raccourcis = [

    {

      keys:
        ["Ctrl", "N"],

      action:
        "Nouvelle vente",

      color:
        "blue"
    },

    {

      keys:
        ["Ctrl", "S"],

      action:
        "Sauvegarder",

      color:
        "green"
    },

    {

      keys:
        ["Ctrl", "P"],

      action:
        "Imprimer",

      color:
        "grape"
    },

    {

      keys:
        ["F5"],

      action:
        "Actualiser",

      color:
        "orange"
    },

    {

      keys:
        ["Ctrl", "F"],

      action:
        "Rechercher",

      color:
        "cyan"
    },

    {

      keys:
        ["Esc"],

      action:
        "Fermer",

      color:
        "red"
    },
  ];

  /**
   * =========================
   * ASTUCES
   * =========================
   */
  const tips = [

    "Utilisez les filtres pour trouver rapidement vos données",

    "Les alertes stock vous préviennent avant la rupture",

    "Exportez vos rapports pour les partager",

    "Configurez le serveur PostgreSQL pour le multi-postes",

    "L'assistant IA répond à vos questions 24/7",

    "Sauvegardez régulièrement votre base PostgreSQL",
  ];

  return (

    <Container
      size="full"
      p="md"
    >

      <Stack gap="lg">

        {/* HERO */}
        <Card
          withBorder
          radius="lg"
          p="xl"
          style={{

            background:

              'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)'
          }}
        >

          <Group justify="space-between">

            <Group gap="md">

              <Avatar
                size={70}
                radius="md"
                style={{

                  backgroundColor:
                    'rgba(255,255,255,0.2)'
                }}
              >

                <IconBook
                  size={35}
                  color="black"
                />

              </Avatar>

              <Box>

                <Title
                  order={1}
                  c="white"
                  size="h2"
                >

                  Guide d'utilisation

                </Title>

                <Text
                  c="gray.3"
                  size="sm"
                >

                  Découvrez toutes les fonctionnalités
                  de Gestion Couture

                </Text>

              </Box>

            </Group>

            <Badge
              size="lg"
              variant="white"
            >

              v{APP_VERSION}

            </Badge>

          </Group>

        </Card>

        {/* ASTUCES */}
        <Card
          withBorder
          radius="lg"
          p="xl"
          shadow="sm"
        >

          <Title
            order={3}
            size="h4"
            mb="md"
          >

            💡 Astuces pour bien démarrer

          </Title>

          <Divider mb="md" />

          <Grid>

            {tips.map(

              (tip, index) => (

                <Grid.Col
                  key={index}
                  span={{
                    base: 12,
                    md: 6
                  }}
                >

                  <Group gap="xs">

                    <ThemeIcon
                      size="sm"
                      radius="xl"
                      color="blue"
                      variant="light"
                    >

                      <IconCheck size={12} />

                    </ThemeIcon>

                    <Text size="sm">

                      {tip}

                    </Text>

                  </Group>

                </Grid.Col>
              )
            )}

          </Grid>

        </Card>

        {/* FONCTIONNALITÉS */}
        <Card
          withBorder
          radius="lg"
          p="xl"
          shadow="sm"
        >

          <Title
            order={3}
            size="h4"
            mb="md"
          >

            📚 Fonctionnalités

          </Title>

          <Divider mb="md" />

          <SimpleGrid
            cols={{
              base: 1,
              md: 2
            }}
            spacing="md"
          >

            {sections.map(

              (section, index) => (

                <Paper
                  key={index}
                  p="lg"
                  radius="lg"
                  withBorder
                  style={{

                    transition:
                      'transform 0.2s',

                    cursor:
                      'pointer'
                  }}

                  onMouseEnter={(e) =>

                    e.currentTarget.style.transform =
                      'translateY(-2px)'
                  }

                  onMouseLeave={(e) =>

                    e.currentTarget.style.transform =
                      'translateY(0)'
                  }
                >

                  <Group mb="md">

                    <ThemeIcon
                      size="xl"
                      radius="md"
                      variant="gradient"
                      gradient={section.gradient}
                    >

                      <section.icon size={24} />

                    </ThemeIcon>

                    <Box>

                      <Title
                        order={4}
                        size="h5"
                      >

                        {section.title}

                      </Title>

                      <Text
                        size="xs"
                        c="dimmed"
                      >

                        {section.description}

                      </Text>

                    </Box>

                  </Group>

                  <Divider mb="md" />

                  <Stack gap="xs">

                    {section.content.map(

                      (point, i) => (

                        <Text
                          key={i}
                          size="sm"
                        >

                          • {point}

                        </Text>
                      )
                    )}

                  </Stack>

                </Paper>
              )
            )}

          </SimpleGrid>

        </Card>

        {/* OUTILS */}
        <Card
          withBorder
          radius="lg"
          p="xl"
          shadow="sm"
        >

          <Title
            order={3}
            size="h4"
            mb="md"
          >

            🛠️ Outils

          </Title>

          <Divider mb="md" />

          <SimpleGrid
            cols={{
              base: 1,
              md: 3
            }}
            spacing="md"
          >

            {outilsSection.map(

              (outil, index) => (

                <Paper
                  key={index}
                  p="xl"
                  radius="lg"
                  withBorder
                  ta="center"

                  style={{

                    cursor:
                      'pointer',

                    transition:
                      'transform 0.2s'
                  }}

                  onClick={() =>
                    navigate(outil.path)
                  }

                  onMouseEnter={(e) =>

                    e.currentTarget.style.transform =
                      'translateY(-3px)'
                  }

                  onMouseLeave={(e) =>

                    e.currentTarget.style.transform =
                      'translateY(0)'
                  }
                >

                  <ThemeIcon
                    size="xl"
                    radius="xl"
                    color={outil.color}
                    variant="light"
                    mx="auto"
                  >

                    <outil.icon size={28} />

                  </ThemeIcon>

                  <Title
                    order={4}
                    size="h5"
                    mt="md"
                  >

                    {outil.title}

                  </Title>

                  <Text
                    size="xs"
                    c="dimmed"
                    mt={4}
                  >

                    {outil.description}

                  </Text>

                  <Button
                    variant="subtle"
                    color={outil.color}
                    rightSection={
                      <IconArrowRight size={14} />
                    }
                    mt="md"
                  >

                    Accéder

                  </Button>

                </Paper>
              )
            )}

          </SimpleGrid>

        </Card>

        {/* RACCOURCIS */}
        <Card
          withBorder
          radius="lg"
          p="xl"
          shadow="sm"
        >

          <Title
            order={3}
            size="h4"
            mb="md"
          >

            ⌨️ Raccourcis clavier

          </Title>

          <Divider mb="md" />

          <SimpleGrid
            cols={{
              base: 1,
              sm: 2,
              md: 3
            }}
            spacing="md"
          >

            {raccourcis.map(

              (item, index) => (

                <Paper
                  key={index}
                  p="sm"
                  radius="md"
                  withBorder
                  bg="gray.0"
                >

                  <Group justify="space-between">

                    <Group gap="xs">

                      {item.keys.map(

                        (key, i) => (

                          <React.Fragment key={i}>

                            <Badge
                              size="lg"
                              variant="filled"
                              color={item.color}
                            >

                              {key}

                            </Badge>

                            {

                              i < item.keys.length - 1

                              &&

                              <Text size="sm">

                                +

                              </Text>
                            }

                          </React.Fragment>
                        )
                      )}

                    </Group>

                    <Text
                      size="sm"
                      fw={500}
                    >

                      {item.action}

                    </Text>

                  </Group>

                </Paper>
              )
            )}

          </SimpleGrid>

        </Card>

        {/* SUPPORT */}
        <Card
          withBorder
          radius="lg"
          p="xl"
          shadow="sm"
        >

          <Title
            order={3}
            size="h4"
            mb="md"
          >

            ❓ Besoin d'aide ?

          </Title>

          <Divider mb="md" />

          <SimpleGrid
            cols={{
              base: 1,
              md: 3
            }}
            spacing="lg"
          >

            {/* EMAIL */}
            <Paper
              withBorder
              radius="lg"
              p="xl"
              ta="center"
            >

              <ThemeIcon
                size={50}
                radius="xl"
                color="red"
                variant="light"
                mx="auto"
              >

                <IconMail size={25} />

              </ThemeIcon>

              <Text
                fw={700}
                mt="md"
              >

                Email

              </Text>

              <Text
                size="sm"
                c="dimmed"
              >

                jacqueskorgo5@gmail.com

              </Text>

              <Button
                variant="light"
                color="red"
                size="xs"
                mt="sm"
                leftSection={
                  <IconCopy size={14} />
                }

                onClick={() =>

                  copyToClipboard(

                    'jacqueskorgo5@gmail.com',

                    'Email'
                  )
                }
              >

                Copier

              </Button>

            </Paper>

            {/* TEL */}
            <Paper
              withBorder
              radius="lg"
              p="xl"
              ta="center"
            >

              <ThemeIcon
                size={50}
                radius="xl"
                color="blue"
                variant="light"
                mx="auto"
              >

                <IconPhone size={25} />

              </ThemeIcon>

              <Text
                fw={700}
                mt="md"
              >

                Téléphone

              </Text>

              <Text
                size="sm"
                c="dimmed"
              >

                +226 75 11 81 61

              </Text>

              <Button
                variant="light"
                color="blue"
                size="xs"
                mt="sm"
                leftSection={
                  <IconCopy size={14} />
                }

                onClick={() =>

                  copyToClipboard(

                    '+226 75 11 81 61',

                    'Téléphone'
                  )
                }
              >

                Copier

              </Button>

            </Paper>

            {/* WHATSAPP */}
            <Paper
              withBorder
              radius="lg"
              p="xl"
              ta="center"
            >

              <ThemeIcon
                size={50}
                radius="xl"
                color="green"
                variant="light"
                mx="auto"
              >

                <IconBrandWhatsapp size={25} />

              </ThemeIcon>

              <Text
                fw={700}
                mt="md"
              >

                WhatsApp

              </Text>

              <Text
                size="sm"
                c="dimmed"
              >

                +226 75 11 81 61

              </Text>

              <Button
                component="a"
                href="https://wa.me/22675118161"
                target="_blank"
                size="xs"
                color="green"
                variant="light"
                rightSection={
                  <IconExternalLink size={14} />
                }
                mt="sm"
              >

                Ouvrir WhatsApp

              </Button>

            </Paper>

          </SimpleGrid>

        </Card>

        {/* FOOTER */}
        <Card
          withBorder
          radius="lg"
          p="md"
          ta="center"
          bg="gray.0"
        >

          <Text
            size="xs"
            c="dimmed"
          >

            © {new Date().getFullYear()}
            KO-SOFT Couture
            - Tous droits réservés

          </Text>

          <Text
            size="xs"
            c="dimmed"
            mt={4}
          >

            Application de gestion professionnelle
            pour atelier de couture
            - Version {APP_VERSION}

          </Text>

        </Card>

      </Stack>

    </Container>
  );
};

export default GuideUtilisation;