import React, { useEffect, useState } from "react";
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Textarea,
  Divider,
  Paper,
  NumberInput,
  Alert,
  Modal,
  Box,
  SimpleGrid,
  Avatar,
  Badge,
  ScrollArea,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Container,
} from '@mantine/core';
import {
  IconPlus,
  IconArrowLeft,
  IconUser,
  IconMapPin,
  IconCheck,
  IconInfoCircle,
  IconRuler,
  IconPhone,
  IconAt,
  IconNote,
  IconUsers,
  IconDeviceFloppy,
  IconRefresh,
} from '@tabler/icons-react';
import FormulaireTypeMesure from "../parametres/FormulaireTypeMesure";
import { executeSafe, selectSafe } from "../../database/db";

// ================= TYPES =================
interface TypeMesure {
  id: number;
  nom: string;
  unite?: string;
  categorie?: string;
}

interface Client {
  telephone_id: string;
  nom_prenom: string;
  adresse?: string;
  email?: string;
  observations?: string;
}

interface Props {
  clientEdit?: Client;
  onSuccess: (clientId?: string, clientNom?: string) => void;
  onBack: () => void;
}

const FormulaireClient: React.FC<Props> = ({ clientEdit, onSuccess, onBack }) => {
  const [typesMesures, setTypesMesures] = useState<TypeMesure[]>([]);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Formulaire client
  const [client, setClient] = useState<Client>({
    telephone_id: "",
    nom_prenom: "",
    adresse: "",
    email: "",
    observations: "",
  });

  const [mesures, setMesures] = useState<Record<number, number | undefined>>({});

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!client.telephone_id) {
      errors.telephone_id = "Le téléphone est requis";
    } else if (client.telephone_id.length < 8) {
      errors.telephone_id = "Téléphone invalide (minimum 8 caractères)";
    }
    
    if (!client.nom_prenom) {
      errors.nom_prenom = "Le nom est requis";
    }
    
    if (client.email && !/^\S+@\S+\.\S+$/.test(client.email)) {
      errors.email = "Email invalide";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ================= LOAD TYPES =================
  const loadTypes = async () => {
    const result = await selectSafe<TypeMesure>(
      `SELECT id, nom, unite, categorie 
       FROM types_mesures 
       WHERE est_active = 1 
       ORDER BY categorie, ordre_affichage, nom`
    );
    setTypesMesures(result);
  };

  // ================= LOAD MESURES =================
  const loadMesuresClient = async (clientId: string) => {
    const result = await selectSafe<{ type_mesure_id: number; valeur: number }>(
      `SELECT type_mesure_id, valeur 
       FROM mesures_clients 
       WHERE client_id = ?`,
      [clientId]
    );

    const formatted: Record<number, number | undefined> = {};
    result.forEach((m) => {
      formatted[m.type_mesure_id] = m.valeur;
    });
    setMesures(formatted);
  };

  // ================= INIT =================
  useEffect(() => {
    loadTypes();
  }, []);

  useEffect(() => {
    if (clientEdit) {
      setClient(clientEdit);
      if (clientEdit.telephone_id) {
        loadMesuresClient(clientEdit.telephone_id);
      }
    }
  }, [clientEdit]);

  // ================= INPUT HANDLERS =================
  const handleClientChange = (field: keyof Client, value: string) => {
    setClient(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMesureChange = (id: number, value: number | undefined) => {
    setMesures(prev => ({ ...prev, [id]: value }));
  };

  // ================= RESET MESURES =================
  const resetMesures = () => {
    const resetValues: Record<number, number | undefined> = {};
    typesMesures.forEach(t => {
      resetValues[t.id] = undefined;
    });
    setMesures(resetValues);
  };

  // ================= SUBMIT =================
  const saveData = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      await executeSafe(
        `INSERT OR REPLACE INTO clients (telephone_id, nom_prenom, adresse, email, observations, date_enregistrement)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [
          client.telephone_id, 
          client.nom_prenom, 
          client.adresse || null, 
          client.email || null, 
          client.observations || null
        ]
      );

      await executeSafe(
        `DELETE FROM mesures_clients WHERE client_id = ?`,
        [client.telephone_id]
      );

      const types = await selectSafe<{ id: number }>(
        `SELECT id FROM types_mesures WHERE est_active = 1`
      );

      const validIds = new Set(types.map((t) => t.id));

      for (const typeIdStr in mesures) {
        const typeId = Number(typeIdStr);
        const valeur = mesures[typeId];

        if (valeur === undefined || valeur === 0 || valeur === null) continue;
        if (!validIds.has(typeId)) continue;

        await executeSafe(
          `INSERT INTO mesures_clients (client_id, type_mesure_id, valeur, date_mesure)
           VALUES (?, ?, ?, datetime('now'))`,
          [client.telephone_id, typeId, valeur]
        );
      }

      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        // Passer l'ID et le nom du client au parent pour ouvrir le formulaire de vente
        onSuccess(client.telephone_id, client.nom_prenom);
      }, 2000);

    } catch (e) {
      console.error(e);
      alert("❌ Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // Grouper les mesures par catégorie
  const mesuresParCategorie = typesMesures.reduce((acc, mesure) => {
    const categorie = mesure.categorie || 'Autres';
    if (!acc[categorie]) acc[categorie] = [];
    acc[categorie].push(mesure);
    return acc;
  }, {} as Record<string, TypeMesure[]>);

  return (
    <Container size="lg" p={0}>
      <Box style={{ maxWidth: 1000, margin: '0 auto' }} p="md">
        <Stack gap="lg">
          {/* HEADER MODERNE */}
          <Card 
            withBorder 
            radius="lg" 
            p="xl" 
            style={{ 
              background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: -50, right: -50, opacity: 0.1 }}>
              <IconUsers size={200} color="white" />
            </div>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconUser size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={2} c="white" size="h3">
                    {clientEdit ? "✏️ Modifier le client" : "➕ Nouveau client"}
                  </Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    {clientEdit 
                      ? "Modifiez les informations et mesures du client" 
                      : "Ajoutez un nouveau client et ses mesures personnalisées"}
                  </Text>
                </Box>
              </Group>
              <Group>
                <Tooltip label="Aide">
                  <ActionIcon 
                    variant="light" 
                    color="white" 
                    size="lg" 
                    onClick={() => setInfoModalOpen(true)}
                  >
                    <IconInfoCircle size={20} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Retour">
                  <ActionIcon 
                    variant="light" 
                    color="white" 
                    size="lg" 
                    onClick={onBack}
                  >
                    <IconArrowLeft size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Card>

          {/* FORMULAIRE PRINCIPAL */}
          <Card withBorder radius="lg" shadow="sm" p="lg">
            <Stack gap="lg">
              {/* SECTION INFOS CLIENT */}
              <div>
                <Group gap="xs" mb="md">
                  <ThemeIcon variant="light" color="blue" size="sm" radius="md">
                    <IconUser size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm" c="gray.7">Informations personnelles</Text>
                </Group>
                
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    label="Téléphone"
                    placeholder="75 11 81 61"
                    value={client.telephone_id}
                    onChange={(e) => handleClientChange('telephone_id', e.target.value)}
                    leftSection={<IconPhone size={16} />}
                    size="md"
                    required
                    error={fieldErrors.telephone_id}
                  />

                  <TextInput
                    label="Nom complet"
                    placeholder="KORGO Jacques"
                    value={client.nom_prenom}
                    onChange={(e) => handleClientChange('nom_prenom', e.target.value)}
                    leftSection={<IconUser size={16} />}
                    size="md"
                    required
                    error={fieldErrors.nom_prenom}
                  />

                  <TextInput
                    label="Adresse"
                    placeholder="Adresse complète"
                    value={client.adresse}
                    onChange={(e) => handleClientChange('adresse', e.target.value)}
                    leftSection={<IconMapPin size={16} />}
                    size="md"
                  />

                  <TextInput
                    label="Email"
                    placeholder="jacques@example.com"
                    value={client.email}
                    onChange={(e) => handleClientChange('email', e.target.value)}
                    leftSection={<IconAt size={16} />}
                    size="md"
                    type="email"
                    error={fieldErrors.email}
                  />
                </SimpleGrid>

                <Textarea
                  label="Observations"
                  placeholder="Notes et observations spécifiques..."
                  value={client.observations}
                  onChange={(e) => handleClientChange('observations', e.target.value)}
                  leftSection={<IconNote size={16} />}
                  size="md"
                  rows={3}
                  mt="md"
                />
              </div>

              <Divider />

              {/* SECTION MESURES */}
              <div>
                <Group justify="space-between" mb="md">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color="green" size="sm" radius="md">
                      <IconRuler size={14} />
                    </ThemeIcon>
                    <Text fw={600} size="sm" c="gray.7">Mesures du client</Text>
                    <Badge size="sm" variant="light" color="blue">
                      {typesMesures.length} types
                    </Badge>
                  </Group>
                  <Group gap="xs">
                    <Button
                      variant="light"
                      size="compact-sm"
                      leftSection={<IconRefresh size={14} />}
                      onClick={resetMesures}
                      color="yellow"
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      variant="light"
                      size="compact-sm"
                      leftSection={<IconPlus size={14} />}
                      onClick={() => setShowTypeForm(true)}
                      color="blue"
                    >
                      Nouveau type
                    </Button>
                  </Group>
                </Group>

                <Paper withBorder radius="md" p="md" bg="gray.0">
                  {typesMesures.length === 0 ? (
                    <Alert 
                      color="blue" 
                      variant="light" 
                      icon={<IconInfoCircle size={16} />}
                    >
                      <Text size="sm">Aucun type de mesure configuré</Text>
                      <Text size="xs" c="dimmed" mt={4}>
                        Cliquez sur "Nouveau type" pour créer des mesures personnalisées
                      </Text>
                    </Alert>
                  ) : (
                    <ScrollArea style={{ maxHeight: 400 }}>
                      <Stack gap="md">
                        {Object.entries(mesuresParCategorie).map(([categorie, mesuresListe]) => (
                          <Box key={categorie}>
                            <Text size="xs" fw={600} c="blue" mb="xs" tt="uppercase">
                              {categorie}
                            </Text>
                            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
                              {mesuresListe.map((t) => (
                                <Paper
                                  key={t.id}
                                  p="sm"
                                  radius="md"
                                  bg="white"
                                  withBorder
                                  style={{
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  <Text size="xs" fw={500} c="gray.7" mb={4}>
                                    {t.nom}
                                  </Text>
                                  <Text size="xs" c="dimmed" mb={8}>
                                    {t.unite || 'cm'}
                                  </Text>
                                  <NumberInput
                                    placeholder="Valeur"
                                    value={mesures[t.id] ?? undefined}
                                    onChange={(val) => handleMesureChange(t.id, val === "" ? undefined : Number(val))}
                                    size="xs"
                                    decimalScale={1}
                                    step={0.5}
                                    min={0}
                                    hideControls={false}
                                    style={{ width: '100%' }}
                                  />
                                </Paper>
                              ))}
                            </SimpleGrid>
                          </Box>
                        ))}
                      </Stack>
                    </ScrollArea>
                  )}
                </Paper>
              </div>

              <Divider />

              {/* ACTIONS */}
              <Group justify="space-between">
                <Button
                  size="md"
                  variant="outline"
                  color="red"
                  onClick={onBack}
                  leftSection={<IconArrowLeft size={16} />}
                >
                  Annuler
                </Button>
                <Button
                  size="md"
                  onClick={saveData}
                  loading={saving}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  leftSection={<IconDeviceFloppy size={16} />}
                >
                  {clientEdit ? "Mettre à jour" : "Enregistrer le client"}
                </Button>
              </Group>

              {/* SUCCÈS */}
              {showSuccess && (
                <Alert
                  icon={<IconCheck size={16} />}
                  color="green"
                  variant="filled"
                >
                  <Text size="sm" c="white">
                    {clientEdit 
                      ? "✅ Client modifié avec succès !" 
                      : "✅ Client ajouté avec succès !"}
                  </Text>
                  <Text size="xs" c="green.1" mt={4}>
                    Redirection vers la vente...
                  </Text>
                </Alert>
              )}
            </Stack>
          </Card>

          {/* MODAL INSTRUCTIONS */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title={
              <Group gap="xs">
                <IconInfoCircle size={18} />
                <Text fw={600}>Guide d'utilisation</Text>
              </Group>
            }
            size="md"
            centered
            radius="lg"
          >
            <Stack gap="md">
              <Paper p="sm" bg="blue.0" radius="md">
                <Text size="sm" fw={500} mb="xs">📝 Informations client</Text>
                <Text size="xs" c="dimmed">• Le téléphone et le nom sont obligatoires</Text>
                <Text size="xs" c="dimmed">• L'email doit être valide si renseigné</Text>
                <Text size="xs" c="dimmed">• Les observations sont optionnelles</Text>
              </Paper>

              <Paper p="sm" bg="green.0" radius="md">
                <Text size="sm" fw={500} mb="xs">📏 Mesures</Text>
                <Text size="xs" c="dimmed">• Saisissez les valeurs dans les champs correspondants</Text>
                <Text size="xs" c="dimmed">• Créez de nouveaux types de mesures si besoin</Text>
                <Text size="xs" c="dimmed">• Les mesures sont automatiquement sauvegardées</Text>
              </Paper>

              <Paper p="sm" bg="orange.0" radius="md">
                <Text size="sm" fw={500} mb="xs">💡 Conseils</Text>
                <Text size="xs" c="dimmed">• Utilisez le bouton "Réinitialiser" pour effacer toutes les mesures</Text>
                <Text size="xs" c="dimmed">• Les mesures vides ne seront pas enregistrées</Text>
                <Text size="xs" c="dimmed">• Vous pouvez modifier les mesures à tout moment</Text>
              </Paper>

              <Divider />
              <Text size="xs" c="dimmed" ta="center">
                Version 2.0.0 - Gestion Couture Pro
              </Text>
            </Stack>
          </Modal>

          {/* MODAL NOUVEAU TYPE DE MESURE */}
          <Modal
            opened={showTypeForm}
            onClose={() => setShowTypeForm(false)}
            title="Nouveau type de mesure"
            size="lg"
            centered
            radius="lg"
          >
            <FormulaireTypeMesure
              onSuccess={async () => {
                setShowTypeForm(false);
                await loadTypes();
              }}
              onCancel={() => setShowTypeForm(false)}
            />
          </Modal>
        </Stack>
      </Box>
    </Container>
  );
};

export default FormulaireClient;