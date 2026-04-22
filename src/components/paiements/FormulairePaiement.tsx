import React, { useEffect, useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Select,
  NumberInput,
  Textarea,
  Divider,
  LoadingOverlay,
  Alert,
  Box,
  Modal,
} from '@mantine/core';
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconReceipt,
  IconCheck,
  IconX,
  IconUser,
  IconShoppingBag,
  IconMoneybag,
  IconNotes,
  IconInfoCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

interface Client {
  telephone_id: string;
  nom_prenom: string;
}

interface Commande {
  id: number;
  client_id: string;
  client_nom: string;
  designation: string;
  total: number;
  paye: number;
  reste: number;
}

interface FormulairePaiementProps {
  onSuccess: () => void;
  onCancel: () => void;
  commandeId?: number;
}

const FormulairePaiement: React.FC<FormulairePaiementProps> = ({ 
  onSuccess, 
  onCancel, 
  commandeId: initialCommandeId 
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedCommandeId, setSelectedCommandeId] = useState<number | null>(initialCommandeId || null);
  const [montant, setMontant] = useState<number | undefined>(undefined);
  const [mode, setMode] = useState<string | null>('cash');
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const modesPaiement = [
    { value: 'cash', label: '💰 Espèces' },
    { value: 'mobile', label: '📱 Mobile Money' },
    { value: 'virement', label: '🏦 Virement bancaire' }
  ];

  // Charger les clients
  useEffect(() => {
    const fetchClients = async () => {
      const db = await getDb();
      const res = await db.select<Client[]>(
        "SELECT telephone_id, nom_prenom FROM clients WHERE est_supprime = 0 ORDER BY nom_prenom"
      );
      setClients(res);
      setLoadingData(false);
    };
    fetchClients();
  }, []);

  // Charger les commandes d'un client
  const fetchCommandes = async (clientId: string) => {
    if (!clientId) return;
    
    const db = await getDb();
    
    const commandesData = await db.select<any[]>(`
      SELECT 
        c.id,
        c.client_id,
        c.designation,
        c.total,
        COALESCE(SUM(p.montant), 0) as paye
      FROM commandes c
      LEFT JOIN paiements_commandes p ON p.commande_id = c.id
      WHERE c.client_id = ? AND c.est_supprime = 0
      GROUP BY c.id
      HAVING c.total > COALESCE(SUM(p.montant), 0)
      ORDER BY c.date_commande DESC
    `, [clientId]);

    const commandesAvecReste = commandesData.map(c => ({
      id: c.id,
      client_id: c.client_id,
      client_nom: '',
      designation: c.designation,
      total: Number(c.total),
      paye: Number(c.paye),
      reste: Number(c.total) - Number(c.paye)
    }));

    setCommandes(commandesAvecReste);
  };

  useEffect(() => {
    if (selectedClientId) {
      fetchCommandes(selectedClientId);
      setSelectedCommandeId(null);
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (initialCommandeId) {
      const loadCommandeClient = async () => {
        const db = await getDb();
        const res = await db.select<{ client_id: string }[]>(
          "SELECT client_id FROM commandes WHERE id = ?",
          [initialCommandeId]
        );
        if (res.length > 0) {
          setSelectedClientId(res[0].client_id);
        }
      };
      loadCommandeClient();
    }
  }, [initialCommandeId]);

  const getCommandeLabel = (commande: Commande) => {
    return `${commande.designation} - ${commande.reste.toLocaleString()} FCFA restant`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCommandeId) {
      setError("Veuillez sélectionner une commande");
      return;
    }
    
    if (!montant || montant <= 0) {
      setError("Montant invalide");
      return;
    }
    
    const commande = commandes.find(c => c.id === selectedCommandeId);
    if (commande && montant > commande.reste) {
      setError(`Le montant ne peut pas dépasser le reste à payer (${commande.reste.toLocaleString()} FCFA)`);
      return;
    }
    
    setLoading(true);
    setError('');
    
    const db = await getDb();
    
    try {
      await db.execute(
        `INSERT INTO paiements_commandes 
        (commande_id, montant, mode, observation, date_paiement)
        VALUES (?, ?, ?, ?, datetime('now'))`,
        [selectedCommandeId, montant, mode, observation || null]
      );
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const clientsOptions = clients.map(c => ({
    value: c.telephone_id,
    label: c.nom_prenom
  }));

  const commandesOptions = commandes.map(c => ({
    value: c.id.toString(),
    label: getCommandeLabel(c)
  }));

  if (loadingData) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des données...</Text>
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
              <IconReceipt size={18} color="white" />
              <Title order={4} size="h5" c="white">Nouveau paiement</Title>
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
                onClick={onCancel}
              >
                Retour
              </Button>
            </Group>
          </Group>
        </Card>

        {/* FORMULAIRE PRINCIPAL */}
        <Card withBorder radius="md" p="sm">
          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              {/* CLIENT */}
              <Select
                label="Client"
                placeholder="Choisir un client"
                data={clientsOptions}
                value={selectedClientId}
                onChange={(value) => setSelectedClientId(value)}
                leftSection={<IconUser size={14} />}
                size="sm"
                required
                searchable
                nothingFoundMessage="Aucun client trouvé"
              />

              {/* COMMANDE */}
              <Select
                label="Commande"
                placeholder="Choisir une commande"
                data={commandesOptions}
                value={selectedCommandeId?.toString() || null}
                onChange={(value) => setSelectedCommandeId(value ? parseInt(value) : null)}
                leftSection={<IconShoppingBag size={14} />}
                size="sm"
                disabled={!selectedClientId}
                required
                nothingFoundMessage="Aucune commande avec solde restant"
              />

              {/* RESTE À PAYER */}
              {selectedCommandeId && (
                <Alert color="blue" variant="light" p="xs" radius="sm">
                  <Group justify="space-between">
                    <Text size="xs">Reste à payer :</Text>
                    <Text fw={700} size="sm" c="blue">
                      {commandes.find(c => c.id === selectedCommandeId)?.reste.toLocaleString()} FCFA
                    </Text>
                  </Group>
                </Alert>
              )}

              {/* MONTANT */}
              <NumberInput
                label="Montant (FCFA)"
                placeholder="Saisir le montant"
                value={montant}
                onChange={(val) => setMontant(Number(val))}
                leftSection={<IconMoneybag size={14} />}
                size="sm"
                min={0}
                step={500}
                required
              />

              {/* MODE */}
              <Select
                label="Mode de paiement"
                placeholder="Choisir un mode"
                data={modesPaiement}
                value={mode}
                onChange={setMode}
                size="sm"
                required
              />

              {/* OBSERVATION */}
              <Textarea
                label="Observation"
                placeholder="Référence, note supplémentaire..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                leftSection={<IconNotes size={14} />}
                size="sm"
                rows={2}
              />

              <Divider />

              {/* ERREUR */}
              {error && (
                <Alert icon={<IconX size={14} />} color="red" variant="light" p="xs">
                  <Text size="xs">{error}</Text>
                </Alert>
              )}

              {/* SUCCÈS */}
              {success && (
                <Alert icon={<IconCheck size={14} />} color="green" variant="light" p="xs">
                  <Text size="xs">✓ Paiement enregistré avec succès !</Text>
                </Alert>
              )}

              {/* ACTIONS */}
              <Group justify="space-between">
                <Button size="sm" variant="light" color="red" onClick={onCancel}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
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
            <Text size="xs">1. Sélectionnez le client concerné</Text>
            <Text size="xs">2. Choisissez la commande pour laquelle le paiement est effectué</Text>
            <Text size="xs">3. Saisissez le montant du paiement</Text>
            <Text size="xs">4. Sélectionnez le mode de paiement</Text>
            <Text size="xs">5. Cliquez sur "Enregistrer" pour valider</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0 - Gestion Couture
            </Text>
          </Stack>
        </Modal>
      </Stack>
    </Box>
  );
};

export default FormulairePaiement;