import React, { useEffect, useState } from "react";
import {
  Stack, Card, Title, Text, Group, Button, TextInput, Textarea,
  Divider, Paper, Alert, Modal, Box, SimpleGrid,
  Avatar, Badge, ActionIcon, Tooltip, Container, Select,
} from '@mantine/core';
import {
  IconPlus, IconArrowLeft, IconUser, IconMapPin, IconCheck,
  IconInfoCircle, IconPhone, IconAt, IconUsers,
  IconDeviceFloppy, IconRefresh,
} from '@tabler/icons-react';
import FormulaireTypeMesure from "../parametres/FormulaireTypeMesure";
import { executeSafe, selectSafe } from "../../database/db";

// ================= TYPES =================
interface TypeMesure {
  id: number;
  nom: string;
  unite?: string;
}

interface Client {
  telephone_id: string;
  nom_prenom: string;
  profil?: string;
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

  const [client, setClient] = useState<Client>({
    telephone_id: "",
    nom_prenom: "",
    profil: "principal",
    adresse: "",
    email: "",
    observations: "",
  });

  const [mesures, setMesures] = useState<Record<number, number | undefined>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!client.telephone_id) { errors.telephone_id = "Le téléphone est requis"; }
    else if (client.telephone_id.length < 8) { errors.telephone_id = "Téléphone invalide (minimum 8 caractères)"; }
    if (!client.nom_prenom) { errors.nom_prenom = "Le nom est requis"; }
    if (client.email && !/^\S+@\S+\.\S+$/.test(client.email)) { errors.email = "Email invalide"; }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadTypes = async () => {
    const result = await selectSafe<TypeMesure>(
      `SELECT id, nom, unite FROM types_mesures WHERE est_active = 1 ORDER BY ordre_affichage, nom`
    );
    setTypesMesures(result);
  };

  const loadMesuresClient = async (clientId: string) => {
    const result = await selectSafe<{ type_mesure_id: number; valeur: number }>(
      `SELECT type_mesure_id, valeur FROM mesures_clients WHERE client_id = ?`, [clientId]
    );
    const formatted: Record<number, number | undefined> = {};
    result.forEach((m) => { formatted[m.type_mesure_id] = m.valeur; });
    setMesures(formatted);
  };

  useEffect(() => { loadTypes(); }, []);
  useEffect(() => {
    if (clientEdit) {
      setClient({ ...clientEdit, profil: clientEdit.profil || 'principal' });
      if (clientEdit.telephone_id) loadMesuresClient(clientEdit.telephone_id);
    }
  }, [clientEdit]);

  const handleClientChange = (field: keyof Client, value: string) => {
    setClient(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleMesureChange = (id: number, value: number | undefined) => {
    setMesures(prev => ({ ...prev, [id]: value }));
  };

  const resetMesures = () => {
    const resetValues: Record<number, number | undefined> = {};
    typesMesures.forEach(t => { resetValues[t.id] = undefined; });
    setMesures(resetValues);
  };

  const saveData = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await executeSafe(
        `INSERT OR REPLACE INTO clients (telephone_id, nom_prenom, profil, adresse, email, observations, date_enregistrement)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [client.telephone_id, client.nom_prenom, client.profil || 'principal', client.adresse || null, client.email || null, client.observations || null]
      );
      await executeSafe(`DELETE FROM mesures_clients WHERE client_id = ?`, [client.telephone_id]);
      const types = await selectSafe<{ id: number }>(`SELECT id FROM types_mesures WHERE est_active = 1`);
      const validIds = new Set(types.map(t => t.id));
      for (const typeIdStr in mesures) {
        const typeId = Number(typeIdStr);
        const valeur = mesures[typeId];
        if (valeur === undefined || valeur === 0 || valeur === null) continue;
        if (!validIds.has(typeId)) continue;
        await executeSafe(`INSERT INTO mesures_clients (client_id, type_mesure_id, valeur, date_mesure) VALUES (?, ?, ?, datetime('now'))`, [client.telephone_id, typeId, valeur]);
      }
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); onSuccess(client.telephone_id, client.nom_prenom); }, 2000);
    } catch (e) { console.error(e); alert("❌ Erreur lors de l'enregistrement"); }
    finally { setSaving(false); }
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
                <Avatar size={50} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}><IconUser size={26} color="white" /></Avatar>
                <Box><Title order={3} c="white">{clientEdit ? "Modifier le client" : "Nouveau client"}</Title><Text c="gray.3" size="xs">{clientEdit ? "Modifiez les informations et mesures" : "Ajoutez un client et ses mesures"}</Text></Box>
              </Group>
              <Group gap={4}>
                <Tooltip label="Aide"><ActionIcon variant="subtle" color="white" size="md" onClick={() => setInfoModalOpen(true)}><IconInfoCircle size={18} /></ActionIcon></Tooltip>
                <Tooltip label="Retour"><ActionIcon variant="subtle" color="white" size="md" onClick={onBack}><IconArrowLeft size={18} /></ActionIcon></Tooltip>
              </Group>
            </Group>
          </Card>

          {/* FORMULAIRE */}
          <Card withBorder radius="lg" shadow="sm" p="lg">
            <Stack gap="md">
              {/* SECTION INFOS CLIENT */}
              <div>
                <Text fw={600} size="sm" mb="md">📋 Informations personnelles</Text>

                {/* Ligne 1 : Téléphone | Nom | Profil */}
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                  <TextInput
                    label="Téléphone" placeholder="75 11 81 61"
                    value={client.telephone_id}
                    onChange={(e) => handleClientChange('telephone_id', e.target.value)}
                    leftSection={<IconPhone size={16} />}
                    size="sm" required radius="md"
                    error={fieldErrors.telephone_id}
                  />
                  <TextInput
                    label="Nom complet" placeholder="KORGO Jacques"
                    value={client.nom_prenom}
                    onChange={(e) => handleClientChange('nom_prenom', e.target.value)}
                    leftSection={<IconUser size={16} />}
                    size="sm" required radius="md"
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
                    size="sm" radius="md"
                  />
                </SimpleGrid>

                {/* Ligne 2 : Adresse | Email */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mt="sm">
                  <TextInput
                    label="Adresse" placeholder="Adresse complète"
                    value={client.adresse}
                    onChange={(e) => handleClientChange('adresse', e.target.value)}
                    leftSection={<IconMapPin size={16} />}
                    size="sm" radius="md"
                  />
                  <TextInput
                    label="Email" placeholder="jacques@example.com"
                    value={client.email}
                    onChange={(e) => handleClientChange('email', e.target.value)}
                    leftSection={<IconAt size={16} />}
                    size="sm" type="email" radius="md"
                    error={fieldErrors.email}
                  />
                </SimpleGrid>

                {/* Ligne 3 : Observations */}
                <Textarea
                  label="Observations" placeholder="Notes..."
                  value={client.observations}
                  onChange={(e) => handleClientChange('observations', e.target.value)}
                  size="sm" rows={2} mt="sm" radius="md"
                />
              </div>

              <Divider />

              {/* SECTION MESURES */}
              <div>
                <Group justify="space-between" mb="md">
                  <Group gap="xs">
                    <Text fw={600} size="sm">📏 Mesures</Text>
                    <Badge size="sm" variant="light" color="blue">{typesMesures.length} types</Badge>
                  </Group>
                  <Group gap="xs">
                    <Button variant="subtle" size="compact-xs" leftSection={<IconRefresh size={12} />} onClick={resetMesures} color="yellow">Reset</Button>
                    <Button variant="subtle" size="compact-xs" leftSection={<IconPlus size={12} />} onClick={() => setShowTypeForm(true)} color="blue">Nouveau type</Button>
                  </Group>
                </Group>

                <Paper withBorder radius="md" p="sm" bg="gray.0">
                  {typesMesures.length === 0 ? (
                    <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
                      <Text size="sm">Aucun type de mesure configuré</Text>
                      <Text size="xs" c="dimmed">Cliquez sur "Nouveau type"</Text>
                    </Alert>
                  ) : (
                    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="xs">
                      {typesMesures.map((t) => (
                        <Paper key={t.id} p="xs" radius="md" bg="white" withBorder>
                          <Text size="xs" fw={500}>{t.nom}</Text>
                          <Text size="10px" c="dimmed">{t.unite || 'cm'}</Text>
                          <TextInput
                            placeholder="0"
                            size="xs"
                            type="number"
                            value={mesures[t.id] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleMesureChange(t.id, val === "" ? undefined : Number(val));
                            }}
                            step={0.5}
                            min={0}
                            style={{ width: '100%' }}
                          />
                        </Paper>
                      ))}
                    </SimpleGrid>
                  )}
                </Paper>
              </div>

              <Divider />

              {/* BOUTONS */}
              <Group justify="space-between">
                <Button size="sm" variant="light" color="gray" onClick={onBack} leftSection={<IconArrowLeft size={14} />}>Annuler</Button>
                <Button size="sm" onClick={saveData} loading={saving} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }} leftSection={<IconDeviceFloppy size={14} />}>
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
            </Stack>
          </Modal>

          {/* MODAL NOUVEAU TYPE */}
          <Modal opened={showTypeForm} onClose={() => setShowTypeForm(false)} title="Nouveau type de mesure" size="lg" centered radius="md">
            <FormulaireTypeMesure onSuccess={async () => { setShowTypeForm(false); await loadTypes(); }} onCancel={() => setShowTypeForm(false)} />
          </Modal>
        </Stack>
      </Box>
    </Container>
  );
};

export default FormulaireClient;