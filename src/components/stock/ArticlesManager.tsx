// components/stock/ArticlesManager.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Stack, Card, Title, Text, Button, Group, Modal,
  TextInput, NumberInput, Textarea, Select, Switch, LoadingOverlay,
  Alert, Badge, ActionIcon, Tooltip, Divider, ScrollArea, Table,
  Pagination, Avatar, Center, Grid, Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus, IconEdit, IconTrash, IconSearch, IconRefresh,
  IconPackage, IconInfoCircle, IconPrinter, IconArrowUp, IconArrowDown,
  IconPackages, IconBarcode, IconMapPin,
  IconDownload, IconFileExcel, IconFile,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  ModeleTenue
} from '../../types/modeles-tenues';

import {
  Taille
} from '../../types/tailles';

import {
  Couleur
} from '../../types/couleurs';

import {
  Texture
} from '../../types/textures';

import {
  ArticleComplet
} from '../../types/articles';

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete
} from '../../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

interface FormData {
  modele_id: number; taille_id: number; couleur_id: number; texture_id: number | null;
  prix_achat: number | null; prix_vente: number; quantite_stock: number; seuil_alerte: number;
  emplacement: string; code_barre: string; notes: string; est_disponible: number; est_actif: number;
}

const initialFormData: FormData = {
  modele_id: 0, taille_id: 0, couleur_id: 0, texture_id: null,
  prix_achat: null, prix_vente: 0, quantite_stock: 0, seuil_alerte: 5,
  emplacement: '', code_barre: '', notes: '', est_disponible: 1, est_actif: 1,
};

