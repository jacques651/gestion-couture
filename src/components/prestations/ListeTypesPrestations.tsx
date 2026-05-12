import React, { useEffect, useState } from 'react';
import {
  TypePrestation
} from '../../types/prestations';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Table,
  Badge,
  ActionIcon,
  LoadingOverlay,
  Box,
  Pagination,
  Tooltip,
  Modal,
  Divider,
  ThemeIcon,
  Container,
  Avatar,
  Center,
  Paper,
  Notification,
} from '@mantine/core';
import {
  IconLayersOff,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconTag,
  IconCheck,
  IconPrinter,
} from '@tabler/icons-react';
import {
  apiGet,
  apiDelete
} from '../../services/api';
import FormulaireTypePrestation from './FormulaireTypePrestation';


const ListeTypesPrestations: React.FC = () => {
  const [types, setTypes] = useState<TypePrestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [vueForm, setVueForm] = useState(false);
  const [typeEdition, setTypeEdition] = useState<TypePrestation | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const chargerTypes = async () => {
    try {
      setLoading(true);
      const result = await apiGet("/types-prestations");
      setTypes(result || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerTypes();
  }, []);

  const supprimerType = async (id: number, nom: string) => {
    if (!globalThis.confirm(`Supprimer le type "${nom}" ?`)) return;
    await apiDelete(`/types-prestations/${id}`);
    await chargerTypes();
    setSuccessMessage(`Type "${nom}" supprimé avec succès`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    setRecherche('');
    chargerTypes();
    setCurrentPage(1);
  };

  // Fonction d'impression
  const handlePrint = () => {
    // Créer un iframe invisible pour l'impression
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    document.body.appendChild(iframe);
    
    const typesFiltres = types.filter(t =>
      t.nom.toLowerCase().includes(recherche.toLowerCase())
    );
    
    // Générer le contenu HTML à imprimer
    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liste des types de prestations</title>
        <meta charset="UTF-8">
        <style>
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
          .print-header h1 { 
            margin-bottom: 10px; 
            font-size: 24px;
          }
          .print-header p { color: #666; font-size: 14px; }
          .print-date { 
            text-align: right; 
            margin-bottom: 20px; 
            font-size: 12px; 
            color: #666;
          }
                   
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
          }
          th, td { 
            border: 1px solid #333; 
            padding: 10px 8px; 
            text-align: left; 
            vertical-align: middle;
          }
          th { 
            background: #1b365d;
            color: white;
            font-weight: bold;
            font-size: 13px;
          }
          td { font-size: 12px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
          }
          .badge-primary { background: #e3f2fd; color: #1976d2; }
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
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>📋 Types de Prestations</h1>
          <p>Gestion des différents types de prestations de l'atelier</p>
        </div>
        <div class="print-date">
          Date d'impression : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
        </div>
        ${recherche ? `
          <div style="margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <strong>🔍 Recherche :</strong> "${recherche}"
          </div>
        ` : ''}
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th class="text-right">Valeur par défaut</th>
            </tr>
          </thead>
          <tbody>
            ${typesFiltres.map(type => `
              <tr>
                <td>
                  <strong>${type.nom}</strong>
                 </td>
                <td class="text-right">
                  <span class="badge badge-primary">${(type.prix_par_defaut || 0).toLocaleString()} FCFA</span>
                 </td>
               </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Logiciel de gestion de couture - Version 1.0</p>
          <p>Document généré le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </body>
      </html>
    `;
    
    // Écrire le contenu dans l'iframe
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 100);
      };
      
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          iframe.contentWindow?.focus();
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

  const typesFiltres = types.filter(t =>
    t.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const totalPages = Math.ceil(typesFiltres.length / itemsPerPage);
  const paginatedData = typesFiltres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconLayersOff size={40} stroke={1.5} />
            <Text>Chargement des types de prestations...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  if (vueForm) {
    return (
      <FormulaireTypePrestation
        type={typeEdition || undefined}
        onSuccess={() => {
          setVueForm(false);
          setTypeEdition(null);
          chargerTypes();
          setSuccessMessage(typeEdition ? 'Type modifié avec succès' : 'Type créé avec succès');
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }}
        onCancel={() => { setVueForm(false); setTypeEdition(null); }}
      />
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Notification de succès */}
          {showSuccess && (
            <Notification
              icon={<IconCheck size={18} />}
              color="green"
              title="Succès !"
              onClose={() => setShowSuccess(false)}
              radius="md"
            >
              {successMessage}
            </Notification>
          )}

          {/* Header amélioré */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconLayersOff size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Types de prestations</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Gérez les différents types de prestations de votre atelier
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {typesFiltres.length} type{typesFiltres.length > 1 ? 's' : ''} actif{typesFiltres.length > 1 ? 's' : ''}
                    </Badge>
                  </Group>
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
            </Group>
          </Card>

          {/* Barre d'outils */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="sm">
                <TextInput
                  placeholder="Rechercher par nom..."
                  leftSection={<IconSearch size={16} />}
                  value={recherche}
                  onChange={(e) => {
                    setRecherche(e.target.value);
                    setCurrentPage(1);
                  }}
                  size="md"
                  radius="md"
                  style={{ width: 280 }}
                />
              </Group>
              <Group gap="sm">
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" onClick={handleReset} size="lg" radius="md">
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <Button
                  leftSection={<IconPlus size={18} />}
                  onClick={() => {
                    setTypeEdition(null);
                    setVueForm(true);
                  }}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                >
                  Nouveau type
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Tableau des types de prestations */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {typesFiltres.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconLayersOff size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucun type de prestation trouvé</Text>
                <Button variant="light" onClick={() => { setTypeEdition(null); setVueForm(true); }}>
                  Ajouter un type
                </Button>
              </Stack>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white' }}>Nom</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right' }}>Valeur par défaut</Table.Th>
                      <Table.Th style={{ textAlign: 'center', color: 'white', width: 120 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((t) => (
                      <Table.Tr key={t.id}>
                        <Table.Td fw={500}>
                          <Group gap="xs">
                            <Avatar size="sm" radius="xl" color="violet">
                              <IconTag size={12} />
                            </Avatar>
                            {t.nom}
                          </Group>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Badge color="green" variant="light" size="md">
                            {(t.prix_par_defaut || 0).toLocaleString()} FCFA
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="center">
                            <Tooltip label="Modifier">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="orange"
                                onClick={() => {
                                  setTypeEdition(t);
                                  setVueForm(true);
                                }}
                              >
                                <IconEdit size={18} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Supprimer">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="red"
                                onClick={() => supprimerType(t.id || 0, t.nom)}
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {totalPages > 1 && (
                  <Group justify="center" p="md">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      color="#1b365d"
                      size="md"
                      radius="md"
                    />
                  </Group>
                )}
              </>
            )}
          </Card>

          {/* Modal Instructions */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Types de prestations"
            size="md"
            centered
            radius="lg"
            styles={{
              header: {
                backgroundColor: '#1b365d',
                padding: '16px 20px',
              },
              title: {
                color: 'white',
                fontWeight: 600,
              },
              body: {
                padding: '24px',
              },
            }}
          >
            <Stack gap="md">
              <Paper p="md" radius="md" withBorder bg="blue.0">
                <Text fw={600} size="sm" mb="md">📌 Fonctionnalités :</Text>
                <Stack gap="xs">
                  <Text size="sm">1️⃣ Utilisez "Nouveau type" pour ajouter un type de prestation</Text>
                  <Text size="sm">2️⃣ La recherche filtre par nom de prestation</Text>
                  <Text size="sm">3️⃣ Cliquez sur ✏️ pour modifier un type</Text>
                  <Text size="sm">4️⃣ Cliquez sur 🗑️ pour supprimer un type</Text>
                  <Text size="sm">5️⃣ Les types supprimés sont désactivés, pas définitivement supprimés</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Exemples de prestations :</Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <Badge color="blue" size="sm">Couture</Badge>
                    <Text size="xs">Confection de vêtements sur mesure</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="blue" size="sm">Retouche</Badge>
                    <Text size="xs">Retouches et modifications</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="blue" size="sm">Brodage</Badge>
                    <Text size="xs">Brodages personnalisés</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="blue" size="sm">Ourlet</Badge>
                    <Text size="xs">Ourlets pour pantalons/jupes</Text>
                  </Group>
                </Stack>
              </Paper>

              <Divider />
              <Text size="xs" c="dimmed" ta="center">
                Version 1.0.0 - Gestion Couture
              </Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default ListeTypesPrestations;