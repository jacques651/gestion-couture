// src/components/clients/ListeClientsAvecMesures.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconRuler } from '@tabler/icons-react';
import { journaliserAction } from "../../services/journal";
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
} from '@mantine/core';
import {
  IconUsers,
  IconAlertCircle,
  IconEdit,
  IconTrash,
  IconPlus,
  IconSearch,
  IconDownload,
  IconDatabaseOff,
  IconFileExcel,
  IconFile,
  IconPrinter,
  IconInfoCircle,
  IconShoppingCart,
  IconFileImport,
  IconClock,
  IconRefresh,
} from '@tabler/icons-react';
import { apiGet, apiDelete } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import FormulaireClient from './FormulaireClient';
import ModalMesures from './ModalMesures';
import ImportClientsExcel from '../ImportClientsExcel';

// 🔥 Mapping des noms de mesures pour affichage lisible
const NOMS_AFFICHAGE: Record<string, string> = {
  'epaule': 'Epaule',
  'dos': 'Dos',
  'poitrine': 'Poitrine',
  'long_poitrine': 'Lg Poitrine',
  'taille': 'Taille',
  'long_taille': 'Lg Taille',
  'long_chemise': 'Lg Chemise',
  'manche': 'Manche',
  'tour_de_manche': 'T. Manche',
  'col': 'Col',
  'poignet': 'Poignet',
  'ceinture': 'Ceinture',
  'bassin': 'Bassin',
  'cuisse': 'Cuisse',
  'long_pantalon': 'Lg Pantalon',
  'bas': 'Bas',
  'long_bassin': 'Lg Bassin',
  'long_robe': 'Lg Robe',
  'epaule_droite': 'Epaule D',
  'epaule_gauche': 'Epaule G',
  'longueur_manche': 'Lg Manche',
  'tour_bras': 'T. Bras',
  'ba': 'Bas',
  'basin': 'Bassin',
  'centure': 'Ceinture',
  'centre': 'Ceinture',
};

interface Mesure {
  nom: string;
  valeur: string;
  unite: string;
}

interface Client {
  id?: number;
  telephone_id: string;
  nom_prenom: string;
  profil?: string;
  adresse?: string;
  email?: string;
  observations?: string;
  date_enregistrement?: string;
}

interface ClientAvecMesures extends Client {
  mesures: Mesure[];
}