const ArticlesManager: React.FC = () => {
  const [articles, setArticles] = useState<ArticleComplet[]>([]);
  const [modeles, setModeles] = useState<ModeleTenue[]>([]);
  const [tailles, setTailles] = useState<Taille[]>([]);
  const [couleurs, setCouleurs] = useState<Couleur[]>([]);
  const [textures, setTextures] = useState<Texture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<ArticleComplet | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [selectedArticle, setSelectedArticle] = useState<ArticleComplet | null>(null);
  const [stockQuantity, setStockQuantity] = useState<number>(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteDesignation, setDeleteDesignation] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({ modele_id: '', taille_id: '', couleur_id: '', texture_id: '', est_disponible: '' });
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [stockModalOpened, { open: openStockModal, close: closeStockModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [a, m, t, c, tx] =
        await Promise.all([
          apiGet("/articles"),
          apiGet("/modeles"),
          apiGet("/tailles"),
          apiGet("/couleurs"),
          apiGet("/textures")
        ]);
      setArticles(a); setModeles(m); setTailles(t); setCouleurs(c); setTextures(tx);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredArticles = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return articles.filter(a => (a.code_article || '').toLowerCase().includes(s) || (a.modele || '').toLowerCase().includes(s) || (a.taille || '').toLowerCase().includes(s) || (a.couleur || '').toLowerCase().includes(s) || (a.emplacement || '').toLowerCase().includes(s));
  }, [articles, searchTerm]);

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const paginatedData = filteredArticles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const applyFilters = async () => {

    let filtered = [...articles];

    if (filters.modele_id) {
      filtered =
        filtered.filter(
          a =>
            String(a.modele_id) ===
            filters.modele_id
        );
    }

    if (filters.taille_id) {
      filtered =
        filtered.filter(
          a =>
            String(a.taille_id) ===
            filters.taille_id
        );
    }

    if (filters.couleur_id) {
      filtered =
        filtered.filter(
          a =>
            String(a.couleur_id) ===
            filters.couleur_id
        );
    }

    if (filters.texture_id) {
      filtered =
        filtered.filter(
          a =>
            String(a.texture_id) ===
            filters.texture_id
        );
    }

    setArticles(filtered);
  };

  const resetFilters = () => { setFilters({ modele_id: '', taille_id: '', couleur_id: '', texture_id: '', est_disponible: '' }); loadData(); };
  const resetForm = () => { setFormData(initialFormData); setEditingArticle(null); };
  const openAddModal = () => { resetForm(); openModal(); };
  const openEditModal = (article: ArticleComplet) => {
    setEditingArticle(article);
    setFormData({ modele_id: article.modele_id, taille_id: article.taille_id, couleur_id: article.couleur_id, texture_id: article.texture_id, prix_achat: article.prix_achat, prix_vente: article.prix_vente, quantite_stock: article.quantite_stock, seuil_alerte: article.seuil_alerte, emplacement: article.emplacement || '', code_barre: article.code_barre || '', notes: article.notes || '', est_disponible: article.est_disponible, est_actif: 1 });
    openModal();
  };
  const handleOpenStockModal = (a: ArticleComplet, action: 'add' | 'remove') => { setSelectedArticle(a); setStockAction(action); setStockQuantity(1); openStockModal(); };
  const openDeleteConfirm = (id: number, d: string) => { setDeleteId(id); setDeleteDesignation(d); openDeleteModal(); };
  const closeDeleteModalHandler = () => { setDeleteId(null); setDeleteDesignation(''); closeDeleteModal(); };

  const handleSave = async () => {
    if (!formData.modele_id || !formData.taille_id || !formData.couleur_id) { setError('Modèle, taille et couleur requis'); return; }
    if (formData.prix_vente <= 0) { setError('Prix de vente > 0'); return; }
    setSaving(true); setError(null);
    try {
      if (editingArticle) await apiPut(
        `/articles/${editingArticle.id}`,
        formData
      );
      else await apiPost(
        "/articles",
        formData
      );
      closeModal(); await loadData(); resetForm();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleStockUpdate = async () => {
    if (!selectedArticle || stockQuantity <= 0) return;
    setSaving(true);
    try {
      await apiPut(
        `/articles/${selectedArticle.id}`,
        {
          ...selectedArticle,
          quantite_stock:
            stockAction === 'add'
              ? selectedArticle.quantite_stock + stockQuantity
              : selectedArticle.quantite_stock - stockQuantity
        }
      );
    }
    catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await apiDelete(
        `/articles/${deleteId}`
      ); closeDeleteModalHandler(); await loadData();
    }
    catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(p);

  const getStockStatus = (stock: number, seuil: number) => {
    if (stock <= 0) return { text: 'Rupture', color: 'red' as const };
    if (stock <= seuil) return { text: 'Stock faible', color: 'orange' as const };
    return { text: 'En stock', color: 'green' as const };
  };

  // ==================== EXPORTS ====================

  const handlePrint = () => {
    const div = document.getElementById('articles-print');
    if (!div) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Articles</title><style>
      body{font-family:Arial;padding:20px;margin:0}h1{color:#1b365d;text-align:center}
      table{width:100%;border-collapse:collapse;font-size:10px}
      th{background:#1b365d;color:#fff;padding:8px 6px;border:1px solid #ddd}
      td{padding:6px;border:1px solid #ddd}tr:nth-child(even){background:#f9f9f9}
      .footer{text-align:center;font-size:10px;color:#999;margin-top:20px}
      .no-print{display:none!important}
    </style></head><body>
      <h1>📦 Inventaire des Articles</h1>
      <p style="text-align:center;color:#666;font-size:12px">Imprimé le ${new Date().toLocaleString('fr-FR')} | ${filteredArticles.length} articles</p>
      ${div.innerHTML}
      <p class="footer">Gestion Couture © ${new Date().getFullYear()}</p>
    </body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const data = filteredArticles.map(a => ({
        'Code': a.code_article, 'Modèle': a.modele, 'Taille': a.taille, 'Couleur': a.couleur,
        'Stock': a.quantite_stock, 'Seuil': a.seuil_alerte,
        'Prix achat': a.prix_achat || 0, 'Prix vente': a.prix_vente, 'Emplacement': a.emplacement || ''
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Articles');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const path = await save({ filters: [{ name: 'Excel', extensions: ['xlsx'] }], defaultPath: `articles_${new Date().toISOString().split('T')[0]}.xlsx` });
      if (path) { await writeFile(path, new Uint8Array(buf)); notifications.show({ title: 'Succès', message: 'Export Excel réussi', color: 'green' }); }
    } catch (e) { console.error(e); notifications.show({ title: 'Erreur', message: 'Échec export Excel', color: 'red' }); }
    finally { setExporting(false); }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      doc.setFillColor(27, 54, 93); doc.rect(0, 0, 297, 25, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(16);
      doc.text('Inventaire des Articles', 148.5, 16, { align: 'center' });
      const head = [['Code', 'Modèle', 'Taille', 'Couleur', 'Stock', 'Prix vente', 'Emplacement']];
      const body = filteredArticles.map(a => [a.code_article, a.modele, a.taille, a.couleur, String(a.quantite_stock), formatPrice(a.prix_vente), a.emplacement || '']);
      autoTable(doc, { head, body, startY: 30, theme: 'striped', headStyles: { fillColor: [27, 54, 93] }, styles: { fontSize: 8, cellPadding: 2 }, margin: { left: 5, right: 5 } });
      const pdfBuf = doc.output('arraybuffer');
      const path = await save({ filters: [{ name: 'PDF', extensions: ['pdf'] }], defaultPath: `articles_${new Date().toISOString().split('T')[0]}.pdf` });
      if (path) { await writeFile(path, new Uint8Array(pdfBuf)); notifications.show({ title: 'Succès', message: 'Export PDF réussi', color: 'green' }); }
    } catch (e) { console.error(e); notifications.show({ title: 'Erreur', message: 'Échec export PDF', color: 'red' }); }
    finally { setExporting(false); }
  };

  if (loading && articles.length === 0) {
    return <Center style={{ height: '50vh' }}><LoadingOverlay visible /><Text>Chargement...</Text></Center>;
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}><IconPackages size={30} color="black" /></Avatar>
                <Box><Title order={1} c="white" size="h2">Gestion des Articles</Title><Text c="gray.3" size="sm">Inventaire de tenues</Text></Box>
              </Group>
              <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">Instructions</Button>
            </Group>
          </Card>

          <Card withBorder radius="lg" shadow="sm">
            <Stack gap="md">
              <Group justify="space-between">
                <Box><Title order={3} size="h4" c="#1b365d">Liste des articles</Title><Text size="xs" c="dimmed">{filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''}</Text></Box>
                <Group>
                  <Menu shadow="md" width={200}>
                    <Menu.Target><Button leftSection={<IconDownload size={16} />} variant="outline" loading={exporting}>Exporter</Button></Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconFileExcel size={16} color="green" />} onClick={exportToExcel}>Excel (.xlsx)</Menu.Item>
                      <Menu.Item leftSection={<IconFile size={16} color="red" />} onClick={exportToPDF}>PDF (.pdf)</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                  <Button leftSection={<IconPrinter size={16} />} onClick={handlePrint} variant="outline" color="teal">Imprimer</Button>
                  <Button leftSection={<IconPlus size={16} />} onClick={openAddModal} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }}>Nouvel article</Button>
                </Group>
              </Group>
              <Divider />
              <Group>
                <TextInput placeholder="Rechercher..." leftSection={<IconSearch size={16} />} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={{ flex: 1 }} radius="md" />
                <Tooltip label="Actualiser"><ActionIcon variant="light" onClick={loadData} size="xl" radius="md"><IconRefresh size={20} /></ActionIcon></Tooltip>
              </Group>
              <Card withBorder radius="md" p="sm" bg="gray.0">
                <Stack gap="xs">
                  <Group justify="space-between"><Text size="sm" fw={600}>Filtres</Text><Button variant="subtle" size="compact-sm" onClick={resetFilters}>Réinitialiser</Button></Group>
                  <Grid>
                    {['modele_id', 'taille_id', 'couleur_id', 'texture_id'].map(key => (
                      <Grid.Col key={key} span={{ base: 12, sm: 6, md: 2 }}>
                        <Select placeholder={key === 'modele_id' ? 'Modèle' : key === 'taille_id' ? 'Taille' : key === 'couleur_id' ? 'Couleur' : 'Texture'}
                          data={key === 'modele_id' ? modeles.map(m => ({ value: String(m.id), label: m.designation })) : key === 'taille_id' ? tailles.filter(t => t.est_actif === 1).map(t => ({ value: String(t.id), label: t.libelle })) : key === 'couleur_id' ? couleurs.filter(c => c.est_actif === 1).map(c => ({ value: String(c.id), label: c.nom_couleur })) : textures.filter(t => t.est_actif === 1).map(t => ({ value: String(t.id), label: t.nom_texture }))}
                          value={(filters as any)[key]} onChange={(v) => setFilters({ ...filters, [key]: v || '' })} clearable size="xs" />
                      </Grid.Col>
                    ))}
                    <Grid.Col span={{ base: 12, sm: 6, md: 2 }}><Select placeholder="Statut" data={[{ value: 'true', label: 'Disponible' }, { value: 'false', label: 'Indisponible' }]} value={filters.est_disponible} onChange={(v) => setFilters({ ...filters, est_disponible: v || '' })} clearable size="xs" /></Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 2 }}><Button onClick={applyFilters} size="xs" fullWidth>Appliquer</Button></Grid.Col>
                  </Grid>
                </Stack>
              </Card>
              {error && <Alert color="red" onClose={() => setError(null)} withCloseButton>{error}</Alert>}
              {filteredArticles.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">{searchTerm ? 'Aucun résultat' : 'Aucun article'}</Alert>
              ) : (
                <>
                  <div id="articles-print">
                    <ScrollArea style={{ maxHeight: 600 }} offsetScrollbars>
                      <Table striped highlightOnHover withColumnBorders style={{ fontSize: '13px' }}>
                        <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                          <Table.Tr>
                            {['Code', 'Modèle', 'Taille', 'Couleur', 'Stock', 'Prix vente', 'Statut', 'Actions'].map(h => <Table.Th key={h} style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600, textAlign: h === 'Actions' ? 'center' : 'left' }}>{h}</Table.Th>)}
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {paginatedData.map(article => {
                            const st = getStockStatus(article.quantite_stock, article.seuil_alerte);
                            const cc = couleurs.find(c => c.nom_couleur === article.couleur);
                            const mm = modeles.find(m => m.designation === article.modele);
                            return (
                              <Table.Tr key={article.id}>
                                <Table.Td><Text size="sm" fw={600}>{article.code_article}</Text></Table.Td>
                                <Table.Td><Text size="sm">{article.modele}{mm && <Text component="span" size="xs" c="dimmed" ml={4}>({mm.categorie})</Text>}</Text></Table.Td>
                                <Table.Td><Badge variant="light" color="gray" size="md">{article.taille}</Badge></Table.Td>
                                <Table.Td><Group gap={8}><Box w={18} h={18} style={{ backgroundColor: cc?.code_hex || '#ccc', borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)' }} /><Text size="sm">{article.couleur}</Text></Group></Table.Td>
                                <Table.Td><Group gap={8} justify="center"><Badge color={st.color} variant="filled" size="md">{st.text}</Badge><Text size="sm" fw={700}>{article.quantite_stock}</Text></Group></Table.Td>
                                <Table.Td><Text size="sm" c="green" fw={700}>{formatPrice(article.prix_vente)}</Text></Table.Td>
                                <Table.Td><Badge color={article.est_disponible === 1 ? 'green' : 'gray'} variant="light" size="md">{article.est_disponible === 1 ? 'Disponible' : 'Indisponible'}</Badge></Table.Td>
                                <Table.Td className="no-print">
                                  <Group gap={6} justify="center">
                                    <Tooltip label="+ Stock"><ActionIcon variant="subtle" color="green" size="md" onClick={() => handleOpenStockModal(article, 'add')}><IconArrowUp size={18} /></ActionIcon></Tooltip>
                                    <Tooltip label="- Stock"><ActionIcon variant="subtle" color="orange" size="md" onClick={() => handleOpenStockModal(article, 'remove')}><IconArrowDown size={18} /></ActionIcon></Tooltip>
                                    <Tooltip label="Modifier"><ActionIcon variant="subtle" color="blue" size="md" onClick={() => openEditModal(article)}><IconEdit size={18} /></ActionIcon></Tooltip>
                                    <Tooltip label="Supprimer"><ActionIcon variant="subtle" color="red" size="md" onClick={() => openDeleteConfirm(article.id, article.code_article)}><IconTrash size={18} /></ActionIcon></Tooltip>
                                  </Group>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  </div>
                  {totalPages > 1 && <Group justify="center" mt="md" className="no-print"><Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} color="#1b365d" /></Group>}
                </>
              )}
            </Stack>
          </Card>

          {/* Modal formulaire */}
          <Modal opened={modalOpened} onClose={closeModal} title={editingArticle ? "Modifier l'article" : "Nouvel article"} size="lg" radius="md" padding="xl" centered>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <Stack gap="md">
                <Select label="Modèle" data={modeles.map(m => ({ value: String(m.id), label: `${m.designation} (${m.categorie})` }))} value={String(formData.modele_id)} onChange={(v) => setFormData({ ...formData, modele_id: parseInt(v || '0') })} required withAsterisk size="md" radius="md" searchable />
                <Grid>
                  <Grid.Col span={6}><Select label="Taille" data={tailles.filter(t => t.est_actif === 1).map(t => ({ value: String(t.id), label: t.code_taille || t.libelle }))} value={String(formData.taille_id)} onChange={(v) => setFormData({ ...formData, taille_id: parseInt(v || '0') })} required withAsterisk size="md" radius="md" searchable /></Grid.Col>
                  <Grid.Col span={6}><Select label="Couleur" data={couleurs.filter(c => c.est_actif === 1).map(c => ({ value: String(c.id), label: c.nom_couleur }))} value={String(formData.couleur_id)} onChange={(v) => setFormData({ ...formData, couleur_id: parseInt(v || '0') })} required withAsterisk size="md" radius="md" searchable
                    renderOption={({ option }) => { const c = couleurs.find(x => String(x.id) === option.value); return <Group gap="sm"><Box w={20} h={20} style={{ backgroundColor: c?.code_hex || '#ccc', borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)' }} /><Text size="sm">{option.label}</Text></Group>; }}
                    leftSection={formData.couleur_id ? <Box w={18} h={18} style={{ backgroundColor: couleurs.find(x => x.id === formData.couleur_id)?.code_hex || '#ccc', borderRadius: '50%' }} /> : undefined} /></Grid.Col>
                </Grid>
                <Select label="Texture (optionnel)" data={textures.filter(t => t.est_actif === 1).map(t => ({ value: String(t.id), label: t.nom_texture }))} value={formData.texture_id ? String(formData.texture_id) : ''} onChange={(v) => setFormData({ ...formData, texture_id: v ? parseInt(v) : null })} clearable searchable size="md" radius="md" />
                <Grid>
                  <Grid.Col span={6}><NumberInput label="Prix d'achat (FCFA)" value={formData.prix_achat ?? ''} onChange={(v) => setFormData({ ...formData, prix_achat: typeof v === 'number' ? v : null })} size="md" radius="md" leftSection={<Text size="sm" fw={600}>FCFA</Text>} thousandSeparator=" " hideControls /></Grid.Col>
                  <Grid.Col span={6}><NumberInput label="Prix de vente (FCFA)" value={formData.prix_vente} onChange={(v) => setFormData({ ...formData, prix_vente: typeof v === 'number' ? v : 0 })} required withAsterisk size="md" radius="md" leftSection={<Text size="sm" fw={600}>FCFA</Text>} thousandSeparator=" " hideControls /></Grid.Col>
                </Grid>
                <Grid>
                  <Grid.Col span={6}><NumberInput label="Stock initial" value={formData.quantite_stock} onChange={(v) => setFormData({ ...formData, quantite_stock: typeof v === 'number' ? v : 0 })} size="md" radius="md" leftSection={<IconPackage size={16} />} hideControls /></Grid.Col>
                  <Grid.Col span={6}><NumberInput label="Seuil d'alerte" value={formData.seuil_alerte} onChange={(v) => setFormData({ ...formData, seuil_alerte: typeof v === 'number' ? v : 0 })} size="md" radius="md" hideControls /></Grid.Col>
                </Grid>
                <TextInput label="Emplacement" value={formData.emplacement} onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })} size="md" radius="md" leftSection={<IconMapPin size={16} />} />
                <TextInput label="Code barre" value={formData.code_barre} onChange={(e) => setFormData({ ...formData, code_barre: e.target.value })} size="md" radius="md" leftSection={<IconBarcode size={16} />} />
                <Textarea label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} size="md" radius="md" />
                <Switch label="Disponible à la vente" checked={formData.est_disponible === 1} onChange={(e) => setFormData({ ...formData, est_disponible: e.currentTarget.checked ? 1 : 0 })} size="md" />
                {error && <Alert color="red" onClose={() => setError(null)} withCloseButton>{error}</Alert>}
                <Divider />
                <Group justify="flex-end"><Button variant="subtle" onClick={closeModal} disabled={saving}>Annuler</Button><Button type="submit" color="blue" loading={saving}>{editingArticle ? 'Modifier' : 'Créer'}</Button></Group>
              </Stack>
            </form>
          </Modal>

          {/* Modal stock */}
          <Modal opened={stockModalOpened} onClose={closeStockModal} title={stockAction === 'add' ? 'Ajouter du stock' : 'Retirer du stock'} size="sm" centered>
            <Stack gap="md">
              {selectedArticle && <><Text>Article : <strong>{selectedArticle.code_article}</strong></Text><Text>Stock actuel : <strong>{selectedArticle.quantite_stock}</strong></Text></>}
              <NumberInput label="Quantité" value={stockQuantity} onChange={(v) => setStockQuantity(typeof v === 'number' ? Math.max(1, v) : 1)} min={1} />
              <Group justify="flex-end"><Button variant="subtle" onClick={closeStockModal} disabled={saving}>Annuler</Button><Button color={stockAction === 'add' ? 'green' : 'orange'} onClick={handleStockUpdate} loading={saving}>{stockAction === 'add' ? 'Ajouter' : 'Retirer'}</Button></Group>
            </Stack>
          </Modal>

          {/* Modal suppression */}
          <Modal opened={deleteModalOpened} onClose={closeDeleteModalHandler} title="Confirmation" size="sm" centered>
            <Stack gap="md">
              <Alert color="red" variant="light"><Text fw={500}>Supprimer "{deleteDesignation}" ?</Text><Text size="sm">Action irréversible.</Text></Alert>
              <Group justify="flex-end"><Button variant="subtle" onClick={closeDeleteModalHandler} disabled={saving}>Annuler</Button><Button color="red" onClick={handleDelete} loading={saving} leftSection={<IconTrash size={18} />}>Supprimer</Button></Group>
            </Stack>
          </Modal>

          {/* Modal instructions */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Instructions" size="md" centered>
            <Stack gap="md">
              <Text size="sm">1️⃣ Combinez modèle + taille + couleur</Text>
              <Text size="sm">2️⃣ Définissez le prix de vente</Text>
              <Text size="sm">3️⃣ Gérez le stock avec +/-</Text>
              <Text size="sm">4️⃣ Exportez en Excel ou PDF</Text>
              <Divider /><Text size="xs" c="dimmed" ta="center">Version 1.0.0</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
      <style>{`@media print{.no-print{display:none!important}}`}</style>
    </Box>
  );
};

export default ArticlesManager;