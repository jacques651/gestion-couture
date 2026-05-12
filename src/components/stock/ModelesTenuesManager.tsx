// components/referentiels/ModelesTenuesManager.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ModeleTenue
} from '../../types/modeles-tenues';

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete
} from '../../services/api';
import {
  Box, Container, Stack, Card, Title, Text, Button, Group, Modal,
  TextInput, LoadingOverlay, Alert, Badge, ActionIcon, Tooltip,
  Divider, Chip, ScrollArea, Table, Select, Switch, Textarea,
  Pagination, Avatar, Center, Image,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus, IconEdit, IconTrash, IconSearch, IconRefresh,
  IconPrinter, IconShirt, IconInfoCircle, IconUpload, IconPhoto, IconX,
} from '@tabler/icons-react';

interface FormData {
  designation: string;
  description: string;
  code_modele: string;
  image_url: string;
  categorie: 'femme' | 'homme' | 'enfant' | 'accessoire';
  est_actif: number;
}

const initialFormData: FormData = {
  designation: '',
  description: '',
  code_modele: '',
  image_url: '',
  categorie: 'femme',
  est_actif: 1
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const loadModeles = async () => {
    try {
      setLoading(true); setError(null);
      const data = await apiGet("/modeles-tenues");
      setModeles(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadModeles(); }, [filterCategorie]);

  const filteredModeles = useMemo(() => {
    return modeles.filter((m) => {
      const matchSearch = m.designation?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategorie = !filterCategorie || m.categorie === filterCategorie;
      return matchSearch && matchCategorie;
    });
  }, [modeles, searchTerm, filterCategorie]);

  const totalPages = Math.ceil(filteredModeles.length / itemsPerPage);
  const paginatedData = filteredModeles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Fonction d'impression
  const handlePrint = () => {
    const printContent = document.getElementById('print-content');
    if (printContent) {
      // Sauvegarder le contenu original
      const originalTitle = document.title;
      document.title = 'Liste des modèles de tenues';
      
      // Créer un iframe invisible pour l'impression
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      document.body.appendChild(iframe);
      
      // Écrire le contenu à imprimer
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Liste des modèles de tenues</title>
            <style>
              /* Styles d'impression */
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: Arial, Helvetica, sans-serif; 
                padding: 20px; 
                background: white; 
                color: black;
              }
              .print-header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #333;
              }
              .print-header h1 { margin-bottom: 10px; font-size: 24px; }
              .print-header p { color: #666; font-size: 14px; }
              .print-date { text-align: right; margin-bottom: 20px; font-size: 12px; color: #666; }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
              }
              th, td { 
                border: 1px solid #333; 
                padding: 8px; 
                text-align: left; 
                vertical-align: top;
              }
              th { 
                background: #f1f1f1; 
                font-weight: bold;
                font-size: 14px;
              }
              td { font-size: 12px; }
              .badge {
                display: inline-block;
                padding: 2px 8px;
                background: #f1f1f1;
                border-radius: 12px;
                font-size: 11px;
              }
              .badge-femme { background: #ffe0e0; color: #d63384; }
              .badge-homme { background: #e0e8ff; color: #0d6efd; }
              .badge-enfant { background: #e0ffe0; color: #198754; }
              .badge-accessoire { background: #f0e0ff; color: #6f42c1; }
              .badge-actif { background: #d4edda; color: #155724; }
              .badge-inactif { background: #f8d7da; color: #721c24; }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                text-align: center;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #ddd;
              }
              @page {
                size: A4;
                margin: 15mm;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
          </html>
        `);
        doc.close();
        
        // Imprimer
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Supprimer l'iframe après l'impression
        setTimeout(() => {
          document.body.removeChild(iframe);
          document.title = originalTitle;
        }, 100);
      }
    } else {
      // Fallback: imprimer toute la page
      window.print();
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingModele(null);
    setImagePreview(null);
  };

  const openAddModal = () => { resetForm(); openModal(); };

  const openEditModal = (modele: ModeleTenue) => {
    setEditingModele(modele);
    setFormData({
      designation: modele.designation,
      description: modele.description || '',
      code_modele: modele.code_modele || '',
      image_url: modele.image_url || '',
      categorie: modele.categorie,
      est_actif: modele.est_actif
    });
    setImagePreview(modele.image_url || null);
    openModal();
  };

  const openDeleteConfirm = (id: number, designation: string) => {
    setDeleteId(id); setDeleteDesignation(designation); openDeleteModal();
  };

  const closeDeleteModalHandler = () => { setDeleteId(null); setDeleteDesignation(''); closeDeleteModal(); };

  const handleCategorieChange = (value: string | null) => {
    if (!value) return;
    setFormData({
      ...formData,
      categorie: value as 'femme' | 'homme' | 'enfant' | 'accessoire'
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 2 Mo");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setFormData({ ...formData, image_url: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      if (editingModele) {
        await apiPut(`/modeles-tenues/${editingModele.id}`, {
          designation: formData.designation,
          description: formData.description,
          image_url: formData.image_url,
          categorie: formData.categorie,
          est_actif: formData.est_actif
        });
      } else {
        await apiPost("/modeles-tenues", {
          designation: formData.designation,
          description: formData.description,
          image_url: formData.image_url,
          categorie: formData.categorie,
          est_actif: formData.est_actif
        });
      }
      closeModal();
      resetForm();
      await loadModeles();
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
      await apiDelete(`/modeles-tenues/${deleteId}`);
      closeDeleteModalHandler();
      await loadModeles();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  // Composant du contenu à imprimer (caché à l'écran)
  const PrintContent = () => (
    <div id="print-content" style={{ display: 'none' }}>
      <div className="print-header">
        <h1>📋 Liste des modèles de tenues</h1>
        <p>Gestion des modèles de base pour vos créations</p>
      </div>
      <div className="print-date">
        Date d'impression : {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
      </div>
      {filterCategorie && (
        <div style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
          <strong>Filtre appliqué :</strong> Catégorie {filterCategorie === 'femme' ? 'Femme' : 
            filterCategorie === 'homme' ? 'Homme' : 
            filterCategorie === 'enfant' ? 'Enfant' : 'Accessoire'}
        </div>
      )}
      {searchTerm && (
        <div style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
          <strong>Recherche :</strong> {searchTerm}
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Désignation</th>
            <th>Code</th>
            <th>Catégorie</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {filteredModeles.map((modele, index) => (
            <tr key={modele.id}>
              <td>{index + 1}</td>
              <td>
                <strong>{modele.designation}</strong>
                {modele.description && (
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                    {modele.description}
                  </div>
                )}
              </td>
              <td>{modele.code_modele || '-'}</td>
              <td>
                <span className={`badge badge-${modele.categorie}`}>
                  {modele.categorie === 'femme' ? 'Femme' : 
                   modele.categorie === 'homme' ? 'Homme' : 
                   modele.categorie === 'enfant' ? 'Enfant' : 'Accessoire'}
                </span>
              </td>
              <td>
                <span className={`badge ${modele.est_actif === 1 ? 'badge-actif' : 'badge-inactif'}`}>
                  {modele.est_actif === 1 ? 'Actif' : 'Inactif'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="footer">
        <p>Total : {filteredModeles.length} modèle{filteredModeles.length > 1 ? 's' : ''}</p>
        <p>Logiciel de gestion de couture - Version 1.0</p>
      </div>
    </div>
  );

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
        {/* Contenu à imprimer (caché) */}
        <PrintContent />

        <Stack gap="lg">
          {/* Header */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconShirt size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Modèles de Tenues</Title>
                  <Text c="gray.3" size="sm">Gérez les modèles de base pour vos créations</Text>
                </Box>
              </Group>
              <Group>
                <Button 
                  variant="light" 
                  color="white" 
                  leftSection={<IconPrinter size={18} />} 
                  onClick={handlePrint} 
                  radius="md"
                >
                  Imprimer
                </Button>
                <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">
                  Instructions
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Contenu principal */}
          <Card withBorder radius="lg" shadow="sm">
            <Stack gap="md">
              <Group justify="space-between" align="flex-end">
                <Box>
                  <Title order={3} size="h4" c="#1b365d">Liste des modèles</Title>
                  <Text size="xs" c="dimmed">{filteredModeles.length} modèle{filteredModeles.length > 1 ? 's' : ''} trouvé{filteredModeles.length > 1 ? 's' : ''}</Text>
                </Box>
                <Group>
                  <Button leftSection={<IconPlus size={16} />} onClick={openAddModal} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }}>
                    Nouveau modèle
                  </Button>
                </Group>
              </Group>
              <Divider />
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
              {error && <Alert color="red" onClose={() => setError(null)} withCloseButton radius="md">{error}</Alert>}

              {filteredModeles.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" radius="md">
                  {searchTerm ? 'Aucun modèle ne correspond à votre recherche' : 'Aucun modèle enregistré.'}
                </Alert>
              ) : (
                <>
                  <ScrollArea style={{ maxHeight: 600 }} offsetScrollbars>
                    <Table striped highlightOnHover withColumnBorders style={{ fontSize: '13px' }}>
                      <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                        <Table.Tr>
                          <Table.Th style={{ color: 'white', fontSize: '13px', padding: '8px 6px', width: 60 }}>Image</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '13px', padding: '8px 6px' }}>Désignation</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '13px', padding: '8px 6px' }}>Code</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '13px', padding: '8px 6px' }}>Catégorie</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '13px', padding: '8px 6px' }}>Statut</Table.Th>
                          <Table.Th style={{ textAlign: 'center', color: 'white', fontSize: '13px', padding: '8px 6px' }}>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {paginatedData.map((modele) => (
                          <Table.Tr key={modele.id}>
                            <Table.Td style={{ padding: '6px' }}>
                              {modele.image_url ? (
                                <Image src={modele.image_url} w={50} h={50} radius="md" fit="cover" />
                              ) : (
                                <Center w={50} h={50} bg="gray.1" style={{ borderRadius: 8 }}>
                                  <IconPhoto size={24} color="gray" />
                                </Center>
                              )}
                            </Table.Td>
                            <Table.Td style={{ fontSize: '13px', padding: '6px' }}>
                              <Text size="sm" fw={500}>{modele.designation}</Text>
                              {modele.description && <Text size="xs" c="dimmed" lineClamp={1}>{modele.description}</Text>}
                            </Table.Td>
                            <Table.Td style={{ fontSize: '13px', padding: '6px', whiteSpace: 'nowrap' }}>
                              <Badge variant="light" color="gray" size="sm">{modele.code_modele}</Badge>
                            </Table.Td>
                            <Table.Td style={{ fontSize: '13px', padding: '6px', whiteSpace: 'nowrap' }}>
                              <Badge 
                                color={modele.categorie === 'femme' ? 'pink' : modele.categorie === 'homme' ? 'blue' : modele.categorie === 'enfant' ? 'green' : 'grape'} 
                                variant="light" 
                                size="sm"
                              >
                                {modele.categorie}
                              </Badge>
                            </Table.Td>
                            <Table.Td style={{ fontSize: '13px', padding: '6px', whiteSpace: 'nowrap' }}>
                              <Badge color={modele.est_actif === 1 ? 'green' : 'red'} variant="filled" size="sm">
                                {modele.est_actif === 1 ? 'Actif' : 'Inactif'}
                              </Badge>
                            </Table.Td>
                            <Table.Td style={{ padding: '6px' }}>
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

          {/* Modal formulaire */}
          <Modal opened={modalOpened} onClose={closeModal} title={editingModele ? 'Modifier le modèle' : 'Nouveau modèle de tenue'} size="lg" radius="md" padding="xl" centered>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <Stack gap="md">
                <TextInput 
                  label="Désignation" 
                  placeholder="Ex: Robe chemisier..." 
                  value={formData.designation} 
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })} 
                  required withAsterisk 
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
                  required withAsterisk 
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
                  placeholder="Description détaillée..." 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  rows={3} 
                  size="md" 
                  radius="md" 
                />

                <Stack gap={4}>
                  <Text size="sm" fw={500}>Image du modèle</Text>
                  {imagePreview ? (
                    <Box style={{ position: 'relative', width: 200 }}>
                      <Image src={imagePreview} w={200} h={150} radius="md" fit="cover" />
                      <ActionIcon color="red" variant="filled" size="sm" style={{ position: 'absolute', top: -8, right: -8 }} onClick={handleRemoveImage} radius="xl">
                        <IconX size={12} />
                      </ActionIcon>
                    </Box>
                  ) : (
                    <Box onClick={() => fileInputRef.current?.click()} style={{ width: 200, height: 150, border: '2px dashed #dee2e6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#f8f9fa' }}>
                      <Stack align="center" gap={4}>
                        <IconUpload size={24} color="#adb5bd" />
                        <Text size="xs" c="dimmed">Cliquer pour uploader</Text>
                      </Stack>
                    </Box>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  <Text size="xs" c="dimmed">PNG, JPG, JPEG • Max 2 Mo</Text>
                </Stack>

                <Switch 
                  label="Modèle actif" 
                  description="Les modèles inactifs ne seront pas visibles" 
                  checked={formData.est_actif === 1} 
                  onChange={(e) => setFormData({ ...formData, est_actif: e.currentTarget.checked ? 1 : 0 })} 
                  size="md" 
                />

                {error && <Alert color="red" onClose={() => setError(null)} withCloseButton radius="md">{error}</Alert>}

                <Divider my="sm" />
                <Group justify="flex-end" gap="md">
                  <Button variant="subtle" onClick={closeModal} size="md" radius="md" disabled={saving}>Annuler</Button>
                  <Button type="submit" color="blue" size="md" radius="md" loading={saving}>
                    {editingModele ? 'Enregistrer les modifications' : 'Créer le modèle'}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Modal>

          {/* Modal confirmation suppression */}
          <Modal opened={deleteModalOpened} onClose={closeDeleteModalHandler} title="Confirmation de suppression" size="sm" radius="md" padding="lg" centered>
            <Stack gap="md">
              <Alert color="red" variant="light">
                <Text size="md" fw={500}>Êtes-vous sûr de vouloir supprimer le modèle "{deleteDesignation}" ?</Text>
                <Text size="sm" mt={8}>Cette action est irréversible.</Text>
              </Alert>
              {error && <Alert color="red" onClose={() => setError(null)} withCloseButton radius="md">{error}</Alert>}
              <Group justify="flex-end" gap="md">
                <Button variant="subtle" onClick={closeDeleteModalHandler} size="md" radius="md" disabled={saving}>Annuler</Button>
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
              <Text size="sm">3️⃣ Le code modèle est généré automatiquement</Text>
              <Text size="sm">4️⃣ Ajoutez une image (upload direct)</Text>
              <Text size="sm">5️⃣ Activez ou désactivez selon vos besoins</Text>
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