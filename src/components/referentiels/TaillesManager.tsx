// components/referentiels/TaillesManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Stack,
  Card,
  Title,
  Text,
  Button,
  Group,
  Modal,
  Table,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Switch,
  LoadingOverlay,
  Alert,
  Badge,
  ActionIcon,
  Tooltip,
  Pagination,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconRefresh } from '@tabler/icons-react';

import {
  Taille
} from '../../types/tailles';

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete
} from '../../services/api';
const TaillesManager: React.FC = () => {
  const [tailles, setTailles] = useState<Taille[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTaille, setEditingTaille] = useState<Taille | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    code_taille: '',
    libelle: '',
    ordre: 0,
    categorie: 'universel' as 'adulte' | 'enfant' | 'universel',
    description: '',
    est_actif: 1
  });

  // Charger les tailles
  const loadTailles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet("/tailles");

      setTailles(data);
      setTailles(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTailles();
  }, []);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      code_taille: '',
      libelle: '',
      ordre: 0,
      categorie: 'universel',
      description: '',
      est_actif: 1
    });
    setEditingTaille(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const openEditModal = (taille: Taille) => {
    setEditingTaille(taille);
    setFormData({

  code_taille:
    taille.code_taille || '',

  libelle:
    taille.libelle || '',

  ordre:
    taille.ordre || 0,

  categorie:
    (taille.categorie as any)
    || 'universel',

  description:
    taille.description || '',

  est_actif:
    taille.est_actif
});
  };

  const openDeleteConfirm = (id: number, _libelle: string) => {
    setDeleteId(id);
    openDeleteModal();
  };

  // Enregistrer (création ou modification)
  const handleSave = async () => {

    if (!formData.code_taille.trim()) {

      setError('Le code est requis');

      return;
    }

    if (!formData.libelle.trim()) {

      setError('Le libellé est requis');

      return;
    }

    try {

      setError(null);

      if (editingTaille) {

        await apiPut(
          `/tailles/${editingTaille.id}`,
          {
            code_taille: formData.code_taille,
            libelle: formData.libelle,
            ordre: formData.ordre,
            categorie: formData.categorie,
            description: formData.description,
            est_actif: formData.est_actif
          }
        );

      } else {

        await apiPost(
          "/tailles",
          {
            code_taille: formData.code_taille,
            libelle: formData.libelle,
            ordre: formData.ordre,
            categorie: formData.categorie,
            description: formData.description,
            est_actif: formData.est_actif
          }
        );
      }

      closeModal();

      await loadTailles();

      resetForm();

    } catch (err: any) {

      setError(
        err.message ||
        'Erreur lors de l’enregistrement'
      );

      console.error(err);
    }
  };
  // Supprimer
  const handleDelete = async () => {

    if (!deleteId) return;

    try {

      setError(null);

      await apiDelete(
        `/tailles/${deleteId}`
      );

      closeDeleteModal();

      setDeleteId(null);

      await loadTailles();

    } catch (err: any) {

      setError(
        err.message ||
        'Erreur lors de la suppression'
      );

      console.error(err);
    }
  };
  // Filtrage
  const filteredTailles = tailles.filter(t =>

  t.libelle
    .toLowerCase()
    .includes(
      searchTerm.toLowerCase()
    )

  ||

  (t.code_taille || '')
    .toLowerCase()
    .includes(
      searchTerm.toLowerCase()
    )
);

  // Pagination
  const totalPages = Math.ceil(filteredTailles.length / itemsPerPage);
  const paginatedTailles = filteredTailles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Box pos="relative" h={200}>
        <LoadingOverlay visible={true} />
      </Box>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* En-tête */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Box>
                <Title order={1} c="white" size="h2">Gestion des Tailles</Title>
                <Text c="gray.3" size="sm" mt={4}>
                  Gérez les tailles disponibles pour vos tenues (XS, S, M, L, XL...)
                </Text>
              </Box>
              <Button
                onClick={openAddModal}
                leftSection={<IconPlus size={18} />}
                variant="light"
                color="white"
                radius="md"
              >
                Nouvelle taille
              </Button>
            </Group>
          </Card>

          {/* Barre de recherche */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group>
              <TextInput
                placeholder="Rechercher par code ou libellé..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ flex: 1 }}
                radius="md"
              />
              <Tooltip label="Actualiser">
                <ActionIcon variant="light" onClick={loadTailles} size="lg" radius="md">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card>

          {/* Message d'erreur */}
          {error && (
            <Alert
              color="red"
              radius="md"
            >
              {error}
            </Alert>
          )}

          {/* Tableau des tailles */}
          <Card withBorder radius="lg" shadow="sm" p={0}>
            <Table striped highlightOnHover>
              <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Libellé</Table.Th>
                  <Table.Th>Catégorie</Table.Th>
                  <Table.Th style={{ width: 80, textAlign: 'center' }}>Ordre</Table.Th>
                  <Table.Th style={{ width: 100, textAlign: 'center' }}>Statut</Table.Th>
                  <Table.Th style={{ width: 100, textAlign: 'center' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedTailles.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                      <Text c="dimmed">
                        {searchTerm ? 'Aucune taille ne correspond à votre recherche' : 'Aucune taille enregistrée'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedTailles.map((taille) => (
                    <Table.Tr key={taille.id}>
                      <Table.Td>
                        <Badge variant="light" color="blue" size="sm">
                          {taille.code_taille}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500}>{taille.libelle}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={
                            taille.categorie === 'adulte' ? 'blue' :
                              taille.categorie === 'enfant' ? 'green' : 'gray'
                          }
                          size="sm"
                        >
                          {taille.categorie === 'adulte' ? 'Adulte' :
                            taille.categorie === 'enfant' ? 'Enfant' : 'Universel'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Badge variant="light" color="gray" size="sm">
                          {taille.ordre}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Badge color={taille.est_actif === 1 ? 'green' : 'red'} variant="light">
                          {taille.est_actif === 1 ? 'Actif' : 'Inactif'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Group gap="xs" justify="center">
                          <Tooltip label="Modifier">
                            <ActionIcon
                              variant="subtle"
                              color="yellow"
                              onClick={() => openEditModal(taille)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Supprimer">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => openDeleteConfirm(taille.id, taille.libelle)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <Group justify="center" p="md">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  color="blue"
                  radius="md"
                />
              </Group>
            )}
          </Card>
        </Stack>
      </Container>

      {/* Modal formulaire */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={
          <Text fw={700} size="lg">
            {editingTaille ? 'Modifier la taille' : 'Nouvelle taille'}
          </Text>
        }
        size="md"
        radius="md"
      >
        <Stack>
          <TextInput
            label="Code"
            placeholder="Ex: XS, S, M, L, XL"
            value={formData.code_taille}
            onChange={(e) => setFormData({ ...formData, code_taille: e.target.value.toUpperCase() })}
            required
            withAsterisk
            maxLength={10}
          />

          <TextInput
            label="Libellé"
            placeholder="Ex: Extra Small, Small, Medium, Large"
            value={formData.libelle}
            onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
            required
            withAsterisk
          />

          <Select
            label="Catégorie"
            data={[
              { value: 'universel', label: 'Universel (tous types)' },
              { value: 'adulte', label: 'Adulte' },
              { value: 'enfant', label: 'Enfant' }
            ]}
            value={formData.categorie}
            onChange={(value) => setFormData({ ...formData, categorie: value as any })}
          />

          <NumberInput
            label="Ordre d'affichage"
            description="Plus le chiffre est petit, plus la taille apparaît en premier"
            value={formData.ordre}
            onChange={(value) => setFormData({ ...formData, ordre: typeof value === 'number' ? value : 0 })}
            min={0}
          />

          <Textarea
            label="Description"
            placeholder="Description optionnelle..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <Switch
            label="Actif (visible dans les listes)"
            checked={formData.est_actif === 1}
            onChange={(e) => setFormData({ ...formData, est_actif: e.currentTarget.checked ? 1 : 0 })}
          />

          <Divider />

          <Group justify="flex-end">
            <Button variant="light" onClick={closeModal}>
              Annuler
            </Button>
            <Button onClick={handleSave} color="blue">
              {editingTaille ? 'Modifier' : 'Créer'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirmation"
        size="sm"
        radius="md"
      >
        <Stack>
          <Text>Êtes-vous sûr de vouloir supprimer cette taille ?</Text>
          <Text size="sm" c="dimmed">
            Cette action est irréversible.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeDeleteModal}>
              Annuler
            </Button>
            <Button color="red" onClick={handleDelete}>
              Supprimer
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default TaillesManager;