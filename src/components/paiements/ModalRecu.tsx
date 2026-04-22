import { useEffect, useState } from 'react';
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
  Badge,
  Box,
  Image,
  SimpleGrid,
} from '@mantine/core';
import {
  IconPrinter,
  IconX,
  IconMapPin,
  IconPhone,
  IconMail,
  IconId,
  IconReceipt,
  IconCalendar,
  IconUser,
} from '@tabler/icons-react';
import { getRecuData, getDb } from '../../database/db';

// ======================
interface Paiement {
  montant: number;
  date_paiement: string;
  mode: string;
}

interface Commande {
  id: number;
  nom_prenom: string;
  telephone_id: string;
  total: number;
}

interface ConfigAtelier {
  nom_atelier?: string;
  telephone?: string;
  adresse?: string;
  email?: string;
  nif?: string;
  message_facture?: string;
  logo_base64?: string;
}

interface RecuData {
  commande: Commande;
  paiements: Paiement[];
}

interface Props {
  commande: { id: number };
  onClose: () => void;
}

// ======================
const ModalRecu: React.FC<Props> = ({ commande, onClose }) => {

  const [data, setData] = useState<RecuData | null>(null);
  const [config, setConfig] = useState<ConfigAtelier | null>(null);
  const [loading, setLoading] = useState(true);

  // ======================
  // LOAD DATA
  // ======================
  useEffect(() => {
    const load = async () => {
      try {
        const db = await getDb();

        const recu = await getRecuData(commande.id);
        setData(recu);

        const conf = await db.select<ConfigAtelier[]>(`
          SELECT * FROM configuration_atelier WHERE id = 1
        `);

        setConfig(conf[0] || null);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [commande.id]);

  if (loading || !data) return null;

  // ======================
  // CALCULS
  // ======================
  const totalPaye = data.paiements.reduce(
    (s, p) => s + (p.montant || 0),
    0
  );

  const totalCommande = data.commande?.total || 0;
  const reste = totalCommande - totalPaye;

  const getStatut = () => {
    if (reste <= 0) {
      return { label: 'PAYÉ', color: 'green', icon: <IconReceipt size={14} /> };
    }
    if (totalPaye > 0) {
      return { label: 'PARTIEL', color: 'orange', icon: <IconReceipt size={14} /> };
    }
    return { label: 'NON PAYÉ', color: 'red', icon: <IconReceipt size={14} /> };
  };

  const statut = getStatut();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="xl"
      centered
      title="Reçu de paiement"
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
      <div id="print-zone">
        <Stack gap={0}>
          {/* EN-TÊTE ATELIER */}
          <Paper p="lg" radius={0} style={{ borderBottom: '2px solid #e9ecef' }}>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Box style={{ flex: 1, textAlign: 'center' }}>
                <Title order={3} ta="center" mb="xs" c="#1b365d">
                  {config?.nom_atelier || "Mon Atelier"}
                </Title>
                <Stack gap={4} align="center">
                  {config?.adresse && (
                    <Group gap={4}>
                      <IconMapPin size={14} />
                      <Text size="xs">{config.adresse}</Text>
                    </Group>
                  )}
                  {config?.telephone && (
                    <Group gap={4}>
                      <IconPhone size={14} />
                      <Text size="xs">Tél: {config.telephone}</Text>
                    </Group>
                  )}
                  {config?.email && (
                    <Group gap={4}>
                      <IconMail size={14} />
                      <Text size="xs">{config.email}</Text>
                    </Group>
                  )}
                  {config?.nif && (
                    <Group gap={4}>
                      <IconId size={14} />
                      <Text size="xs">NIF: {config.nif}</Text>
                    </Group>
                  )}
                </Stack>
              </Box>
              {config?.logo_base64 && (
                <Image
                  src={config.logo_base64}
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

          {/* TITRE REÇU */}
          <Paper p="md" radius={0} bg="gray.0">
            <Group justify="space-between">
              <Group gap="xs">
                <IconReceipt size={20} />
                <Text fw={700} size="lg">REÇU DE PAIEMENT</Text>
                <Badge color={statut.color} size="lg" leftSection={statut.icon}>
                  {statut.label}
                </Badge>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} />
                <Text size="sm">{new Date().toLocaleDateString('fr-FR')}</Text>
                <Text size="xs" c="dimmed">{new Date().toLocaleTimeString()}</Text>
              </Group>
            </Group>
          </Paper>

          <Divider />

          {/* INFOS CLIENT */}
          <Paper p="lg" radius={0}>
            <Title order={5} mb="md" c="#1b365d">Informations client</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Group gap="xs">
                <IconUser size={16} />
                <Text size="sm" c="dimmed">Nom :</Text>
                <Text fw={500} size="sm">{data.commande.nom_prenom}</Text>
              </Group>
              <Group gap="xs">
                <IconPhone size={16} />
                <Text size="sm" c="dimmed">Téléphone :</Text>
                <Text fw={500} size="sm">{data.commande.telephone_id}</Text>
              </Group>
            </SimpleGrid>
          </Paper>

          <Divider />

          {/* TABLEAU DES PAIEMENTS */}
          <Paper p="lg" radius={0}>
            <Title order={5} mb="md" c="#1b365d">Historique des paiements</Title>
            <Table striped highlightOnHover>
              <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Mode</Table.Th>
                  <Table.Th ta="right">Montant</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.paiements.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={3} ta="center" c="dimmed">
                      Aucun paiement enregistré
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  data.paiements.map((p, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</Table.Td>
                      <Table.Td>{p.mode}</Table.Td>
                      <Table.Td ta="right" fw={500} c="green">
                        {p.montant.toLocaleString()} FCFA
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Paper>

          <Divider />

          {/* RÉCAPITULATIF FINANCIER */}
          <Paper p="lg" radius={0} bg="gray.0">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Box ta="center">
                <Text size="xs" c="dimmed">Total commande</Text>
                <Text fw={700} size="lg" c="blue">
                  {totalCommande.toLocaleString()} FCFA
                </Text>
              </Box>
              <Box ta="center">
                <Text size="xs" c="dimmed">Total payé</Text>
                <Text fw={700} size="lg" c="green">
                  {totalPaye.toLocaleString()} FCFA
                </Text>
              </Box>
              <Box ta="center">
                <Text size="xs" c="dimmed">Reste à payer</Text>
                <Text fw={700} size="lg" c={reste > 0 ? "red" : "green"}>
                  {reste.toLocaleString()} FCFA
                </Text>
              </Box>
            </SimpleGrid>
          </Paper>

          {/* MESSAGE FACTURE */}
          {config?.message_facture && (
            <>
              <Divider />
              <Paper p="lg" radius={0} ta="center">
                <Text size="sm" fs="italic" c="dimmed">
                  {config.message_facture}
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

export default ModalRecu;