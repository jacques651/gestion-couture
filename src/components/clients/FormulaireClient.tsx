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
} from '@mantine/core';
import {
  IconPlus,
  IconArrowLeft,
  IconDeviceMobile,
  IconUser,
  IconMapPin,
  IconMail,
  IconMessage,
  IconCheck,
  IconInfoCircle,
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
  adresse?: string;
  email?: string;
  recommandations?: string;
}

interface Props {
  clientEdit?: Client;
  onSuccess: () => void;
  onBack: () => void;
}

const FormulaireClient: React.FC<Props> = ({ clientEdit, onSuccess, onBack }) => {
  const [typesMesures, setTypesMesures] = useState<TypeMesure[]>([]);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const [client, setClient] = useState<Client>({
    telephone_id: "",
    nom_prenom: "",
    adresse: "",
    email: "",
    recommandations: "",
  });

  const [mesures, setMesures] = useState<Record<number, number | undefined>>({});

  // ================= LOAD TYPES =================
  const loadTypes = async () => {
    const result = await selectSafe<TypeMesure>(
      `SELECT id, nom, unite 
       FROM types_mesures 
       WHERE est_active = 1 
       ORDER BY ordre_affichage`
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

  // ================= INPUT =================
  const handleChange = (field: keyof Client, value: string) => {
    setClient(prev => ({ ...prev, [field]: value }));
  };

  const handleMesureChange = (id: number, value: number | undefined) => {
    setMesures(prev => ({ ...prev, [id]: value }));
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (!client.telephone_id || !client.nom_prenom) {
      alert("Téléphone et nom obligatoires");
      return;
    }

    setSaving(true);
    setSuccess(false);

    try {
      await executeSafe(
        `INSERT INTO clients (telephone_id, nom_prenom, adresse, email, recommandations)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(telephone_id)
         DO UPDATE SET
           nom_prenom = excluded.nom_prenom,
           adresse = excluded.adresse,
           email = excluded.email,
           recommandations = excluded.recommandations`,
        [client.telephone_id, client.nom_prenom, client.adresse, client.email, client.recommandations]
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

        if (valeur === undefined || valeur === 0) continue;
        if (!validIds.has(typeId)) continue;

        await executeSafe(
          `INSERT INTO mesures_clients (client_id, type_mesure_id, valeur)
           VALUES (?, ?, ?)`,
          [client.telephone_id, typeId, valeur]
        );
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (e) {
      console.error(e);
      alert("❌ Erreur base de données");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box style={{ maxWidth: 800, margin: '0 auto' }} p="sm">
      <Stack gap="md">
        {/* HEADER COMPACT */}
        <Card withBorder radius="md" p="sm" bg="#1b365d">
          <Group justify="space-between">
            <Group gap="xs">
              <IconUser size={18} color="white" />
              <Title order={4} size="h5" c="white">
                {clientEdit ? "Modifier client" : "Nouveau client"}
              </Title>
            </Group>
            <Group gap="xs">
              <Button
                variant="subtle"
                color="white"
                size="compact-sm"
                leftSection={<IconInfoCircle size={14} />}
                onClick={() => setInfoModalOpen(true)}
              >
                Aide
              </Button>
              <Button
                variant="subtle"
                color="white"
                size="compact-sm"
                leftSection={<IconArrowLeft size={14} />}
                onClick={onBack}
              >
                Retour
              </Button>
            </Group>
          </Group>
        </Card>

        {/* FORMULAIRE PRINCIPAL COMPACT */}
        <Card withBorder radius="md" p="xs">
          <Stack gap="xs">
            {/* INFOS CLIENT */}
            <TextInput
              label="Téléphone"
              placeholder="75 11 81 61"
              value={client.telephone_id}
              onChange={(e) => handleChange('telephone_id', e.target.value)}
              leftSection={<IconDeviceMobile size={12} />}
              size="xs"
              required
            />

            <TextInput
              label="Nom complet"
              placeholder="OUOBA Ali"
              value={client.nom_prenom}
              onChange={(e) => handleChange('nom_prenom', e.target.value)}
              leftSection={<IconUser size={12} />}
              size="xs"
              required
            />

            <TextInput
              label="Adresse"
              placeholder="Adresse"
              value={client.adresse}
              onChange={(e) => handleChange('adresse', e.target.value)}
              leftSection={<IconMapPin size={12} />}
              size="xs"
            />

            <TextInput
              label="Email"
              placeholder="client@exemple.com"
              value={client.email}
              onChange={(e) => handleChange('email', e.target.value)}
              leftSection={<IconMail size={12} />}
              size="xs"
              type="email"
            />

            <Textarea
              label="Recommandations"
              placeholder="Notes..."
              value={client.recommandations || ""}
              onChange={(e) => handleChange('recommandations', e.target.value)}
              leftSection={<IconMessage size={12} />}
              size="xs"
              rows={2}
            />

            <Divider />

           {/* MESURES */}
<div>
  <Group justify="space-between" mb={4}>
    <Text size="xs" fw={500}>Mesures</Text>
    <Button
      variant="light"
      size="compact-xs"
      leftSection={<IconPlus size={12} />}
      onClick={() => setShowTypeForm(true)}
    >
      Type
    </Button>
  </Group>

  <Paper withBorder p="xs" radius="md" bg="gray.0">
    {typesMesures.length === 0 ? (
      <Text ta="center" size="xs" c="dimmed" py="sm">
        Aucun type de mesure
      </Text>
    ) : (
      <SimpleGrid cols={4} spacing="xs">
        {typesMesures.map((t) => (
          <Paper key={t.id} withBorder p="xs" radius="sm" bg="white">
            <Text size="xs" c="dimmed" mb={2}>
              {t.nom} {t.unite && `(${t.unite})`}
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
            />
          </Paper>
        ))}
      </SimpleGrid>
    )}
  </Paper>
</div>

            <Divider />

            {/* ACTIONS */}
            <Group justify="space-between">
              <Button size="xs" variant="light" color="red" onClick={onBack}>
                Annuler
              </Button>
              <Button
                size="xs"
                onClick={handleSubmit}
                loading={saving}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                {clientEdit ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </Group>

            {/* SUCCÈS */}
            {success && (
              <Alert icon={<IconCheck size={12} />} color="green" variant="light" p="xs">
                <Text size="xs">Succès ! Redirection...</Text>
              </Alert>
            )}
          </Stack>
        </Card>

        {/* MODAL INSTRUCTIONS */}
        <Modal
          opened={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          title="📋 Instructions"
          size="sm"
          centered
          styles={{
            header: {
              backgroundColor: '#1b365d',
              padding: '10px 12px',
            },
            title: {
              color: 'white',
              fontWeight: 600,
              fontSize: 13,
            },
            body: {
              padding: '12px',
            },
          }}
        >
          <Stack gap="xs">
            <Text size="xs">1. Téléphone et nom sont obligatoires</Text>
            <Text size="xs">2. Ajoutez les mesures du client</Text>
            <Text size="xs">3. Créez des types de mesures si besoin</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0
            </Text>
          </Stack>
        </Modal>

        {/* MODAL NOUVEAU TYPE DE MESURE */}
        <Modal
          opened={showTypeForm}
          onClose={() => setShowTypeForm(false)}
          title="Nouveau type de mesure"
          size="sm"
          centered
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
  );
};

export default FormulaireClient;