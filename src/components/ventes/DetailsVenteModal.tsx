// src/components/ventes/DetailsVenteModal.tsx
import React from 'react';
import { Modal, Stack, Paper, SimpleGrid, Box, Text, Badge, Table, Divider, Group, Button } from '@mantine/core';
import { IconEye, IconFileInvoice, IconReceipt, IconUser, IconPhone } from '@tabler/icons-react';

interface DetailsVenteModalProps {
  opened: boolean;
  onClose: () => void;
  vente: any;
  details: any[];
  onShowFacture: (vente: any) => void;
  onShowRecu: (vente: any) => void;
  formatPrice: (price: number) => string;
}

const DetailsVenteModal: React.FC<DetailsVenteModalProps> = ({
  opened,
  onClose,
  vente,
  details,
  onShowFacture,
  onShowRecu,
  formatPrice
}) => {
  if (!vente) return null;

  // 🔥 Fonctions pour récupérer les infos client
  const getClientNom = () => {
    if (vente.client_nom) return vente.client_nom;
    if (vente.client?.nom_prenom) return vente.client.nom_prenom;
    if (vente.client_nom_complet) return vente.client_nom_complet;
    return '-';
  };

  const getClientTelephone = () => {
    if (vente.client_telephone) return vente.client_telephone;
    if (vente.client?.telephone_id) return vente.client.telephone_id;
    return null;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Group gap="sm"><IconEye size={20} color="white" /><Text fw={700} c="white">Détails vente {vente?.code_vente}</Text></Group>}
      size="lg"
      centered
      radius="md"
      styles={{
        header: { backgroundColor: '#1b365d', padding: '14px 20px' },
        title: { color: 'white' },
        body: { padding: '20px' }
      }}
    >
      <Stack gap="md">
        {/* 🔥 Informations générales avec client amélioré */}
        <Paper p="md" radius="md" withBorder bg="gray.0">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Box>
              <Text size="xs" c="dimmed">Type</Text>
              <Badge variant="light" color={vente.type_vente === 'commande' ? 'violet' : 'cyan'}>
                {vente.type_vente === 'commande' ? 'Sur mesure' : 'Prêt-à-porter'}
              </Badge>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Client</Text>
              <Group gap="xs">
                <IconUser size={14} color="#666" />
                <Text size="sm" fw={500}>{getClientNom()}</Text>
              </Group>
              {getClientTelephone() && (
                <Group gap="xs" mt={2}>
                  <IconPhone size={12} color="#666" />
                  <Text size="xs" c="dimmed">{getClientTelephone()}</Text>
                </Group>
              )}
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Date</Text>
              <Text size="sm">{new Date(vente.date_vente).toLocaleDateString('fr-FR')}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Paiement</Text>
              <Text size="sm">{vente.mode_paiement || '-'}</Text>
            </Box>
          </SimpleGrid>
        </Paper>

        {/* 🔥 Liste des articles */}
        <Paper p="md" radius="md" withBorder>
          <Text fw={600} size="sm" mb="sm">📋 Articles</Text>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Désignation</Table.Th>
                <Table.Th ta="center">Qté</Table.Th>
                <Table.Th ta="right">Prix unit.</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {details.length > 0 ? details.map((detail: any, index: number) => (
                <Table.Tr key={detail.id || index}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{detail.designation || '-'}</Text>
                    {detail.taille_libelle && detail.taille_libelle !== 'null' && (
                      <Text size="xs" c="dimmed">Taille: {detail.taille_libelle}</Text>
                    )}
                  </Table.Td>
                  <Table.Td ta="center">{detail.quantite || 0}</Table.Td>
                  <Table.Td ta="right">{formatPrice(detail.prix_unitaire || 0)}</Table.Td>
                  <Table.Td ta="right">
                    <Text fw={600}>{formatPrice(detail.total || 0)}</Text>
                  </Table.Td>
                </Table.Tr>
              )) : (
                <Table.Tr>
                  <Table.Td colSpan={4} ta="center" py="md">
                    <Text c="dimmed">Aucun détail disponible</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
          <Divider my="sm" />
          <Group justify="space-between">
            <Text fw={700}>Total général</Text>
            <Text fw={700} size="lg" c="blue">{formatPrice(vente.montant_total || 0)}</Text>
          </Group>
          <Group justify="space-between" mt={4}>
            <Text size="sm" c="dimmed">Réglé</Text>
            <Text size="sm" c="green">{formatPrice(vente.montant_regle || 0)}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Reste</Text>
            <Text size="sm" c="orange">
              {formatPrice(Math.max(0, Number(vente.montant_total || 0) - Number(vente.montant_regle || 0)))}
            </Text>
          </Group>
        </Paper>

        {/* 🔥 Observation */}
        {vente.observation && (
          <Paper p="md" radius="md" withBorder bg="gray.0">
            <Text size="xs" c="dimmed" mb={4}>📝 Observation</Text>
            <Text size="sm">{vente.observation}</Text>
          </Paper>
        )}

        {/* 🔥 Boutons d'action */}
        <Group justify="flex-end" gap="sm">
          <Button variant="light" onClick={onClose}>Fermer</Button>
          <Button leftSection={<IconReceipt size={16} />} variant="light" color="grape" onClick={() => onShowRecu(vente)}>
            Reçu
          </Button>
          {vente.type_vente === 'commande' && (
            <Button leftSection={<IconFileInvoice size={16} />} variant="light" color="teal" onClick={() => onShowFacture(vente)}>
              Facture
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};

export default DetailsVenteModal;