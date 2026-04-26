import { useEffect, useState } from "react";
import {
  Modal,
  Stack,
  Card,
  Text,
  Group,
  Button,
  Divider,
  Table,
  Paper,
  Box,
  LoadingOverlay,
  SimpleGrid,
  Badge,
  Title,
} from '@mantine/core';
import {
  IconPrinter,
  IconFile,
  IconX,
  IconUser,
  IconPhone,
  IconCalendar,
  IconCash,
  IconBuildingStore,
  IconCreditCard,
  IconWallet,
} from '@tabler/icons-react';
import { getDb } from "../../database/db";
import html2pdf from "html2pdf.js";

// ================= TYPES =================
interface Employe {
  id: number;
  nom_prenom: string;
  salaire_base: number;
  telephone?: string;
  date_embauche?: string;
  type_remuneration: 'fixe' | 'prestation'
  lieu_residence?: string;
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

interface Emprunt {
  id: number;
  montant: number;
  date_emprunt: string;
  raison?: string;
}

interface SalaireVersement {
  id: number;
  montant_net: number;
  date_paiement: string;
  mode: string;
}

interface PrestationRealisee {
  id: number;
  designation: string;
  valeur: number;
  nombre: number;
  total: number;
  date_prestation: string;
}

interface BulletinData {
  employe: Employe;
  atelier: Atelier | null;
  salaireBrut: number;
  prestations: PrestationRealisee[];
  totalPrestations: number;
  emprunts: Emprunt[];
  totalEmprunts: number;
  netAPayer: number;
  versements: SalaireVersement[];
  totalVersements: number;
  resteAPayer: number;
  modePaiement?: string;
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

      // Récupérer l'employé
      const emp = await db.select<Employe[]>(
        `SELECT id, nom_prenom, COALESCE(salaire_base, 0) as salaire_base, telephone, date_embauche, type_remuneration, lieu_residence
   FROM employes WHERE id = ?`,
        [employeId]
      );

      if (!emp.length) {
        setLoading(false);
        return;
      }

      const employe = emp[0];

      // Récupérer l'atelier
      const atelierRows = await db.select<Atelier[]>(
        `SELECT nom_atelier, telephone, adresse, email, nif, message_facture, logo_base64
         FROM configuration_atelier WHERE id = 1`
      );
      const atelier = atelierRows.length ? atelierRows[0] : null;

      let salaireBrut = 0;
      let prestations: PrestationRealisee[] = [];
      let totalPrestations = 0;

      if (employe.type_remuneration === 'fixe') {
        salaireBrut = employe.salaire_base;
      } else {
        // Récupérer les prestations non payées
        const prestaData = await db.select<PrestationRealisee[]>(
          `SELECT id, designation, valeur, nombre, total, date_prestation
           FROM prestations_realisees 
           WHERE employe_id = ? AND (paye = 0 OR paye IS NULL)`,
          [employeId]
        );
        prestations = prestaData;
        totalPrestations = prestaData.reduce((sum, p) => sum + p.total, 0);
        salaireBrut = totalPrestations;
      }

      // Récupérer les emprunts non déduits
      const emprunts = await db.select<Emprunt[]>(
        `SELECT id, montant, date_emprunt, NULL as raison
         FROM emprunts 
         WHERE employe_id = ? AND deduit = 0`,
        [employeId]
      );
      const totalEmprunts = emprunts.reduce((s, e) => s + e.montant, 0);
      const netAPayer = salaireBrut - totalEmprunts;

      // Récupérer les versements déjà effectués
      const versements = await db.select<SalaireVersement[]>(
        `SELECT id, montant_net, date_paiement, mode
         FROM salaires 
         WHERE employe_id = ? AND annule = 0
         ORDER BY date_paiement DESC`,
        [employeId]
      );
      const totalVersements = versements.reduce((s, v) => s + v.montant_net, 0);
      const resteAPayer = netAPayer - totalVersements;

