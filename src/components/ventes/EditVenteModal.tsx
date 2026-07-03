// src/components/ventes/EditVenteModal.tsx
import React, { useState } from 'react';
import {
  Modal, Stack, Paper, SimpleGrid, TextInput, Select, Textarea,
  Card, Group, Text, Divider, Button, ActionIcon, ScrollArea,
  Table, NumberInput, Box, Alert} from '@mantine/core';
import {
  IconEdit, IconPlus, IconTrash, IconCalendar, IconClock, IconInfoCircle
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { updateVente } from '../../services/ventes';
import { journaliserAction } from "../../services/journal";

interface EditVenteModalProps {
  opened: boolean;
  onClose: () => void;
  venteData: any;
  onSave: () => void;
  loading: boolean;
}

const EditVenteModal: React.FC<EditVenteModalProps> = ({
  opened,
  onClose,
  venteData,
  onSave}) => {
  const [editLoading, setEditLoading] = useState(false);
  const [editData, setEditData] = useState(venteData);

  // Mettre à jour les données quand venteData change
  React.useEffect(() => {
    setEditData(venteData);
  }, [venteData]);

  if (!editData) return null;

  const handleEditLigneChange = (i: number, f: string, v: any) => {
    const nl = [...(editData?.lignes || [])];
    nl[i][f] = v;
    nl[i].total = (nl[i].quantite || 0) * (nl[i].prix_unitaire || 0);
    setEditData({ ...editData, lignes: nl });
  };

  const handleRemoveEditLigne = (i: number) => {
    const nl = [...(editData?.lignes || [])];
    nl.splice(i, 1);
    setEditData({ ...editData, lignes: nl });
  };

  const handleAddEditLigne = () => {
    setEditData({
      ...editData,
      lignes: [...(editData?.lignes || []), { designation: '', quantite: 1, prix_unitaire: 0, total: 0 }]
    });
  };

  const getEditTotal = () => {
    return (editData?.lignes || []).reduce((s: number, l: any) => s + (l.quantite * l.prix_unitaire), 0);
  };

  const handleSaveEditVente = async () => {
    if (!editData) return;
    setEditLoading(true);
    try {
      const newTotal = getEditTotal();

      await updateVente(editData.id, {
        client_id: editData.client_id,
        client_nom: editData.client_nom,
        date_vente: editData.date_vente,
        observation: editData.observation,
        type_vente: editData.type_vente,
        montant_total: newTotal,
        montant_regle: editData.montant_regle || 0,
        details: editData.lignes,
        rendezvous: editData.type_vente === 'commande' && editData.rendezvous?.date_rendezvous 
          ? editData.rendezvous 
          : null
      });

      notifications.show({
        title: 'Succès',
        message: 'Vente modifiée avec succès',
        color: 'green'
      });

      await journaliserAction({
        utilisateur: 'Utilisateur',
        action: 'UPDATE',
        table: 'ventes',
        idEnregistrement: editData.id,
        details: `Modification vente : ${editData.code_vente} - ${newTotal.toLocaleString()} FCFA`
      });

      onSave();
    } catch (err: any) {
      console.error(err);
      notifications.show({
        title: 'Erreur',
        message: err.message,
        color: 'red'
      });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Group gap="sm"><IconEdit size={20} color="white" /><Text fw={700} c="white">Modifier vente {editData?.code_vente || ''}</Text></Group>}
      size="xl"
      centered
      radius="md"
      styles={{
        header: { backgroundColor: '#1b365d', padding: '14px 20px' },
        title: { color: 'white' },
        body: { padding: '20px' }
      }}
    >
      <Stack gap="md">
        <Paper p="md" radius="md" withBorder>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Date"
              type="date"
              value={editData.date_vente?.split('T')[0] || ''}
              onChange={(e) => setEditData({ ...editData, date_vente: e.target.value })}
              size="sm"
              radius="md"
            />
            <Select
              label="Type"
              data={[
                { value: 'commande', label: '📝 Sur mesure' },
                { value: 'pret_a_porter', label: '👕 Prêt-à-porter' },
                { value: 'matiere', label: '📦 Matière' }
              ]}
              value={editData.type_vente}
              onChange={(val) => setEditData({ ...editData, type_vente: val })}
              size="sm"
              radius="md"
            />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="sm">
            <TextInput
              label="Client"
              value={editData.client_nom || ''}
              onChange={(e) => setEditData({ ...editData, client_nom: e.target.value })}
              size="sm"
              radius="md"
            />
            <TextInput
              label="Téléphone"
              value={editData.client_telephone || ''}
              onChange={(e) => setEditData({ ...editData, client_id: e.target.value })}
              size="sm"
              radius="md"
            />
          </SimpleGrid>
          <Textarea
            label="Observation"
            value={editData.observation || ''}
            onChange={(e) => setEditData({ ...editData, observation: e.target.value })}
            rows={2}
            size="sm"
            radius="md"
            mt="sm"
          />
        </Paper>

        {/* Section Rendez-vous pour les commandes */}
        {editData.type_vente === 'commande' && (
          <Card withBorder radius="md" p="md" style={{ backgroundColor: '#FFF8E7', borderLeft: '4px solid #1b365d' }}>
            <Group gap="xs" mb="sm">
              <IconCalendar size={20} color="#1b365d" />
              <Text fw={600} size="sm">📅 Rendez-vous associé</Text>
            </Group>
            <Divider mb="sm" />
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <TextInput
                label="Date du rendez-vous"
                type="date"
                placeholder="jj/mm/aaaa"
                leftSection={<IconCalendar size={14} />}
                value={editData.rendezvous?.date_rendezvous || ''}
                onChange={(e) => setEditData({
                  ...editData,
                  rendezvous: { ...editData.rendezvous, date_rendezvous: e.target.value, statut: 'planifie' }
                })}
                size="sm"
                radius="md"
              />
              <TextInput
                label="Heure"
                type="time"
                leftSection={<IconClock size={14} />}
                value={editData.rendezvous?.heure_rendezvous || ''}
                onChange={(e) => setEditData({
                  ...editData,
                  rendezvous: { ...editData.rendezvous, heure_rendezvous: e.target.value }
                })}
                size="sm"
                radius="md"
              />
              <Select
                label="Type de rendez-vous"
                data={[
                  { value: 'essayage', label: '👗 Essayage' },
                  { value: 'livraison', label: '🚚 Livraison' },
                  { value: 'retrait', label: '📦 Retrait' }
                ]}
                value={editData.rendezvous?.type_rendezvous || 'essayage'}
                onChange={(val) => setEditData({
                  ...editData,
                  rendezvous: { ...editData.rendezvous, type_rendezvous: val }
                })}
                size="sm"
                radius="md"
              />
            </SimpleGrid>
            {editData.rendezvous?.statut && editData.rendezvous.statut !== 'planifie' && (
              <Alert color="blue" mt="sm">
                <Group gap="xs">
                  <IconInfoCircle size={14} />
                  Ce rendez-vous est {editData.rendezvous.statut === 'termine' ? 'déjà terminé' : 'annulé'}.
                  Seuls les rendez-vous planifiés peuvent être modifiés.
                </Group>
              </Alert>
            )}
          </Card>
        )}

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={600} size="sm">📋 Articles</Text>
            <Button variant="light" size="compact-sm" onClick={handleAddEditLigne} leftSection={<IconPlus size={14} />}>
              Ajouter
            </Button>
          </Group>
          <ScrollArea h={300}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Désignation</Table.Th>
                  <Table.Th w={70} ta="center">Qté</Table.Th>
                  <Table.Th w={110} ta="right">Prix unit.</Table.Th>
                  <Table.Th w={110} ta="right">Total</Table.Th>
                  <Table.Th w={40}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(editData.lignes || []).map((l: any, i: number) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={l.designation}
                        onChange={(e) => handleEditLigneChange(i, 'designation', e.target.value)}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        size="xs"
                        min={1}
                        value={l.quantite}
                        onChange={(val) => handleEditLigneChange(i, 'quantite', val)}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        size="xs"
                        min={0}
                        step={100}
                        value={l.prix_unitaire}
                        onChange={(val) => handleEditLigneChange(i, 'prix_unitaire', val)}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ta="right" fw={600}>
                        {(l.quantite * l.prix_unitaire).toLocaleString()} FCFA
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveEditLigne(i)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Total</Text>
            <Text fw={700} size="lg" c="blue">{getEditTotal().toLocaleString()} FCFA</Text>
          </Group>
          <Divider my="xs" />
          <SimpleGrid cols={2} spacing="md">
            <NumberInput
              label="Montant réglé"
              value={editData.montant_regle || 0}
              onChange={(val) => setEditData({ ...editData, montant_regle: val || 0 })}
              min={0}
              step={1000}
              size="sm"
              radius="md"
            />
            <Box>
              <Text size="xs" fw={500} mb={4}>Reste à payer</Text>
              <Text fw={600} c="red">
                {(getEditTotal() - (editData.montant_regle || 0)).toLocaleString()} FCFA
              </Text>
            </Box>
          </SimpleGrid>
        </Paper>

        <Group justify="flex-end" gap="sm">
          <Button variant="light" onClick={onClose} radius="md" disabled={editLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleSaveEditVente}
            loading={editLoading}
            radius="md"
            variant="gradient"
            gradient={{ from: '#1b365d', to: '#2a4a7a' }}
          >
            Enregistrer
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default EditVenteModal;