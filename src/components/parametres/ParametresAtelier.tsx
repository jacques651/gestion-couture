import React, { useEffect, useState, useRef } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Divider,
  TextInput,
  Textarea,
  LoadingOverlay,
  Image,
  Box,
  Tooltip,
  ActionIcon,
  Grid,
  Avatar,
  Container,
  Center,
  Notification,
  Select,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconUpload,
  IconPhoto,
  IconPhone,
  IconId,
  IconMessage,
  IconDeviceFloppy,
  IconTrash,
  IconMap2,
  IconAt,
  IconCheck,
  IconSettings,
  IconBuilding,
  IconFileCertificate,
  IconCurrencyEuro,
  IconMapPin,
} from '@tabler/icons-react';
import {
  getConfigurationAtelier,
  saveConfigurationAtelier,
} from '../../database/db';
import { journaliserAction } from '../../services/journal';

// Interface alignée avec la table
interface ConfigForm {
  id: number;
  nom_atelier: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  pays: string;
  ifu: string;
  rccm: string;
  message_facture_defaut: string;
  logo_base64: string;
  devise: string;

}

export default function ParametresAtelier() {
  const [config, setConfig] = useState<ConfigForm>({
    id: 1,
    nom_atelier: '',
    telephone: '',
    email: '',
    adresse: '',
    ville: '',
    pays: '',
    ifu: '',
    rccm: '',
    message_facture_defaut: '',
    logo_base64: '',
    devise: 'XOF',

  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const charger = async () => {
      const data = await getConfigurationAtelier();
      if (data) {
        setConfig({
          id: data.id || 1,
          nom_atelier: data.nom_atelier || '',
          telephone: data.telephone || '',
          email: data.email || '',
          adresse: data.adresse || '',
          ville: data.ville || '',
          pays: data.pays || '',
          ifu: (data as any).ifu || '',
          rccm: (data as any).rccm || '',
          message_facture_defaut: data.message_facture_defaut || '',
          logo_base64: data.logo_base64 || '',
          devise: data.devise || 'XOF',
        });
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
      alert('Le fichier est trop volumineux. Taille max: 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      setConfig((prev) => ({ ...prev, logo_base64: base64 }));
    };
    // Journalisation import logo
    journaliserAction({
      utilisateur: 'Utilisateur',
      action: 'UPDATE',
      table: 'atelier',
      idEnregistrement: config.id,
      details:
        `Import logo atelier : ${file.name}`
    });

    reader.readAsDataURL(file);
  };

  const supprimerLogo = async () => {

    setLogoPreview(null);

    setConfig({
      ...config,
      logo_base64: ''
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Journalisation suppression logo
    await journaliserAction({
      utilisateur: 'Utilisateur',
      action: 'UPDATE',
      table: 'atelier',
      idEnregistrement: config.id,
      details: 'Suppression logo atelier'
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Sauvegarde avec les champs de la table
    await saveConfigurationAtelier({
      nom_atelier: config.nom_atelier,
      telephone: config.telephone,
      email: config.email,
      adresse: config.adresse,
      ville: config.ville,
      pays: config.pays,
      ifu: config.ifu,
      rccm: config.rccm,
      message_facture_defaut: config.message_facture_defaut,
      logo_base64: config.logo_base64,
      devise: config.devise,
    } as any);

    // Journalisation configuration atelier
    await journaliserAction({
      utilisateur: 'Utilisateur',
      action: 'UPDATE',
      table: 'atelier',
      idEnregistrement: config.id,
      details:
        `Modification paramètres atelier : ${config.nom_atelier}`
    });
    setSaving(false);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <LoadingOverlay visible={true} />
        <Text>Chargement...</Text>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(19, 65, 134, 0.2)' }}>
                  <IconSettings size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Paramètres de l'atelier</Title>
                  <Text c="gray.3" size="sm">Configurez les informations de votre atelier</Text>
                </Box>
              </Group>
            </Group>
          </Card>

          {/* Notification */}
          {showNotification && (
            <Notification icon={<IconCheck size={18} />} color="green" title="Succès !" onClose={() => setShowNotification(false)} radius="md">
              Configuration enregistrée avec succès !
            </Notification>
          )}

          <form onSubmit={handleSave}>
            <Grid>
              {/* Logo */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card withBorder radius="lg" shadow="sm" p="xl">
                  <Stack align="center" gap="md">
                    <Title order={4}>Logo</Title>
                    <Box style={{ position: 'relative' }}>
                      {logoPreview ? (
                        <>
                          <Image src={logoPreview} w={160} h={160} fit="contain" radius="md" style={{ border: '2px solid #dee2e6', padding: 16, backgroundColor: 'white' }} />
                          <Tooltip label="Supprimer">
                            <ActionIcon color="red" variant="filled" onClick={supprimerLogo} style={{ position: 'absolute', top: -8, right: -8 }} size="sm" radius="xl">
                              <IconTrash size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      ) : (
                        <Box onClick={choisirLogo} style={{ width: 160, height: 160, border: '2px dashed #dee2e6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#f8f9fa' }}>
                          <Stack align="center" gap={4}>
                            <IconPhoto size={40} color="#adb5bd" />
                            <Text size="xs" c="dimmed">Ajouter un logo</Text>
                          </Stack>
                        </Box>
                      )}
                    </Box>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                    <Button variant="light" leftSection={<IconUpload size={16} />} onClick={choisirLogo} fullWidth radius="md">Importer</Button>
                    <Text size="xs" c="dimmed">PNG, JPG • Max 2MB</Text>
                  </Stack>
                </Card>

                {/* Message facture */}
                <Grid.Col span={16} style={{ marginTop: 16 }}>
                  <Card withBorder radius="lg" shadow="sm" p="xl">
                    <Stack gap="md">
                      <Title order={4}>
                        <Group gap="xs">
                          <IconMessage size={20} />
                          Message sur les factures
                        </Group>
                      </Title>
                      <Divider />
                      <Textarea
                        placeholder="Ex: Merci de votre confiance ! À bientôt."
                        value={config.message_facture_defaut}
                        onChange={(e) => setConfig({ ...config, message_facture_defaut: e.target.value })}
                        minRows={3}
                        radius="md"
                      />
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid.Col>

              {/* Formulaire principal */}
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Card withBorder radius="lg" shadow="sm" p="xl">
                  <Stack gap="md">
                    <Title order={4}>Informations générales</Title>
                    <Divider />

                    <TextInput
                      label="Nom de l'atelier"
                      placeholder="Ex: Couture Moderne"
                      value={config.nom_atelier}
                      onChange={(e) => setConfig({ ...config, nom_atelier: e.target.value })}
                      leftSection={<IconBuildingStore size={16} />}
                      required
                      radius="md"
                    />

                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Téléphone"
                          placeholder="75 11 81 61"
                          value={config.telephone}
                          onChange={(e) => setConfig({ ...config, telephone: e.target.value })}
                          leftSection={<IconPhone size={16} />}
                          radius="md"
                        />
                      </Grid.Col>

                    </Grid>

                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Email"
                          placeholder="contact@atelier.com"
                          value={config.email}
                          onChange={(e) => setConfig({ ...config, email: e.target.value })}
                          leftSection={<IconAt size={16} />}
                          radius="md"
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Select
                          label="Devise"
                          data={[
                            { value: 'XOF', label: 'FCFA (XOF)' },
                            { value: 'EUR', label: 'Euro (€)' },
                            { value: 'USD', label: 'Dollar ($)' },
                          ]}
                          value={config.devise || 'XOF'}
                          onChange={(value) => setConfig({ ...config, devise: value || 'XOF' })}
                          leftSection={<IconCurrencyEuro size={16} />}
                          radius="md"
                        />
                      </Grid.Col>
                    </Grid>

                    <TextInput
                      label="Adresse"
                      placeholder="Adresse complète"
                      value={config.adresse}
                      onChange={(e) => setConfig({ ...config, adresse: e.target.value })}
                      leftSection={<IconMap2 size={16} />}
                      radius="md"
                    />

                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Ville"
                          placeholder="Ouagadougou"
                          value={config.ville}
                          onChange={(e) => setConfig({ ...config, ville: e.target.value })}
                          leftSection={<IconBuilding size={16} />}
                          radius="md"
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Pays"
                          placeholder="Burkina Faso"
                          value={config.pays}
                          onChange={(e) => setConfig({ ...config, pays: e.target.value })}
                          leftSection={<IconMapPin size={16} />}
                          radius="md"
                        />
                      </Grid.Col>
                    </Grid>

                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
                          label="IFU"
                          placeholder="N° IFU"
                          value={config.ifu}
                          onChange={(e) => setConfig({ ...config, ifu: e.target.value })}
                          leftSection={<IconId size={16} />}
                          radius="md"
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput
                          label="RCCM"
                          placeholder="N° RCCM"
                          value={config.rccm}
                          onChange={(e) => setConfig({ ...config, rccm: e.target.value })}
                          leftSection={<IconFileCertificate size={16} />}
                          radius="md"
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Bouton */}
              <Grid.Col span={12}>
                <Group justify="flex-end">
                  <Button type="submit" loading={saving} size="lg" radius="md" leftSection={<IconDeviceFloppy size={20} />}>
                    Enregistrer
                  </Button>
                </Group>
              </Grid.Col>
            </Grid>
          </form>
        </Stack>
      </Container>
    </Box>
  );
}