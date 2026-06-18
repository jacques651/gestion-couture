// src/components/clients/FormulaireClient.tsx
import React, { useEffect, useState } from "react";
import { journaliserAction } from "../../services/journal";
import {
  Stack, Card, Title, Text, Group, Button, TextInput, Textarea,
  Divider, Paper, Alert, Modal, Box, SimpleGrid,
  Avatar, Badge, ActionIcon, Tooltip, Container, Select,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconPlus, IconArrowLeft, IconUser, IconMapPin, IconCheck,
  IconInfoCircle, IconPhone, IconAt, IconUsers,
  IconDeviceFloppy, IconRefresh,
} from '@tabler/icons-react';
import FormulaireTypeMesure from "../parametres/FormulaireTypeMesure";
import { apiGet, apiPost, apiPut } from '../../services/api';

// ================= TYPES =================
interface TypeMesure {
  id: number;
  nom: string;
  unite?: string;
}

interface Client {
  id?: number;
  telephone_id: string;
  nom_prenom: string;
  profil?: string;
  adresse?: string;
  email?: string;
  observations?: string;
}

interface Props {
  clientEdit?: Client;
  onSuccess: (clientId?: number, clientNom?: string) => void;
  onBack: () => void;
}

const FormulaireClient: React.FC<Props> = ({ clientEdit, onSuccess, onBack }) => {
  const [typesMesures, setTypesMesures] = useState<TypeMesure[]>([]);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingMesures, setLoadingMesures] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const [client, setClient] = useState<Client>({
    telephone_id: "",
    nom_prenom: "",
    profil: "principal",
    adresse: "",
    email: "",
    observations: "",
  });

  const isUpdateMode = Boolean(clientEdit?.id || clientEdit?.telephone_id);

  // 🔥 CHANGEMENT : Les mesures sont maintenant de type string
  const [mesures, setMesures] = useState<Record<number, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!client.telephone_id || client.telephone_id.trim() === '') {
      errors.telephone_id = "Le téléphone est requis";
    } else if (client.telephone_id.trim().length < 3) {
      errors.telephone_id = "Téléphone invalide (minimum 3 caractères)";
    }
    if (!client.nom_prenom || client.nom_prenom.trim() === '') {
      errors.nom_prenom = "Le nom est requis";
    }
    if (client.email && !/^\S+@\S+\.\S+$/.test(client.email)) {
      errors.email = "Email invalide";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadTypes = async () => {
    try {
      const result = await apiGet("/types-mesures");
      setTypesMesures(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("❌ Erreur chargement types:", error);
      setTypesMesures([]);
    }
  };

  const loadMesuresClient = async () => {
    if (!clientEdit?.telephone_id) {
      console.log("⚠️ Pas de téléphone pour charger les mesures");
      return;
    }

    setLoadingMesures(true);
    setLoadError(null);
    
    try {
      console.log(`📊 Chargement des mesures pour: ${clientEdit.telephone_id}`);
      const result = await apiGet(`/clients/${clientEdit.telephone_id}/mesures`);
      console.log("📊 Mesures reçues (brut):", result);
      
      // 🔥 CHANGEMENT : Stocker les valeurs comme des chaînes
      const formatted: Record<number, string> = {};
      
      if (Array.isArray(result)) {
        result.forEach((m: any) => {
          if (m && typeof m === 'object') {
            const typeId = m.type_mesure_id || m.typeMesureId || m.id;
            const valeur = m.valeur || m.value || m.valeur_mesure;
            
            if (typeId && valeur !== undefined && valeur !== null) {
              // Garder la valeur telle quelle (string)
              formatted[Number(typeId)] = String(valeur);
            }
          }
        });
      }
      
      setMesures(formatted);
      console.log("📊 Mesures formatées (string):", formatted);
      
      const count = Object.keys(formatted).filter(k => {
        const val = formatted[Number(k)];
        return val !== undefined && val !== null && val.trim() !== '' && val !== '0';
      }).length;
      console.log(`📊 ${count} mesure(s) chargée(s)`);
      
    } catch (error) {
      console.error("❌ Erreur chargement mesures:", error);
      setLoadError("Impossible de charger les mesures du client");
      setMesures({});
    } finally {
      setLoadingMesures(false);
    }
  };

  useEffect(() => { 
    loadTypes(); 
  }, []);

  useEffect(() => {
    if (clientEdit) {
      console.log("📝 Client à modifier:", clientEdit);
      
      setClient({
        id: clientEdit.id,
        telephone_id: clientEdit.telephone_id || "",
        nom_prenom: clientEdit.nom_prenom || "",
        profil: clientEdit.profil || 'principal',
        adresse: clientEdit.adresse || "",
        email: clientEdit.email || "",
        observations: clientEdit.observations || "",
      });

      if (clientEdit.telephone_id) {
        loadMesuresClient();
      }
    }
  }, [clientEdit]);

  const handleClientChange = (field: keyof Client, value: string) => {
    setClient(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  // 🔥 CHANGEMENT : handleMesureChange accepte maintenant une string
  const handleMesureChange = (id: number, value: string) => {
    setMesures(prev => ({ ...prev, [id]: value }));
  };

  const resetMesures = () => {
    const resetValues: Record<number, string> = {};
    typesMesures.forEach(t => { resetValues[t.id] = ''; });
    setMesures(resetValues);
  };

  const saveData = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setLoadError(null);

    try {
      const isUpdate = isUpdateMode;

      if (clientEdit?.id) {
        await apiPut(`/clients/id/${clientEdit.id}`, {
          telephone_id: client.telephone_id,
          nom_prenom: client.nom_prenom,
          profil: client.profil || "principal",
          adresse: client.adresse || null,
          email: client.email || null,
          observations: client.observations || null
        });
      } else {
        await apiPost("/clients", {
          telephone_id: client.telephone_id,
          nom_prenom: client.nom_prenom,
          profil: client.profil || "principal",
          adresse: client.adresse || null,
          email: client.email || null,
          observations: client.observations || null
        });
      }

      // 🔥 CHANGEMENT : Envoyer les mesures comme des chaînes
      const mesuresPayload = Object.entries(mesures)
        .filter(([_, valeur]) => {
          return valeur !== undefined && 
                 valeur !== null && 
                 valeur.trim() !== '' && 
                 valeur.trim() !== '0';
        })
        .map(([type_mesure_id, valeur]) => ({
          type_mesure_id: Number(type_mesure_id),
          valeur: valeur.trim()
        }));

      console.log("📊 Mesures à envoyer:", mesuresPayload);

      await apiPost(`/clients/${client.telephone_id}/mesures`, {
        mesures: mesuresPayload
      });

      await journaliserAction({
        utilisateur: 'Utilisateur',
        action: isUpdate ? 'UPDATE' : 'CREATE',
        table: 'clients',
        details: isUpdate 
          ? `Modification client : ${client.nom_prenom}` 
          : `Création client : ${client.nom_prenom}`
      });

      if (mesuresPayload.length > 0) {
        await journaliserAction({
          utilisateur: 'Utilisateur',
          action: 'UPDATE',
          table: 'mesures_clients',
          details: `Mise à jour des mesures (${mesuresPayload.length}) : ${client.nom_prenom}`
        });
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess(client.id || 0, client.nom_prenom);
      }, 2000);

    } catch (e) {
      console.error("❌ Erreur lors de l'enregistrement:", e);
      setLoadError("❌ Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // Fonction pour afficher les noms des mesures
  const getTypeDisplayName = (nom: string): string => {
    if (!nom) return '';
    // Remplacer les underscores par des espaces
    let displayName = nom.replace(/_/g, ' ');
    // Remplacer les tirets par des espaces
    displayName = displayName.replace(/-/g, ' ');
    // Remplacer les slashs par des espaces
    displayName = displayName.replace(/\//g, ' ');
    // Mettre en majuscule la première lettre de chaque mot
    displayName = displayName.replace(/\b\w/g, (char) => char.toUpperCase());
    return displayName;
  };

  // Compter les mesures non vides
  const countNonEmptyMesures = (): number => {
    let count = 0;
    Object.keys(mesures).forEach(key => {
      const id = Number(key);
      const value = mesures[id];
      if (value !== undefined && value !== null && value.trim() !== '' && value.trim() !== '0') {
        count++;
      }
    });
    return count;
  };

  return (
    <Container size="lg" p={0}>
      <Box style={{ maxWidth: 800, margin: '0 auto' }} p="md">
        <Stack gap="lg">
          {/* HEADER */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, opacity: 0.1 }}><IconUsers size={200} color="white" /></div>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={50} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconUser size={26} color="white" />
                </Avatar>
                <Box>
                  <Title order={3} c="white">
                    {clientEdit ? "Modifier le client" : "Nouveau client"}
                  </Title>
                  <Text c="gray.3" size="xs">
                    {clientEdit ? "Modifiez les informations et mesures" : "Ajoutez un client et ses mesures"}
                  </Text>
                </Box>
              </Group>
              <Group gap={4}>
                <Tooltip label="Aide">
                  <ActionIcon variant="subtle" color="white" size="md" onClick={() => setInfoModalOpen(true)}>
                    <IconInfoCircle size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Retour">
                  <ActionIcon variant="subtle" color="white" size="md" onClick={onBack}>
                    <IconArrowLeft size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Card>

          {/* FORMULAIRE */}
          <Card withBorder radius="lg" shadow="sm" p="lg" style={{ position: 'relative' }}>
            <LoadingOverlay visible={loadingMesures} />
            
            <Stack gap="md">
              {/* SECTION INFOS CLIENT */}
              <div>
                <Text fw={600} size="sm" mb="md">📋 Informations personnelles</Text>

                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                  <TextInput
                    label="Téléphone"
                    placeholder="75 11 81 61"
                    value={client.telephone_id || ""}
                    disabled={isUpdateMode}
                    onChange={(e) => handleClientChange('telephone_id', e.target.value)}
                    leftSection={<IconPhone size={16} />}
                    size="sm"
                    required
                    radius="md"
                    error={fieldErrors.telephone_id}
                  />
                  <TextInput
                    label="Nom complet"
                    placeholder="KORGO Jacques"
                    value={client.nom_prenom || ""}
                    onChange={(e) => handleClientChange('nom_prenom', e.target.value)}
                    leftSection={<IconUser size={16} />}
                    size="sm"
                    required
                    radius="md"
                    error={fieldErrors.nom_prenom}
                  />
                  <Select
                    label="Profil"
                    data={[
                      { value: 'principal', label: '👤 Principal (moi)' },
                      { value: 'enfant', label: '👶 Enfant' },
                      { value: 'conjoint', label: '💑 Conjoint(e)' },
                      { value: 'parent', label: '👴 Parent' },
                      { value: 'autre', label: '📝 Autre' },
                    ]}
                    value={client.profil || 'principal'}
                    onChange={(val) => handleClientChange('profil', val || 'principal')}
                    size="sm"
                    radius="md"
                  />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mt="sm">
                  <TextInput
                    label="Adresse"
                    placeholder="Adresse complète"
                    value={client.adresse || ""}
                    onChange={(e) => handleClientChange('adresse', e.target.value)}
                    leftSection={<IconMapPin size={16} />}
                    size="sm"
                    radius="md"
                  />
                  <TextInput
                    label="Email"
                    placeholder="jacques@example.com"
                    value={client.email || ""}
                    onChange={(e) => handleClientChange('email', e.target.value)}
                    leftSection={<IconAt size={16} />}
                    size="sm"
                    type="email"
                    radius="md"
                    error={fieldErrors.email}
                  />
                </SimpleGrid>

                <Textarea
                  label="Observations"
                  placeholder="Notes..."
                  value={client.observations || ""}
                  onChange={(e) => handleClientChange('observations', e.target.value)}
                  size="sm"
                  rows={2}
                  mt="sm"
                  radius="md"
                />
              </div>

              <Divider />

              {/* SECTION MESURES */}
              <div>
                <Group justify="space-between" mb="md">
                  <Group gap="xs">
                    <Text fw={600} size="sm">📏 Mesures</Text>
                    <Badge size="sm" variant="light" color="blue">{typesMesures.length} types</Badge>
                    {loadingMesures && <Badge size="sm" variant="light" color="yellow">Chargement...</Badge>}
                    {!loadingMesures && isUpdateMode && countNonEmptyMesures() > 0 && (
                      <Badge size="sm" variant="light" color="green">
                        {countNonEmptyMesures()} chargée(s)
                      </Badge>
                    )}
                  </Group>
                  <Group gap="xs">
                    <Button variant="subtle" size="compact-xs" leftSection={<IconRefresh size={12} />} onClick={resetMesures} color="yellow">
                      Reset
                    </Button>
                    <Button variant="subtle" size="compact-xs" leftSection={<IconPlus size={12} />} onClick={() => setShowTypeForm(true)} color="blue">
                      Nouveau type
                    </Button>
                  </Group>
                </Group>

                {loadError && (
                  <Alert color="red" variant="light" mb="sm">
                    <Text size="sm">{loadError}</Text>
                    <Button size="xs" variant="subtle" onClick={loadMesuresClient} mt="xs">
                      Réessayer
                    </Button>
                  </Alert>
                )}

                <Paper withBorder radius="md" p="sm" bg="gray.0">
                  {typesMesures.length === 0 ? (
                    <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
                      <Text size="sm">Aucun type de mesure configuré</Text>
                      <Text size="xs" c="dimmed">Cliquez sur "Nouveau type"</Text>
                    </Alert>
                  ) : (
                    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="xs">
                      {typesMesures.map((t) => {
                        const mesureValue = mesures[t.id] || '';
                        return (
                          <Paper key={t.id} p="xs" radius="md" bg="white" withBorder>
                            <Text size="xs" fw={500}>{getTypeDisplayName(t.nom)}</Text>
                            <Text size="10px" c="dimmed">{t.unite || 'cm'}</Text>
                            <TextInput
                              placeholder="0"
                              size="xs"
                              type="text"
                              value={mesureValue}
                              onChange={(e) => {
                                handleMesureChange(t.id, e.target.value);
                              }}
                              style={{ width: '100%' }}
                            />
                          </Paper>
                        );
                      })}
                    </SimpleGrid>
                  )}
                </Paper>
              </div>

              <Divider />

              {/* BOUTONS */}
              <Group justify="space-between">
                <Button size="sm" variant="light" color="gray" onClick={onBack} leftSection={<IconArrowLeft size={14} />}>
                  Annuler
                </Button>
                <Button 
                  size="sm" 
                  onClick={saveData} 
                  loading={saving} 
                  variant="gradient" 
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }} 
                  leftSection={<IconDeviceFloppy size={14} />}
                >
                  {clientEdit ? "Mettre à jour" : "Enregistrer"}
                </Button>
              </Group>

              {showSuccess && (
                <Alert icon={<IconCheck size={16} />} color="green" variant="filled" radius="md">
                  <Text size="sm" c="white">{clientEdit ? "✅ Client modifié !" : "✅ Client ajouté !"}</Text>
                </Alert>
              )}
            </Stack>
          </Card>

          {/* MODAL INSTRUCTIONS */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Guide" size="sm" centered radius="md">
            <Stack gap="xs">
              <Text size="sm">• Téléphone et nom obligatoires</Text>
              <Text size="sm">• Le profil permet plusieurs personnes avec le même numéro</Text>
              <Text size="sm">• Saisissez les mesures dans les champs</Text>
              <Text size="sm">• Toutes les mesures avec une valeur &gt; 0 sont enregistrées</Text>
              <Text size="sm">• Les valeurs peuvent contenir des caractères spéciaux (ex: 31-116, 80-100)</Text>
            </Stack>
          </Modal>

          {/* MODAL NOUVEAU TYPE */}
          <Modal opened={showTypeForm} onClose={() => setShowTypeForm(false)} title="Nouveau type de mesure" size="lg" centered radius="md">
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