// src/components/tenues/ListeGammesTenues.tsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Group,
  Badge,
  ActionIcon,
  Stack,
  Title,
  Card,
  Text,
  Tooltip,
  Modal,
  TextInput,
  NumberInput,
  Textarea,
  Tabs,
  Avatar,
  ThemeIcon,
  Divider,
  Paper,
  SimpleGrid,
  Alert,
  Image,
  FileInput,
  LoadingOverlay,
  Pagination,
  Box,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconTruck,
  IconPackage,
  IconSearch,
  IconDownload,
  IconUpload,
  IconPhoto,
  IconMoneybag,
  IconTag,
  IconTextCaption,
  IconDeviceFloppy,
  IconInfoCircle,
  IconRefresh,
  IconArrowLeft,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';
import { GestionVariantesTenues } from './GestionVariantesTenues';
import { CompositionTenue } from './CompositionTenue';
import * as XLSX from 'xlsx';

interface GammeTenue {
  id: number;
  code_tenue: string;
  designation: string;
  description: string | null;
  prix_base: number;
  image_url: string | null;
  est_actif: number;
  created_at?: string;
  updated_at?: string;
}

export const ListeGammesTenues: React.FC = () => {
  const [tenues, setTenues] = useState<GammeTenue[]>([]);
  const [filteredTenues, setFilteredTenues] = useState<GammeTenue[]>([]);
  const [selectedTenue, setSelectedTenue] = useState<GammeTenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [editingTenue, setEditingTenue] = useState<GammeTenue | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    code_tenue: '',
    designation: '',
    description: '',
    prix_base: 0,
    image_url: '',
  });

  const loadData = async () => {
    setLoading(true);
    const db = await getDb();
    try {
      const data = await db.select<GammeTenue[]>(
        'SELECT * FROM gammes_tenues WHERE est_actif = 1 ORDER BY designation'
      );
      setTenues(data);
      setFilteredTenues(data);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Erreur',
        message: 'Erreur de chargement des tenues',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = tenues.filter(tenue =>
      tenue.code_tenue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenue.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTenues(filtered);
    setCurrentPage(1);
  }, [searchTerm, tenues]);

  const paginatedTenues = filteredTenues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredTenues.length / itemsPerPage);

  const handleImageChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, image_url: result });
        setImageError(false);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setFormData({ ...formData, image_url: '' });
    }
  };

  const generateCode = async () => {
    const db = await getDb();
    const result = await db.select<{ maxCode: string }[]>(
      "SELECT code_tenue FROM gammes_tenues ORDER BY id DESC LIMIT 1"
    );
    
    let newCode = 'TEN-0001';
    if (result.length > 0 && result[0].maxCode) {
      const lastNumber = parseInt(result[0].maxCode.split('-')[1]);
      newCode = `TEN-${(lastNumber + 1).toString().padStart(4, '0')}`;
    }
    return newCode;
  };

  const handleSave = async () => {
    if (!formData.code_tenue || !formData.designation) {
      notifications.show({
        title: 'Erreur',
        message: 'Le code et la désignation sont requis',
        color: 'red',
      });
      return;
    }

    if (formData.prix_base <= 0) {
      notifications.show({
        title: 'Erreur',
        message: 'Le prix de base doit être supérieur à 0',
        color: 'red',
      });
      return;
    }

    setSaving(true);
    const db = await getDb();

    try {
      if (editingTenue) {
        await db.execute(`
          UPDATE gammes_tenues 
          SET code_tenue = ?, designation = ?, description = ?, prix_base = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [formData.code_tenue, formData.designation, formData.description, formData.prix_base, formData.image_url, editingTenue.id]);
        
        notifications.show({
          title: 'Succès',
          message: 'Tenue modifiée avec succès',
          color: 'green',
        });
      } else {
        await db.execute(`
          INSERT INTO gammes_tenues (code_tenue, designation, description, prix_base, image_url, est_actif) 
          VALUES (?, ?, ?, ?, ?, 1)
        `, [formData.code_tenue, formData.designation, formData.description, formData.prix_base, formData.image_url]);
        
        notifications.show({
          title: 'Succès',
          message: `Tenue "${formData.designation}" créée avec succès`,
          color: 'green',
        });
      }
      
      setModalOpened(false);
      resetForm();
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.message || 'Erreur lors de l\'enregistrement',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const db = await getDb();
    try {
      await db.execute(`UPDATE gammes_tenues SET est_actif = 0 WHERE id = ?`, [deleteId]);
      notifications.show({
        title: 'Succès',
        message: 'Tenue supprimée avec succès',
        color: 'green',
      });
      setDeleteId(null);
      loadData();
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors de la suppression',
        color: 'red',
      });
    }
  };

  const openDetailModal = (tenue: GammeTenue) => {
    setSelectedTenue(tenue);
    setDetailModalOpened(true);
  };

  const openCreateModal = async () => {
    const newCode = await generateCode();
    resetForm();
    setFormData(prev => ({ ...prev, code_tenue: newCode }));
    setEditingTenue(null);
    setModalOpened(true);
  };

  const openEditModal = (tenue: GammeTenue) => {
    setEditingTenue(tenue);
    setFormData({
      code_tenue: tenue.code_tenue,
      designation: tenue.designation,
      description: tenue.description || '',
      prix_base: tenue.prix_base,
      image_url: tenue.image_url || '',
    });
    setImagePreview(tenue.image_url || null);
    setModalOpened(true);
  };

  const resetForm = () => {
    setFormData({
      code_tenue: '',
      designation: '',
      description: '',
      prix_base: 0,
      image_url: '',
    });
    setImagePreview(null);
    setImageError(false);
  };

  const exportToExcel = () => {
    const exportData = tenues.map(tenue => ({
      'Code': tenue.code_tenue,
      'Désignation': tenue.designation,
      'Description': tenue.description || '',
      'Prix de base (FCFA)': tenue.prix_base,
      'Date création': tenue.created_at || '',
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gammes tenues');
    XLSX.writeFile(wb, `gammes_tenues_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    notifications.show({
      title: 'Export réussi',
      message: 'Le fichier Excel a été téléchargé',
      color: 'green',
    });
  };

  if (loading) {
    return (
      <Card withBorder p="xl" radius="lg">
        <Stack align="center">
          <LoadingOverlay visible={true} />
          <Text>Chargement des tenues...</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="lg">
      {/* HEADER */}
      <Card withBorder radius="lg" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Avatar size={50} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <IconTruck size={25} color="white" />
            </Avatar>
            <div>
              <Title order={2} c="white">Gammes de tenues</Title>
              <Text c="gray.3" size="sm">Gérez vos collections et modèles de tenues</Text>
            </div>
          </Group>
          <Group>
            <Tooltip label="Exporter Excel">
              <Button
                variant="light"
                color="white"
                leftSection={<IconDownload size={16} />}
                onClick={exportToExcel}
              >
                Exporter
              </Button>
            </Tooltip>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={openCreateModal}
              variant="white"
            >
              Nouvelle tenue
            </Button>
          </Group>
        </Group>
      </Card>

      {/* BARRE DE RECHERCHE */}
      <Card withBorder radius="lg" shadow="sm">
        <Group justify="space-between">
          <TextInput
            placeholder="Rechercher par code ou désignation..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
            radius="md"
            size="md"
          />
          <Badge size="lg" variant="light" color="blue">
            {filteredTenues.length} tenue{filteredTenues.length > 1 ? 's' : ''}
          </Badge>
        </Group>
      </Card>

{/* TABLEAU DES TENUES - VERSION CARTES POUR MOBILE */}
<Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
  {filteredTenues.length === 0 ? (
    <Stack align="center" py={80} gap="md">
      <ThemeIcon size={80} radius="xl" color="gray" variant="light">
        <IconTruck size={40} stroke={1.5} />
      </ThemeIcon>
      <Stack gap="xs" align="center">
        <Text size="lg" fw={600} c="gray.7">Aucune tenue trouvée</Text>
        <Text size="sm" c="dimmed">
          {searchTerm ? 'Essayez avec d\'autres critères de recherche' : 'Cliquez sur "Nouvelle tenue" pour commencer'}
        </Text>
      </Stack>
      {searchTerm && (
        <Button 
          variant="light" 
          onClick={() => setSearchTerm('')} 
          leftSection={<IconRefresh size={16} />}
        >
          Réinitialiser
        </Button>
      )}
    </Stack>
  ) : (
    <>
      {/* Version Desktop - Tableau */}
      <Box visibleFrom="md">
        <Table striped highlightOnHover verticalSpacing="md" horizontalSpacing="md">
          <Table.Thead style={{ backgroundColor: '#1b365d' }}>
            <Table.Tr>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>
                <Group gap="xs"><IconTag size={14} /><span>Code</span></Group>
              </Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>
                <Group gap="xs"><IconTextCaption size={14} /><span>Désignation</span></Group>
              </Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>
                <Group gap="xs">< span>Description</span></Group>
              </Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>
                <Group gap="xs"><IconMoneybag size={14} /><span>Prix</span></Group>
              </Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>
                Actions
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedTenues.map((tenue) => (
              <Table.Tr key={tenue.id}>
                <Table.Td>
                  <Badge variant="gradient" gradient={{ from: '#667eea', to: '#764ba2' }} size="lg">
                    {tenue.code_tenue}
                  </Badge>
                </Table.Td>
                <Table.Td fw={600}>{tenue.designation}</Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={2} c="dimmed">
                    {tenue.description || <span style={{ color: '#adb5bd' }}>—</span>}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge color="blue" variant="light" size="lg">
                    {tenue.prix_base.toLocaleString()} FCFA
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={8} justify="center">
                    <ActionIcon variant="light" color="blue" size="lg" radius="md" onClick={() => openDetailModal(tenue)}>
                      <IconEye size={18} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="green" size="lg" radius="md" onClick={() => openEditModal(tenue)}>
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="red" size="lg" radius="md" onClick={() => setDeleteId(tenue.id)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>

      {/* Version Mobile - Cartes */}
      <Box hiddenFrom="md" p="md">
        <Stack gap="md">
          {paginatedTenues.map((tenue) => (
            <Paper
              key={tenue.id}
              withBorder
              radius="lg"
              p="md"
              style={{ transition: 'all 0.2s' }}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="start">
                  <Group gap="xs" align="center" wrap="nowrap">
                    {tenue.image_url ? (
                      <Avatar src={tenue.image_url} size={50} radius="lg" />
                    ) : (
                      <Avatar size={50} radius="lg" color="blue" variant="light">
                        <IconTruck size={24} />
                      </Avatar>
                    )}
                    <div>
                      <Badge variant="light" size="sm" mb={4}>
                        {tenue.code_tenue}
                      </Badge>
                      <Text fw={600} size="md">{tenue.designation}</Text>
                    </div>
                  </Group>
                  <Badge size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                    {tenue.prix_base.toLocaleString()} FCFA
                  </Badge>
                </Group>

                {tenue.description && (
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {tenue.description}
                  </Text>
                )}

                <Group grow gap="xs">
                  <Button
                    variant="light"
                    color="blue"
                    size="sm"
                    leftSection={<IconEye size={16} />}
                    onClick={() => openDetailModal(tenue)}
                    fullWidth
                  >
                    Détails
                  </Button>
                  <Button
                    variant="light"
                    color="green"
                    size="sm"
                    leftSection={<IconEdit size={16} />}
                    onClick={() => openEditModal(tenue)}
                    fullWidth
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="light"
                    color="red"
                    size="sm"
                    leftSection={<IconTrash size={16} />}
                    onClick={() => setDeleteId(tenue.id)}
                    fullWidth
                  >
                    Supprimer
                  </Button>
                </Group>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Group justify="space-between" align="center" p="md" style={{ borderTop: '1px solid #e9ecef' }}>
          <Text size="xs" c="dimmed" visibleFrom="sm">
            {((currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredTenues.length)} / {filteredTenues.length}
          </Text>
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={totalPages}
            color="blue"
            radius="md"
            withEdges={window.innerWidth > 768}
            size={window.innerWidth > 768 ? 'md' : 'sm'}
          />
        </Group>
      )}
    </>
  )}
</Card>

      {/* MODAL SUPPRESSION */}
      <Modal
        opened={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Confirmation de suppression"
        centered
        radius="lg"
      >
        <Stack>
          <Alert color="red" variant="light" icon={<IconTrash size={16} />}>
            Êtes-vous sûr de vouloir supprimer cette tenue ?
          </Alert>
          <Text size="sm" c="dimmed">
            Cette action est irréversible. Toutes les variantes et compositions associées seront également supprimées.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button color="red" onClick={handleDelete}>Supprimer</Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL FORMULAIRE TENUE */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Group gap="xs">
            <ThemeIcon variant="light" color="blue" size="lg" radius="xl">
              {editingTenue ? <IconEdit size={18} /> : <IconPlus size={18} />}
            </ThemeIcon>
            <div>
              <Text fw={600} size="lg">
                {editingTenue ? 'Modifier la tenue' : 'Nouvelle tenue'}
              </Text>
              <Text size="xs" c="dimmed">
                {editingTenue
                  ? 'Modifiez les informations de la tenue'
                  : 'Ajoutez une nouvelle tenue à votre catalogue'}
              </Text>
            </div>
          </Group>
        }
        size="lg"
        centered
        radius="lg"
      >
        <LoadingOverlay visible={saving} />
        
        <Stack gap="md" mt="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Code tenue"
              placeholder="Ex: TEN-0001"
              value={formData.code_tenue}
              onChange={(e) => setFormData({ ...formData, code_tenue: e.target.value })}
              leftSection={<IconTag size={16} />}
              size="md"
              required
              disabled={!!editingTenue}
              description={editingTenue ? "Le code ne peut pas être modifié" : "Code unique de la tenue"}
            />

            <TextInput
              label="Désignation"
              placeholder="Ex: Robe traditionnelle"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              leftSection={<IconTextCaption size={16} />}
              size="md"
              required
            />
          </SimpleGrid>

          <Textarea
            label="Description"
            placeholder="Décrivez la tenue (matières, particularités, etc.)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            size="md"
            rows={4}
            autosize
            maxRows={8}
          />

          <NumberInput
            label="Prix de base (FCFA)"
            placeholder="0"
            value={formData.prix_base}
            onChange={(val) => setFormData({ ...formData, prix_base: Number(val) || 0 })}
            leftSection={<IconMoneybag size={16} />}
            size="md"
            min={0}
            step={1000}
            thousandSeparator=" "
            required
          />

          <Divider label="Image" labelPosition="center" />

          <TextInput
            label="URL de l'image"
            placeholder="https://example.com/image.jpg"
            value={formData.image_url}
            onChange={(e) => {
              setFormData({ ...formData, image_url: e.target.value });
              setImagePreview(e.target.value);
              setImageError(false);
            }}
            leftSection={<IconPhoto size={16} />}
            size="md"
          />

          <FileInput
            label="Ou uploader une image"
            placeholder="Cliquez pour sélectionner une image"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleImageChange}
            leftSection={<IconUpload size={16} />}
            size="md"
            clearable
          />

          {imagePreview && (
            <Paper withBorder p="sm" radius="md" style={{ textAlign: 'center' }}>
              <Image
                src={imagePreview}
                alt="Aperçu"
                radius="md"
                fit="contain"
                height={150}
                onError={() => setImageError(true)}
                fallbackSrc="https://placehold.co/400x300?text=Image+non+disponible"
              />
              {imageError && (
                <Text size="xs" c="red" mt="xs">Image non disponible</Text>
              )}
            </Paper>
          )}

          <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
            <Text size="xs">
              Après création, vous pourrez ajouter des variantes par taille et gérer les stocks.
            </Text>
          </Alert>

          <Divider />

          <Group justify="space-between">
            <Button variant="outline" color="red" onClick={() => setModalOpened(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              leftSection={<IconDeviceFloppy size={16} />}
              variant="gradient"
              gradient={{ from: '#1b365d', to: '#2a4a7a' }}
            >
              {editingTenue ? 'Mettre à jour' : 'Créer la tenue'}
            </Button>
          </Group>
        </Stack>
      </Modal>

  {/* MODAL DÉTAILS TENUE - VERSION MINIMALISTE ÉLÉGANTE */}
<Modal
  opened={detailModalOpened}
  onClose={() => setDetailModalOpened(false)}
  size="1000px"
  padding="lg"
  radius="lg"
  title={
    <Group gap="md" align="center">
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        onClick={() => setDetailModalOpened(false)}
      >
        <IconArrowLeft size={18} />
      </ActionIcon>
      <div>
        <Text size="xs" c="dimmed">{selectedTenue?.code_tenue}</Text>
        <Text fw={600} size="md">{selectedTenue?.designation}</Text>
      </div>
    </Group>
  }
  styles={{
    header: {
      borderBottom: '1px solid #e9ecef',
      padding: '16px 24px',
    },
    title: { flex: 1 },
    body: { padding: '24px' },
  }}
>
  {selectedTenue && (
    <Stack gap="xl">
      {/* Infos rapides */}
      <Group justify="space-between" align="center">
        <Group gap="md">
          <ThemeIcon size={60} radius="md" variant="light" color="blue">
            <IconTruck size={30} />
          </ThemeIcon>
          <div>
            <Text size="xs" c="dimmed">Prix de base</Text>
            <Title order={3} c="blue">{selectedTenue.prix_base.toLocaleString()} FCFA</Title>
          </div>
        </Group>
        <Badge size="xl" variant="dot" color="green">En stock</Badge>
      </Group>

      {selectedTenue.description && (
        <Paper p="md" withBorder radius="md" bg="gray.0">
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
            {selectedTenue.description}
          </Text>
        </Paper>
      )}

      <Tabs defaultValue="variantes" variant="outline" radius="md">
        <Tabs.List grow>
          <Tabs.Tab value="variantes" leftSection={<IconTruck size={16} />}>
            Tailles
          </Tabs.Tab>
          <Tabs.Tab value="compositions" leftSection={<IconPackage size={16} />}>
            Compositions
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="variantes" pt="md">
          <GestionVariantesTenues tenueId={selectedTenue.id} />
        </Tabs.Panel>

        <Tabs.Panel value="compositions" pt="md">
          <CompositionTenue tenueId={selectedTenue.id} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )}
</Modal>
    </Stack>
  );
};

export default ListeGammesTenues;