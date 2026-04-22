import { useRef, useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Text,
  Title,
  Group,
  Button,
  Divider,
  Paper,
  Table,
  Box,
  Image,
  SimpleGrid,
} from '@mantine/core';
import {
  IconPrinter,
  IconX,
  IconBuildingStore,
  IconMapPin,
  IconPhone,
  IconMail,
  IconId,
  IconReceipt,
  IconCalendar,
  IconUser,
  IconCash,
} from '@tabler/icons-react';
import { getDb, ConfigurationAtelier } from '../../database/db';

interface LigneFacture {
  designation: string;
  quantite: number;
  prix_unitaire: number;
}

interface ClientFacture {
  nom_prenom: string;
  telephone_id: string;
}

interface CommandeFacture {
  id?: number;
  client: ClientFacture;
  lignes: LigneFacture[];
  numero?: string;
  avance?: number;
  reste?: number;
  total_general?: number;
}

interface ModalFactureProps {
  commande: CommandeFacture;
  onClose: () => void;
}

const ModalFacture: React.FC<ModalFactureProps> = ({ commande, onClose }) => {

  const printRef = useRef<HTMLDivElement>(null);
  const [atelier, setAtelier] = useState<ConfigurationAtelier | null>(null);
  const [loading, setLoading] = useState(true);

  // ================= LOAD CONFIG =================
  useEffect(() => {
    const load = async () => {
      try {
        const db = await getDb();

        const conf = await db.select<ConfigurationAtelier[]>(`
          SELECT * FROM configuration_atelier WHERE id = 1
        `);

        setAtelier(conf[0] || null);
      } catch (e) {
        console.error("Erreur chargement atelier", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ================= CALCUL =================
  const total =
    commande.total_general ??
    commande.lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return null;
  }

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="xl"
      centered
      title="Facture"
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
          padding: 0,
        },
      }}
    >
      {/* ZONE IMPRIMABLE */}
      <div ref={printRef} id="print-zone">
        <Stack gap={0}>
          {/* EN-TÊTE ATELIER */}
          <Paper p="lg" radius={0} style={{ borderBottom: '2px solid #e9ecef' }}>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Box style={{ flex: 1, textAlign: 'center' }}>
                <Title order={3} ta="center" mb="xs" c="#1b365d">
                  {atelier?.nom_atelier || "MON ATELIER"}
                </Title>
                <Stack gap={4} align="center">
                  {atelier?.adresse && (
                    <Group gap={4}>
                      <IconMapPin size={14} />
                      <Text size="xs">{atelier.adresse}</Text>
                    </Group>
                  )}
                  {atelier?.telephone && (
                    <Group gap={4}>
                      <IconPhone size={14} />
                      <Text size="xs">Tél: {atelier.telephone}</Text>
                    </Group>
                  )}
                  {atelier?.email && (
                    <Group gap={4}>
                      <IconMail size={14} />
                      <Text size="xs">{atelier.email}</Text>
                    </Group>
                  )}
                  {atelier?.nif && (
                    <Group gap={4}>
                      <IconId size={14} />
                      <Text size="xs">NIF: {atelier.nif}</Text>
                    </Group>
                  )}
                </Stack>
              </Box>
              {atelier?.logo_base64 && (
                <Image
                  src={atelier.logo_base64}
                  w={80}
                  h={80}
                  fit="contain"
                  radius="md"
                  style={{ border: '1px solid #dee2e6', padding: 8 }}
                />
              )}
            </Group>
          </Paper>

          <Divider />

          {/* ENTÊTE FACTURE */}
          <Paper p="md" radius={0} bg="orange.0">
            <Group justify="space-between">
              <Group gap="xs">
                <IconReceipt size={20} />
                <Text fw={700} size="lg">FACTURE</Text>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} />
                <Text size="sm">{new Date().toLocaleDateString('fr-FR')}</Text>
                <Text size="xs" c="dimmed">{new Date().toLocaleTimeString()}</Text>
              </Group>
            </Group>
          </Paper>

          <Divider />

          {/* NUMÉRO FACTURE */}
          <Paper p="md" radius={0} bg="orange.1">
            <Text ta="center" fw={700} size="lg" c="#1b365d">
              Facture N° : {commande.numero || '---'}
            </Text>
          </Paper>

          {/* INFOS CLIENT */}
          <Paper p="lg" radius={0}>
            <Title order={5} mb="md" c="#1b365d">Informations client</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Group gap="xs">
                <IconUser size={16} />
                <Text size="sm" c="dimmed">Nom :</Text>
                <Text fw={500} size="sm">{commande.client.nom_prenom}</Text>
              </Group>
              <Group gap="xs">
                <IconPhone size={16} />
                <Text size="sm" c="dimmed">Téléphone :</Text>
                <Text fw={500} size="sm">{commande.client.telephone_id}</Text>
              </Group>
            </SimpleGrid>
          </Paper>

          <Divider />

          {/* TABLEAU DES ARTICLES */}
          <Paper p="lg" radius={0}>
            <Title order={5} mb="md" c="#1b365d">Détails de la commande</Title>
            <Table striped highlightOnHover>
              <Table.Thead style={{ backgroundColor: '#f5f5f5' }}>
                <Table.Tr>
                  <Table.Th style={{ width: 50 }}>N°</Table.Th>
                  <Table.Th>Désignation</Table.Th>
                  <Table.Th style={{ width: 80, textAlign: 'center' }}>Qté</Table.Th>
                  <Table.Th style={{ width: 120, textAlign: 'right' }}>Prix unitaire</Table.Th>
                  <Table.Th style={{ width: 120, textAlign: 'right' }}>Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {commande.lignes.map((l, i) => (
                  <Table.Tr key={i}>
                    <Table.Td ta="center">{i + 1}</Table.Td>
                    <Table.Td>{l.designation}</Table.Td>
                    <Table.Td ta="center">{l.quantite}</Table.Td>
                    <Table.Td ta="right">{l.prix_unitaire.toLocaleString()} FCFA</Table.Td>
                    <Table.Td ta="right" fw={600}>
                      {(l.quantite * l.prix_unitaire).toLocaleString()} FCFA
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>

          <Divider />

          {/* TOTAL */}
          <Paper p="lg" radius={0} bg="gray.0">
            <Group justify="flex-end">
              <Stack gap={4}>
                <Group justify="space-between">
                  <Text fw={600}>Total :</Text>
                  <Text fw={700} size="xl" c="blue">
                    {total.toLocaleString()} FCFA
                  </Text>
                </Group>
                {commande.avance !== undefined && commande.avance > 0 && (
                  <>
                    <Group justify="space-between">
                      <Text fw={600}>Avance :</Text>
                      <Text fw={600} c="green">
                        {commande.avance.toLocaleString()} FCFA
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text fw={600}>Reste à payer :</Text>
                      <Text fw={700} size="lg" c="red">
                        {commande.reste?.toLocaleString()} FCFA
                      </Text>
                    </Group>
                  </>
                )}
              </Stack>
            </Group>
          </Paper>

          {/* MESSAGE FACTURE */}
          {atelier?.message_facture && (
            <>
              <Divider />
              <Paper p="lg" radius={0} ta="center">
                <Text size="sm" fs="italic" c="dimmed">
                  {atelier.message_facture}
                </Text>
              </Paper>
            </>
          )}
        </Stack>
      </div>

      {/* ACTIONS */}
      <Divider />
      <Group justify="flex-end" p="md" className="no-print">
        <Button variant="light" onClick={onClose} leftSection={<IconX size={16} />}>
          Fermer
        </Button>
        <Button
          onClick={handlePrint}
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan' }}
          leftSection={<IconPrinter size={16} />}
        >
          Imprimer
        </Button>
      </Group>

      {/* STYLES D'IMPRESSION */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          #print-zone {
            margin: 0;
            padding: 0;
          }
          body {
            background: white;
          }
          .mantine-Modal-root {
            display: none;
          }
        }
      `}</style>
    </Modal>
  );
};

export default ModalFacture;