import React, { useEffect, useState, useRef } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Alert,
  Divider,
  ThemeIcon,
  TextInput,
  Textarea,
  SimpleGrid,
  LoadingOverlay,
  Image,
  Box,
  Modal,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconCheck,
  IconUpload,
  IconX,
  IconPhoto,
  IconPhone,
  IconMail,
  IconId,
  IconMapPin,
  IconMessage,
  IconInfoCircle,
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
  const [success, setSuccess] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===============================
  // LOAD
  // ===============================
  useEffect(() => {
    const charger = async () => {
      const data = await getConfigurationAtelier();
      if (data) setConfig(data);
      setLoading(false);
    };
    charger();
  }, []);

  // ===============================
  // LOGO
  // ===============================
  const choisirLogo = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Le fichier est trop volumineux. Taille max: 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setConfig(prev => ({
        ...prev,
        logo_base64: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // ===============================
  // SAVE
  // ===============================
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    await saveConfigurationAtelier(config);

    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement de la configuration...</Text>
      </Card>
    );
  }

  return (
    <Stack p="md" gap="lg">
      {/* HEADER AVEC BOUTON INSTRUCTIONS */}
      <Card withBorder radius="md" p="lg" bg="#1b365d">
        <Group justify="space-between">
          <Stack gap={4}>
            <Group gap="xs">
              <IconBuildingStore size={24} color="white" />
              <Title order={2} c="white">Paramètres de l'atelier</Title>
            </Group>
            <Text size="sm" c="gray.3">
              Configurez les informations de votre atelier
            </Text>
          </Stack>
          <Group gap="md">
            <Button
              variant="light"
              color="white"
              leftSection={<IconInfoCircle size={18} />}
              onClick={() => setInfoModalOpen(true)}
            >
              Instructions
            </Button>
            <ThemeIcon size={48} radius="md" color="white" variant="light">
              <IconBuildingStore size={28} />
            </ThemeIcon>
          </Group>
        </Group>
      </Card>

      {/* CONTENU PRINCIPAL */}
      <Card withBorder radius="md" p="lg">
        <form onSubmit={handleSave}>
          <Stack gap="lg">
            {/* EN-TÊTE */}
            <div>
              <Title order={4}>Informations de l'atelier</Title>
              <Text size="sm" c="dimmed">
                Ces informations apparaîtront sur les factures et documents
              </Text>
            </div>

            <Divider />

            {/* LOGO */}
            <Box>
              <Text fw={500} size="sm" mb="xs">Logo de l'atelier</Text>
              <Group align="flex-end" gap="md">
                {config.logo_base64 ? (
                  <Box style={{ position: 'relative' }}>
                    <Image
                      src={config.logo_base64}
                      w={100}
                      h={100}
                      fit="contain"
                      radius="md"
                      style={{ border: '1px solid #dee2e6', padding: 8 }}
                    />
                    <Button
                      size="xs"
                      color="red"
                      variant="light"
                      onClick={() => setConfig({ ...config, logo_base64: '' })}
                      style={{ position: 'absolute', top: -8, right: -8 }}
                      p={4}
                    >
                      <IconX size={14} />
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="light"
                    leftSection={<IconPhoto size={16} />}
                    onClick={choisirLogo}
                  >
                    Choisir un logo
                  </Button>
                )}

                <Button
                  variant="subtle"
                  leftSection={<IconUpload size={16} />}
                  onClick={choisirLogo}
                  size="sm"
                >
                  Importer une image
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </Group>
              <Text size="xs" c="dimmed" mt="xs">
                Formats acceptés : PNG, JPG, JPEG (taille max: 2MB)
              </Text>
            </Box>

            <Divider />

            {/* FORMULAIRE */}
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Nom de l'atelier"
                placeholder="Ex: Couture Moderne"
                value={config.nom_atelier}
                onChange={(e) => setConfig({ ...config, nom_atelier: e.target.value })}
                leftSection={<IconBuildingStore size={16} />}
                required
              />

              <TextInput
                label="Téléphone"
                placeholder="Ex: 75 11 81 61"
                value={config.telephone}
                onChange={(e) => setConfig({ ...config, telephone: e.target.value })}
                leftSection={<IconPhone size={16} />}
              />

              <TextInput
                label="Email"
                placeholder="Ex: contact@couture.com"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                leftSection={<IconMail size={16} />}
                type="email"
              />

              <TextInput
                label="NIF (Numéro d'Identification Fiscale)"
                placeholder="Ex: 123456789"
                value={config.nif}
                onChange={(e) => setConfig({ ...config, nif: e.target.value })}
                leftSection={<IconId size={16} />}
              />
            </SimpleGrid>

            <Textarea
              label="Adresse"
              placeholder="Adresse complète de l'atelier"
              value={config.adresse}
              onChange={(e) => setConfig({ ...config, adresse: e.target.value })}
              leftSection={<IconMapPin size={16} />}
              minRows={2}
            />

            <Textarea
              label="Message sur les factures"
              placeholder="Message personnalisé à afficher sur les factures"
              value={config.message_facture}
              onChange={(e) => setConfig({ ...config, message_facture: e.target.value })}
              leftSection={<IconMessage size={16} />}
              minRows={3}
              description="Ce message apparaîtra au bas de chaque facture"
            />

            <Divider />

            {/* ACTIONS */}
            <Group justify="flex-end">
              <Button
                type="submit"
                loading={saving}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Enregistrer les modifications
              </Button>
            </Group>

            {/* MESSAGE DE SUCCÈS */}
            {success && (
              <Alert
                icon={<IconCheck size={16} />}
                color="green"
                variant="light"
                withCloseButton
                onClose={() => setSuccess(false)}
              >
                Configuration enregistrée avec succès !
              </Alert>
            )}
          </Stack>
        </form>
      </Card>

      {/* MODAL INSTRUCTIONS */}
      <Modal
        opened={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title="📋 Instructions"
        size="md"
        centered
        styles={{
          header: {
            backgroundColor: '#1b365d',
            padding: '16px 20px',
          },
          title: {
            color: 'white',
            fontWeight: 600,
          },
          body: {
            padding: '20px',
          },
        }}
      >
        <Stack gap="md">
          <Text size="sm">1. Renseignez les informations de votre atelier</Text>
          <Text size="sm">2. Téléchargez votre logo (optionnel mais recommandé)</Text>
          <Text size="sm">3. Le message sur les factures sera affiché sur chaque facture</Text>
          <Text size="sm">4. Toutes les informations sont utilisées sur les documents officiels</Text>
          <Text size="sm">5. N'oubliez pas d'enregistrer après chaque modification</Text>
          <Divider />
          <Text size="xs" c="dimmed" ta="center">
            Version 1.0.0 - Gestion Couture
          </Text>
        </Stack>
      </Modal>
    </Stack>
  );
}