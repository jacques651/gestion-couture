// components/stock/MatieresManager.tsx
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
  NumberInput,
  Select,
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
  Grid,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconPackage,
  IconInfoCircle,
  IconPrinter,
  IconArrowUp,
  IconArrowDown,
  IconMapPin,
  IconBarcode,
  IconCube,
} from '@tabler/icons-react';
import {
  CategorieMatiere
} from '../../types/categories';

import {
  Matiere
} from '../../types/matieres';

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete
} from '../../services/api';
import { notifications } from '@mantine/notifications';

interface FormData {
  code_matiere: string;
  designation: string;
  categorie_id: number;
  unite: string;
  prix_achat: number;
  stock_actuel: number;
  seuil_alerte: number;
  reference_fournisseur: string;
  emplacement: string;
  est_supprime: number;
}

const initialFormData: FormData = {
  code_matiere: '',
  designation: '',
  categorie_id: 0,
  unite: 'mètre',
  prix_achat: 0,
  stock_actuel: 0,
  seuil_alerte: 0,
  reference_fournisseur: '',
  emplacement: '',
  est_supprime: 0,
};

const MatieresManager: React.FC = () => {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [categories, setCategories] = useState<CategorieMatiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMatiere, setEditingMatiere] = useState<Matiere | null>(null);
  const [saving, setSaving] = useState(false);
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);
  const [stockQuantity, setStockQuantity] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteDesignation, setDeleteDesignation] = useState<string>('');
  const itemsPerPage = 10;

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [stockModalOpened, { open: openStockModal, close: closeStockModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        matieresData,
        categoriesData
      ] = await Promise.all([
        apiGet("/matieres"),
        apiGet("/categories-matieres"),
      ]);

      setMatieres(matieresData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingMatiere(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const openEditModal = (matiere: Matiere) => {
    setEditingMatiere(matiere);
    setFormData({
      code_matiere: matiere.code_matiere,
      designation: matiere.designation,
      categorie_id: matiere.categorie_id,
      unite: matiere.unite,
      prix_achat: matiere.prix_achat,
      stock_actuel: matiere.stock_actuel,
      seuil_alerte: matiere.seuil_alerte,
      reference_fournisseur: matiere.reference_fournisseur || '',
      emplacement: matiere.emplacement || '',
      est_supprime: 0,
    });
    openModal();
  };

  const handleOpenStockModal = (matiere: Matiere, action: 'add' | 'remove') => {
    setSelectedMatiere(matiere);
    setStockAction(action);
    setStockQuantity(1);
    openStockModal();
  };

  const openDeleteConfirm = (id: number, designation: string) => {
    setDeleteId(id);
    setDeleteDesignation(designation);
    openDeleteModal();
  };

  const closeDeleteModalHandler = () => {
    setDeleteId(null);
    setDeleteDesignation('');
    closeDeleteModal();
  };

  const handleSave = async () => {

    if (!formData.designation.trim()) {

      setError(
        'La désignation est requise'
      );

      return;
    }

    if (!formData.categorie_id) {

      setError(
        'La catégorie est requise'
      );

      return;
    }

    try {

      setSaving(true);

      setError(null);

      if (editingMatiere) {

        await apiPut(
          `/matieres/${editingMatiere.id}`,
          formData
        );

      } else {

        await apiPost(
          "/matieres",
          formData
        );
      }

      closeModal();

      await loadData();

      resetForm();

    } catch (err: any) {

      console.error(err);

      setError(
        err.message ||
        "Erreur lors de l'enregistrement"
      );

    } finally {

      setSaving(false);
    }
  };
  const handleStockUpdate = async () => {

    if (
      !selectedMatiere ||
      stockQuantity <= 0
    ) return;

    try {

      setSaving(true);

      setError(null);

      await apiPut(
        `/matieres/${selectedMatiere.id}/stock`,
        {
          quantite: stockQuantity,
          action: stockAction
        }
      );

      closeStockModal();

      await loadData();

    } catch (err: any) {

      console.error(err);

      setError(
        err.message ||
        'Erreur lors de la mise à jour du stock'
      );

    } finally {

      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setSaving(true);
      setError(null);
      await apiDelete(
        `/matieres/${deleteId}`
      );
      closeDeleteModalHandler();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(price);
  };

  const getStockStatus = (stock: number, seuil: number) => {
    if (stock <= 0) return { text: 'Rupture', color: 'red' as const };
    if (stock <= seuil) return { text: 'Stock faible', color: 'orange' as const };
    return { text: 'En stock', color: 'green' as const };
  };

  const [newCategorieName, setNewCategorieName] = useState('');

  // Filtrer les matières
  const filteredMatieres = useMemo(() => {
    return matieres.filter(
      (matiere) =>
        matiere.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        matiere.code_matiere.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matieres, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredMatieres.length / itemsPerPage);
  const paginatedMatieres = filteredMatieres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading && matieres.length === 0) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconCube size={40} stroke={1.5} />
            <Text>Chargement des matières...</Text>
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
                  <IconCube size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Gestion des Matières</Title>
                  <Text c="gray.3" size="sm">Gérez vos stocks de tissus, fils et fournitures</Text>
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
                  <Title order={3} size="h4" c="#1b365d">Liste des matières</Title>
                  <Text size="xs" c="dimmed">
                    {filteredMatieres.length} matière{filteredMatieres.length > 1 ? 's' : ''} trouvée{filteredMatieres.length > 1 ? 's' : ''}
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
                    Nouvelle matière
                  </Button>
                </Group>
              </Group>

              <Divider />

              {/* Recherche */}
              <Group>
                <TextInput
                  placeholder="Rechercher par nom ou code..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{ flex: 1 }}
                  radius="md"
                  size="md"
                />
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" onClick={loadData} size="xl" radius="md">
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
              {filteredMatieres.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" radius="md">
                  {searchTerm ? 'Aucune matière ne correspond à votre recherche' : "Aucune matière enregistrée. Cliquez sur \"Nouvelle matière\" pour commencer."}
                </Alert>
              ) : (
                <>
                  <ScrollArea style={{ maxHeight: 600 }} offsetScrollbars>
                    <Table striped highlightOnHover withColumnBorders style={{ fontSize: '13px' }}>
                      <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                        <Table.Tr>
                          <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600 }}>Code</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600 }}>Désignation</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600 }}>Catégorie</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Unité</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Stock</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Prix achat</Table.Th>
                          <Table.Th style={{ textAlign: 'center', color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600 }}>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {paginatedMatieres.map((matiere) => {
                          const stockStatus = getStockStatus(matiere.stock_actuel, matiere.seuil_alerte);
                          const categorie = categories.find((c) => c.id === matiere.categorie_id);
                          return (
                            <Table.Tr key={matiere.id}>
                              <Table.Td style={{ fontSize: '13px', padding: '8px 8px', whiteSpace: 'nowrap' }}>
                                <Text size="sm" fw={500}>{matiere.code_matiere}</Text>
                              </Table.Td>
                              <Table.Td style={{ fontSize: '13px', padding: '8px 8px' }}>
                                <Text size="sm" fw={600}>{matiere.designation}</Text>
                                {matiere.emplacement && (
                                  <Text size="xs" c="dimmed">{matiere.emplacement}</Text>
                                )}
                              </Table.Td>
                              <Table.Td style={{ fontSize: '13px', padding: '8px 8px', whiteSpace: 'nowrap' }}>
                                {categorie && (
                                  <Badge
                                    style={{
                                      backgroundColor: categorie.couleur_affichage ? `${categorie.couleur_affichage}25` : '#e5e7eb',
                                      color: categorie.couleur_affichage || '#374151',
                                    }}
                                    size="md"
                                  >
                                    {categorie.nom_categorie}
                                  </Badge>
                                )}
                              </Table.Td>
                              <Table.Td style={{ fontSize: '13px', padding: '8px 8px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                <Badge variant="light" color="gray" size="md">{matiere.unite}</Badge>
                              </Table.Td>
                              <Table.Td style={{ fontSize: '13px', padding: '8px 8px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                <Group gap={8} justify="center" wrap="nowrap">
                                  <Badge color={stockStatus.color} variant="filled" size="md">{stockStatus.text}</Badge>
                                  <Text size="sm" fw={700}>{matiere.stock_actuel}</Text>
                                </Group>
                              </Table.Td>
                              <Table.Td style={{ fontSize: '13px', padding: '8px 8px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                                <Text size="sm" c="gray.7">{formatPrice(matiere.prix_achat)}</Text>
                              </Table.Td>
                              <Table.Td style={{ padding: '8px 8px' }}>
                                <Group gap={6} justify="center" wrap="nowrap">
                                  <Tooltip label="Ajouter stock">
                                    <ActionIcon variant="subtle" color="green" size="md" onClick={() => handleOpenStockModal(matiere, 'add')}>
                                      <IconArrowUp size={18} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Retirer stock">
                                    <ActionIcon variant="subtle" color="orange" size="md" onClick={() => handleOpenStockModal(matiere, 'remove')}>
                                      <IconArrowDown size={18} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Modifier">
                                    <ActionIcon variant="subtle" color="blue" size="md" onClick={() => openEditModal(matiere)}>
                                      <IconEdit size={18} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Supprimer">
                                    <ActionIcon variant="subtle" color="red" size="md" onClick={() => openDeleteConfirm(matiere.id, matiere.designation)}>
                                      <IconTrash size={18} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
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

          {/* Modal formulaire matière */}
          <Modal
            opened={modalOpened}
            onClose={closeModal}
            title={editingMatiere ? 'Modifier la matière' : 'Nouvelle matière'}
            size="lg"
            radius="md"
            padding="xl"
            centered
          >
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <Stack gap="md">
                <TextInput
                  label="Désignation"
                  placeholder="Nom de la matière"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  required withAsterisk size="md" radius="md"
                />

                {/* Catégorie avec option "Autre" */}
                <Stack gap={4}>
                  <Select
                    label="Catégorie"
                    placeholder="Sélectionner une catégorie"
                    data={[
                      ...categories.filter(c => c.est_active === 1).map(c => ({ value: String(c.id), label: c.nom_categorie })),
                      { value: 'autre', label: '+ Autre (créer)' },
                    ]}
                    value={formData.categorie_id === 0 && newCategorieName ? 'autre' : String(formData.categorie_id)}
                    onChange={(value) => {
                      if (value === 'autre') {
                        setFormData({ ...formData, categorie_id: 0 });
                      } else {
                        setFormData({ ...formData, categorie_id: parseInt(value || '0') });
                      }
                    }}
                    required withAsterisk size="md" radius="md" searchable
                  />
                  {(formData.categorie_id === 0 || String(formData.categorie_id) === '0') && (
                    <Group gap="xs">
                      <TextInput
                        placeholder="Nom de la nouvelle catégorie"
                        value={newCategorieName}
                        onChange={(e) => setNewCategorieName(e.target.value)}
                        size="xs"
                        radius="md"
                        style={{ flex: 1 }}
                      />
                      <Button
                        size="xs"
                        variant="light"
                        color="green"
                        onClick={async () => {
                          if (!newCategorieName.trim()) {
                            notifications.show({ title: 'Erreur', message: 'Nom requis', color: 'red' });
                            return;
                          }
                          try {

                            // Recharger les catégories
                            const cats =
                              await apiGet(
                                "/categories-matieres"
                              );

                            setCategories(cats);

                            const newCategorie =
                              cats.find(
                                (c: any) =>
                                  c.nom_categorie ===
                                  newCategorieName.trim()
                              );

                            if (newCategorie) {

                              setFormData({
                                ...formData,
                                categorie_id:
                                  newCategorie.id
                              });
                            }

                            setNewCategorieName('');

                            notifications.show({
                              title: 'Succès',
                              message: 'Catégorie créée',
                              color: 'green'
                            });

                          } catch (err: any) {

                            notifications.show({
                              title: 'Erreur',
                              message:
                                err.message,
                              color: 'red'
                            });
                          }
                        }}
                      >
                        Créer
                      </Button>
                    </Group>
                  )}
                </Stack>

                <Grid>
                  <Grid.Col span={6}>
                    <Select
                      label="Unité"
                      data={[
                        { value: 'mètre', label: 'Mètre (m)' },
                        { value: 'pièce', label: 'Pièce' },
                        { value: 'kg', label: 'Kilogramme (kg)' },
                        { value: 'rouleau', label: 'Rouleau' },
                        { value: 'bobine', label: 'Bobine' },
                      ]}
                      value={formData.unite}
                      onChange={(value) => setFormData({ ...formData, unite: value || 'mètre' })}
                      size="md" radius="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Emplacement"
                      placeholder="Rayon, étagère..."
                      value={formData.emplacement}
                      onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
                      size="md" radius="md" leftSection={<IconMapPin size={16} />}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Prix d'achat (FCFA)" placeholder="0"
                      value={formData.prix_achat}
                      onChange={(value) => setFormData({ ...formData, prix_achat: typeof value === 'number' ? value : 0 })}
                      size="md" radius="md" leftSection={<Text size="sm" fw={600}>FCFA</Text>} thousandSeparator=" " hideControls
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Stock initial"
                      value={formData.stock_actuel}
                      onChange={(value) => setFormData({ ...formData, stock_actuel: typeof value === 'number' ? value : 0 })}
                      size="md" radius="md" leftSection={<IconPackage size={16} />} hideControls
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Seuil d'alerte" description="Alerte si stock ≤ ce seuil"
                      value={formData.seuil_alerte}
                      onChange={(value) => setFormData({ ...formData, seuil_alerte: typeof value === 'number' ? value : 0 })}
                      size="md" radius="md" hideControls
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Référence fournisseur" placeholder="Réf. fournisseur"
                      value={formData.reference_fournisseur}
                      onChange={(e) => setFormData({ ...formData, reference_fournisseur: e.target.value })}
                      size="md" radius="md" leftSection={<IconBarcode size={16} />}
                    />
                  </Grid.Col>
                </Grid>

                {error && <Alert color="red" onClose={() => setError(null)} withCloseButton radius="md">{error}</Alert>}

                <Divider my="sm" />
                <Group justify="flex-end" gap="md">
                  <Button variant="subtle" onClick={closeModal} size="md" radius="md" disabled={saving}>Annuler</Button>
                  <Button type="submit" color="blue" size="md" radius="md" loading={saving}>
                    {editingMatiere ? 'Mettre à jour' : 'Enregistrer'}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Modal>

          {/* Modal gestion stock (Ajout/Retrait avec historique) */}
          <Modal
            opened={stockModalOpened}
            onClose={closeStockModal}
            title={stockAction === 'add' ? '📥 Ajouter du stock' : '📤 Retirer du stock'}
            size="md"
            radius="md"
            padding="xl"
            centered
          >
            <Stack gap="md">
              {selectedMatiere && (
                <Card withBorder radius="md" p="sm" bg="gray.0">
                  <Group justify="space-between">
                    <Box>
                      <Text size="sm" fw={600}>{selectedMatiere.designation}</Text>
                      <Text size="xs" c="dimmed">Code : {selectedMatiere.code_matiere}</Text>
                    </Box>
                    <Badge color={selectedMatiere.stock_actuel <= selectedMatiere.seuil_alerte ? 'red' : 'green'} size="lg">
                      Stock : {selectedMatiere.stock_actuel} {selectedMatiere.unite}
                    </Badge>
                  </Group>
                </Card>
              )}

              <NumberInput
                label={`Quantité à ${stockAction === 'add' ? 'ajouter' : 'retirer'}`}
                description={stockAction === 'remove' && selectedMatiere ? `Maximum : ${selectedMatiere.stock_actuel} ${selectedMatiere.unite}` : ''}
                value={stockQuantity}
                onChange={(value) => setStockQuantity(typeof value === 'number' ? Math.max(1, value) : 1)}
                min={1}
                max={stockAction === 'remove' && selectedMatiere ? selectedMatiere.stock_actuel : undefined}
                size="md" radius="md" autoFocus
              />

              <NumberInput
                label={stockAction === 'add' ? "Coût unitaire d'achat (FCFA)" : "Valeur unitaire (FCFA)"}
                placeholder="0"
                value={formData.prix_achat || 0}
                onChange={(_value) => {/* Optionnel : stocker le coût */ }}
                size="md" radius="md" leftSection={<Text size="sm" fw={600}>FCFA</Text>} thousandSeparator=" " hideControls
              />

              {stockAction === 'add' && (
                <TextInput label="Fournisseur" placeholder="Nom du fournisseur (optionnel)" size="md" radius="md" />
              )}
              {stockAction === 'remove' && (
                <Select
                  label="Motif de sortie"
                  data={[
                    { value: 'vente', label: '💰 Vente' },
                    { value: 'utilisation', label: '🔧 Utilisation interne' },
                    { value: 'perte', label: '🗑️ Perte/Casse' },
                    { value: 'retour_fournisseur', label: '📦 Retour fournisseur' },
                    { value: 'autre', label: '📝 Autre' },
                  ]}
                  size="md" radius="md"
                />
              )}
              <Textarea label="Observation" placeholder="Notes..." rows={2} size="md" radius="md" />

              {error && <Alert color="red" onClose={() => setError(null)} withCloseButton radius="md">{error}</Alert>}

              <Group justify="flex-end" gap="md" mt="md">
                <Button variant="subtle" onClick={closeStockModal} size="md" radius="md" disabled={saving}>Annuler</Button>
                <Button
                  color={stockAction === 'add' ? 'green' : 'orange'}
                  onClick={handleStockUpdate}
                  size="md" radius="md" loading={saving}
                  leftSection={stockAction === 'add' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
                >
                  {stockAction === 'add' ? 'Ajouter au stock' : 'Retirer du stock'}
                </Button>
              </Group>
            </Stack>
          </Modal>
          {/* Modal confirmation suppression */}
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
                  Êtes-vous sûr de vouloir supprimer la matière "{deleteDesignation}" ?
                </Text>
                <Text size="sm" mt={8}>
                  Cette action est irréversible. Toutes les données associées seront perdues.
                </Text>
              </Alert>

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
              <Text size="sm">1️⃣ Ajoutez vos matières premières (tissus, fils, boutons...)</Text>
              <Text size="sm">2️⃣ Choisissez la catégorie appropriée pour chaque matière</Text>
              <Text size="sm">3️⃣ Définissez l'unité de mesure (mètre, pièce, kg...)</Text>
              <Text size="sm">4️⃣ Gérez le stock avec les boutons d'ajout/retrait</Text>
              <Text size="sm">5️⃣ Le seuil d'alerte vous avertit quand le stock est bas</Text>
              <Text size="sm">6️⃣ Les prix d'achat et de vente sont en FCFA</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 1.0.0 - Gestion Couture</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default MatieresManager;