export default function ListeClientsAvecMesures() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'nom_prenom' | 'telephone_id' | 'date_enregistrement'>('date_enregistrement');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [exporting, setExporting] = useState(false);
  const [vueForm, setVueForm] = useState(false);
  const [vueImport, setVueImport] = useState(false);
  const [clientEdit, setClientEdit] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientAvecMesures | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const itemsPerPage = 10;

  // 🔥 Requête avec refreshKey pour forcer le rechargement
  const {
    data: clientsAvecMesures = [],
    isLoading,
    error,
    refetch,
    isError
  } = useQuery<ClientAvecMesures[]>({
    queryKey: ['clients_avec_mesures', refreshKey],
    queryFn: async () => {
      try {
        const clients = await apiGet("/clients");
        if (!clients?.length) {
          return [];
        }
        return clients.map((client: any) => ({
          ...client,
          observations: client.observations || '',
          mesures: client.mesures || []
        }));
      } catch (err) {
        console.error("Erreur dans queryFn:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // 🔥 Force le rafraîchissement des données
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['clients_avec_mesures'] });
    refetch();
  };

  // 🔥 Récupérer tous les noms de mesures uniques
  const tousNomsMesures = useMemo(() => {
    const noms = new Set<string>();
    for (const client of clientsAvecMesures) {
      for (const mesure of client.mesures) {
        if (mesure.nom) noms.add(mesure.nom.trim());
      }
    }
    return Array.from(noms).sort();
  }, [clientsAvecMesures]);

  // 🔥 Filtrer et trier les données
  const filteredAndSortedData = useMemo(() => {
    if (!clientsAvecMesures || clientsAvecMesures.length === 0) return [];

    let filtered = clientsAvecMesures.filter(c =>
      (c.nom_prenom && c.nom_prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.telephone_id && c.telephone_id.includes(searchTerm))
    );

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nom_prenom') {
        comparison = (a.nom_prenom || '').localeCompare(b.nom_prenom || '');
      } else if (sortBy === 'telephone_id') {
        comparison = (a.telephone_id || '').localeCompare(b.telephone_id || '');
      } else if (sortBy === 'date_enregistrement') {
        const dateA = a.date_enregistrement ? new Date(a.date_enregistrement).getTime() : 0;
        const dateB = b.date_enregistrement ? new Date(b.date_enregistrement).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [clientsAvecMesures, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 🔥 Suppression
  const deleteMutation = useMutation({
    mutationFn: async (telephone_id: string) => {
      await apiDelete(`/clients/${telephone_id}`);
      await journaliserAction({
        utilisateur: 'Utilisateur',
        action: 'DELETE',
        table: 'clients',
        idEnregistrement: telephone_id,
        details: `Suppression client : ${telephone_id}`
      });
    },
    onSuccess: async () => {
      setDeleteId(null);
      forceRefresh();
      alert("✅ Client supprimé avec succès");
    },
    onError: (error) => {
      console.error(error);
      alert("❌ Erreur lors de la suppression");
    }
  });

  // 🔥 Vider la liste
  const viderListeMutation = useMutation({
    mutationFn: async () => {
      await apiDelete("/clients/mesures/all");
      await apiDelete("/clients/all");
      await journaliserAction({
        utilisateur: 'Utilisateur',
        action: 'DELETE',
        table: 'clients',
        idEnregistrement: 'ALL',
        details: 'Vidage complet de la liste des clients et mesures'
      });
    },
    onSuccess: () => {
      forceRefresh();
      alert("✅ Liste des clients vidée avec succès");
    },
    onError: (error) => {
      console.error(error);
      alert("❌ Erreur lors du vidage");
    }
  });

  // 🔥 Ouvrir les détails des mesures

  const handleVoir = async (client: ClientAvecMesures) => {
  try {
    console.log('📏 Client sélectionné:', client.nom_prenom);
    console.log('📏 telephone_id:', client.telephone_id);
    
    // 🔥 Utiliser la route /details/
    const url = `/api/clients/details/${encodeURIComponent(client.telephone_id)}`;
    console.log('📏 URL appelée:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API:', response.status, errorText);
      throw new Error(`Erreur API: ${response.status}`);
    }
    
    const clientFrais = await response.json();
    console.log('📏 Mesures fraîches API:', clientFrais.mesures);
    
    setSelectedClient({
      ...client,
      mesures: clientFrais.mesures || []
    });
    setShowModal(true);
  } catch (error) {
    console.error('❌ Erreur chargement client:', error);
    // Fallback: utiliser les données du tableau
    setSelectedClient(client);
    setShowModal(true);
  }
};

  const handleModifier = (client: Client) => {
    const clientData = {
      id: client.id,
      telephone_id: client.telephone_id,
      nom_prenom: client.nom_prenom,
      profil: client.profil || 'principal',
      adresse: client.adresse || '',
      email: client.email || '',
      observations: client.observations || '',
    };
    setClientEdit(clientData);
    setVueForm(true);
  };

  const handleSupprimer = (id: string) => setDeleteId(id);
  const handleCreateVente = (client: Client) => {
    navigate(`/ventes?client_id=${client.telephone_id}&client_nom=${encodeURIComponent(client.nom_prenom)}`);
  };

  const handleSort = (column: 'nom_prenom' | 'telephone_id' | 'date_enregistrement') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'date_enregistrement' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  // 🔥 Export Excel
  const exportToExcel = async () => {
    try {
      setExporting(true);
      const data = filteredAndSortedData.map(client => {
        const mesuresMap = new Map(client.mesures.map(m => [m.nom.trim(), `${m.valeur} ${m.unite || 'cm'}`]));
        const row: any = {
          'Téléphone': client.telephone_id,
          'Nom complet': client.nom_prenom,
          'Adresse': client.adresse || '',
          'Email': client.email || '',
          'Observations': client.observations || '',
          'Date enregistrement': client.date_enregistrement || '',
        };
        for (const nom of tousNomsMesures) {
          row[nom] = mesuresMap.get(nom) || '';
        }
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');
      XLSX.writeFile(wb, `clients_${new Date().toISOString().split('T')[0]}.xlsx`);
      alert('✅ Export Excel réussi !');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('❌ Erreur lors de l\'export');
    } finally { setExporting(false); }
  };

  // 🔥 Export PDF
  const exportToPDF = async () => {
    try {
      setExporting(true);
      const doc = new jsPDF('landscape', 'mm', 'a4');
      doc.setFillColor(27, 54, 93);
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('LISTE DES CLIENTS AVEC MESURES', 148.5, 20, { align: 'center' });

      const head = ['N°', 'Téléphone', 'Nom', 'Adresse', 'Observations', 'Date', ...tousNomsMesures];
      const body = filteredAndSortedData.map((client, idx) => {
        const mesuresMap = new Map(client.mesures.map(m => [m.nom.trim(), `${m.valeur} ${m.unite || 'cm'}`]));
        const dateFormatted = client.date_enregistrement
          ? new Date(client.date_enregistrement).toLocaleDateString('fr-FR')
          : '';
        const ligne = [idx + 1, client.telephone_id, client.nom_prenom, client.adresse || '', (client.observations || '').substring(0, 50), dateFormatted];
        for (const nom of tousNomsMesures) {
          ligne.push(mesuresMap.get(nom) || '');
        }
        return ligne;
      });

      autoTable(doc, {
        head: [head],
        body: body,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [27, 54, 93], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 5, right: 5 }
      });

      doc.save(`clients_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('✅ Export PDF réussi !');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('❌ Erreur lors de l\'export');
    } finally { setExporting(false); }
  };

  // 🔥 Impression
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert("Veuillez autoriser les popups"); return; }

    const rows = filteredAndSortedData.map((client, idx) => {
      const mesuresMap = new Map(client.mesures.map(m => [m.nom.trim(), `${m.valeur} ${m.unite || 'cm'}`]));
      const dateFormatted = client.date_enregistrement
        ? new Date(client.date_enregistrement).toLocaleDateString('fr-FR')
        : '';
      return `<tr>
        <td>${idx + 1}</td>
        <td>${client.telephone_id}</td>
        <td><strong>${client.nom_prenom}</strong></td>
        <td>${client.observations || '-'}</td>
        <td>${dateFormatted}</td>
        ${tousNomsMesures.map(nom => `<td>${mesuresMap.get(nom) || '-'}</td>`).join('')}
      </tr>`;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Clients</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        h1 { color: #1b365d; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
        th { background: #1b365d; color: white; padding: 8px; border: 1px solid #ddd; }
        td { padding: 6px; border: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
      </style></head><body>
      <h1>LISTE DES CLIENTS AVEC MESURES</h1>
      <table><thead><tr><th>N°</th><th>Tél</th><th>Nom</th><th>Obs.</th><th>Date</th>${tousNomsMesures.map(n => `<th>${n}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody></table>
      <script>window.onload=()=>{window.print();window.close()}</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  if (vueImport) {
    return <ImportClientsExcel />;
  }

  if (vueForm) {
    return (
      <FormulaireClient
        clientEdit={clientEdit || undefined}
        onBack={() => {
          setVueForm(false);
          setClientEdit(null);
        }}
        onSuccess={(clientId, clientNom) => {
          setVueForm(false);
          setClientEdit(null);
          forceRefresh();
          if (clientId && clientNom) {
            const confirmed = globalThis.confirm(
              'Client créé/modifié avec succès ! Voulez-vous créer une vente pour ce client ?'
            );
            if (confirmed) {
              navigate(`/ventes?client_id=${clientId}&client_nom=${encodeURIComponent(clientNom)}`);
            }
          }
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconUsers size={40} stroke={1.5} />
            <Text>Chargement des clients...</Text>
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
            <Text>Impossible de charger les clients</Text>
            <Text size="sm">{error instanceof Error ? error.message : 'Erreur inconnue'}</Text>
            <Button onClick={() => forceRefresh()} variant="white" size="xs" mt="md">Réessayer</Button>
          </Stack>
        </Alert>
      </Container>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(19, 65, 134, 0.2)' }}>
                  <IconUsers size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Clients avec mesures</Title>
                  <Text c="gray.3" size="sm">Gérez les informations des clients et leurs mesures personnalisées</Text>
                </Box>
              </Group>
              <Group>
                <Button
                  variant="light"
                  color="white"
                  leftSection={<IconRefresh size={18} />}
                  onClick={forceRefresh}
                  radius="md"
                >
                  Rafraîchir
                </Button>
                <Button
                  variant="light"
                  color="white"
                  leftSection={<IconFileImport size={18} />}
                  onClick={() => setVueImport(true)}
                  radius="md"
                >
                  Importer Excel
                </Button>
                <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">
                  Instructions
                </Button>
              </Group>
            </Group>
          </Card>

          <Card withBorder radius="lg" shadow="sm">
            <Stack gap="md">
              <Group justify="space-between" align="flex-end">
                <Box>
                  <Title order={3} size="h4" c="#1b365d">Liste des clients</Title>
                  <Text size="xs" c="dimmed">
                    {filteredAndSortedData.length} client{filteredAndSortedData.length > 1 ? 's' : ''} trouvé{filteredAndSortedData.length > 1 ? 's' : ''}
                    {sortBy === 'date_enregistrement' && (
                      <Text component="span" size="xs" c="dimmed" ml="xs">
                        (triés du plus récent au plus ancien)
                      </Text>
                    )}
                  </Text>
                </Box>
                <Group>
                  <Button
                    leftSection={<IconFileImport size={16} />}
                    variant="outline"
                    color="green"
                    onClick={() => setVueImport(true)}
                  >
                    Importer
                  </Button>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <Button leftSection={<IconDownload size={16} />} variant="outline" loading={exporting}>Exporter</Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Format d'export</Menu.Label>
                      <Menu.Item leftSection={<IconFileExcel size={16} color="#00a84f" />} onClick={exportToExcel}>Excel (.xlsx)</Menu.Item>
                      <Menu.Item leftSection={<IconFile size={16} color="#e74c3c" />} onClick={exportToPDF}>PDF (.pdf)</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                  <Button leftSection={<IconPrinter size={16} />} onClick={handlePrint} variant="outline" color="teal">Imprimer</Button>
                  <Button
                    leftSection={<IconDatabaseOff size={16} />}
                    color="red"
                    variant="light"
                    onClick={() => {
                      const confirmDelete = confirm(
                        "Voulez-vous vraiment vider toute la liste des clients et mesures ?"
                      );
                      if (confirmDelete) {
                        viderListeMutation.mutate();
                      }
                    }}
                    loading={viderListeMutation.isPending}
                  >
                    Vider la liste
                  </Button>
                  <Button leftSection={<IconPlus size={16} />} onClick={() => { setClientEdit(null); setVueForm(true); }} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }}>Ajouter un client</Button>
                </Group>
              </Group>

              <Divider />

              <TextInput
                placeholder="Rechercher par nom ou téléphone..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                radius="md"
                size="md"
              />

              {filteredAndSortedData.length === 0 ? (
                <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light" radius="md">
                  Aucun client trouvé. Cliquez sur "Ajouter" pour commencer.
                </Alert>
              ) : (
                <>
                  <ScrollArea style={{ maxHeight: 600 }} offsetScrollbars>
                    <Table striped highlightOnHover withColumnBorders style={{ fontSize: '12px' }}>
                      <Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0, zIndex: 10 }}>
                        <Table.Tr>
                          <Table.Th style={{ color: 'white', fontSize: '12px', padding: '8px 6px', width: 70 }}>Profil</Table.Th>
                          <Table.Th
                            style={{ cursor: 'pointer', color: 'white', fontSize: '12px', padding: '8px 8px', whiteSpace: 'nowrap', minWidth: 140 }}
                            onClick={() => handleSort('nom_prenom')}
                          >
                            <Group gap={4}>
                              Nom
                              {sortBy === 'nom_prenom' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}
                            </Group>
                          </Table.Th>
                          <Table.Th
                            style={{ cursor: 'pointer', color: 'white', fontSize: '12px', padding: '8px 8px', whiteSpace: 'nowrap', minWidth: 110 }}
                            onClick={() => handleSort('telephone_id')}
                          >
                            <Group gap={4}>
                              Téléphone
                              {sortBy === 'telephone_id' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}
                            </Group>
                          </Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '12px', padding: '8px 8px', minWidth: 100 }}>Obs.</Table.Th>
                          <Table.Th
                            style={{ cursor: 'pointer', color: 'white', fontSize: '12px', padding: '8px 8px', minWidth: 100 }}
                            onClick={() => handleSort('date_enregistrement')}
                          >
                            <Group gap={4}>
                              <IconClock size={14} />
                              Date
                              {sortBy === 'date_enregistrement' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}
                            </Group>
                          </Table.Th>

                          {/* 🔥 Colonnes des mesures avec affichage lisible */}
                          {tousNomsMesures.map(nom => {
                            const nomAffichage = NOMS_AFFICHAGE[nom.toLowerCase()] || nom;
                            return (
                              <Table.Th
                                key={nom}
                                style={{
                                  color: 'white',
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  padding: '8px 2px',
                                  whiteSpace: 'nowrap',
                                  textAlign: 'center',
                                  minWidth: 35,
                                  maxWidth: 50,
                                  cursor: 'default'
                                }}
                                title={nom}
                              >
                                {nomAffichage}
                              </Table.Th>
                            );
                          })}

                          <Table.Th style={{ textAlign: 'center', color: 'white', fontSize: '12px', padding: '8px 8px', width: 150, minWidth: 150 }}>
                            Actions
                          </Table.Th>
                        </Table.Tr>
                      </Table.Thead>

                      <Table.Tbody>
                        {paginatedData.map((client) => {
                          // 🔥 Construire un Map des mesures par nom (insensible à la casse)
                          const mesuresMap = new Map();
                          client.mesures.forEach(m => {
                            mesuresMap.set(m.nom.trim().toLowerCase(), m.valeur);
                          });

                          const profilColor =
                            client.profil === 'principal' ? 'blue' :
                              client.profil === 'enfant' ? 'pink' :
                                client.profil === 'conjoint' ? 'violet' :
                                  client.profil === 'parent' ? 'orange' : 'gray';

                          const profilLabel =
                            client.profil === 'principal' ? 'Moi' :
                              client.profil === 'enfant' ? 'Enfant' :
                                client.profil === 'conjoint' ? 'Conjoint' :
                                  client.profil === 'parent' ? 'Parent' : 'Autre';

                          const dateFormatted = client.date_enregistrement
                            ? new Date(client.date_enregistrement).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                            : '-';

                          return (
                            <Table.Tr key={client.id || client.telephone_id}>
                              <Table.Td style={{ padding: '6px 4px', textAlign: 'center' }}>
                                <Badge size="sm" color={profilColor} variant="light">
                                  {profilLabel}
                                </Badge>
                              </Table.Td>
                              <Table.Td style={{ fontSize: '12px', padding: '6px 8px', whiteSpace: 'nowrap' }}>
                                <Text size="sm" fw={500} lineClamp={1}>{client.nom_prenom}</Text>
                              </Table.Td>
                              <Table.Td style={{ fontSize: '12px', padding: '6px 8px', whiteSpace: 'nowrap' }}>
                                <Badge color="gray" variant="light" size="sm">{client.telephone_id}</Badge>
                              </Table.Td>
                              <Table.Td style={{ fontSize: '12px', padding: '6px 8px', maxWidth: '150px' }}>
                                <Text size="xs" lineClamp={1} title={client.observations || ''}>
                                  {client.observations?.substring(0, 30) || '-'}
                                </Text>
                              </Table.Td>
                              <Table.Td style={{ fontSize: '11px', padding: '6px 8px', whiteSpace: 'nowrap' }}>
                                <Text size="xs" c="dimmed">
                                  {dateFormatted}
                                </Text>
                              </Table.Td>

                              {/* 🔥 Cellules des mesures avec les bonnes valeurs */}
                              {tousNomsMesures.map(nom => {
                                const valeur = mesuresMap.get(nom.toLowerCase()) || '-';
                                return (
                                  <Table.Td
                                    key={nom}
                                    style={{
                                      fontSize: '10px',
                                      padding: '4px 2px',
                                      whiteSpace: 'nowrap',
                                      textAlign: 'center',
                                      minWidth: 35,
                                      maxWidth: 50,
                                    }}
                                    title={`${nom}: ${valeur}`}
                                  >
                                    <Text size="xs" ta="center" c={valeur !== '-' ? 'dark' : 'dimmed'} fw={valeur !== '-' ? 600 : 400}>
                                      {valeur}
                                    </Text>
                                  </Table.Td>
                                );
                              })}

                              <Table.Td style={{ padding: '6px 4px' }}>
                                <Group gap={4} justify="center" wrap="nowrap">
                                  <Tooltip label="Détails des mesures">
                                    <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleVoir(client)}>
                                      <IconRuler size={14} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Nouvelle vente">
                                    <ActionIcon variant="light" color="green" size="sm" onClick={() => handleCreateVente(client)}>
                                      <IconShoppingCart size={14} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Modifier le client">
                                    <ActionIcon variant="light" color="yellow" size="sm" onClick={() => handleModifier(client)}>
                                      <IconEdit size={14} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Supprimer">
                                    <ActionIcon variant="light" color="red" size="sm" onClick={() => handleSupprimer(client.telephone_id)}>
                                      <IconTrash size={14} />
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

          {/* 🔥 Modal de suppression */}
          <Modal opened={deleteId !== null} onClose={() => setDeleteId(null)} title="Confirmation" centered radius="md">
            <Stack>
              <Text>Êtes-vous sûr de vouloir supprimer ce client ?</Text>
              <Text size="sm" c="dimmed">Cette action est irréversible.</Text>
              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={() => setDeleteId(null)}>Annuler</Button>
                <Button color="red" onClick={() => {
                  if (!deleteId) return;
                  deleteMutation.mutate(deleteId);
                }} loading={deleteMutation.isPending}>Supprimer</Button>
              </Group>
            </Stack>
          </Modal>

          {/* 🔥 Modal des mesures - CORRIGÉE */}
          {showModal && selectedClient && (
            <ModalMesures
              client={{
                nom_prenom: selectedClient.nom_prenom,
                telephone_id: selectedClient.telephone_id,
                observations: selectedClient.observations || '',
              }}
              mesures={selectedClient.mesures.map((m: any) => ({
                nom: m.nom,
                // ✅ Conserver la valeur BRUTE : les valeurs multiples ("35/44", "23/42/57")
                // ne doivent JAMAIS passer par parseFloat qui tronque au premier nombre
                valeur: m.valeur ?? '',
                unite: m.unite || 'cm'
              }))}
              onClose={() => {
                setShowModal(false);
                forceRefresh();
              }}
            />
          )}

          {/* 🔥 Modal instructions */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Instructions" size="md" centered radius="md">
            <Stack gap="md">
              <Text size="sm">1️⃣ Renseignez les informations personnelles du client</Text>
              <Text size="sm">2️⃣ Ajoutez les mesures du client dans l'onglet dédié</Text>
              <Text size="sm">3️⃣ Les observations sont optionnelles mais utiles</Text>
              <Text size="sm">4️⃣ Exportez la liste au format Excel ou PDF</Text>
              <Text size="sm">5️⃣ Utilisez la recherche pour filtrer rapidement</Text>
              <Text size="sm">6️⃣ Cliquez sur 👁️ pour voir les mesures détaillées</Text>
              <Text size="sm">7️⃣ Cliquez sur 🛒 pour créer une vente</Text>
              <Text size="sm">8️⃣ Les clients sont triés du plus récent au plus ancien</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 2.0.0 - Gestion Couture</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
}