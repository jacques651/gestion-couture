import React, { useEffect, useState, useRef } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Divider,
  ThemeIcon,
  TextInput,
  Textarea,
  LoadingOverlay,
  Image,
  Box,
  Modal,
  Tooltip,
  ActionIcon,
  Badge,
  Paper,
  Grid,
  Avatar,
  Container,
  Center,
  SimpleGrid,
  Notification,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconUpload,
  IconPhoto,
  IconPhone,
  IconId,
  IconMessage,
  IconInfoCircle,
  IconDeviceFloppy,
  IconTrash,
  IconFileInfo,
  IconBrandWhatsapp,
  IconMap2,
  IconAt,
  IconBuilding,
  IconCheck,
  IconSettings,
  IconMail,
  IconMapPin,
} from '@tabler/icons-react';
import {
  getConfigurationAtelier,
  saveConfigurationAtelier,
  ConfigurationAtelier
} from '../../database/db';

export default function ParametresAtelier() {
  const [config, setConfig] = useState<ConfigurationAtelier>({
    id: 1,
    nom_atelier: '',
    telephone: '',
    adresse: '',
    email: '',
    nif: '',
    message_facture: '',
    logo_base64: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setSuccess] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const charger = async () => {
      const data = await getConfigurationAtelier();
      if (data) {
        setConfig(data);
        setLogoPreview(data.logo_base64 || null);
      }
      setLoading(false);
    };
    charger();
  }, []);

  const choisirLogo = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Le fichier est trop volumineux. Taille max: 2MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner une image valide (PNG, JPG, JPEG)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      setConfig(prev => ({
        ...prev,
        logo_base64: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  const supprimerLogo = () => {
    setLogoPreview(null);
    setConfig({ ...config, logo_base64: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    await saveConfigurationAtelier(config);

    setSaving(false);
    setSuccess(true);
    setShowNotification(true);
    
    setTimeout(() => {
      setSuccess(false);
      setShowNotification(false);
    }, 3000);
  };

  const previewInfo = [
    { icon: IconBuildingStore, label: "Nom", value: config.nom_atelier || "Mon Atelier" },
    { icon: IconPhone, label: "Téléphone", value: config.telephone || "+226 XX XX XX XX" },
    { icon: IconMail, label: "Email", value: config.email || "contact@atelier.com" },
    { icon: IconMapPin, label: "Adresse", value: config.adresse || "Votre adresse" },
  ];

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl" style={{ minWidth: 300 }}>
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconBuildingStore size={40} stroke={1.5} />
            <Text fw={500}>Chargement de la configuration...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header amélioré */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconSettings size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Paramètres de l'atelier</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Configurez les informations de votre atelier de couture
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">Informations générales</Badge>
                    <Badge size="sm" variant="white" color="blue">Logo personnalisé</Badge>
                    <Badge size="sm" variant="white" color="blue">Factures</Badge>
                  </Group>
                </Box>
              </Group>
              <Button
                variant="light"
                color="white"
                leftSection={<IconInfoCircle size={18} />}
                onClick={() => setInfoModalOpen(true)}
                radius="md"
              >
                Instructions
              </Button>
            </Group>
          </Card>

          {/* Notification de succès */}
          {showNotification && (
            <Notification
              icon={<IconCheck size={18} />}
              color="green"
              title="Succès !"
              onClose={() => setShowNotification(false)}
              radius="md"
            >
              Configuration enregistrée avec succès !
            </Notification>
          )}

          <form onSubmit={handleSave}>
            <Grid>
              {/* Carte Logo améliorée */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card withBorder radius="lg" h="100%" shadow="sm" p="xl">
                  <Stack align="center" gap="md">
                    <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                      <IconPhoto size={30} />
                    </ThemeIcon>
                    <Title order={3} size="h4" ta="center">Logo de l'atelier</Title>
                    <Text size="xs" c="dimmed" ta="center">
                      Un logo professionnel renforce votre image de marque
                    </Text>
                    
                    <Box style={{ position: 'relative' }}>
                      {logoPreview ? (
                        <>
                          <Image
                            src={logoPreview}
                            w={160}
                            h={160}
                            fit="contain"
                            radius="md"
                            style={{ border: '2px solid #dee2e6', padding: 16, backgroundColor: 'white' }}
                          />
                          <Tooltip label="Supprimer le logo" position="top" withArrow>
                            <ActionIcon
                              color="red"
                              variant="filled"
                              onClick={supprimerLogo}
                              style={{ position: 'absolute', top: -10, right: -10 }}
                              size="md"
                              radius="xl"
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      ) : (
                        <Box
                          onClick={choisirLogo}
                          style={{
                            width: 160,
                            height: 160,
                            border: '2px dashed #dee2e6',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backgroundColor: '#f8f9fa',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e9ecef';
                            e.currentTarget.style.borderColor = '#1b365d';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#dee2e6';
                          }}
                        >
                          <Stack align="center" gap={8}>
                            <IconPhoto size={40} color="#adb5bd" />
                            <Text size="xs" c="dimmed">Choisir un logo</Text>
                          </Stack>
                        </Box>
                      )}
                    </Box>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />

                    <Button
                      variant="light"
                      leftSection={<IconUpload size={16} />}
                      onClick={choisirLogo}
                      fullWidth
                      radius="md"
                    >
                      Importer une image
                    </Button>

                    <Divider w="100%" />

                    <Stack gap={4} w="100%">
                      <Text size="xs" c="dimmed" ta="center">Formats acceptés :</Text>
                      <Group justify="center" gap="xs">
                        <Badge size="sm" variant="light">PNG</Badge>
                        <Badge size="sm" variant="light">JPG</Badge>
                        <Badge size="sm" variant="light">JPEG</Badge>
                      </Group>
                      <Text size="xs" c="dimmed" ta="center">Taille max : 2MB • Format carré recommandé</Text>
                    </Stack>
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Carte Informations de l'atelier améliorée */}
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Card withBorder radius="lg" shadow="sm" p="xl">
                  <Stack gap="lg">
                    <Group gap="sm">
                      <ThemeIcon size={45} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                        <IconBuilding size={22} />
                      </ThemeIcon>
                      <Box>
                        <Title order={3} size="h4">Informations de l'atelier</Title>
                        <Text size="xs" c="dimmed">Ces informations apparaîtront sur les factures et documents officiels</Text>
                      </Box>
                    </Group>

                    <Divider />

                    <Grid >
                      <Grid.Col span={12}>
                        <TextInput
                          label="Nom de l'atelier"
                          placeholder="Ex: Couture Moderne"
                          value={config.nom_atelier}
                          onChange={(e) => setConfig({ ...config, nom_atelier: e.target.value })}
                          leftSection={<IconBuildingStore size={16} />}
                          required
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label="Téléphone"
                          placeholder="Ex: 75 11 81 61"
                          value={config.telephone}
                          onChange={(e) => setConfig({ ...config, telephone: e.target.value })}
                          leftSection={<IconPhone size={16} />}
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label="WhatsApp"
                          placeholder="Ex: 75 11 81 61"
                          value={config.telephone}
                          onChange={(e) => setConfig({ ...config, telephone: e.target.value })}
                          leftSection={<IconBrandWhatsapp size={16} color="#25D366" />}
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label="Email"
                          placeholder="Ex: contact@couture.com"
                          value={config.email}
                          onChange={(e) => setConfig({ ...config, email: e.target.value })}
                          leftSection={<IconAt size={16} />}
                          type="email"
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label="NIF (Numéro d'Identification Fiscale)"
                          placeholder="Ex: 123456789"
                          value={config.nif}
                          onChange={(e) => setConfig({ ...config, nif: e.target.value })}
                          leftSection={<IconId size={16} />}
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={12}>
                        <Textarea
                          label="Adresse complète"
                          placeholder="Adresse complète de l'atelier"
                          value={config.adresse}
                          onChange={(e) => setConfig({ ...config, adresse: e.target.value })}
                          leftSection={<IconMap2 size={16} />}
                          minRows={2}
                          radius="md"
                          size="md"
                          autosize
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Carte Message sur les factures améliorée */}
              <Grid.Col span={12}>
                <Card withBorder radius="lg" shadow="sm" p="xl">
                  <Stack gap="lg">
                    <Group gap="sm">
                      <ThemeIcon size={45} radius="md" variant="gradient" gradient={{ from: 'violet', to: 'pink' }}>
                        <IconMessage size={22} />
                      </ThemeIcon>
                      <Box>
                        <Title order={3} size="h4">Message sur les factures</Title>
                        <Text size="xs" c="dimmed">Message personnalisé à afficher sur les factures</Text>
                      </Box>
                    </Group>

                    <Divider />

                    <Textarea
                      placeholder="Ex: Merci de votre confiance ! À bientôt dans notre atelier."
                      value={config.message_facture}
                      onChange={(e) => setConfig({ ...config, message_facture: e.target.value })}
                      minRows={3}
                      radius="md"
                      size="md"
                      autosize
                      description="Ce message apparaîtra au bas de chaque facture"
                    />

                    <Paper p="md" radius="md" bg="blue.0" withBorder>
                      <Group gap="xs" align="flex-start">
                        <IconFileInfo size={18} color="#1b365d" />
                        <Box>
                          <Text size="xs" fw={600} c="#1b365d">💡 Exemple de message :</Text>
                          <Text size="xs" c="#1b365d" mt={4}>
                            "Merci de votre fidélité ! Présentez cette facture pour bénéficier de -10% sur votre prochaine commande."
                          </Text>
                        </Box>
                      </Group>
                    </Paper>

                    <Paper p="md" radius="md" bg="yellow.0" withBorder>
                      <Group gap="xs" align="flex-start">
                        <IconMessage size={18} color="#e65100" />
                        <Box>
                          <Text size="xs" fw={600} c="#e65100">🎯 Autres idées :</Text>
                          <Text size="xs" c="#e65100" mt={4}>
                            • "Merci pour votre confiance, à très bientôt !"<br />
                            • "N'hésitez pas à nous recommander autour de vous."<br />
                            • "Suivez-nous sur les réseaux sociaux pour nos offres spéciales."
                          </Text>
                        </Box>
                      </Group>
                    </Paper>
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Aperçu en direct (optionnel) */}
              <Grid.Col span={12}>
                <Card withBorder radius="lg" shadow="sm" p="xl" bg="gray.0">
                  <Group mb="md">
                    <ThemeIcon size="md" radius="md" color="blue" variant="light">
                      <IconBuildingStore size={16} />
                    </ThemeIcon>
                    <Title order={4} size="h5">📋 Aperçu des informations</Title>
                  </Group>
                  <Divider mb="md" />
                  <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
                    {previewInfo.map((item, index) => (
                      <Paper key={index} p="sm" radius="md" withBorder bg="white">
                        <Group gap="xs">
                          <item.icon size={14} color="#1b365d" />
                          <Text size="xs" c="dimmed">{item.label}</Text>
                        </Group>
                        <Text size="sm" fw={500} mt={4} lineClamp={1}>
                          {item.value}
                        </Text>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Card>
              </Grid.Col>

              {/* Bouton d'enregistrement amélioré */}
              <Grid.Col span={12}>
                <Group justify="flex-end">
                  <Button
                    type="submit"
                    loading={saving}
                    variant="gradient"
                    gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                    leftSection={<IconDeviceFloppy size={20} />}
                    size="xl"
                    radius="md"
                  >
                    {saving ? "Enregistrement en cours..." : "Enregistrer les modifications"}
                  </Button>
                </Group>
              </Grid.Col>
            </Grid>
          </form>

          {/* Modal Instructions améliorée */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title={
              <Group gap="xs">
                <IconInfoCircle size={22} />
                <Text fw={600} size="lg">Instructions de configuration</Text>
              </Group>
            }
            size="lg"
            centered
            radius="lg"
            styles={{
              header: {
                backgroundColor: '#1b365d',
                padding: '20px 24px',
              },
              title: {
                color: 'white',
                fontWeight: 600,
              },
              body: {
                padding: '24px',
              },
            }}
          >
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" p="lg" bg="blue.0" h="100%">
                  <Text fw={700} size="md" mb="md" c="#1b365d">📋 Étapes de configuration</Text>
                  <Stack gap="md">
                    {[
                      "Renseignez les informations de votre atelier",
                      "Téléchargez votre logo (optionnel mais recommandé)",
                      "Personnalisez le message sur les factures",
                      "Toutes les informations sont utilisées sur les documents officiels",
                      "N'oubliez pas d'enregistrer après chaque modification"
                    ].map((step, i) => (
                      <Group key={i} gap="sm" align="flex-start" wrap="nowrap">
                        <Badge size="md" circle color="blue" variant="filled">{i + 1}</Badge>
                        <Text size="sm">{step}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" p="lg" bg="yellow.0" h="100%">
                  <Text fw={700} size="md" mb="md" c="#e65100">💡 Conseils pratiques</Text>
                  <Stack gap="md">
                    <Group gap="sm" align="flex-start">
                      <IconPhoto size={18} color="#e65100" />
                      <Text size="sm">Utilisez un logo carré de préférence (fond transparent)</Text>
                    </Group>
                    <Group gap="sm" align="flex-start">
                      <IconMessage size={18} color="#e65100" />
                      <Text size="sm">Le message de facture peut être un remerciement ou une promotion</Text>
                    </Group>
                    <Group gap="sm" align="flex-start">
                      <IconDeviceFloppy size={18} color="#e65100" />
                      <Text size="sm">Les informations apparaîtront sur les impressions</Text>
                    </Group>
                    <Group gap="sm" align="flex-start">
                      <IconBrandWhatsapp size={18} color="#e65100" />
                      <Text size="sm">Le numéro WhatsApp sera affiché pour que vos clients vous contactent</Text>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>

            <Divider my="lg" />

            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0 - Gestion Couture<br />
              © {new Date().getFullYear()} Tous droits réservés
            </Text>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
}