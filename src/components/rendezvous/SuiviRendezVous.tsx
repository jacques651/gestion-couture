// src/components/rendezvous/SuiviRendezVous.tsx
import { useState, useMemo } from 'react';
import {
    Stack,
    Card,
    Title,
    Text,
    Group,
    Button,
    Alert,
    Table,
    Badge,
    Divider,
    TextInput,
    ActionIcon,
    ScrollArea,
    LoadingOverlay,
    Modal,
    Pagination,
    Tooltip,
    Menu,
    Box,
    Container,
    Avatar,
    Center,
    Select,
} from '@mantine/core';
import {
    IconCalendarEvent,
    IconAlertCircle,
    IconCheck,
    IconX,
    IconSearch,
    IconDownload,
    IconFileExcel,
    IconFile,
    IconPrinter,
    IconInfoCircle,
    IconClock,
    IconUser,
    IconStatusChange,
} from '@tabler/icons-react';
import {
    apiGet,
    apiPut
} from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { journaliserAction } from "../../services/journal";

interface RendezVous {
    id: number;
    date_rendezvous: string;
    heure_rendezvous?: string;
    type_rendezvous: string;
    statut: string;
    nom_prenom: string;
    code_vente: string;
    client_id?: number;
    vente_id?: number;
}

export default function SuiviRendezVous() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [statutFilter, setStatutFilter] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'date_rendezvous' | 'nom_prenom' | 'statut'>('date_rendezvous');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [exporting, setExporting] = useState(false);
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
    const [newStatut, setNewStatut] = useState<string>('');

    const itemsPerPage = 10;

    const {
        data: rendezVous = [],
        isLoading,
        error,
        refetch,
        isError
    } = useQuery<RendezVous[]>({
        queryKey: ['rendezvous_suivi'],
        queryFn: async () => {

            try {

                const rows =
                    await apiGet(
                        '/rendezvous'
                    );

                return rows || [];

            } catch (err) {

                console.error(
                    "Erreur chargement rendez-vous:",
                    err
                );

                throw err;
            }
        },
        retry: 1,
        staleTime: 1000 * 60 * 5,
    });

    // Statistiques
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const stats = useMemo(() => ({
        today: rendezVous.filter(r => r.date_rendezvous === today).length,
        tomorrow: rendezVous.filter(r => r.date_rendezvous === tomorrow).length,
        delayed: rendezVous.filter(r => r.date_rendezvous < today && r.statut !== 'termine' && r.statut !== 'annule').length,
        completed: rendezVous.filter(r => r.statut === 'termine').length,
        planned: rendezVous.filter(r => r.statut === 'planifie').length,
        cancelled: rendezVous.filter(r => r.statut === 'annule').length,
        total: rendezVous.length
    }), [rendezVous, today, tomorrow]);

    const filteredAndSortedData = useMemo(() => {
        if (!rendezVous || rendezVous.length === 0) return [];

        let filtered = rendezVous.filter(r => {
            const matchesSearch =
                (r.nom_prenom && r.nom_prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.code_vente && r.code_vente.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatut = !statutFilter || r.statut === statutFilter;
            const matchesType = !typeFilter || r.type_rendezvous === typeFilter;

            return matchesSearch && matchesStatut && matchesType;
        });

        return [...filtered].sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'date_rendezvous') {
                comparison = (a.date_rendezvous || '').localeCompare(b.date_rendezvous || '');
                if (comparison === 0 && a.heure_rendezvous && b.heure_rendezvous) {
                    comparison = (a.heure_rendezvous || '').localeCompare(b.heure_rendezvous || '');
                }
            } else if (sortBy === 'nom_prenom') {
                comparison = (a.nom_prenom || '').localeCompare(b.nom_prenom || '');
            } else if (sortBy === 'statut') {
                comparison = (a.statut || '').localeCompare(b.statut || '');
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [rendezVous, searchTerm, statutFilter, typeFilter, sortBy, sortOrder]);

    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
    const paginatedData = filteredAndSortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const updateStatutMutation = useMutation({

  mutationFn: async (
    {
      id,
      statut
    }: {
      id: number;
      statut: string;
    }
  ) => {

    const rendezVousAvant =
      rendezVous.find(
        r => r.id === id
      );

    /**
     * API UPDATE
     */
    await apiPut(
      `/rendezvous/${id}/statut`,
      {
        statut
      }
    );

    /**
     * Journal
     */
    await journaliserAction({

      utilisateur:
        'Utilisateur',

      action:
        'UPDATE',

      table:
        'rendezvous_commandes',

      idEnregistrement:
        id.toString(),

      details:
        `Changement de statut: ${rendezVousAvant?.statut} → ${statut} pour le rendez-vous du ${rendezVousAvant?.date_rendezvous}`
    });
  },

  onSuccess: async () => {

    await queryClient.invalidateQueries({
      queryKey:
        ['rendezvous_suivi']
    });

    await refetch();

    setUpdateModalOpen(false);

    setSelectedRendezVous(null);
  },

  onError: (error) => {

    console.error(error);

    alert(
      "❌ Erreur lors de la mise à jour du statut"
    );
  }
});

    const handleSort = (column: 'date_rendezvous' | 'nom_prenom' | 'statut') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    };

    const openUpdateModal = (rdv: RendezVous) => {
        setSelectedRendezVous(rdv);
        setNewStatut(rdv.statut);
        setUpdateModalOpen(true);
    };

    const exportToExcel = async () => {
        try {
            setExporting(true);
            const data = filteredAndSortedData.map(rdv => ({
                'Date': new Date(rdv.date_rendezvous).toLocaleDateString('fr-FR'),
                'Heure': rdv.heure_rendezvous || '--:--',
                'Client': rdv.nom_prenom,
                'Commande': rdv.code_vente,
                'Type': rdv.type_rendezvous,
                'Statut': rdv.statut === 'planifie' ? 'Planifié' : rdv.statut === 'termine' ? 'Terminé' : 'Annulé'
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Rendez-vous');
            XLSX.writeFile(wb, `rendezvous_${new Date().toISOString().split('T')[0]}.xlsx`);
            alert('✅ Export Excel réussi !');
        } catch (error) {
            console.error('Erreur export Excel:', error);
            alert('❌ Erreur lors de l\'export');
        } finally {
            setExporting(false);
        }
    };

    const exportToPDF = async () => {
        try {
            setExporting(true);
            const doc = new jsPDF('landscape', 'mm', 'a4');

            doc.setFillColor(27, 54, 93);
            doc.rect(0, 0, 297, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text('SUIVI DES RENDEZ-VOUS', 148.5, 20, { align: 'center' });

            const head = ['N°', 'Date', 'Heure', 'Client', 'Commande', 'Type', 'Statut'];
            const body = filteredAndSortedData.map((rdv, idx) => [
                idx + 1,
                new Date(rdv.date_rendezvous).toLocaleDateString('fr-FR'),
                rdv.heure_rendezvous || '--:--',
                rdv.nom_prenom,
                rdv.code_vente,
                rdv.type_rendezvous,
                rdv.statut === 'planifie' ? 'Planifié' : rdv.statut === 'termine' ? 'Terminé' : 'Annulé'
            ]);

            autoTable(doc, {
                head: [head],
                body: body,
                startY: 40,
                theme: 'striped',
                headStyles: { fillColor: [27, 54, 93], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 2 },
                margin: { left: 5, right: 5 }
            });

            doc.save(`rendezvous_${new Date().toISOString().split('T')[0]}.pdf`);
            alert('✅ Export PDF réussi !');
        } catch (error) {
            console.error('Erreur export PDF:', error);
            alert('❌ Erreur lors de l\'export');
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => {
        // Créer un élément iframe invisible
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const rows = paginatedData.map((rdv, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${new Date(rdv.date_rendezvous).toLocaleDateString('fr-FR')}</td>
      <td>${rdv.heure_rendezvous || '--:--'}</td>
      <td><strong>${rdv.nom_prenom}</strong></td>
      <td>${rdv.code_vente}</td>
      <td>${rdv.type_rendezvous}</td>
      <td>${rdv.statut === 'planifie' ? 'Planifié' : rdv.statut === 'termine' ? 'Terminé' : 'Annulé'}</td>
    </tr>
  `).join('');

        const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Rendez-vous</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { color: #1b365d; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th { background: #1b365d; color: white; padding: 8px; border: 1px solid #ddd; }
          td { padding: 6px; border: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          @media print {
            body { margin: 0; padding: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>SUIVI DES RENDEZ-VOUS</h1>
        <p>Date d'édition: ${new Date().toLocaleDateString('fr-FR')}</p>
        <p>Total: ${paginatedData.length} rendez-vous</p>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Date</th>
              <th>Heure</th>
              <th>Client</th>
              <th>Commande</th>
              <th>Type</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;

        // Écrire le contenu dans l'iframe
        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(printContent);
            iframeDoc.close();

            // Attendre que le contenu soit chargé puis imprimer
            iframe.onload = () => {
                iframe.contentWindow?.print();
                // Supprimer l'iframe après l'impression
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 100);
            };

            // Si l'événement onload ne se déclenche pas, imprimer directement
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 100);
                }
            }, 500);
        }
    };

    const getStatutColor = (statut: string) => {
        switch (statut) {
            case 'planifie': return 'orange';
            case 'termine': return 'green';
            case 'annule': return 'red';
            default: return 'gray';
        }
    };

    const getStatutLabel = (statut: string) => {
        switch (statut) {
            case 'planifie': return 'Planifié';
            case 'termine': return 'Terminé';
            case 'annule': return 'Annulé';
            default: return statut;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'livraison': return '🚚';
            case 'installation': return '🔧';
            case 'devis': return '📄';
            case 'sav': return '🔨';
            default: return '📅';
        }
    };

    if (isLoading) {
        return (
            <Center style={{ height: '50vh' }}>
                <Card withBorder radius="lg" p="xl">
                    <LoadingOverlay visible={true} />
                    <Stack align="center" gap="md">
                        <IconCalendarEvent size={40} stroke={1.5} />
                        <Text>Chargement des rendez-vous...</Text>
                    </Stack>
                </Card>
            </Center>
        );
    }

    if (isError || error) {
        return (
            <Container size="xl" p="md">
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erreur de chargement" variant="filled">
                    <Stack>
                        <Text>Impossible de charger les rendez-vous</Text>
                        <Text size="sm">{error instanceof Error ? error.message : 'Erreur inconnue'}</Text>
                        <Button onClick={() => refetch()} variant="white" size="xs" mt="md">Réessayer</Button>
                    </Stack>
                </Alert>
            </Container>
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
                                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                    <IconCalendarEvent size={30} color="white" />
                                </Avatar>
                                <Box>
                                    <Title order={1} c="white" size="h2">Suivi des rendez-vous</Title>
                                    <Text c="gray.3" size="sm">Gérez et suivez tous vos rendez-vous clients</Text>
                                </Box>
                            </Group>
                            <Button
                                variant="light"
                                color="white"
                                leftSection={<IconInfoCircle size={18} />}
                                onClick={() => setInfoModalOpen(true)}
                                radius="md"
                            >
                                Instructions
                            </Button>
                        </Group>
                    </Card>

                    {/* Cartes statistiques */}
                    <Card withBorder radius="lg" shadow="sm" p="md">
                        <Group grow>
                            <Stack align="center" gap={4}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Aujourd'hui</Text>
                                <Text fw={700} size="32px" c="blue">{stats.today}</Text>
                                <Badge size="sm" color="blue" variant="light">RDV</Badge>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack align="center" gap={4}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Demain</Text>
                                <Text fw={700} size="32px" c="cyan">{stats.tomorrow}</Text>
                                <Badge size="sm" color="cyan" variant="light">À venir</Badge>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack align="center" gap={4}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>En retard</Text>
                                <Text fw={700} size="32px" c="red">{stats.delayed}</Text>
                                <Badge size="sm" color="red" variant="light">Urgent</Badge>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack align="center" gap={4}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Terminés</Text>
                                <Text fw={700} size="32px" c="green">{stats.completed}</Text>
                                <Badge size="sm" color="green" variant="light">Taux: {((stats.completed / stats.total) * 100 || 0).toFixed(0)}%</Badge>
                            </Stack>
                        </Group>
                    </Card>

                    {/* Contenu principal */}
                    <Card withBorder radius="lg" shadow="sm">
                        <Stack gap="md">
                            {/* Barre d'actions */}
                            <Group justify="space-between" align="flex-end">
                                <Box>
                                    <Title order={3} size="h4" c="#1b365d">Liste des rendez-vous</Title>
                                    <Text size="xs" c="dimmed">
                                        {filteredAndSortedData.length} rendez-vous trouvé{filteredAndSortedData.length > 1 ? 's' : ''}
                                    </Text>
                                </Box>
                                <Group>
                                    <Menu shadow="md" width={200}>
                                        <Menu.Target>
                                            <Button leftSection={<IconDownload size={16} />} variant="outline" loading={exporting}>
                                                Exporter
                                            </Button>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Label>Format d'export</Menu.Label>
                                            <Menu.Item leftSection={<IconFileExcel size={16} color="#00a84f" />} onClick={exportToExcel}>
                                                Excel (.xlsx)
                                            </Menu.Item>
                                            <Menu.Item leftSection={<IconFile size={16} color="#e74c3c" />} onClick={exportToPDF}>
                                                PDF (.pdf)
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                    <Button leftSection={<IconPrinter size={16} />} onClick={handlePrint} variant="outline" color="teal">
                                        Imprimer
                                    </Button>
                                </Group>
                            </Group>

                            <Divider />

                            {/* Filtres */}
                            <Group grow>
                                <TextInput
                                    placeholder="Rechercher par client ou commande..."
                                    leftSection={<IconSearch size={16} />}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    radius="md"
                                    size="md"
                                />
                                <Select
                                    placeholder="Filtrer par statut"
                                    value={statutFilter}
                                    onChange={(value) => { setStatutFilter(value); setCurrentPage(1); }}
                                    clearable
                                    data={[
                                        { value: 'planifie', label: '📅 Planifié' },
                                        { value: 'termine', label: '✅ Terminé' },
                                        { value: 'annule', label: '❌ Annulé' }
                                    ]}
                                    radius="md"
                                    size="md"
                                />
                                <Select
                                    placeholder="Filtrer par type"
                                    value={typeFilter}
                                    onChange={(value) => { setTypeFilter(value); setCurrentPage(1); }}
                                    clearable
                                    data={[
                                        { value: 'livraison', label: '🚚 Livraison' },
                                        { value: 'installation', label: '🔧 Installation' },
                                        { value: 'devis', label: '📄 Devis' },
                                        { value: 'sav', label: '🔨 SAV' }
                                    ]}
                                    radius="md"
                                    size="md"
                                />
                            </Group>

                            {/* Tableau */}
                            {filteredAndSortedData.length === 0 ? (
                                <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light" radius="md">
                                    Aucun rendez-vous trouvé.
                                </Alert>
                            ) : (
                                <>
                                    <ScrollArea style={{ maxHeight: 600 }} offsetScrollbars>
                                        <Table striped highlightOnHover withColumnBorders style={{ fontSize: '12px' }}>
                                            <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                                                <Table.Tr>
                                                    <Table.Th style={{ cursor: 'pointer', color: 'white', fontSize: '12px', padding: '8px 6px' }} onClick={() => handleSort('date_rendezvous')}>
                                                        <Group gap={4}>Date {sortBy === 'date_rendezvous' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}</Group>
                                                    </Table.Th>
                                                    <Table.Th style={{ color: 'white', fontSize: '12px', padding: '8px 6px' }}>Heure</Table.Th>
                                                    <Table.Th style={{ cursor: 'pointer', color: 'white', fontSize: '12px', padding: '8px 6px' }} onClick={() => handleSort('nom_prenom')}>
                                                        <Group gap={4}>Client {sortBy === 'nom_prenom' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}</Group>
                                                    </Table.Th>
                                                    <Table.Th style={{ color: 'white', fontSize: '12px', padding: '8px 6px' }}>Commande</Table.Th>
                                                    <Table.Th style={{ color: 'white', fontSize: '12px', padding: '8px 6px' }}>Type</Table.Th>
                                                    <Table.Th style={{ cursor: 'pointer', color: 'white', fontSize: '12px', padding: '8px 6px' }} onClick={() => handleSort('statut')}>
                                                        <Group gap={4}>Statut {sortBy === 'statut' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}</Group>
                                                    </Table.Th>
                                                    <Table.Th style={{ textAlign: 'center', color: 'white', fontSize: '12px', padding: '8px 4px' }}>Actions</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {paginatedData.map((rdv) => {
                                                    const isDelayed = rdv.date_rendezvous < today && rdv.statut !== 'termine' && rdv.statut !== 'annule';
                                                    return (
                                                        <Table.Tr key={rdv.id} style={isDelayed ? { backgroundColor: '#fff5f5' } : {}}>
                                                            <Table.Td style={{ fontSize: '12px', padding: '6px 6px', whiteSpace: 'nowrap' }}>
                                                                <Text size="sm" fw={500}>{new Date(rdv.date_rendezvous).toLocaleDateString('fr-FR')}</Text>
                                                            </Table.Td>
                                                            <Table.Td style={{ fontSize: '12px', padding: '6px 6px', whiteSpace: 'nowrap' }}>
                                                                <Group gap={4}>
                                                                    <IconClock size={12} />
                                                                    <Text size="sm">{rdv.heure_rendezvous || '--:--'}</Text>
                                                                </Group>
                                                            </Table.Td>
                                                            <Table.Td style={{ fontSize: '12px', padding: '6px 6px', whiteSpace: 'nowrap' }}>
                                                                <Group gap={4}>
                                                                    <IconUser size={12} />
                                                                    <Text size="sm" fw={500}>{rdv.nom_prenom}</Text>
                                                                </Group>
                                                            </Table.Td>
                                                            <Table.Td style={{ fontSize: '12px', padding: '6px 6px', whiteSpace: 'nowrap' }}>
                                                                <Badge color="gray" variant="light" size="sm">{rdv.code_vente}</Badge>
                                                            </Table.Td>
                                                            <Table.Td style={{ fontSize: '12px', padding: '6px 6px' }}>
                                                                <Badge color="blue" variant="light" size="sm" leftSection={getTypeIcon(rdv.type_rendezvous)}>
                                                                    {rdv.type_rendezvous}
                                                                </Badge>
                                                            </Table.Td>
                                                            <Table.Td style={{ fontSize: '12px', padding: '6px 6px' }}>
                                                                <Badge color={getStatutColor(rdv.statut)} variant="light" size="md">
                                                                    {getStatutLabel(rdv.statut)}
                                                                </Badge>
                                                                {isDelayed && (
                                                                    <Badge color="red" size="xs" ml={4}>⚠ Retard</Badge>
                                                                )}
                                                            </Table.Td>
                                                            <Table.Td style={{ padding: '6px 4px' }}>
                                                                <Group gap={4} justify="center" wrap="nowrap">
                                                                    <Tooltip label="Changer le statut">
                                                                        <ActionIcon variant="light" color="blue" size="sm" onClick={() => openUpdateModal(rdv)}>
                                                                            <IconStatusChange size={14} />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                    <Tooltip label="Terminer">
                                                                        <ActionIcon
                                                                            variant="light"
                                                                            color="green"
                                                                            size="sm"
                                                                            onClick={() => updateStatutMutation.mutate({ id: rdv.id, statut: 'termine' })}
                                                                        >
                                                                            <IconCheck size={14} />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                    <Tooltip label="Annuler">
                                                                        <ActionIcon
                                                                            variant="light"
                                                                            color="red"
                                                                            size="sm"
                                                                            onClick={() => updateStatutMutation.mutate({ id: rdv.id, statut: 'annule' })}
                                                                        >
                                                                            <IconX size={14} />
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
                                            <Pagination
                                                value={currentPage}
                                                onChange={setCurrentPage}
                                                total={totalPages}
                                                color="#1b365d"
                                            />
                                        </Group>
                                    )}
                                </>
                            )}
                        </Stack>
                    </Card>

                    {/* Modal mise à jour statut */}
                    <Modal opened={updateModalOpen} onClose={() => setUpdateModalOpen(false)} title="Modifier le statut" centered radius="md">
                        {selectedRendezVous && (
                            <Stack>
                                <Text size="sm">
                                    <strong>Client:</strong> {selectedRendezVous.nom_prenom}<br />
                                    <strong>Date:</strong> {new Date(selectedRendezVous.date_rendezvous).toLocaleDateString('fr-FR')}<br />
                                    <strong>Heure:</strong> {selectedRendezVous.heure_rendezvous || '--:--'}
                                </Text>
                                <Select
                                    label="Nouveau statut"
                                    value={newStatut}
                                    onChange={(value) => setNewStatut(value || 'planifie')}
                                    data={[
                                        { value: 'planifie', label: '📅 Planifié' },
                                        { value: 'termine', label: '✅ Terminé' },
                                        { value: 'annule', label: '❌ Annulé' }
                                    ]}
                                />
                                <Group justify="flex-end" mt="md">
                                    <Button variant="light" onClick={() => setUpdateModalOpen(false)}>Annuler</Button>
                                    <Button
                                        color="blue"
                                        onClick={() => updateStatutMutation.mutate({ id: selectedRendezVous.id, statut: newStatut })}
                                        loading={updateStatutMutation.isPending}
                                    >
                                        Enregistrer
                                    </Button>
                                </Group>
                            </Stack>
                        )}
                    </Modal>

                    {/* Modal instructions */}
                    <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Instructions" size="md" centered radius="md">
                        <Stack gap="md">
                            <Text size="sm">1️⃣ Visualisez tous les rendez-vous programmés</Text>
                            <Text size="sm">2️⃣ Utilisez les filtres pour affiner la liste</Text>
                            <Text size="sm">3️⃣ Cliquez sur ✅ pour marquer comme terminé</Text>
                            <Text size="sm">4️⃣ Cliquez sur ❌ pour annuler un rendez-vous</Text>
                            <Text size="sm">5️⃣ Les rendez-vous en retard sont surlignés en rouge</Text>
                            <Text size="sm">6️⃣ Exportez la liste au format Excel ou PDF</Text>
                            <Text size="sm">7️⃣ Utilisez la recherche pour trouver rapidement</Text>
                            <Divider />
                            <Text size="xs" c="dimmed" ta="center">Version 2.0.0 - Gestion Couture</Text>
                        </Stack>
                    </Modal>
                </Stack>
            </Container>
        </Box>
    );
}