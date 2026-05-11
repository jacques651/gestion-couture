// components/referentiels/CategoriesMatieresManager.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
  TextInput,
  Textarea,
  Switch,
  ColorInput,
  LoadingOverlay,
  Alert,
  Badge,
  ActionIcon,
  Tooltip,
  Divider,
  ScrollArea,
  Table,
  Pagination,
  Avatar,
  Center,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconCategory,
  IconInfoCircle,
  IconPrinter,
  IconPalette,
} from '@tabler/icons-react';
import {
  CategorieMatiere
} from '../../types/categories';

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete
} from '../../services/api';

const CategoriesMatieresManager: React.FC = () => {
  const [categories, setCategories] = useState<CategorieMatiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategorie, setEditingCategorie] = useState<CategorieMatiere | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const itemsPerPage = 10;

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const [formData, setFormData] =
    useState({
      nom_categorie: "",
      description: "",
      couleur_affichage: "#1b365d",
      est_active: 1
    });
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data =
        await apiGet(
          "/categories-matieres"
        );

      setCategories(data);
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filtrage et pagination
  const filteredCategories = useMemo(() => {
    return categories.filter(c =>
      c.nom_categorie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [categories, searchTerm]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedData = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetForm = () => {

    setFormData({
      nom_categorie: "",
      description: "",
      couleur_affichage: "#1b365d",
      est_active: 1
    });

    setEditingCategorie(null);

    setError(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const openEditModal = (categorie: CategorieMatiere) => {
    setEditingCategorie(categorie);
    setFormData({
      nom_categorie:
        categorie.nom_categorie || "",

      description:
        categorie.description || "",

      couleur_affichage:
        categorie.couleur_affichage || "#1b365d",

      est_active:
        categorie.est_active ?? 1
    });
    openModal();
  };

  const openDeleteConfirm = (id: number, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    openDeleteModal();
  };

  const closeDeleteModalHandler = () => {
    setDeleteId(null);
    setDeleteName('');
    closeDeleteModal();
  };

  const handleSave = async () => {

    if (
      !formData.nom_categorie.trim()
    ) {

      setError(
        "Le nom est requis"
      );

      return;
    }

    try {

      setError(null);

      if (editingCategorie) {

        await apiPut(
          `/categories-matieres/${editingCategorie.id}`,
          {
            nom_categorie:
              formData.nom_categorie,

            description:
              formData.description,

            couleur_affichage:
              formData.couleur_affichage,

            est_active:
              formData.est_active
          }
        );

      } else {

        await apiPost(
          "/categories-matieres",
          {
            nom_categorie:
              formData.nom_categorie,

            description:
              formData.description,

            couleur_affichage:
              formData.couleur_affichage,

            est_active:
              formData.est_active
          }
        );
      }

      closeModal();

      await loadCategories();

      resetForm();

    } catch (err: any) {

      console.error(err);

      setError(
        err.message ||
        "Erreur lors de l'enregistrement"
      );
    }
  };
  const handleDelete = async () => {

    if (!deleteId) return;

    try {

      setError(null);

      await apiDelete(
        `/categories-matieres/${deleteId}`
      );

      closeDeleteModal();

      setDeleteId(null);

      await loadCategories();

    } catch (err: any) {

      console.error(err);

      setError(
        err.message ||
        "Erreur lors de la suppression"
      );
    }
  };

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconCategory size={40} stroke={1.5} />
            <Text>Chargement des catégories...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(19, 65, 134, 0.2)' }}>
                  <IconCategory size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Catégories de Matières</Title>
                  <Text c="gray.3" size="sm">Gérez les catégories (Tissus, Doublures, Fournitures, Fils...)</Text>
                </Box>
              </Group>
              <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">
                Instructions
              </Button>
            </Group>
          </Card>

          {/* Contenu principal */}
          <Card withBorder radius="lg" shadow="sm">
            <Stack gap="md">
              {/* Barre d'actions */}
              <Group justify="space-between" align="flex-end">
                <Box>
                  <Text
                    fw={700}
                    size="lg"
                    c="#1b365d"
                  >
                    Liste des catégories
                  </Text>

                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    {filteredCategories.length}
                    catégorie
                    {filteredCategories.length > 1 ? 's' : ''}
                    trouvée
                    {filteredCategories.length > 1 ? 's' : ''}
                  </Text>
                </Box>
                <Group>
                  <Button leftSection={<IconPrinter size={16} />} onClick={() => window.print()} variant="outline" color="teal">Imprimer</Button>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={openAddModal}
                    variant="gradient"
                    gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  >
                    Nouvelle catégorie
                  </Button>
                </Group>
              </Group>

              <Divider />

              {/* Recherche */}
              <Group>
                <TextInput
                  placeholder="Rechercher une catégorie..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{ flex: 1 }}
                  radius="md"
                  size="md"
                />
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" onClick={loadCategories} size="xl" radius="md">
                    <IconRefresh size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              {/* Message d'erreur */}
              {error && (
                <Alert color="red" onClose={() => setError(null)} withCloseButton radius="md">
                  {error}
                </Alert>
              )}

              {/* Tableau */}
              {filteredCategories.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" radius="md">
                  {searchTerm ? 'Aucune catégorie ne correspond à votre recherche' : 'Aucune catégorie enregistrée. Cliquez sur "Nouvelle catégorie" pour commencer.'}
                </Alert>
              ) : (
                <>
                  <ScrollArea style={{ maxHeight: 600 }} offsetScrollbars>
                    <Table
                      striped
                      highlightOnHover
                      withColumnBorders
                      style={{ fontSize: '15px' }}
                    >
                      <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                        <Table.Tr>
                          <Table.Th style={{ width: 40, color: 'white', fontSize: '11px', padding: '8px 4px' }}></Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '11px', padding: '8px 4px' }}>Nom</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '11px', padding: '8px 4px' }}>Code</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '11px', padding: '8px 4px' }}>Description</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '11px', padding: '8px 4px' }}>Couleur</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '11px', padding: '8px 4px' }}>Statut</Table.Th>
                          <Table.Th style={{ textAlign: 'center', color: 'white', fontSize: '11px', padding: '8px 4px' }}>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {paginatedData.map((categorie) => (
                          <Table.Tr key={categorie.id}>
                            <Table.Td style={{ padding: '6px 4px', width: 40 }}>
                              <Box
                                w={20}
                                h={20}
                                style={{
                                  backgroundColor: categorie.couleur_affichage || '#6B7280',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(0,0,0,0.1)'
                                }}
                              />
                            </Table.Td>
                            <Table.Td style={{ fontSize: '15px', padding: '6px 4px' }}>
                              <Text size="xs" fw={500}>
                                {categorie.nom_categorie}
                              </Text>
                            </Table.Td>
                            <Table.Td style={{ fontSize: '15px', padding: '6px 4px', whiteSpace: 'nowrap' }}>
                              <Badge variant="light" color="gray" size="xs">{categorie.code_categorie}</Badge>
                            </Table.Td>
                            <Table.Td style={{ fontSize: '15px', padding: '6px 4px', maxWidth: '200px' }}>
                              <Text size="xs" lineClamp={1}>
                                {categorie.description || '-'}
                              </Text>
                            </Table.Td>
                            <Table.Td style={{ fontSize: '15px', padding: '6px 4px', whiteSpace: 'nowrap' }}>
                              <Group gap={4}>
                                <Box
                                  w={12}
                                  h={12}
                                  style={{
                                    backgroundColor: categorie.couleur_affichage || '#6B7280',
                                    borderRadius: '50%',
                                    border: '1px solid rgba(0,0,0,0.2)'
                                  }}
                                />
                                <Text size="xs">{categorie.couleur_affichage || '#6B7280'}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td style={{ fontSize: '15px', padding: '6px 4px', whiteSpace: 'nowrap' }}>
                              <Badge
                                color={categorie.est_active === 1 ? 'green' : 'red'}
                                variant="filled"
                                size="xs"
                              >
                                {categorie.est_active === 1 ? 'Actif' : 'Inactif'}
                              </Badge>
                            </Table.Td>
                            <Table.Td style={{ padding: '6px 4px' }}>
                              <Group gap={4} justify="center" wrap="nowrap">
                                <Tooltip label="Modifier">
                                  <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => openEditModal(categorie)}>
                                    <IconEdit size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Supprimer">
                                  <ActionIcon variant="subtle" color="red" size="sm" onClick={() => openDeleteConfirm(categorie.id, categorie.nom_categorie)}>
                                    <IconTrash size={14} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>

                  {totalPages > 1 && (
                    <Group justify="center" mt="md">
                      <Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} color="#1b365d" />
                    </Group>
                  )}
                </>
              )}
            </Stack>
          </Card>

          {/* Modal Formulaire */}
          <Modal
            opened={modalOpened}
            onClose={closeModal}
            title={
              <Title order={3}>
                {editingCategorie ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </Title>
            }
            size="md"
            radius="md"
            padding="xl"
            centered
          >
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <Stack gap="md">
                <TextInput
                  label="Nom de la catégorie"
                  placeholder="Ex: Tissus, Doublures, Fournitures..."
                  value={formData.nom_categorie}
                  onChange={(e) => setFormData({ ...formData, nom_categorie: e.target.value })}
                  required
                  withAsterisk
                  size="md"
                  radius="md"
                />

                <Textarea
                  label="Description"
                  placeholder="Description de la catégorie..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  size="md"
                  radius="md"
                />

                <ColorInput
                  label="Couleur associée"
                  placeholder="Sélectionnez une couleur"
                  value={formData.couleur_affichage}
                  onChange={(value) => setFormData({ ...formData, couleur_affichage: value })}
                  format="hex"
                  size="md"
                  radius="md"
                  leftSection={<IconPalette size={16} />}
                />

                <Switch
                  label="Catégorie active"
                  description="Les catégories inactives ne seront pas visibles"
                  checked={formData.est_active === 1}
                  onChange={(e) => setFormData({ ...formData, est_active: e.currentTarget.checked ? 1 : 0 })}
                  size="md"
                />

                {error && (
                  <Alert color="red" onClose={() => setError(null)} withCloseButton radius="md">
                    {error}
                  </Alert>
                )}

                <Divider my="sm" />

                <Group justify="flex-end" gap="md">
                  <Button variant="subtle" onClick={closeModal} size="md" radius="md" disabled={saving}>
                    Annuler
                  </Button>
                  <Button type="submit" color="blue" size="md" radius="md" loading={saving}>
                    {editingCategorie ? 'Enregistrer les modifications' : 'Créer la catégorie'}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Modal>

          {/* Modal Confirmation Suppression */}
          <Modal
            opened={deleteModalOpened}
            onClose={closeDeleteModalHandler}
            title="Confirmation de suppression"
            size="sm"
            radius="md"
            padding="lg"
            centered
          >
            <Stack gap="md">
              <Alert color="red" variant="light">
                <Text size="md" fw={500}>
                  Êtes-vous sûr de vouloir supprimer la catégorie "{deleteName}" ?
                </Text>
                <Text size="sm" mt={8}>
                  Cette action est irréversible. Les matières associées ne seront pas supprimées.
                </Text>
              </Alert>

              {error && (
                <Alert color="red" onClose={() => setError(null)} withCloseButton radius="md">
                  {error}
                </Alert>
              )}

              <Group justify="flex-end" gap="md">
                <Button variant="subtle" onClick={closeDeleteModalHandler} size="md" radius="md" disabled={saving}>
                  Annuler
                </Button>
                <Button color="red" onClick={handleDelete} size="md" radius="md" leftSection={<IconTrash size={18} />} loading={saving}>
                  Supprimer définitivement
                </Button>
              </Group>
            </Stack>
          </Modal>

          {/* Modal instructions */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Instructions" size="md" centered radius="md">
            <Stack gap="md">
              <Text size="sm">1️⃣ Créez des catégories pour organiser vos matières</Text>
              <Text size="sm">2️⃣ Chaque catégorie peut avoir une couleur distinctive</Text>
              <Text size="sm">3️⃣ Le code catégorie est généré automatiquement</Text>
              <Text size="sm">4️⃣ Ajoutez une description pour plus de détails</Text>
              <Text size="sm">5️⃣ Activez ou désactivez une catégorie selon vos besoins</Text>
              <Text size="sm">6️⃣ Les matières associées ne sont pas supprimées avec la catégorie</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 1.0.0 - Gestion Couture</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default CategoriesMatieresManager;