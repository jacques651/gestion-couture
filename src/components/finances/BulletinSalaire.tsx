import { useEffect, useState } from "react";
import {
  Modal,
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Divider,
  Table,
  Paper,
  Box,
  Image,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconPrinter,
  IconFile,
  IconX,
  IconUser,
  IconMapPin,
  IconPhone,
  IconMail,
  IconId,
  IconCheck,
} from '@tabler/icons-react';
import { getDb } from "../../database/db";
import html2pdf from "html2pdf.js";

// ================= TYPES =================
interface Employe {
  id: number;
  nom_prenom: string;
  salaire_base: number;
}

interface Atelier {
  nom_atelier: string;
  telephone: string;
  adresse: string;
  email: string;
  nif: string;
  message_facture: string;
  logo_base64: string;
}

interface EmpruntNonDeduit {
  id: number;
  montant: number;
  date_emprunt: string;
}

interface SalaireVersement {
  id: number;
  montant_net: number;
  date_paiement: string;
  mode: string;
}

interface BulletinData {
  employe: Employe;
  brut: number;
  retenues: EmpruntNonDeduit[];
  totalRetenues: number;
  net: number;
  versements: SalaireVersement[];
  totalDejaPaye: number;
  reste: number;
  atelier: Atelier | null;
}

interface Props {
  employeId: number;
  onClose: () => void;
}

