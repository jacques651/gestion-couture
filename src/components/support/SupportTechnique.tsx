import React from 'react';
import {
  useNavigate
} from 'react-router-dom';
import {
  Stack,
  Card,
  Title,
  Text,
  Button,
  Group,
  ThemeIcon,
  Divider,
  Alert,
  SimpleGrid,
  Box,
  Container,
  Avatar,
  Badge,
  Paper,
  Grid,
} from '@mantine/core';
import {
  IconHeadset,
  IconMail,
  IconPhone,
  IconClock,
  IconBrandWhatsapp,
  IconMailForward,
  IconBuildingStore,
  IconMessageCircle,
  IconHelpCircle,
  IconCheck,
  IconExternalLink,
} from '@tabler/icons-react';


const navigate =
  useNavigate();
const SupportTechnique:
React.FC = ({ }) => {
  const supportOptions = [
    {
      icon: IconPhone,
      title: "Support Téléphonique",
      description: "Appelez-nous pour une assistance immédiate",
      contact: "+226 75 11 81 61",
      contact2: "+226 72 44 24 85",
      action: "tel:+22675118161",
      color: "blue",
      gradient: { from: 'blue', to: 'cyan' },
    },
    {
      icon: IconBrandWhatsapp,
      title: "Support WhatsApp",
      description: "Support instantané par message",
      contact: "+226 75 11 81 61",
      contact2: "+226 72 44 24 85",
      action: "https://wa.me/22675118161",
      color: "green",
      gradient: { from: 'green', to: 'teal' },
    },
    {
      icon: IconMail,
      title: "Support Email",
      description: "Envoyez-nous un email détaillé",
      contact: "jacqueskorgo5@gmail.com",
      contact2: "",
      action: "mailto:jacqueskorgo5@gmail.com",
      color: "red",
      gradient: { from: 'red', to: 'orange' },
    },
  ];
  const APP_VERSION =
    '1.0.0';

  const faqs = [
    {
      question: "Comment créer une commande ?",
      answer: "Allez dans Commandes → Nouvelle commande, renseignez le client et les produits.",
    },
    {
      question: "Comment exporter la base de données ?",
      answer: "Allez dans Support & Aide → Exporter pour support.",
    },
    {
      question: "Comment ajouter un employé ?",
      answer: "Allez dans Ressources Humaines → Employés → Ajouter un employé.",
    },
    {
      question: "Comment générer une facture ?",
      answer: "Allez dans Factures & Reçus → Cliquez sur Facture pour la commande souhaitée.",
    },
  ];

  return (
    <Box p="md">
      <Container size="xl">
        <Stack gap="lg">
          {/* Header amélioré */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconHeadset size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Support Technique</Title>
                  <Text c="gray.3" size="sm">
                    Besoin d'aide ? Notre équipe est là pour vous assister 24h/24
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">Assistance rapide</Badge>
                    <Badge size="sm" variant="white" color="blue">Support gratuit</Badge>
                    <Badge size="sm" variant="white" color="blue">Réponse sous 24h</Badge>
                  </Group>
                </Box>
              </Group>
              <ThemeIcon size={60} radius="md" variant="white" style={{ opacity: 0.9 }}>
                <IconHelpCircle size={35} color="#1b365d" />
              </ThemeIcon>
            </Group>
          </Card>

          {/* Options de support en cartes larges */}
          <Grid>
            {supportOptions.map((option, index) => (
              <Grid.Col key={index} span={{ base: 12, md: 4 }}>
                <Card
                  withBorder
                  radius="lg"
                  p="xl"
                  h="100%"
                  shadow="sm"
                  style={{
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Stack align="center" gap="md">
                    <ThemeIcon size={70} radius="xl" variant="gradient" gradient={option.gradient}>
                      <option.icon size={35} />
                    </ThemeIcon>

                    <Stack align="center" gap={4}>
                      <Title order={3} size="h4" ta="center">{option.title}</Title>
                      <Text size="xs" c="dimmed" ta="center">{option.description}</Text>
                    </Stack>

                    <Divider w="100%" />

                    <Stack align="center" gap={4} w="100%">
                      <Text fw={600} size="sm">Contact :</Text>
                      <Text size="md" fw={700} c={option.color}>{option.contact}</Text>
                      {option.contact2 && (
                        <Text size="md" fw={700} c={option.color}>{option.contact2}</Text>
                      )}
                    </Stack>

                    <Button
                      component="a"
                      href={option.action}
                      target="_blank"
                      variant="gradient"
                      gradient={option.gradient}
                      fullWidth
                      size="md"
                      radius="md"
                      leftSection={<option.icon size={18} />}
                      rightSection={<IconExternalLink size={14} />}
                    >
                      Contacter
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>

          {/* Section FAQ */}
          <Card withBorder radius="lg" p="xl" shadow="sm">
            <Group mb="md">
              <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                <IconHelpCircle size={20} />
              </ThemeIcon>
              <Title order={3} size="h4">Foire Aux Questions (FAQ)</Title>
            </Group>
            <Divider mb="md" />
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {faqs.map((faq, index) => (
                <Paper key={index} p="md" radius="md" withBorder bg="gray.0">
                  <Group gap="xs" mb={8}>
                    <IconHelpCircle size={16} color="#1b365d" />
                    <Text fw={600} size="sm">{faq.question}</Text>
                  </Group>
                  <Text size="sm" c="dimmed" pl="lg">{faq.answer}</Text>
                </Paper>
              ))}
            </SimpleGrid>
          </Card>

          {/* Section Export */}
          <Alert
            icon={<IconMailForward size={20} />}
            color="blue"
            variant="light"
            radius="lg"
            p="lg"
          >
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={700} size="md">Besoin d'exporter votre base de données ?</Text>
                <Text size="sm" mt={4}>
                  Utilisez l'option "Export support PostgreSQL" pour générer un package diagnostic sécurisé.
                </Text>
              </Box>
              <Button
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
                onClick={() =>
  navigate('/export-support')
}
                leftSection={<IconMailForward size={16} />}
                radius="md"
              >
                Exporter maintenant
              </Button>
            </Group>
          </Alert>

          {/* Horaires et infos */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder radius="lg" p="xl" h="100%" shadow="sm">
                <Group mb="md">
                  <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                    <IconClock size={20} />
                  </ThemeIcon>
                  <Title order={3} size="h4">Horaires d'assistance</Title>
                </Group>
                <Divider mb="md" />
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconClock size={16} color="#1b365d" />
                      <Text size="sm">Lundi - Vendredi</Text>
                    </Group>
                    <Badge size="md" variant="light" color="green">9h00 - 18h00</Badge>
                  </Group>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconClock size={16} color="#1b365d" />
                      <Text size="sm">Samedi</Text>
                    </Group>
                    <Badge size="md" variant="light" color="orange">9h00 - 13h00</Badge>
                  </Group>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconClock size={16} color="#1b365d" />
                      <Text size="sm">Dimanche & Jours fériés</Text>
                    </Group>
                    <Badge size="md" variant="light" color="red">Fermé</Badge>
                  </Group>
                </Stack>
                <Divider my="md" />
                <Alert icon={<IconMessageCircle size={16} />} color="blue" variant="light">
                  <Text size="xs">En dehors des heures, laissez-nous un message, nous vous répondrons dans les plus brefs délais.</Text>
                </Alert>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder radius="lg" p="xl" h="100%" shadow="sm">
                <Group mb="md">
                  <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                    <IconHeadset size={20} />
                  </ThemeIcon>
                  <Title order={3} size="h4">À propos du support</Title>
                </Group>
                <Divider mb="md" />
                <Stack gap="sm">
                  <Group gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm">Support technique inclus avec votre licence</Text>
                  </Group>
                  <Group gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm">Mises à jour gratuites à vie</Text>
                  </Group>
                  <Group gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm">Formation incluse sur demande</Text>
                  </Group>
                  <Group gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm">Assistance prioritaire pour les urgences</Text>
                  </Group>
                </Stack>
                <Divider my="md" />
                <Alert icon={<IconBuildingStore size={16} />} color="teal" variant="light">
                  <Text size="xs" fw={600} ta="center">
                    KO-SOFT Couture - Solution complète pour atelier de couture
                  </Text>
                </Alert>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Footer */}
          <Card withBorder radius="lg" p="md" ta="center" bg="gray.0">
            <Text size="xs" c="dimmed">
              © {new Date().getFullYear()} KO-SOFT Couture - Tous droits réservés
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Application de gestion professionnelle pour atelier de couture - Version {APP_VERSION}
            </Text>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default SupportTechnique;