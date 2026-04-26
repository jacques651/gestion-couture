// src/components/stock/FormulaireSortieStock.tsx
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
  Divider,
  Alert,
  Box,
  Modal,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Textarea,
  TextInput,
} from '@mantine/core';
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconPackage,
  IconBox,
  IconInfoCircle,
  IconCheck,
  IconAlertCircle,
  IconTruck,
  IconShoppingBag,
} from '@tabler/icons-react';
import { getDb, getNextSortieCode } from '../../database/db';
import { notifications } from '@mantine/notifications';

interface MatiereStock {
  id: number;
  code_matiere: string;
  designation: string;
  unite: string;
  stock_actuel: number;
  prix_achat: number;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  editingSortie?: {
    id: number;
    matiere_id: number;
    quantite: number;
    observation: string;
  } | null;
}

const FormulaireSortieStock: React.FC<Props> = ({ onClose, onSuccess, editingSortie }) => {
  const [matieres, setMatieres] = useState<MatiereStock[]>([]);
  const [matiereId, setMatiereId] = useState<string | null>(null);
  const [selectedMatiere, setSelectedMatiere] = useState<MatiereStock | null>(null);
  const [quantite, setQuantite] = useState<number | undefined>(undefined);
  const [motif, setMotif] = useState<string>('production');
  const [observation, setObservation] = useState('');
  const [commandeId, setCommandeId] = useState<string | null>(null);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [codeSortie, setCodeSortie] = useState('');

  // Générer le code sortie
  useEffect(() => {
    const generateCode = async () => {
      const code = await getNextSortieCode();
      setCodeSortie(code);
    };
    generateCode();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const db = await getDb();

      // Charger les matières avec stock
      const matieresData = await db.select<MatiereStock[]>(`
        SELECT 
          id,
          code_matiere,
          designation,
          unite,
          stock_actuel,
          prix_achat
        FROM matieres
        WHERE est_supprime = 0 AND stock_actuel > 0
        ORDER BY designation
      `);
      setMatieres(matieresData);

      // Charger les commandes pour liaison
      const commandesData = await db.select<any[]>(`
        SELECT id, code_commande, designation 
        FROM commandes 
        WHERE est_supprime = 0 AND etat != 'LIVREE'
        ORDER BY date_commande DESC
        LIMIT 50
      `);
      setCommandes(commandesData);

      if (editingSortie) {
        setMatiereId(editingSortie.matiere_id.toString());
        setQuantite(editingSortie.quantite);
        setObservation(editingSortie.observation || '');
      }

      setLoading(false);
    };

    load();
  }, [editingSortie]);

  // Mettre à jour la matière sélectionnée
  useEffect(() => {
    if (matiereId) {
      const matiere = matieres.find(m => m.id.toString() === matiereId);
      setSelectedMatiere(matiere || null);
    } else {
      setSelectedMatiere(null);
    }
    setQuantite(undefined);
    setError('');
  }, [matiereId, matieres]);

  const motifs = [
    { value: 'production', label: '🏭 Production', color: 'blue' },
    { value: 'commande', label: '📦 Commande client', color: 'green' },
    { value: 'perte', label: '⚠️ Perte / Casse', color: 'red' },
    { value: 'retour_fournisseur', label: '🔄 Retour fournisseur', color: 'orange' },
    { value: 'don', label: '🎁 Don / Échantillon', color: 'purple' },
    { value: 'autre', label: '📝 Autre', color: 'gray' },
  ];

  const matieresOptions = matieres.map(m => ({
    value: m.id.toString(),
    label: `${m.code_matiere} - ${m.designation} (Stock: ${m.stock_actuel} ${m.unite})`
  }));

  const commandesOptions = commandes.map(c => ({
    value: c.id.toString(),
    label: `${c.code_commande} - ${c.designation}`
  }));

  const enregistrer = async () => {
    setError('');
    setSuccess(false);

    if (!matiereId || !selectedMatiere) {
      setError('Veuillez sélectionner une matière');
      return;
    }

    if (!quantite || quantite <= 0) {
      setError('Veuillez saisir une quantité valide');
      return;
    }

    if (quantite > selectedMatiere.stock_actuel) {
      setError(`Stock insuffisant. Disponible: ${selectedMatiere.stock_actuel} ${selectedMatiere.unite}`);
      return;
    }

    setSaving(true);
    const db = await getDb();

    try {
      const cout_unitaire = selectedMatiere.prix_achat;

      if (editingSortie) {
        // Restaurer l'ancienne quantité
        const oldSortie = await db.select<{ quantite: number }[]>(
          `SELECT quantite FROM sorties_stock WHERE id = ?`,
          [editingSortie.id]
        );
        if (oldSortie.length > 0) {
          await db.execute(`
            UPDATE matieres SET stock_actuel = stock_actuel + ? WHERE id = ?
          `, [oldSortie[0].quantite, selectedMatiere.id]);
        }

        // Mettre à jour la sortie
        await db.execute(`
          UPDATE sorties_stock 
          SET matiere_id = ?, quantite = ?, cout_unitaire = ?, 
              motif = ?, observation = ?, commande_id = ?, date_sortie = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [selectedMatiere.id, quantite, cout_unitaire, motif, observation || null, commandeId || null, editingSortie.id]);

        // Appliquer la nouvelle quantité
        await db.execute(`
          UPDATE matieres SET stock_actuel = stock_actuel - ? WHERE id = ?
        `, [quantite, selectedMatiere.id]);

        notifications.show({
          title: 'Succès',
          message: `Sortie modifiée avec succès`,
          color: 'green',
        });
      } else {
        // Nouvelle sortie
        await db.execute(`
          INSERT INTO sorties_stock (
            code_sortie, matiere_id, quantite, cout_unitaire, 
            motif, observation, commande_id, date_sortie
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [codeSortie, selectedMatiere.id, quantite, cout_unitaire, motif, observation || null, commandeId || null]);

        // Mettre à jour le stock
        await db.execute(`
          UPDATE matieres SET stock_actuel = stock_actuel - ? WHERE id = ?
        `, [quantite, selectedMatiere.id]);

        notifications.show({
          title: 'Succès',
          message: `Sortie de ${quantite} ${selectedMatiere.unite} de ${selectedMatiere.designation} enregistrée`,
          color: 'green',
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de l'enregistrement");
      notifications.show({
        title: 'Erreur',
        message: err.message || "Erreur lors de l'enregistrement",
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des matières...</Text>
      </Card>
    );
  }

  return (
    <Box style={{ maxWidth: 800, margin: '0 auto' }} p="sm">
      <Stack gap="md">
        {/* HEADER */}
        <Card withBorder radius="md" p="sm" bg="#1b365d">
          <Group justify="space-between">
            <Group gap="xs">
              <IconTruck size={18} color="white" />
              <Title order={4} size="h5" c="white">
                {editingSortie ? 'Modifier la sortie' : 'Nouvelle sortie de stock'}
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
                onClick={onClose}
              >
                Retour
              </Button>
            </Group>
          </Group>
        </Card>

        {/* FORMULAIRE */}
        <Card withBorder radius="md" p="sm">
          <Stack gap="sm">
            {/* Code sortie */}
            {!editingSortie && (
              <TextInput
                label="Code sortie"
                value={codeSortie}
                readOnly
                disabled
                size="sm"
                styles={{ input: { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } }}
              />
            )}

            {/* SUCCÈS */}
            {success && (
              <Alert icon={<IconCheck size={14} />} color="green" variant="light" p="xs">
                <Text size="xs">Sortie enregistrée avec succès !</Text>
              </Alert>
            )}

            {/* ERREUR */}
            {error && (
              <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light" p="xs">
                <Text size="xs">{error}</Text>
              </Alert>
            )}

            {/* MATIÈRE */}
            <Select
              label="Matière première"
              placeholder="Choisir une matière"
              data={matieresOptions}
              value={matiereId}
              onChange={setMatiereId}
              leftSection={<IconBox size={14} />}
              size="sm"
              required
              searchable
              nothingFoundMessage="Aucune matière avec stock disponible"
              disabled={!!editingSortie}
            />

            {/* INFOS STOCK */}
            {selectedMatiere && (
              <Paper p="xs" withBorder bg="gray.0" radius="sm">
                <SimpleGrid cols={2} spacing="sm">
                  <div>
                    <Text size="xs" c="dimmed">Stock disponible</Text>
                    <Text fw={700} size="md" c={selectedMatiere.stock_actuel <= 5 ? "orange" : "green"}>
                      {selectedMatiere.stock_actuel} {selectedMatiere.unite}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Coût unitaire</Text>
                    <Text fw={700} size="md" c="blue">
                      {selectedMatiere.prix_achat.toLocaleString()} FCFA
                    </Text>
                  </div>
                </SimpleGrid>
              </Paper>
            )}

            {/* MOTIF */}
            <Select
              label="Motif de la sortie"
              placeholder="Choisir un motif"
              data={motifs.map(m => ({ value: m.value, label: m.label }))}
              value={motif}
              onChange={(val) => setMotif(val || 'production')}
              size="sm"
              required
            />

            {/* COMMANDE LIÉE (optionnel) */}
            {motif === 'commande' && (
              <Select
                label="Commande liée"
                placeholder="Lier à une commande"
                data={commandesOptions}
                value={commandeId}
                onChange={setCommandeId}
                leftSection={<IconShoppingBag size={14} />}
                size="sm"
                clearable
                searchable
              />
            )}

            {/* QUANTITÉ */}
            <NumberInput
              label="Quantité à sortir"
              placeholder="Quantité"
              value={quantite}
              onChange={(val) => setQuantite(Number(val))}
              leftSection={<IconPackage size={14} />}
              size="sm"
              min={0}
              max={selectedMatiere?.stock_actuel}
              step={0.1}
              required
              disabled={!selectedMatiere}
            />

            {/* TOTAL */}
            {quantite && quantite > 0 && selectedMatiere && (
              <Alert color="blue" variant="light" p="xs">
                <Group justify="space-between">
                  <Text size="sm">Valeur totale :</Text>
                  <Text fw={700}>{(quantite * selectedMatiere.prix_achat).toLocaleString()} FCFA</Text>
                </Group>
              </Alert>
            )}

            {/* ALERTE STOCK BAS */}
            {selectedMatiere && selectedMatiere.stock_actuel <= 5 && selectedMatiere.stock_actuel > 0 && (
              <Alert color="orange" variant="light" p="xs">
                <Group gap="xs">
                  <IconAlertCircle size={14} />
                  <Text size="xs">Stock bas ! Il reste {selectedMatiere.stock_actuel} {selectedMatiere.unite}</Text>
                </Group>
              </Alert>
            )}

            {/* OBSERVATION */}
            <Textarea
              label="Observation (optionnel)"
              placeholder="Informations complémentaires..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              size="sm"
              rows={2}
            />

            <Divider />

            {/* ACTIONS */}
            <Group justify="space-between">
              <Button size="sm" variant="light" color="red" onClick={onClose}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={enregistrer}
                loading={saving}
                leftSection={<IconDeviceFloppy size={14} />}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                {editingSortie ? 'Modifier' : 'Enregistrer'}
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* MODAL INSTRUCTIONS */}
        <Modal
          opened={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          title="📋 Instructions - Sortie de stock"
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
            <Text size="xs">1. Sélectionnez la matière première à sortir</Text>
            <Text size="xs">2. Le stock disponible et le coût moyen s'affichent</Text>
            <Text size="xs">3. Choisissez le motif de la sortie</Text>
            <Text size="xs">4. Si "Commande client", vous pouvez lier une commande</Text>
            <Text size="xs">5. Saisissez la quantité à sortir</Text>
            <Text size="xs">6. La valeur totale est calculée automatiquement</Text>
            <Text size="xs">7. Cliquez sur "Enregistrer" pour valider</Text>
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

export default FormulaireSortieStock;