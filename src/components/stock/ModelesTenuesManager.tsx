// components/referentiels/ModelesTenuesManager.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { getModelesTenues, ModeleTenue, getDb } from '../../database/db';
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
  LoadingOverlay,
  Alert,
  Badge,
  ActionIcon,
  Tooltip,
  Divider,
  Chip,
  ScrollArea,
  Table,
  Select,
  Switch,
  Textarea,
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
  IconPrinter,
  IconShirt,
  IconInfoCircle,
} from '@tabler/icons-react';

interface FormData {
  designation: string;
  description: string;
  code_modele: string;
  categorie: 'femme' | 'homme' | 'enfant' | 'accessoire';
  est_actif: number;
}

const initialFormData: FormData = {
  designation: '',
  description: '',
  code_modele: '',
  categorie: 'femme',
  est_actif: 1
};

// Fonction pour générer un code modèle unique
const generateCodeModele = (categorie: string, existingCodes: string[]): string => {
  const prefix = categorie.substring(0, 3).toUpperCase();
  let suffix = 1;
  let code = '';
  
  do {
    code = `${prefix}-${String(suffix).padStart(3, '0')}`;
    suffix++;
  } while (existingCodes.includes(code));
  
  return code;
};

const ModelesTenuesManager: React.FC = () => {
  const [modeles, setModeles] = useState<ModeleTenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState<string>('');
  const [editingModele, setEditingModele] = useState<ModeleTenue | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteDesignation, setDeleteDesignation] = useState<string>('');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const itemsPerPage = 10;

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

 const loadModeles = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await getModelesTenues(true, filterCategorie || undefined);
    setModeles(data);
  } catch (err: any) {
    console.error('ERREUR DÉTAILLÉE:', err); // ← Ajoute cette ligne
    setError(err.message || 'Erreur lors du chargement');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadModeles();
  }, [filterCategorie]);

  // Filtrage et pagination
  const filteredModeles = useMemo(() => {
    return modeles.filter(m =>
      m.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [modeles, searchTerm]);

  const totalPages = Math.ceil(filteredModeles.length / itemsPerPage);
  const paginatedData = filteredModeles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingModele(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const openEditModal = (modele: ModeleTenue) => {
    setEditingModele(modele);
    setFormData({
      designation: modele.designation,
      description: modele.description || '',
      code_modele: modele.code_modele || '',
      categorie: modele.categorie,
      est_actif: modele.est_actif
    });
    openModal();
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

  const handleCategorieChange = (value: string | null) => {
    if (value && !editingModele) {
      const categorie = value as 'femme' | 'homme' | 'enfant' | 'accessoire';
      const existingCodes = modeles.map(m => m.code_modele);
      const newCode = generateCodeModele(categorie, existingCodes);
      setFormData({ 
        ...formData, 
        categorie,
        code_modele: newCode 
      });
    } else if (value) {
      setFormData({ ...formData, categorie: value as 'femme' | 'homme' | 'enfant' | 'accessoire' });
    }
  };

const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.designation.trim()) {
        throw new Error('La désignation est requise');
      }
      if (!formData.categorie) {
        throw new Error('La catégorie est requise');
      }

      // ✅ Vrai appel à la base de données
      const db = await getDb(); // ← Ajoute l'import de getDb
      
      if (editingModele) {
        await db.execute(
          `UPDATE modeles_tenues SET designation = ?, description = ?, categorie = ?, est_actif = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [formData.designation, formData.description, formData.categorie, formData.est_actif, editingModele.id]
        );
      } else {
        const code = formData.code_modele || generateCodeModele(formData.categorie, modeles.map(m => m.code_modele));
        await db.execute(
          `INSERT INTO modeles_tenues (code_modele, designation, description, categorie, est_actif) VALUES (?, ?, ?, ?, ?)`,
          [code, formData.designation, formData.description, formData.categorie, formData.est_actif]
        );
      }

      closeModal();
      resetForm();
      await loadModeles(); // Recharge depuis la base
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setSaving(true);
      setError(null);
      
      const db = await getDb();
      await db.execute(`UPDATE modeles_tenues SET est_actif = 0 WHERE id = ?`, [deleteId]);
      
      closeDeleteModalHandler();
      await loadModeles();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  if (loading && modeles.length === 0) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconShirt size={40} stroke={1.5} />
            <Text>Chargement des modèles...</Text>
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
                  <IconShirt size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Modèles de Tenues</Title>
                  <Text c="gray.3" size="sm">Gérez les modèles de base pour vos créations</Text>
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
                  <Title order={3} size="h4" c="#1b365d">Liste des modèles</Title>
                  <Text size="xs" c="dimmed">
                    {filteredModeles.length} modèle{filteredModeles.length > 1 ? 's' : ''} trouvé{filteredModeles.length > 1 ? 's' : ''}
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
                    Nouveau modèle
                  </Button>
                </Group>
              </Group>

              <Divider />

              {/* Recherche et filtres */}
              <Group>
                <TextInput
                  placeholder="Rechercher un modèle..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{ flex: 1 }}
                  radius="md"
                  size="md"
                />
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" onClick={loadModeles} size="xl" radius="md">
                    <IconRefresh size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Group gap="md">
                <Text size="sm" fw={600}>Catégories :</Text>
                <Chip.Group value={filterCategorie} onChange={(value) => { setFilterCategorie(value as string); setCurrentPage(1); }}>
                  <Group gap="xs">
                    <Chip value="" variant="filled" size="sm">Tous</Chip>
                    <Chip value="femme" color="pink" variant="filled" size="sm">Femme</Chip>
                    <Chip value="homme" color="blue" variant="filled" size="sm">Homme</Chip>
                    <Chip value="enfant" color="green" variant="filled" size="sm">Enfant</Chip>
                    <Chip value="accessoire" color="grape" variant="filled" size="sm">Accessoire</Chip>
                  </Group>
                </Chip.Group>
              </Group>

              {/* Message d'erreur */}
              {error && (
                <Alert color="red" onClose={() => setError(null)} withCloseButton radius="md">
                  {error}
                </Alert>
              )}

              {/* Tableau */}
              {filteredModeles.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" radius="md">
                  {searchTerm ? 'Aucun modèle ne correspond à votre recherche' : 'Aucun modèle enregistré. Cliquez sur "Nouveau modèle" pour commencer.'}
                </Alert>
              ) : (
                <>
                  <ScrollArea style={{ maxHeight: 600 }} offsetScrollbars>
                    <Table 
                      striped 
                      highlightOnHover 
                      withColumnBorders 
                      style={{ fontSize: '11px' }}
                    >
                      <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                        <Table.Tr>
                          <Table.Th style={{ color: 'white', fontSize: '11px', padding: '8px 4px' }}>Désignation</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '11px', padding: '8px 4px' }}>Code</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '11px', padding: '8px 4px' }}>Catégorie</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '11px', padding: '8px 4px' }}>Statut</Table.Th>
                          <Table.Th style={{ textAlign: 'center', color: 'white', fontSize: '11px', padding: '8px 4px' }}>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {paginatedData.map((modele) => (
                          <Table.Tr key={modele.id}>
                            <Table.Td style={{ fontSize: '11px', padding: '6px 4px' }}>
                              <Text size="xs" fw={500} lineClamp={1}>
                                {modele.designation}
                              </Text>
                              {modele.description && (
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {modele.description}
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td style={{ fontSize: '11px', padding: '6px 4px', whiteSpace: 'nowrap' }}>
                              <Badge variant="light" color="gray" size="xs">{modele.code_modele}</Badge>
                            </Table.Td>
                            <Table.Td style={{ fontSize: '11px', padding: '6px 4px', whiteSpace: 'nowrap' }}>
                              <Badge 
                                color={
                                  modele.categorie === 'femme' ? 'pink' :
                                  modele.categorie === 'homme' ? 'blue' :
                                  modele.categorie === 'enfant' ? 'green' : 'grape'
                                } 
                                variant="light"
                                size="xs"
                              >
                                {modele.categorie}
                              </Badge>
                            </Table.Td>
                            <Table.Td style={{ fontSize: '11px', padding: '6px 4px', whiteSpace: 'nowrap' }}>
                              <Badge 
                                color={modele.est_actif === 1 ? 'green' : 'red'} 
                                variant="filled"
                                size="xs"
                              >
                                {modele.est_actif === 1 ? 'Actif' : 'Inactif'}
                              </Badge>
                            </Table.Td>
                            <Table.Td style={{ padding: '6px 4px' }}>
                              <Group gap={4} justify="center" wrap="nowrap">
                                <Tooltip label="Modifier">
                                  <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => openEditModal(modele)}>
                                    <IconEdit size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Supprimer">
                                  <ActionIcon variant="subtle" color="red" size="sm" onClick={() => openDeleteConfirm(modele.id, modele.designation)}>
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

          {/* Modal formulaire d'ajout/modification - CORRIGÉ */}
          <Modal
            opened={modalOpened}
            onClose={closeModal}
            title={editingModele ? 'Modifier le modèle' : 'Nouveau modèle de tenue'}
            size="lg"
            radius="md"
            padding="xl"
            centered
          >
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <Stack gap="md">
                <TextInput
                  label="Désignation"
                  placeholder="Ex: Robe chemisier, Pantalon classique..."
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  required
                  withAsterisk
                  size="md"
                  radius="md"
                />

                <Select
                  label="Catégorie"
                  placeholder="Sélectionnez une catégorie"
                  data={[
                    { value: 'femme', label: 'Femme' },
                    { value: 'homme', label: 'Homme' },
                    { value: 'enfant', label: 'Enfant' },
                    { value: 'accessoire', label: 'Accessoire' }
                  ]}
                  value={formData.categorie}
                  onChange={handleCategorieChange}
                  size="md"
                  radius="md"
                  required
                  withAsterisk
                />

                <TextInput
                  label="Code modèle (généré automatiquement)"
                  value={formData.code_modele}
                  size="md"
                  radius="md"
                  disabled
                  description="Le code est généré automatiquement selon la catégorie"
                />

                <Textarea
                  label="Description"
                  placeholder="Description détaillée du modèle..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  size="md"
                  radius="md"
                />

                <Switch
                  label="Modèle actif"
                  description="Les modèles inactifs ne seront pas visibles"
                  checked={formData.est_actif === 1}
                  onChange={(e) => setFormData({ ...formData, est_actif: e.currentTarget.checked ? 1 : 0 })}
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
                    {editingModele ? 'Enregistrer les modifications' : 'Créer le modèle'}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Modal>

          {/* Modal confirmation suppression - CORRIGÉ */}
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
                  Êtes-vous sûr de vouloir supprimer le modèle "{deleteDesignation}" ?
                </Text>
                <Text size="sm" mt={8}>
                  Cette action est irréversible. Toutes les données associées seront perdues.
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
              <Text size="sm">1️⃣ Créez des modèles de base pour vos tenues</Text>
              <Text size="sm">2️⃣ Choisissez une catégorie : Femme, Homme, Enfant ou Accessoire</Text>
              <Text size="sm">3️⃣ Le code modèle est généré automatiquement selon la catégorie</Text>
              <Text size="sm">4️⃣ Ajoutez une description détaillée pour référence</Text>
              <Text size="sm">5️⃣ Activez ou désactivez un modèle selon vos besoins</Text>
              <Text size="sm">6️⃣ Utilisez la recherche et les filtres par catégorie</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 1.0.0 - Gestion Couture</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default ModelesTenuesManager;