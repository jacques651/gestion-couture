// components/referentiels/CouleursManager.tsx
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
  Switch,
  ColorInput,
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
  Couleur
} from '../../database/db';

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete
} from '../../services/api';

const CouleursManager: React.FC = () => {
  const [couleurs, setCouleurs] = useState<Couleur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCouleur, setEditingCouleur] = useState<Couleur | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    nom_couleur: '',
    code_hex: '#000000',
    code_rgb: '(0,0,0)',
    code_cmyk: '',
    description: '',
    est_actif: 1
  });

  const loadCouleurs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet("/couleurs");

setCouleurs(data);
      setCouleurs(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCouleurs();
  }, []);

  const resetForm = () => {
    setFormData({
      nom_couleur: '',
      code_hex: '#000000',
      code_rgb: '(0,0,0)',
      code_cmyk: '',
      description: '',
      est_actif: 1
    });
    setEditingCouleur(null);
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)})` : '(0,0,0)';
  };

  const handleHexChange = (hex: string) => {
    setFormData({
      ...formData,
      code_hex: hex,
      code_rgb: hexToRgb(hex)
    });
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const openEditModal = (couleur: Couleur) => {
    setEditingCouleur(couleur);
    setFormData({
      nom_couleur: couleur.nom_couleur,
      code_hex: couleur.code_hex || '#000000',
      code_rgb: couleur.code_rgb || '(0,0,0)',
      code_cmyk: couleur.code_cmyk || '',
      description: couleur.description || '',
      est_actif: couleur.est_actif
    });
    openModal();
  };

  const openDeleteConfirm = (id: number) => {
    setDeleteId(id);
    openDeleteModal();
  };

 const handleSave = async () => {

  if (!formData.nom_couleur.trim()) {

    setError(
      'Le nom de la couleur est requis'
    );

    return;
  }

  try {

    setError(null);

    if (editingCouleur) {

      await apiPut(
        `/couleurs/${editingCouleur.id}`,
        {
          nom_couleur: formData.nom_couleur,
          code_hex: formData.code_hex,
          code_rgb: formData.code_rgb,
          code_cmyk: formData.code_cmyk,
          description: formData.description,
          est_actif: formData.est_actif
        }
      );

    } else {

      await apiPost(
        "/couleurs",
        {
          nom_couleur: formData.nom_couleur,
          code_hex: formData.code_hex,
          code_rgb: formData.code_rgb,
          code_cmyk: formData.code_cmyk,
          description: formData.description,
          est_actif: formData.est_actif
        }
      );
    }

    closeModal();

    await loadCouleurs();

    resetForm();

  } catch (err: any) {

    setError(
      err.message ||
      'Erreur lors de l’enregistrement'
    );
  }
};

 const handleDelete = async () => {

  if (!deleteId) return;

  try {

    setError(null);

    await apiDelete(
      `/couleurs/${deleteId}`
    );

    closeDeleteModal();

    setDeleteId(null);

    await loadCouleurs();

  } catch (err: any) {

    setError(
      err.message ||
      'Erreur lors de la suppression'
    );
  }
};
  // Filtrage
  const filteredCouleurs = couleurs.filter(c =>
    c.nom_couleur.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredCouleurs.length / itemsPerPage);
  const paginatedCouleurs = filteredCouleurs.slice(
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
                <Title order={1} c="white" size="h2">Gestion des Couleurs</Title>
                <Text c="gray.3" size="sm" mt={4}>
                  Gérez les couleurs disponibles pour vos tenues
                </Text>
              </Box>
              <Button
                onClick={openAddModal}
                leftSection={<IconPlus size={18} />}
                variant="light"
                color="white"
                radius="md"
              >
                Nouvelle couleur
              </Button>
            </Group>
          </Card>

          {/* Barre de recherche */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group>
              <TextInput
                placeholder="Rechercher une couleur..."
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
                <ActionIcon variant="light" onClick={loadCouleurs} size="lg" radius="md">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card>

          {/* Message d'erreur */}
          {error && (
            <Alert color="red" onClose={() => setError(null)} withCloseButton radius="md">
              {error}
            </Alert>
          )}

          {/* Tableau des couleurs */}
          <Card withBorder radius="lg" shadow="sm" p={0}>
            <Table striped highlightOnHover>
              <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                <Table.Tr>
                  <Table.Th style={{ width: 80 }}>Couleur</Table.Th>
                  <Table.Th>Nom</Table.Th>
                  <Table.Th>Hex</Table.Th>
                  <Table.Th>RGB</Table.Th>
                  <Table.Th style={{ width: 100, textAlign: 'center' }}>Statut</Table.Th>
                  <Table.Th style={{ width: 100, textAlign: 'center' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedCouleurs.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                      <Text c="dimmed">
                        {searchTerm ? 'Aucune couleur ne correspond à votre recherche' : 'Aucune couleur enregistrée'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedCouleurs.map((couleur) => (
                    <Table.Tr key={couleur.id}>
                      <Table.Td>
                        <Box
                          w={40}
                          h={40}
                          style={{
                            backgroundColor: couleur.code_hex || '#000',
                            borderRadius: '50%',
                            border: '1px solid #dee2e6',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500}>{couleur.nom_couleur}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="gray" size="sm">
                          {couleur.code_hex || '-'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="gray" size="sm">
                          {couleur.code_rgb || '-'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Badge color={couleur.est_actif === 1 ? 'green' : 'red'} variant="light">
                          {couleur.est_actif === 1 ? 'Actif' : 'Inactif'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Group gap="xs" justify="center">
                          <Tooltip label="Modifier">
                            <ActionIcon
                              variant="subtle"
                              color="yellow"
                              onClick={() => openEditModal(couleur)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Supprimer">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => openDeleteConfirm(couleur.id)}
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

      {/* Modal Formulaire */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={
          <Title order={3} size="h4">
            {editingCouleur ? 'Modifier la couleur' : 'Nouvelle couleur'}
          </Title>
        }
        size="md"
        radius="md"
      >
        <Stack>
          <TextInput
            label="Nom de la couleur"
            placeholder="Ex: Rouge, Bleu, Noir..."
            value={formData.nom_couleur}
            onChange={(e) => setFormData({ ...formData, nom_couleur: e.target.value })}
            required
            withAsterisk
          />
          
          <ColorInput
            label="Code Hexadécimal"
            placeholder="#000000"
            value={formData.code_hex}
            onChange={handleHexChange}
            format="hex"
          />
          
          <TextInput
            label="Code RGB"
            placeholder="(0,0,0)"
            value={formData.code_rgb}
            onChange={(e) => setFormData({ ...formData, code_rgb: e.target.value })}
          />
          
          <Textarea
            label="Description"
            placeholder="Description de la couleur..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          
          <Switch
            label="Actif"
            checked={formData.est_actif === 1}
            onChange={(e) => setFormData({ ...formData, est_actif: e.currentTarget.checked ? 1 : 0 })}
          />
          
          <Divider />
          
          <Group justify="flex-end">
            <Button variant="light" onClick={closeModal}>
              Annuler
            </Button>
            <Button onClick={handleSave} color="blue">
              {editingCouleur ? 'Modifier' : 'Créer'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Confirmation Suppression */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirmation"
        size="sm"
        radius="md"
      >
        <Stack>
          <Text>Êtes-vous sûr de vouloir supprimer cette couleur ?</Text>
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

export default CouleursManager;