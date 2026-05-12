// src/components/paiements/HistoriquePaiements.tsx
import React, { useState, useMemo } from 'react';
import {
    Stack,
    Card,
    Title,
    Text,
    Group,
    Button,
    Table,
    Badge,
    TextInput,
    ActionIcon,
    ScrollArea,
    LoadingOverlay,
    Modal,
    Pagination,
    Tooltip,
    Box,
    Container,
    Avatar,
    Center,
    Select,
    Paper,
    SimpleGrid,
    ThemeIcon,
    Tabs,
} from '@mantine/core';
import {
    IconCash,
    IconSearch,
    IconRefresh,
    IconEye,
    IconReceipt,
    IconCalendarStats,
    IconChartBar,
    IconDownload,
    IconFileExcel,
    IconPrinter,
    IconUsers,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { notifications } from '@mantine/notifications';


interface Paiement {
    id: number;
    vente_id: number;
    montant: number;
    mode_paiement: string;
    created_at: string;
    code_vente?: string;
    client_nom?: string;
    client_id?: number;
    restant?: number;
    total_vente?: number;
    statut?: string;
    vente_observation?: string;  // L'observation vient de la table ventes
    observation?: string;         // Optionnel pour compatibilité
}
interface ClientStats {
    client_id: number;
    client_nom: string;
    total_achats: number;
    total_paiements: number;
    reste_a_payer: number;
    nb_commandes: number;
    dernier_paiement: string;
}

const HistoriquePaiements: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedClient, setSelectedClient] = useState<number | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [clientDetails, setClientDetails] = useState<Paiement[]>([]);
    const [selectedClientName, setSelectedClientName] = useState('');
    const [exporting, setExporting] = useState(false);
    const itemsPerPage = 15;

    // Récupérer tous les paiements depuis la table paiements_ventes
    const {
        data: paiements = [],
        isLoading,
        refetch,
        dataUpdatedAt,
    } = useQuery<Paiement[]>({
        queryKey: ['paiements_historique'],
        queryFn: async () => {
            try {
                // Récupérer tous les paiements
                const data = await apiGet('/api/paiements-ventes');
                if (!data || data.length === 0) return [];

                // Enrichir avec les infos vente et client
                const enriched = await Promise.all(
                    data.map(async (p: Paiement) => {
                        try {
                            const vente = await apiGet(`/ventes/${p.vente_id}`);
                            return {
                                ...p,
                                code_vente: vente.code_vente,
                                client_nom: vente.client_nom || 'Client inconnu',
                                client_id: vente.client_id,
                                restant: (vente.montant_total || 0) - (vente.montant_regle || 0),
                                total_vente: vente.montant_total || 0,
                                statut: vente.statut
                            };
                        } catch {
                            return p;
                        }
                    })
                );

                // Trier par date décroissante
                return enriched.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            } catch (err) {
                console.error('Erreur chargement paiements:', err);
                notifications.show({
                    title: 'Erreur',
                    message: 'Impossible de charger l\'historique des paiements',
                    color: 'red'
                });
                return [];
            }
        },
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 2,
    });

    // Statistiques globales - Version corrigée
    const stats = useMemo(() => {
        // Vérifier que paiements existe et est un tableau
        if (!paiements || !Array.isArray(paiements) || paiements.length === 0) {
            return {
                total_encaisse: 0,
                paiements_jour: 0,
                paiements_semaine: 0,
                paiements_mois: 0,
                nb_paiements: 0,
                moyenne: 0,
                modes_paiement: {}
            };
        }

        // Convertir les montants en nombres (important !)
        const total_encaisse = paiements.reduce((sum, p) => {
            const montant = typeof p.montant === 'string' ? parseFloat(p.montant) : (p.montant || 0);
            return sum + (isNaN(montant) ? 0 : montant);
        }, 0);

        const aujourdhui = new Date().toDateString();
        const paiements_jour = paiements.filter(p => {
            const date = new Date(p.created_at);
            return date.toDateString() === aujourdhui;
        }).reduce((sum, p) => {
            const montant = typeof p.montant === 'string' ? parseFloat(p.montant) : (p.montant || 0);
            return sum + (isNaN(montant) ? 0 : montant);
        }, 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const paiements_semaine = paiements.filter(p => {
            const date = new Date(p.created_at);
            return date >= weekAgo;
        }).reduce((sum, p) => {
            const montant = typeof p.montant === 'string' ? parseFloat(p.montant) : (p.montant || 0);
            return sum + (isNaN(montant) ? 0 : montant);
        }, 0);

        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const paiements_mois = paiements.filter(p => {
            const date = new Date(p.created_at);
            return date >= monthAgo;
        }).reduce((sum, p) => {
            const montant = typeof p.montant === 'string' ? parseFloat(p.montant) : (p.montant || 0);
            return sum + (isNaN(montant) ? 0 : montant);
        }, 0);

        const moyenne = paiements.length > 0 ? total_encaisse / paiements.length : 0;

        // Modes de paiement
        const modes_paiement = paiements.reduce((acc, p) => {
            const mode = p.mode_paiement || 'Non spécifié';
            const montant = typeof p.montant === 'string' ? parseFloat(p.montant) : (p.montant || 0);
            acc[mode] = (acc[mode] || 0) + (isNaN(montant) ? 0 : montant);
            return acc;
        }, {} as Record<string, number>);

        return {
            total_encaisse,
            paiements_jour,
            paiements_semaine,
            paiements_mois,
            nb_paiements: paiements.length,
            moyenne,
            modes_paiement
        };
    }, [paiements]);
    // Statistiques par client
    const statsClients = useMemo(() => {
        const clientsMap = new Map<number, ClientStats>();

        paiements.forEach(p => {
            if (p.client_id && p.client_nom) {
                if (!clientsMap.has(p.client_id)) {
                    clientsMap.set(p.client_id, {
                        client_id: p.client_id,
                        client_nom: p.client_nom,
                        total_achats: p.total_vente || 0,
                        total_paiements: 0,
                        reste_a_payer: 0,
                        nb_commandes: 0,
                        dernier_paiement: p.created_at
                    });
                }
                const client = clientsMap.get(p.client_id)!;
                client.total_paiements += p.montant;
                if (new Date(p.created_at) > new Date(client.dernier_paiement)) {
                    client.dernier_paiement = p.created_at;
                }
                client.nb_commandes += 1;
                client.reste_a_payer = client.total_achats - client.total_paiements;
            }
        });

        // Trier par total payé décroissant
        return Array.from(clientsMap.values())
            .sort((a, b) => b.total_paiements - a.total_paiements);
    }, [paiements]);

    // Filtrer les paiements
    const filteredPaiements = useMemo(() => {
        let filtered = paiements;

        if (searchTerm) {
            filtered = filtered.filter(p =>
                (p.client_nom && p.client_nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.code_vente && p.code_vente.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.mode_paiement && p.mode_paiement.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedClient) {
            filtered = filtered.filter(p => p.client_id === selectedClient);
        }

        return filtered;
    }, [paiements, searchTerm, selectedClient]);

    const totalPages = Math.ceil(filteredPaiements.length / itemsPerPage);
    const paginatedData = filteredPaiements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const viewClientDetails = async (clientId: number, clientNom: string) => {
        setSelectedClientName(clientNom);
        const clientPaiements = paiements.filter(p => p.client_id === clientId);
        setClientDetails(clientPaiements);
        setDetailsModalOpen(true);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedClient(null);
        setCurrentPage(1);
    };

    const exportToExcel = async () => {
        setExporting(true);
        try {
            const data = filteredPaiements.map(p => ({
                'Date': new Date(p.created_at).toLocaleString('fr-FR'),
                'Commande': p.code_vente || '-',
                'Client': p.client_nom || '-',
                'Montant': `${p.montant.toLocaleString()} FCFA`,
                'Mode': p.mode_paiement,
                'Reste à payer': p.restant ? `${p.restant.toLocaleString()} FCFA` : '-',
                'Observation': p.observation || '-'
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Historique Paiements');
            XLSX.writeFile(wb, `paiements_${new Date().toISOString().split('T')[0]}.xlsx`);

            notifications.show({
                title: 'Export réussi',
                message: 'Le fichier Excel a été généré',
                color: 'green'
            });
        } catch (error) {
            notifications.show({ title: 'Erreur', message: 'Échec de l\'export', color: 'red' });
        } finally {
            setExporting(false);
        }
    };

    const exportToPDF = async () => {
        setExporting(true);
        try {
            const doc = new jsPDF('landscape', 'mm', 'a4');

            doc.setFillColor(27, 54, 93);
            doc.rect(0, 0, 297, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.text('HISTORIQUE DES PAIEMENTS', 148.5, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 148.5, 28, { align: 'center' });

            const head = [['Date', 'Commande', 'Client', 'Montant', 'Mode', 'Reste à payer']];
            const body = filteredPaiements.map(p => [
                new Date(p.created_at).toLocaleString('fr-FR'),
                p.code_vente || '-',
                p.client_nom || '-',
                `${p.montant.toLocaleString()} FCFA`,
                p.mode_paiement,
                p.restant ? `${p.restant.toLocaleString()} FCFA` : '-'
            ]);

            autoTable(doc, {
                head,
                body,
                startY: 40,
                theme: 'striped',
                headStyles: { fillColor: [27, 54, 93], textColor: 255 },
                styles: { fontSize: 8, cellPadding: 2 },
            });

            doc.save(`paiements_${new Date().toISOString().split('T')[0]}.pdf`);
            notifications.show({ title: 'Export réussi', message: 'PDF généré', color: 'green' });
        } catch (error) {
            notifications.show({ title: 'Erreur', message: 'Échec de l\'export', color: 'red' });
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const rows = paginatedData.map(p => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(p.created_at).toLocaleString('fr-FR')}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.code_vente || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.client_nom || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>${p.montant.toLocaleString()} FCFA</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.mode_paiement}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${p.restant ? p.restant.toLocaleString() + ' FCFA' : '-'}</td>
      </tr>
    `).join('');

        const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Historique des paiements</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #1b365d; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #1b365d; color: white; padding: 10px; border: 1px solid #2a4a7a; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          @media print { body { margin: 0; padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 HISTORIQUE DES PAIEMENTS</h1>
          <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
        </div>
        <p><strong>Total:</strong> ${filteredPaiements.length} paiements | <strong>Montant total:</strong> ${stats.total_encaisse.toLocaleString()} FCFA</p>
        <table>
          <thead><tr><th>Date</th><th>Commande</th><th>Client</th><th>Montant</th><th>Mode</th><th>Reste</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">Document généré automatiquement - ${new Date().toLocaleDateString('fr-FR')}</div>
      </body>
      </html>
    `;

        const doc = iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(printHtml);
            doc.close();
            iframe.onload = () => {
                iframe.contentWindow?.print();
                setTimeout(() => document.body.removeChild(iframe), 100);
            };
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    iframe.contentWindow?.print();
                    setTimeout(() => document.body.removeChild(iframe), 100);
                }
            }, 500);
        }
    };

    if (isLoading) {
        return (
            <Center style={{ height: '50vh' }}>
                <Card withBorder radius="lg" p="xl">
                    <LoadingOverlay visible={true} />
                    <Stack align="center" gap="md">
                        <IconCash size={40} stroke={1.5} />
                        <Text>Chargement de l'historique des paiements...</Text>
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
                        <Group justify="space-between">
                            <Group gap="md">
                                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                    <IconCash size={30} color="white" />
                                </Avatar>
                                <Box>
                                    <Title order={1} c="white" size="h2">Historique des paiements</Title>
                                    <Text c="gray.3" size="sm">Suivez toutes les transactions financières de vos clients</Text>
                                </Box>
                            </Group>
                            <Group>
                                <Tooltip label="Actualiser">
                                    <ActionIcon variant="light" color="white" onClick={() => refetch()} size="lg" radius="md">
                                        <IconRefresh size={18} />
                                    </ActionIcon>
                                </Tooltip>
                                <Badge size="lg" variant="white" color="blue">
                                    Dernière mise à jour: {new Date(dataUpdatedAt).toLocaleTimeString('fr-FR')}
                                </Badge>
                            </Group>
                        </Group>
                    </Card>

                    {/* Cartes statistiques */}
                    <SimpleGrid cols={{ base: 2, md: 5 }} spacing="md">
                        <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e3f2fd' }}>
                            <Group justify="space-between" mb="xs">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total encaissé</Text>
                                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                                    <IconCash size={18} />
                                </ThemeIcon>
                            </Group>
                            <Text fw={700} size="xl" c="blue">
                                {stats.total_encaisse.toLocaleString()} FCFA
                            </Text>
                            <Text size="xs" c="dimmed">{stats.nb_paiements} transaction(s)</Text>
                        </Paper>

                        <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e8f5e9' }}>
                            <Group justify="space-between" mb="xs">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Aujourd'hui</Text>
                                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                                    <IconCalendarStats size={18} />
                                </ThemeIcon>
                            </Group>
                            <Text fw={700} size="xl" c="green">
                                {stats.paiements_jour.toLocaleString()} FCFA
                            </Text>
                            <Text size="xs" c="dimmed">Paiements du jour</Text>
                        </Paper>

                        <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#fff3e0' }}>
                            <Group justify="space-between" mb="xs">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Cette semaine</Text>
                                <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                                    <IconChartBar size={18} />
                                </ThemeIcon>
                            </Group>
                            <Text fw={700} size="xl" c="orange">
                                {stats.paiements_semaine.toLocaleString()} FCFA
                            </Text>
                            <Text size="xs" c="dimmed">7 derniers jours</Text>
                        </Paper>

                        <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#f3e5f5' }}>
                            <Group justify="space-between" mb="xs">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ce mois</Text>
                                <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                                    <IconCalendarStats size={18} />
                                </ThemeIcon>
                            </Group>
                            <Text fw={700} size="xl" c="violet">
                                {stats.paiements_mois.toLocaleString()} FCFA
                            </Text>
                            <Text size="xs" c="dimmed">30 derniers jours</Text>
                        </Paper>

                        <Paper p="md" radius="lg" withBorder>
                            <Group justify="space-between" mb="xs">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Moyenne</Text>
                                <ThemeIcon size="lg" radius="md" color="gray" variant="light">
                                    <IconReceipt size={18} />
                                </ThemeIcon>
                            </Group>
                            <Text fw={700} size="xl">
                                {stats.moyenne.toLocaleString()} FCFA
                            </Text>
                            <Text size="xs" c="dimmed">Par transaction</Text>
                        </Paper>
                    </SimpleGrid>

                    {/* Tabs: Historique paiements / Classement clients */}
                    <Tabs defaultValue="historique" variant="outline" radius="md">
                        <Tabs.List>
                            <Tabs.Tab value="historique" leftSection={<IconCash size={16} />}>Historique des paiements</Tabs.Tab>
                            <Tabs.Tab value="clients" leftSection={<IconUsers size={16} />}>Classement clients</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="historique" pt="md">
                            <Card withBorder radius="lg" shadow="sm">
                                <Stack gap="md">
                                    <Group justify="space-between">
                                        <Group>
                                            <TextInput
                                                placeholder="Rechercher par client, commande, mode..."
                                                leftSection={<IconSearch size={16} />}
                                                value={searchTerm}
                                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                                style={{ width: 300 }}
                                                radius="md"
                                            />
                                            <Select
                                                placeholder="Filtrer par client"
                                                value={selectedClient?.toString() || null}
                                                onChange={(val) => setSelectedClient(val ? parseInt(val) : null)}
                                                clearable
                                                data={statsClients.map(c => ({ value: c.client_id.toString(), label: c.client_nom }))}
                                                radius="md"
                                                style={{ width: 250 }}
                                            />
                                            {(searchTerm || selectedClient) && (
                                                <Button variant="subtle" onClick={resetFilters} size="sm">
                                                    Réinitialiser
                                                </Button>
                                            )}
                                        </Group>
                                        <Group>
                                            <Button variant="outline" onClick={exportToExcel} loading={exporting} leftSection={<IconFileExcel size={16} />}>Excel</Button>
                                            <Button variant="outline" onClick={exportToPDF} loading={exporting} leftSection={<IconDownload size={16} />}>PDF</Button>
                                            <Button variant="outline" color="teal" onClick={handlePrint} leftSection={<IconPrinter size={16} />}>Imprimer</Button>
                                        </Group>
                                    </Group>

                                    <ScrollArea h={500} offsetScrollbars>
                                        <Table striped highlightOnHover>
                                            <Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0 }}>
                                                <Table.Tr>
                                                    <Table.Th style={{ color: 'white' }}>Date</Table.Th>
                                                    <Table.Th style={{ color: 'white' }}>Commande</Table.Th>
                                                    <Table.Th style={{ color: 'white' }}>Client</Table.Th>
                                                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Montant</Table.Th>
                                                    <Table.Th style={{ color: 'white' }}>Mode</Table.Th>
                                                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Reste à payer</Table.Th>
                                                    <Table.Th style={{ color: 'white', textAlign: 'center' }}>Actions</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {paginatedData.length === 0 ? (
                                                    <Table.Tr>
                                                        <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                                                            Aucun paiement trouvé
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ) : (
                                                    paginatedData.map((p) => (
                                                        <Table.Tr key={p.id}>
                                                            <Table.Td>{new Date(p.created_at).toLocaleString('fr-FR')}</Table.Td>
                                                            <Table.Td>
                                                                <Badge variant="light" color="blue">{p.code_vente || '-'}</Badge>
                                                            </Table.Td>
                                                            <Table.Td>{p.client_nom || '-'}</Table.Td>
                                                            <Table.Td style={{ textAlign: 'right' }}>
                                                                <Text fw={700} c="green">
                                                                    {Number(p.montant).toLocaleString()} FCFA
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Badge color="gray" variant="light">{p.mode_paiement}</Badge>
                                                            </Table.Td>
                                                            <Table.Td style={{ textAlign: 'right' }}>
                                                                {p.restant !== undefined && Number(p.restant) > 0 ? (
                                                                    <Text c="orange">{Number(p.restant).toLocaleString()} FCFA</Text>
                                                                ) : Number(p.restant) === 0 ? (
                                                                    <Text c="green">Soldé</Text>
                                                                ) : '-'}
                                                            </Table.Td>
                                                            <Table.Td style={{ textAlign: 'center' }}>
                                                                {p.client_id && (
                                                                    <Tooltip label="Voir historique client">
                                                                        <ActionIcon variant="subtle" color="blue" onClick={() => viewClientDetails(p.client_id!, p.client_nom!)}>
                                                                            <IconEye size={16} />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                )}
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    ))
                                                )}
                                            </Table.Tbody>
                                        </Table>
                                    </ScrollArea>

                                    {totalPages > 1 && (
                                        <Group justify="center" mt="md">
                                            <Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} color="#1b365d" />
                                        </Group>
                                    )}
                                </Stack>
                            </Card>
                        </Tabs.Panel>

                        <Tabs.Panel value="clients" pt="md">
                            <Card withBorder radius="lg" shadow="sm">
                                <Stack gap="md">
                                    <Text fw={600} size="lg">🏆 Classement des meilleurs clients</Text>
                                    <ScrollArea h={500}>
                                        <Table striped highlightOnHover>
                                            <Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0 }}>
                                                <Table.Tr>
                                                    <Table.Th style={{ color: 'white' }}>#</Table.Th>
                                                    <Table.Th style={{ color: 'white' }}>Client</Table.Th>
                                                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Total payé</Table.Th>
                                                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Total achats</Table.Th>
                                                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Reste à payer</Table.Th>
                                                    <Table.Th style={{ color: 'white', textAlign: 'center' }}>Nb commandes</Table.Th>
                                                    <Table.Th style={{ color: 'white' }}>Dernier paiement</Table.Th>
                                                    <Table.Th style={{ color: 'white', textAlign: 'center' }}>Actions</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {statsClients.length === 0 ? (
                                                    <Table.Tr>
                                                        <Table.Td colSpan={8} style={{ textAlign: 'center' }}>
                                                            Aucun client avec paiements
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ) : (
                                                    statsClients.map((client, index) => (
                                                        <Table.Tr key={client.client_id}>
                                                            <Table.Td>
                                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Group gap="xs">
                                                                    <Avatar size="sm" radius="xl" color="blue">
                                                                        {client.client_nom.charAt(0).toUpperCase()}
                                                                    </Avatar>
                                                                    <Text fw={500}>{client.client_nom}</Text>
                                                                </Group>
                                                            </Table.Td>
                                                            <Table.Td style={{ textAlign: 'right' }}>
                                                                <Text fw={700} c="green">{client.total_paiements.toLocaleString()} FCFA</Text>
                                                            </Table.Td>
                                                            <Table.Td style={{ textAlign: 'right' }}>
                                                                {client.total_achats.toLocaleString()} FCFA
                                                            </Table.Td>
                                                            <Table.Td style={{ textAlign: 'right' }}>
                                                                {client.reste_a_payer > 0 ? (
                                                                    <Text c="orange">{client.reste_a_payer.toLocaleString()} FCFA</Text>
                                                                ) : (
                                                                    <Text c="green">-</Text>
                                                                )}
                                                            </Table.Td>
                                                            <Table.Td style={{ textAlign: 'center' }}>
                                                                <Badge color="blue" variant="light">{client.nb_commandes}</Badge>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                {new Date(client.dernier_paiement).toLocaleDateString('fr-FR')}
                                                            </Table.Td>
                                                            <Table.Td style={{ textAlign: 'center' }}>
                                                                <Tooltip label="Voir historique">
                                                                    <ActionIcon variant="subtle" color="blue" onClick={() => viewClientDetails(client.client_id, client.client_nom)}>
                                                                        <IconEye size={16} />
                                                                    </ActionIcon>
                                                                </Tooltip>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    ))
                                                )}
                                            </Table.Tbody>
                                        </Table>
                                    </ScrollArea>
                                </Stack>
                            </Card>
                        </Tabs.Panel>
                    </Tabs>
                </Stack>
            </Container>

            {/* Modal détails client */}
            <Modal
                opened={detailsModalOpen}
                onClose={() => { setDetailsModalOpen(false); setClientDetails([]); }}
                title={`Historique des paiements - ${selectedClientName}`}
                size="lg"
                centered
                radius="md"
            >
                <Stack>
                    <Paper p="sm" withBorder bg="gray.0">
                        <Group justify="space-between">
                            <Text size="sm">
                                <strong>Total payé:</strong> {clientDetails.reduce((sum, p) => sum + p.montant, 0).toLocaleString()} FCFA
                            </Text>
                            <Badge size="lg" color="blue">
                                {clientDetails.length} paiement(s)
                            </Badge>
                        </Group>
                    </Paper>
                    <ScrollArea h={400}>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Date</Table.Th>
                                    <Table.Th>Commande</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>Montant</Table.Th>
                                    <Table.Th>Mode</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>Reste</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {clientDetails.map((p) => (
                                    <Table.Tr key={p.id}>
                                        <Table.Td>{new Date(p.created_at).toLocaleString('fr-FR')}</Table.Td>
                                        <Table.Td><Badge variant="light">{p.code_vente || '-'}</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}><Text fw={700} c="green">{p.montant.toLocaleString()} FCFA</Text></Table.Td>
                                        <Table.Td>{p.mode_paiement}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                            {p.restant !== undefined && p.restant > 0 ? (
                                                <Text c="orange">{p.restant.toLocaleString()} FCFA</Text>
                                            ) : '-'}
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Stack>
            </Modal>
        </Box>
    );
};

export default HistoriquePaiements;