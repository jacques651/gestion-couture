import React, { useState, useEffect } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Select,
  TextInput,
  NumberInput,
  Textarea,
  Divider,
  LoadingOverlay,
  Alert,
  SimpleGrid,
  Box,
  Modal,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconUser,
  IconTag,
  IconCalendar,
  IconNotes,
  IconShoppingBag,
  IconInfoCircle,
} from '@tabler/icons-react';
import { selectSafe, executeSafe } from '../../database/db';
import ModalFacture from '../factures/ModalFacture';

interface Client {
  telephone_id: string;
  nom_prenom: string;
}

interface FormProps {
  onSuccess?: () => void;
  onBack: () => void;
}

const FormulaireCommande: React.FC<FormProps> = ({ onSuccess, onBack }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [commandeData, setCommandeData] = useState<any>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const modeles = [
    { value: 'Chemise manche courte', label: '👕 Chemise manche courte' },
    { value: 'Chemise manche longue', label: '👔 Chemise manche longue' },
    { value: 'Pantalon', label: '👖 Pantalon' },
    { value: 'Robe', label: '👗 Robe' },
    { value: 'Veste', label: '🧥 Veste' },
    { value: 'Ensemble', label: '👘 Ensemble' },
    { value: 'Costume', label: '🤵 Costume' },
  ];

  const [formData, setFormData] = useState({
    client_id: '',
    designation: '',
    nombre: 1,
    prix_unitaire: '',
    rendez_vous: '',
    observation: ''
  });

  useEffect(() => {
    const fetchClients = async () => {
      const res = await selectSafe<Client>(
        "SELECT telephone_id, nom_prenom FROM clients WHERE est_supprime = 0 ORDER BY nom_prenom"
      );
      setClients(res);
      setLoadingData(false);
    };
    fetchClients();
  }, []);

  const clientsOptions = clients.map(c => ({
    value: c.telephone_id,
    label: c.nom_prenom
  }));

  const quantite = Number(formData.nombre) || 0;
  const prixUnitaire = Number(formData.prix_unitaire) || 0;
  const total = quantite * prixUnitaire;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id) {
      alert("Veuillez sélectionner un client");
      return;
    }
    if (!formData.designation) {
      alert("Veuillez choisir ou saisir un modèle");
      return;
    }
    if (!formData.prix_unitaire || Number(formData.prix_unitaire) <= 0) {
      alert("Veuillez saisir un prix unitaire valide");
      return;
    }

    if (isNaN(quantite) || quantite <= 0) {
      alert("La quantité doit être un nombre positif");
      return;
    }

    if (formData.rendez_vous) {
      const dateObj = new Date(formData.rendez_vous);
      if (isNaN(dateObj.getTime())) {
        alert("La date de rendez-vous est invalide");
        return;
      }
    }

    setLoading(true);

    try {
      await executeSafe(
        `INSERT INTO commandes 
        (client_id, designation, nombre, prix_unitaire, total, rendez_vous, etat, observation) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          formData.client_id,
          formData.designation,
          quantite,
          prixUnitaire,
          total,
          formData.rendez_vous || null,
          'EN_COURS',
          formData.observation || null
        ]
      );

      const client = clients.find(c => c.telephone_id === formData.client_id);

      setCommandeData({
        client: {
          nom_prenom: client?.nom_prenom || "Client",
          telephone_id: formData.client_id
        },
        lignes: [
          {
            designation: formData.designation,
            quantite: quantite,
            prix_unitaire: prixUnitaire
          }
        ],
        total_general: total,
        avance: 0,
        reste: total
      });

      setShowModal(true);
      onSuccess?.();

    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de la commande");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement du formulaire...</Text>
      </Card>
    );
  }

  return (
    <Box style={{ maxWidth: 800, margin: '0 auto' }} p="sm">
      <Stack gap="md">
        {/* HEADER COMPACT */}
        <Card withBorder radius="md" p="sm" bg="#1b365d">
          <Group justify="space-between">
            <Group gap="xs">
              <IconShoppingBag size={18} color="white" />
              <Title order={4} size="h5" c="white">Nouvelle commande</Title>
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

        {/* FORMULAIRE COMPACT */}
        <Card withBorder radius="md" p="sm">
          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              {/* CLIENT */}
              <Select
                label="Client"
                placeholder="Sélectionner un client"
                data={clientsOptions}
                value={formData.client_id}
                onChange={(value) => setFormData({ ...formData, client_id: value || '' })}
                leftSection={<IconUser size={14} />}
                size="sm"
                required
                searchable
                nothingFoundMessage="Aucun client trouvé"
              />

              {/* MODÈLE */}
              {!isCustom ? (
                <Select
                  label="Modèle"
                  placeholder="Choisir un modèle"
                  data={[
                    ...modeles,
                    { value: 'AUTRE', label: '✏️ Autre (personnalisé)' }
                  ]}
                  value={formData.designation}
                  onChange={(value) => {
                    if (value === 'AUTRE') {
                      setIsCustom(true);
                      setFormData({ ...formData, designation: '' });
                    } else {
                      setIsCustom(false);
                      setFormData({ ...formData, designation: value || '' });
                    }
                  }}
                  leftSection={<IconTag size={14} />}
                  size="sm"
                  required
                />
              ) : (
                <TextInput
                  label="Modèle personnalisé"
                  placeholder="Saisir le modèle"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  leftSection={<IconTag size={14} />}
                  size="sm"
                  required
                  rightSection={
                    <Button
                      variant="subtle"
                      size="compact-xs"
                      onClick={() => {
                        setIsCustom(false);
                        setFormData({ ...formData, designation: '' });
                      }}
                    >
                      Annuler
                    </Button>
                  }
                />
              )}

              {/* QUANTITÉ & PRIX */}
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <NumberInput
                  label="Quantité"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={(val) => setFormData({ ...formData, nombre: Number(val) || 1 })}
                  min={1}
                  step={1}
                  leftSection={<IconShoppingBag size={14} />}
                  size="sm"
                  required
                />

                <NumberInput
                  label="Prix unitaire (FCFA)"
                  placeholder="Prix"
                  value={formData.prix_unitaire}
                  onChange={(val) => setFormData({ ...formData, prix_unitaire: String(val || '') })}
                  min={0}
                  step={500}
                  leftSection="FCFA"
                  size="sm"
                  required
                />
              </SimpleGrid>

              {/* APERÇU TOTAL */}
              {prixUnitaire > 0 && quantite > 0 && (
                <Alert color="blue" variant="light" p="xs" radius="sm">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Total :</Text>
                    <Text fw={700} size="md" c="blue">
                      {total.toLocaleString()} FCFA
                    </Text>
                  </Group>
                </Alert>
              )}

              {/* DATE RENDEZ-VOUS */}
              <TextInput
                label="Date de rendez-vous"
                type="date"
                value={formData.rendez_vous}
                onChange={(e) => setFormData({ ...formData, rendez_vous: e.target.value })}
                leftSection={<IconCalendar size={14} />}
                size="sm"
              />

              {/* OBSERVATION */}
              <Textarea
                label="Observation"
                placeholder="Informations complémentaires..."
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                leftSection={<IconNotes size={14} />}
                size="sm"
                rows={2}
              />

              <Divider />

              {/* ACTIONS */}
              <Group justify="space-between">
                <Button size="sm" variant="light" color="red" onClick={onBack}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  loading={loading}
                  leftSection={<IconDeviceFloppy size={14} />}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  Enregistrer
                </Button>
              </Group>
            </Stack>
          </form>
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
            <Text size="xs">1. Sélectionnez un client</Text>
            <Text size="xs">2. Choisissez un modèle ou personnalisez</Text>
            <Text size="xs">3. Saisissez la quantité et le prix unitaire</Text>
            <Text size="xs">4. Optionnel : date de rendez-vous et observation</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">Version 1.0.0</Text>
          </Stack>
        </Modal>

        {/* MODAL FACTURE */}
        {showModal && commandeData && (
          <ModalFacture
            commande={commandeData}
            onClose={() => {
              setShowModal(false);
              onBack();
            }}
          />
        )}
      </Stack>
    </Box>
  );
};

export default FormulaireCommande;