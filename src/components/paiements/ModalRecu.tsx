// src/components/paiements/ModalRecu.tsx
import { useEffect, useState, useRef } from 'react';
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
  SimpleGrid,
  LoadingOverlay,
  Center,
  Image,
  Badge,
} from '@mantine/core';
import {
  IconPrinter,
  IconX,
  IconBuildingStore,
  IconUser,
  IconPhone,
} from '@tabler/icons-react';
import { getDb, ConfigurationAtelier } from '../../database/db';

interface VenteRecu {
  id: number;
  code_vente: string;
  type_vente: 'commande' | 'pret_a_porter' | 'matiere';
  date_vente: string;
  client_nom: string | null;
  client_id: string | null;
  montant_total: number;
  montant_regle: number;
  mode_paiement: string | null;
  statut: string;
}

interface DetailRecu {
  id: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
}

interface Props {
  commande: { id: number } | VenteRecu;
  onClose: () => void;
}

const ModalRecu: React.FC<Props> = ({ commande, onClose }) => {
  const [data, setData] = useState<VenteRecu | null>(null);
  const [details, setDetails] = useState<DetailRecu[]>([]);
  const [config, setConfig] = useState<ConfigurationAtelier | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const db = await getDb();
        
        let venteData: VenteRecu | null = null;
        
        if ('code_vente' in commande && commande.code_vente) {
          venteData = commande as VenteRecu;
        } else {
          const vente = await db.select<VenteRecu[]>(`
            SELECT 
              id, 
              code_vente, 
              type_vente,
              date_vente, 
              client_nom, 
              client_id, 
              montant_total, 
              montant_regle, 
              mode_paiement,
              statut
            FROM ventes 
            WHERE id = ?
          `, [commande.id]);

          if (vente.length === 0) {
            setLoading(false);
            return;
          }
          venteData = vente[0];
        }
        
        const detailsData = await db.select<DetailRecu[]>(`
          SELECT id, designation, quantite, prix_unitaire, total
          FROM vente_details
          WHERE vente_id = ?
        `, [venteData.id]);
        
        setData(venteData);
        setDetails(detailsData);
        
        const conf = await db.select<ConfigurationAtelier[]>(`
          SELECT * FROM atelier WHERE id = 1
        `);
        setConfig(conf[0] || null);
      } catch (e) {
        console.error("Erreur chargement reçu:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [commande]);

  const total = data?.montant_total || 0;
  const paye = data?.montant_regle || 0;
  const reste = total - paye;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'commande': return 'Sur mesure';
      case 'pret_a_porter': return 'Prêt-à-porter';
      case 'matiere': return 'Matière';
      default: return type;
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    let stylesHTML = '';
    styles.forEach((style) => {
      if (style.tagName === 'STYLE') {
        stylesHTML += style.outerHTML;
      } else if (style.tagName === 'LINK') {
        stylesHTML += `<link rel="stylesheet" href="${(style as HTMLLinkElement).href}">`;
      }
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les popups pour l'impression");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reçu ${data?.code_vente || ''}</title>
        ${stylesHTML}
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; margin: 0; background: white; }
          .print-container { max-width: 800px; margin: 0 auto; }
          @media print { body { padding: 20px; margin: 0; } }
          .header { text-align: center; margin-bottom: 30px; }
          .receipt-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .receipt-table th, .receipt-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .receipt-table th { background-color: #1b365d; color: white; }
          .total { text-align: right; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="print-container">${printContent.innerHTML}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const nombreEnLettres = (montant: number): string => {
    if (montant >= 1000000) return `${Math.floor(montant / 1000000)} million(s) ${nombreEnLettres(montant % 1000000)}`;
    if (montant >= 1000) return `${Math.floor(montant / 1000)} mille ${nombreEnLettres(montant % 1000)}`;
    if (montant === 0) return 'zéro';
    const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    if (montant < 10) return unites[montant];
    if (montant < 20) return montant === 11 ? 'onze' : montant === 12 ? 'douze' : `${dizaines[1]}${montant > 10 ? '-' + unites[montant - 10] : ''}`;
    const d = Math.floor(montant / 10);
    const u = montant % 10;
    if (d === 7 || d === 9) return `${dizaines[d - 1]}${u > 0 ? '-' + unites[u] : ''}`;
    return `${dizaines[d]}${u > 0 ? '-' + unites[u] : ''}`;
  };

  const montantLettres = `${nombreEnLettres(paye)} ${paye >= 1000 ? 'Francs' : 'Franc'} CFA`;

  if (loading) {
    return (
      <Modal opened={true} onClose={onClose} size="lg" centered title="Reçu de paiement">
        <Center style={{ height: 200 }}><LoadingOverlay visible={true} /></Center>
      </Modal>
    );
  }

  if (!data) {
    return (
      <Modal opened={true} onClose={onClose} size="lg" centered title="Reçu de paiement">
        <Center>
          <Text c="red">Erreur: Données non trouvées</Text>
        </Center>
        <Group justify="center" mt="md">
          <Button onClick={onClose}>Fermer</Button>
        </Group>
      </Modal>
    );
  }

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="lg"
      centered
      title={`Reçu N° : ${data.code_vente}`}
      radius="md"
      styles={{
        header: { backgroundColor: '#1b365d', padding: '16px 24px' },
        title: { color: 'white', fontWeight: 600, fontSize: '1.1rem' },
        body: { padding: 0 },
      }}
    >
      <div ref={printRef}>
        <Stack gap={0}>
          <Paper p="xl" radius={0} style={{ borderBottom: '2px solid #e9ecef' }}>
            <SimpleGrid cols={{ base: 2 }} spacing="md" mb="md">
              <Box>
                <Text size="sm" fw={600}>Gérant(e) :</Text>
                <Text size="sm">KORGO Jacques</Text>
              </Box>
              <Box ta="right">
                <Text size="sm" fw={600}>Date d'émission :</Text>
                <Text size="sm">{new Date().toLocaleDateString('fr-FR')}</Text>
              </Box>
            </SimpleGrid>

            <Group justify="space-between" align="center" wrap="nowrap" mb="md">
              <Box style={{ flex: 1 }}>
                <Group justify="center" mb={4}>
                  <IconBuildingStore size={28} color="#1b365d" />
                  <Title order={2} size="h3" c="#1b365d">
                    {config?.nom_atelier || "GESTION COUTURE"}
                  </Title>
                </Group>
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed">{config?.adresse || "Ouagadougou, Burkina Faso"}</Text>
                  <Text size="xs" c="dimmed">Tel: {config?.telephone || "70 00 00 00"}</Text>
                  {config?.email && <Text size="xs" c="dimmed">Email: {config.email}</Text>}
                  {config?.ifu && <Text size="xs" c="dimmed">IFU: {config.ifu}</Text>}
                </Stack>
              </Box>
              {config?.logo_base64 && (
                <Box>
                  <Image src={config.logo_base64} w={80} h={80} fit="contain" radius="md" style={{ border: '1px solid #dee2e6', padding: 8 }} />
                </Box>
              )}
            </Group>

            <Divider my="md" />

            <SimpleGrid cols={{ base: 2 }} spacing="md" mb="md">
              <Box>
                <Text size="sm" fw={600}>Date de la vente :</Text>
                <Text size="sm">{new Date(data.date_vente).toLocaleDateString('fr-FR')}</Text>
              </Box>
              <Box ta="right">
                <Text size="sm" fw={600}>Type de vente :</Text>
                <Badge color="violet" size="sm">{getTypeLabel(data.type_vente)}</Badge>
              </Box>
            </SimpleGrid>

            <Box mb="md">
              <Text fw={700} size="sm" mb="xs" tt="uppercase">INFORMATIONS DU CLIENT</Text>
              <Paper p="xs" radius="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                <Group gap="lg" wrap="wrap">
                  <Group gap={4}><IconUser size={14} color="#1b365d" /><Text size="sm" c="dimmed">Nom :</Text><Text fw={600} size="sm">{data.client_nom || 'Client non renseigné'}</Text></Group>
                  {data.client_id && <Group gap={4}><IconPhone size={14} color="#1b365d" /><Text size="sm" c="dimmed">Tél :</Text><Text fw={600} size="sm">{data.client_id}</Text></Group>}
                </Group>
              </Paper>
            </Box>

            <Divider my="md" />

            <Text fw={700} size="sm" mb="xs" tt="uppercase">DÉTAILS DE LA VENTE</Text>
            <Table striped highlightOnHover>
              <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                <Table.Tr>
                  <Table.Th style={{ color: 'white', width: 50 }}>N°</Table.Th>
                  <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                  <Table.Th style={{ color: 'white', textAlign: 'center', width: 80 }}>Qté</Table.Th>
                  <Table.Th style={{ color: 'white', textAlign: 'right', width: 120 }}>Prix unitaire</Table.Th>
                  <Table.Th style={{ color: 'white', textAlign: 'right', width: 120 }}>Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {details.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} ta="center">Aucun détail disponible</Table.Td>
                  </Table.Tr>
                ) : (
                  details.map((detail, idx) => (
                    <Table.Tr key={detail.id}>
                      <Table.Td ta="center">{idx + 1}</Table.Td>
                      <Table.Td>{detail.designation}</Table.Td>
                      <Table.Td ta="center">{detail.quantite}</Table.Td>
                      <Table.Td ta="right">{detail.prix_unitaire.toLocaleString()} FCFA</Table.Td>
                      <Table.Td ta="right" fw={600}>{detail.total.toLocaleString()} FCFA</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>

            <Box mt="xl">
              <Text fw={700} size="sm" mb="xs" tt="uppercase">RÉCAPITULATIF DES PAIEMENTS</Text>
              <Paper p="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                <SimpleGrid cols={{ base: 2 }} spacing="md">
                  <Box>
                    <Text size="sm" c="dimmed">Montant total</Text>
                    <Text fw={700} size="lg">{total.toLocaleString()} FCFA</Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">Montant déjà réglé</Text>
                    <Text fw={700} size="lg" c="green">{paye.toLocaleString()} FCFA</Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">Mode de paiement</Text>
                    <Text fw={600}>{data.mode_paiement || 'Non spécifié'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">Statut</Text>
                    <Badge color={reste === 0 ? 'green' : 'orange'} size="md">
                      {reste === 0 ? 'Payé' : paye > 0 ? 'Partiel' : 'Non payé'}
                    </Badge>
                  </Box>
                </SimpleGrid>
              </Paper>
            </Box>

            <Paper p="md" mt="xl" style={{ backgroundColor: '#f8f9fa', borderRadius: 8 }}>
              <Text size="sm">
                Arrêté le présent reçu à la somme de : <strong>
                  {montantLettres} ({paye.toLocaleString()}) Francs CFA
                </strong>
              </Text>
            </Paper>

            <SimpleGrid cols={{ base: 2 }} spacing="md" mt="xl">
              <Box></Box>
              <Box ta="right">
                <Text size="sm" fw={600}>Signature et cachet</Text>
                <Box mt={20} style={{ borderTop: '1px solid #000', width: 150, marginLeft: 'auto' }} />
              </Box>
            </SimpleGrid>

            {config?.message_facture_defaut && (
              <Text size="xs" c="dimmed" ta="center" mt="xl" fs="italic">
                {config.message_facture_defaut}
              </Text>
            )}
          </Paper>
        </Stack>
      </div>

      <Divider />
      <Group justify="flex-end" p="md" className="no-print">
        <Button variant="light" onClick={onClose} leftSection={<IconX size={16} />}>Fermer</Button>
        <Button onClick={handlePrint} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }} leftSection={<IconPrinter size={16} />}>
          Imprimer
        </Button>
      </Group>
    </Modal>
  );
};

export default ModalRecu;