      setData({
        employe,
        atelier,
        salaireBrut,
        prestations,
        totalPrestations,
        emprunts,
        totalEmprunts,
        netAPayer,
        versements,
        totalVersements,
        resteAPayer,
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
        filename: `bulletin-salaire-${data?.employe.nom_prenom?.replace(/\s/g, '-')}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { format: "a4", orientation: "portrait" },
      })
      .save();
  };

  const nombreEnLettres = (montant: number): string => {
    if (montant === 0) return 'zéro';
    const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

    if (montant < 10) return unites[montant];
    if (montant < 20) {
      if (montant === 11) return 'onze';
      if (montant === 12) return 'douze';
      return `${dizaines[1]}${montant > 10 ? '-' + unites[montant - 10] : ''}`;
    }
    const d = Math.floor(montant / 10);
    const u = montant % 10;
    if (d === 7 || d === 9) return `${dizaines[d - 1]}${u > 0 ? '-' + unites[u] : ''}`;
    return `${dizaines[d]}${u > 0 ? '-' + unites[u] : ''}`;
  };

  const montantEnLettres = (montant: number): string => {
    const mille = Math.floor(montant / 1000);
    const reste = montant % 1000;
    let result = '';
    if (mille > 0) {
      if (mille === 1) result += 'mille ';
      else result += `${nombreEnLettres(mille)} mille `;
    }
    if (reste > 0) result += nombreEnLettres(reste);
    return result.trim() || 'zéro';
  };

  if (loading) {
    return (
      <Modal opened={true} onClose={onClose} size="xl" centered title="Bulletin de salaire">
        <Card withBorder radius="md" p="lg" pos="relative">
          <LoadingOverlay visible={true} />
          <Text>Chargement du bulletin...</Text>
        </Card>
      </Modal>
    );
  }

  if (!data) return null;

  const getModePaiementIcon = (mode: string) => {
    if (mode === 'Espèces' || mode === 'cash') return <IconWallet size={14} />;
    if (mode === 'Orange money' || mode === 'Moov money' || mode === 'Wave') return <IconCreditCard size={14} />;
    return <IconCash size={14} />;
  };

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="1200px"
      centered
      padding={0}
      styles={{
        header: { display: 'none' },
        body: { padding: 0 },
      }}
    >
      {/* ZONE IMPRIMABLE */}
      <div id="bulletin-print" style={{ backgroundColor: 'white' }}>
        <Stack gap={0}>
          {/* EN-TÊTE ATELIER */}
          <Paper p="xl" radius={0} style={{ borderBottom: '3px solid #1b365d', backgroundColor: '#f8f9fa' }}>
            <Group justify="space-between" align="center">
              <Box>
                <Title order={2} c="#1b365d" size="h3">BULLETIN DE SALAIRE</Title>
                <Text size="xs" c="dimmed" mt={4}>N°: {new Date().getFullYear()}-{String(data.employe.id).padStart(4, '0')}</Text>
              </Box>
              <Box ta="right">
                <Text fw={700} size="lg">{data.atelier?.nom_atelier || "GESTION COUTURE"}</Text>
                <Text size="xs" c="dimmed">{data.atelier?.adresse}</Text>
                <Text size="xs" c="dimmed">Tél: {data.atelier?.telephone}</Text>
                <Text size="xs" c="dimmed">NIF: {data.atelier?.nif}</Text>
              </Box>
            </Group>
          </Paper>

          {/* INFORMATIONS EMPLOYÉ */}
          <Paper p="xl" radius={0}>
            <Title order={4} size="sm" mb="md" c="#1b365d">📋 INFORMATIONS DE L'EMPLOYÉ</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              <Group gap="sm">
                <IconUser size={16} color="#1b365d" />
                <Text size="sm" fw={500}>Nom complet:</Text>
                <Text size="sm">{data.employe.nom_prenom}</Text>
              </Group>
              {data.employe.telephone && (
                <Group gap="sm">
                  <IconPhone size={16} color="#1b365d" />
                  <Text size="sm" fw={500}>Téléphone:</Text>
                  <Text size="sm">{data.employe.telephone}</Text>
                </Group>
              )}
              <Group gap="sm">
                <IconCalendar size={16} color="#1b365d" />
                <Text size="sm" fw={500}>Période:</Text>
                <Text size="sm">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</Text>
              </Group>
              <Group gap="sm">
                <IconCash size={16} color="#1b365d" />
                <Text size="sm" fw={500}>Type:</Text>
                <Badge size="sm" color={data.employe.type_remuneration === 'fixe' ? 'blue' : 'green'}>
                  {data.employe.type_remuneration === 'fixe' ? 'Salaire fixe' : 'À prestation'}
                </Badge>
              </Group>
              {data.employe.date_embauche && (
                <Group gap="sm">
                  <IconCalendar size={16} color="#1b365d" />
                  <Text size="sm" fw={500}>Date embauche:</Text>
                  <Text size="sm">{new Date(data.employe.date_embauche).toLocaleDateString('fr-FR')}</Text>
                </Group>
              )}
              {data.employe.lieu_residence && (
                <Group gap="sm">
                  <IconBuildingStore size={16} color="#1b365d" />
                  <Text size="sm" fw={500}>Résidence:</Text>
                  <Text size="sm">{data.employe.lieu_residence}</Text>
                </Group>
              )}
            </SimpleGrid>
          </Paper>

          <Divider />

          {/* Tableau principal - 3 colonnes */}
          <Paper p="xl" radius={0}>
            <Table striped highlightOnHover>
              <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                <Table.Tr>
                  <Table.Th style={{ color: 'white', width: '33%' }}>ÉLÉMENTS DE PAIE</Table.Th>
                  <Table.Th style={{ color: 'white', width: '33%' }}>AVOIRS</Table.Th>
                  <Table.Th style={{ color: 'white', width: '34%' }}>RETENUES</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  {/* Éléments de paie */}
                  <Table.Td valign="top">
                    <Stack gap="xs">
                      {data.employe.type_remuneration === 'fixe' ? (
                        <Group justify="space-between">
                          <Text size="sm">Salaire de base</Text>
                          <Text fw={600}>{data.salaireBrut.toLocaleString()} FCFA</Text>
                        </Group>
                      ) : (
                        <Stack gap="xs">
                          {data.prestations.map((p, idx) => (
                            <Group key={idx} justify="space-between">
                              <Text size="sm">{p.designation} x{p.nombre}</Text>
                              <Text>{p.total.toLocaleString()} FCFA</Text>
                            </Group>
                          ))}
                          <Divider />
                          <Group justify="space-between" fw={700}>
                            <Text size="sm">Total prestations</Text>
                            <Text c="blue">{data.totalPrestations.toLocaleString()} FCFA</Text>
                          </Group>
                        </Stack>
                      )}
                    </Stack>
                  </Table.Td>

                  {/* Avoirs - Pour prestataire, afficher les prestations comme avoirs */}
                  <Table.Td valign="top">
                    <Stack gap="xs">
                      {data.employe.type_remuneration === 'prestation' ? (
                        <>
                          {data.prestations.map((p, idx) => (
                            <Group key={idx} justify="space-between">
                              <Text size="sm">✓ {p.designation}</Text>
                              <Text c="green">{p.total.toLocaleString()} FCFA</Text>
                            </Group>
                          ))}
                          <Divider />
                          <Group justify="space-between" fw={700}>
                            <Text size="sm">Total avoirs</Text>
                            <Text c="green" fw={700}>{data.totalPrestations.toLocaleString()} FCFA</Text>
                          </Group>
                        </>
                      ) : (
                        <Group justify="space-between">
                          <Text size="sm">Aucun avoir</Text>
                          <Text>0 FCFA</Text>
                        </Group>
                      )}
                    </Stack>
                  </Table.Td>

                  {/* Retenues */}
                  <Table.Td valign="top">
                    <Stack gap="xs">
                      {data.emprunts.length > 0 ? (
                        data.emprunts.map((e, idx) => (
                          <Group key={idx} justify="space-between">
                            <Text size="sm">Emprunt du {new Date(e.date_emprunt).toLocaleDateString('fr-FR')}</Text>
                            <Text c="red">- {e.montant.toLocaleString()} FCFA</Text>
                          </Group>
                        ))
                      ) : (
                        <Text size="sm" c="dimmed">Aucune retenue</Text>
                      )}
                      {data.emprunts.length > 0 && (
                        <>
                          <Divider />
                          <Group justify="space-between" fw={700}>
                            <Text size="sm">Total retenues</Text>
                            <Text c="red">- {data.totalEmprunts.toLocaleString()} FCFA</Text>
                          </Group>
                        </>
                      )}
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>

          <Divider />

          {/* RÉCAPITULATIF DES VERSEMENTS */}
          {data.versements.length > 0 && (
            <Paper p="xl" radius={0}>
              <Title order={4} size="sm" mb="md" c="#1b365d">💰 VERSEMENTS EFFECTUÉS</Title>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Mode</Table.Th>
                    <Table.Th>Montant</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.versements.map((v, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{new Date(v.date_paiement).toLocaleDateString('fr-FR')}</Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {getModePaiementIcon(v.mode)}
                          <Text size="sm">{v.mode}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>{v.montant_net.toLocaleString()} FCFA</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}

          <Divider />

          {/* RÉCAPITULATIF FINAL */}
          <Paper p="xl" radius={0} style={{ backgroundColor: '#f0f7ff' }}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
              <Paper p="md" radius="md" bg="white">
                <Text size="xs" c="dimmed">BRUT À PAYER</Text>
                <Text fw={700} size="xl" c="blue">{data.salaireBrut.toLocaleString()} FCFA</Text>
              </Paper>
              <Paper p="md" radius="md" bg="white">
                <Text size="xs" c="dimmed">RETENUES</Text>
                <Text fw={700} size="xl" c="red">- {data.totalEmprunts.toLocaleString()} FCFA</Text>
              </Paper>
              <Paper p="md" radius="md" bg="white">
                <Text size="xs" c="dimmed">NET À PAYER</Text>
                <Text fw={700} size="xl" c="green">{data.netAPayer.toLocaleString()} FCFA</Text>
              </Paper>
              <Paper p="md" radius="md" bg="white">
                <Text size="xs" c="dimmed">DÉJÀ VERSÉ</Text>
                <Text fw={700} size="xl" c="orange">- {data.totalVersements.toLocaleString()} FCFA</Text>
              </Paper>
            </SimpleGrid>

            <Divider my="lg" />

            <Paper p="xl" radius="md" bg={data.resteAPayer > 0 ? '#fff5f5' : '#f0fff0'} style={{ border: `2px solid ${data.resteAPayer > 0 ? '#ff8787' : '#69db7e'}` }}>
              <Group justify="space-between" align="center">
                <Box>
                  <Text size="sm" c="dimmed">MODE DE PAIEMENT</Text>
                  <Group gap="sm" mt={4}>
                    <Badge size="lg" color="blue" variant="light">
                      <Group gap={4}>
                        <IconWallet size={14} />
                        <Text>Espèces</Text>
                      </Group>
                    </Badge>
                    <Badge size="lg" color="orange" variant="light">
                      <Group gap={4}>
                        <IconCreditCard size={14} />
                        <Text>Mobile Money</Text>
                      </Group>
                    </Badge>
                    <Badge size="lg" color="gray" variant="light">
                      <Group gap={4}>
                        <IconBuildingStore size={14} />
                        <Text>Virement</Text>
                      </Group>
                    </Badge>
                  </Group>
                </Box>
                <Box ta="right">
                  <Text size="sm" c="dimmed">NET À PAYER</Text>
                  <Text fw={800} size="32px" c={data.resteAPayer > 0 ? "red" : "green"}>
                    {data.resteAPayer.toLocaleString()} FCFA
                  </Text>
                  {data.resteAPayer <= 0 && (
                    <Badge color="green" size="lg" mt={4}>✅ SALAIRE COMPLET</Badge>
                  )}
                </Box>
              </Group>
            </Paper>

            {/* Montant en lettres */}
            <Box ta="center" mt="lg">
              <Text size="sm" fw={600} c="#1b365d">Arrêté le présent bulletin à la somme de :</Text>
              <Text size="md" fw={800} c="#1b365d" mt={5}>
                {montantEnLettres(data.resteAPayer)} ({data.resteAPayer.toLocaleString()}) Francs CFA
              </Text>
            </Box>
          </Paper>

          {/* MESSAGE ET SIGNATURE */}
          <Paper p="xl" radius={0} style={{ borderTop: '1px solid #e9ecef' }}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Box>
                <Text size="xs" c="dimmed">Observations:</Text>
                <Text size="sm" fs="italic" c="dimmed" mt={4}>
                  {data.atelier?.message_facture || "Merci pour votre travail. En cas d'erreur, veuillez contacter le service comptable."}
                </Text>
              </Box>
              <Box ta="right">
                <Box mt={30} style={{ borderTop: '1px solid #000', width: 200, marginLeft: 'auto' }} />
                <Text size="xs" c="dimmed" mt={4}>Signature et cachet de l'employeur</Text>
              </Box>
            </SimpleGrid>
          </Paper>

          {/* PIED DE PAGE */}
          <Paper p="md" radius={0} ta="center" bg="gray.0">
            <Text size="xs" c="gray.5">
              Document généré automatiquement par Gestion Couture - Gestion d'atelier professionnel
            </Text>
            <Text size="xs" c="gray.5" mt={2}>
              © {new Date().getFullYear()} - Tous droits réservés
            </Text>
          </Paper>
        </Stack>
      </div>

      {/* ACTIONS */}
      <Divider />
      <Group justify="flex-end" p="md" className="no-print">
        <Button variant="light" onClick={onClose} leftSection={<IconX size={16} />} radius="md">
          Fermer
        </Button>
        <Button
          onClick={handlePrint}
          variant="outline"
          color="teal"
          leftSection={<IconPrinter size={16} />}
          radius="md"
        >
          Imprimer
        </Button>
        <Button
          onClick={handlePDF}
          variant="gradient"
          gradient={{ from: '#1b365d', to: '#2a4a7a' }}
          leftSection={<IconFile size={16} />}
          radius="md"
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
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </Modal>
  );
};

export default BulletinSalaire;