const BulletinSalaire = ({ employeId, onClose }: Props) => {
  const [data, setData] = useState<BulletinData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeId) return;

    const load = async () => {
      setLoading(true);
      const db = await getDb();

      // Employé
      const emp = await db.select<Employe[]>(
        `SELECT id, nom_prenom, COALESCE(salaire_base, 0) as salaire_base 
         FROM employes WHERE id = ?`,
        [employeId]
      );

      if (!emp.length) {
        setLoading(false);
        return;
      }

      const employe = emp[0];

      // Atelier
      const atelierRows = await db.select<Atelier[]>(
        `SELECT nom_atelier, telephone, adresse, email, nif, message_facture, logo_base64
         FROM configuration_atelier WHERE id = 1`
      );

      const atelier = atelierRows.length ? atelierRows[0] : null;

      // Emprunts
      const emprunts = await db.select<EmpruntNonDeduit[]>(
        `SELECT id, montant, date_emprunt
         FROM emprunts 
         WHERE employe_id = ? AND deduit = 0`,
        [employeId]
      );

      const totalRetenues = emprunts.reduce((s, e) => s + e.montant, 0);

      const brut = employe.salaire_base;
      const net = brut - totalRetenues;

      // Paiements
      const versements = await db.select<SalaireVersement[]>(
        `SELECT id, montant_net, date_paiement, mode
         FROM salaires 
         WHERE employe_id = ?`,
        [employeId]
      );

      const totalDejaPaye = versements.reduce((s, v) => s + v.montant_net, 0);
      const reste = net - totalDejaPaye;

      setData({
        employe,
        brut,
        retenues: emprunts,
        totalRetenues,
        net,
        versements,
        totalDejaPaye,
        reste,
        atelier,
      });
      setLoading(false);
    };

    load();
  }, [employeId]);

  const handlePrint = () => window.print();

  const handlePDF = () => {
    const el = document.getElementById("bulletin-print");
    if (!el) return;

    html2pdf()
      .from(el)
      .set({
        margin: 10,
        filename: `bulletin-${data?.employe.nom_prenom}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { format: "a4" },
      })
      .save();
  };

  if (loading) {
    return (
      <Modal opened={true} onClose={onClose} size="xl" centered>
        <Card withBorder radius="md" p="lg" pos="relative">
          <LoadingOverlay visible={true} />
          <Text>Chargement du bulletin...</Text>
        </Card>
      </Modal>
    );
  }

  if (!data) return null;

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="xl"
      centered
      title="Bulletin de salaire"
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
      <div id="bulletin-print">
        <Stack gap={0}>
          {/* EN-TÊTE ATELIER */}
          <Paper p="lg" radius={0} style={{ borderBottom: '2px solid #e9ecef' }}>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Box style={{ flex: 1 }}>
                {data.atelier?.logo_base64 && (
                  <Image
                    src={data.atelier.logo_base64}
                    h={60}
                    fit="contain"
                    mb="sm"
                  />
                )}
                <Title order={3} c="#1b365d">
                  {data.atelier?.nom_atelier || "MON ATELIER"}
                </Title>
                <Stack gap={4} mt={4}>
                  {data.atelier?.adresse && (
                    <Group gap={4}>
                      <IconMapPin size={14} />
                      <Text size="xs">{data.atelier.adresse}</Text>
                    </Group>
                  )}
                  {data.atelier?.telephone && (
                    <Group gap={4}>
                      <IconPhone size={14} />
                      <Text size="xs">Tél: {data.atelier.telephone}</Text>
                    </Group>
                  )}
                  {data.atelier?.email && (
                    <Group gap={4}>
                      <IconMail size={14} />
                      <Text size="xs">{data.atelier.email}</Text>
                    </Group>
                  )}
                  {data.atelier?.nif && (
                    <Group gap={4}>
                      <IconId size={14} />
                      <Text size="xs">NIF: {data.atelier.nif}</Text>
                    </Group>
                  )}
                </Stack>
              </Box>
              <Box ta="right">
                <Title order={4} c="#1b365d">BULLETIN DE SALAIRE</Title>
                <Text size="sm" c="dimmed">{new Date().toLocaleDateString('fr-FR')}</Text>
              </Box>
            </Group>
          </Paper>

          <Divider />

          {/* INFOS EMPLOYÉ */}
          <Paper p="lg" radius={0} bg="gray.0">
            <Group gap="xs">
              <IconUser size={16} />
              <Text fw={500}>Employé :</Text>
              <Text fw={700}>{data.employe.nom_prenom}</Text>
            </Group>
          </Paper>

          <Divider />

          {/* TABLEAU DES MONTANTS - CORRECTION : suppression de size sur Table.Td */}
          <Paper p="lg" radius={0}>
            <Table striped highlightOnHover>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={600} style={{ width: 200 }}>
                    <Text size="sm">Salaire brut</Text>
                  </Table.Td>
                  <Table.Td ta="right" fw={700}>
                    <Text size="sm">{data.brut.toLocaleString()} FCFA</Text>
                  </Table.Td>
                </Table.Tr>
                {data.retenues.length > 0 && (
                  <>
                    <Table.Tr>
                      <Table.Td fw={600} c="red">
                        <Text size="sm">Retenues (emprunts)</Text>
                      </Table.Td>
                      <Table.Td ta="right" c="red" fw={600}>
                        <Text size="sm">- {data.totalRetenues.toLocaleString()} FCFA</Text>
                      </Table.Td>
                    </Table.Tr>
                    {data.retenues.map((emprunt) => (
                      <Table.Tr key={emprunt.id}>
                        <Table.Td pl={20}>
                          <Text size="xs" c="dimmed">
                            • Emprunt du {new Date(emprunt.date_emprunt).toLocaleDateString('fr-FR')}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text size="xs" c="dimmed">
                            {emprunt.montant.toLocaleString()} FCFA
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </>
                )}
                <Table.Tr style={{ backgroundColor: '#f0f9ff' }}>
                  <Table.Td fw={700}>
                    <Text size="sm">Salaire net</Text>
                  </Table.Td>
                  <Table.Td ta="right" fw={700}>
                    <Text size="lg" c="blue">{data.net.toLocaleString()} FCFA</Text>
                  </Table.Td>
                </Table.Tr>
                {data.versements.length > 0 && (
                  <>
                    <Table.Tr>
                      <Table.Td fw={600}>
                        <Text size="sm">Déjà payé</Text>
                      </Table.Td>
                      <Table.Td ta="right" c="green" fw={600}>
                        <Text size="sm">- {data.totalDejaPaye.toLocaleString()} FCFA</Text>
                      </Table.Td>
                    </Table.Tr>
                    {data.versements.map((versement) => (
                      <Table.Tr key={versement.id}>
                        <Table.Td pl={20}>
                          <Text size="xs" c="dimmed">
                            • Paiement du {new Date(versement.date_paiement).toLocaleDateString('fr-FR')} ({versement.mode})
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text size="xs" c="dimmed">
                            {versement.montant_net.toLocaleString()} FCFA
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </>
                )}
                <Table.Tr style={{ backgroundColor: data.reste > 0 ? '#fff5f5' : '#f0fff0' }}>
                  <Table.Td fw={700}>
                    <Text size="sm">Reste à payer</Text>
                  </Table.Td>
                  <Table.Td ta="right" fw={700}>
                    <Text size="lg" c={data.reste > 0 ? "red" : "green"}>
                      {data.reste > 0 ? data.reste.toLocaleString() : "0"} FCFA
                      {data.reste <= 0 && <IconCheck size={16} style={{ marginLeft: 8, display: 'inline' }} />}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>

          {/* MESSAGE FACTURE */}
          {data.atelier?.message_facture && (
            <>
              <Divider />
              <Paper p="lg" radius={0} ta="center">
                <Text size="sm" fs="italic" c="dimmed">
                  {data.atelier.message_facture}
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
          variant="outline"
          color="teal"
          leftSection={<IconPrinter size={16} />}
        >
          Imprimer
        </Button>
        <Button
          onClick={handlePDF}
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan' }}
          leftSection={<IconFile size={16} />}
        >
          PDF
        </Button>
      </Group>

      {/* STYLES D'IMPRESSION */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          #bulletin-print {
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

export default BulletinSalaire;