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
} from '@mantine/core';
import {
  IconPrinter,
  IconX,
  IconBuildingStore,
} from '@tabler/icons-react';
import { getDb, ConfigurationAtelier } from '../../database/db';

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

interface RecuData {
  commande: Commande;
  paiements: Paiement[];
}

interface Props {
  commande: { id: number };
  onClose: () => void;
}

const ModalRecu: React.FC<Props> = ({ commande, onClose }) => {
  const [data, setData] = useState<RecuData | null>(null);
  const [config, setConfig] = useState<ConfigurationAtelier | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const db = await getDb();
        
        // Récupérer la vente directement
        const vente = await db.select<{
          id: number;
          client_nom: string;
          client_telephone: string;
          montant_total: number;
          montant_regle: number;
          date_vente: string;
          mode_paiement: string;
        }[]>(`
          SELECT id, client_nom, client_telephone, montant_total, montant_regle, date_vente, mode_paiement
          FROM ventes 
          WHERE id = ?
        `, [commande.id]);

        if (!vente.length) {
          setLoading(false);
          return;
        }

        const recuData: RecuData = {
          commande: {
            id: vente[0].id,
            nom_prenom: vente[0].client_nom || 'Client',
            telephone_id: vente[0].client_telephone || '',
            total: vente[0].montant_total
          },
          paiements: [{
            montant: vente[0].montant_regle,
            date_paiement: vente[0].date_vente,
            mode: vente[0].mode_paiement
          }]
        };
        
        setData(recuData);
        
        const conf = await db.select<ConfigurationAtelier[]>(`
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

  const totalPaye = data?.paiements.reduce((s, p) => s + (p.montant || 0), 0) || 0;
  const totalCommande = data?.commande?.total || 0;
  const reste = totalCommande - totalPaye;
  let cumul = 0;

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

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reçu de règlement</title>
        ${stylesHTML}
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; margin: 0; background: white; }
          .print-container { max-width: 800px; margin: 0 auto; }
          @media print { body { padding: 0; margin: 0; } }
        </style>
      </head>
      <body>
        <div class="print-container">${printContent.innerHTML}</div>
      </body>
      </html>
    `);
    iframeDoc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
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

  if (loading) {
    return (
      <Modal opened={true} onClose={onClose} size="xl" centered title="Reçu de paiement">
        <Center style={{ height: 200 }}><LoadingOverlay visible={true} /></Center>
      </Modal>
    );
  }

  if (!data) return null;

  const paiementsAffiches = data.paiements.map((p) => {
    cumul += p.montant;
    return { ...p, cumul, reste: totalCommande - cumul };
  });

  const dernierPaiement = paiementsAffiches[paiementsAffiches.length - 1];
  const montantVersement = dernierPaiement?.montant || totalPaye;

  const montantLettres = `${nombreEnLettres(montantVersement)} ${montantVersement >= 1000 ? 'Francs' : 'Franc'} CFA`;

  return (
    <Modal opened={true} onClose={onClose} size="xl" centered title="Reçu de règlement" radius="md"
      styles={{
        header: { backgroundColor: '#1b365d', padding: '16px 24px' },
        title: { color: 'white', fontWeight: 600, fontSize: '1.1rem' },
        body: { padding: 0 },
      }}
    >
      <div ref={printRef}>
        <Stack gap={0}>
          <Paper p="xl" radius={0} style={{ borderBottom: '2px solid #ddd' }}>
            <SimpleGrid cols={{ base: 2 }} spacing="md" mb="md">
              <Box><Text size="sm" fw={600}>Gérant(e) :</Text><Text size="sm">KORGO Jacques</Text></Box>
              <Box ta="right"><Text size="sm" fw={600}>Date :</Text><Text size="sm">{new Date().toLocaleDateString('fr-FR')}</Text></Box>
            </SimpleGrid>

            <Group justify="space-between" align="center" wrap="nowrap" mb="md">
              <Box style={{ flex: 1 }}>
                <Group justify="center" mb={4}>
                  <IconBuildingStore size={24} color="#1b365d" />
                  <Title order={2} size="h3" c="#1b365d">{config?.nom_atelier || "GESTION COUTURE"}</Title>
                </Group>
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed">Atelier de couture</Text>
                  <Text size="xs" c="dimmed">{config?.adresse || "Ouagadougou, Burkina Faso"}</Text>
                  <Text size="xs" c="dimmed">Tel: {config?.telephone || "70 00 00 00"}</Text>
                </Stack>
              </Box>
              {config?.logo_base64 && (
                <Box><Image src={config.logo_base64} w={80} h={80} fit="contain" radius="md" style={{ border: '1px solid #dee2e6', padding: 8 }} /></Box>
              )}
            </Group>

            <Title order={3} size="h4" ta="center" my="md" tt="uppercase">Reçu de règlement</Title>

            <Table striped highlightOnHover mt="md">
              <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                <Table.Tr>
                  <Table.Th style={{ color: 'white' }}>Référence</Table.Th>
                  <Table.Th style={{ color: 'white' }}>Date</Table.Th>
                  <Table.Th style={{ color: 'white' }}>Mode Règlement</Table.Th>
                  <Table.Th style={{ color: 'white', textAlign: 'right' }}>Montant total</Table.Th>
                  <Table.Th style={{ color: 'white', textAlign: 'right' }}>Versement</Table.Th>
                  <Table.Th style={{ color: 'white', textAlign: 'right' }}>Cumul</Table.Th>
                  <Table.Th style={{ color: 'white', textAlign: 'right' }}>Reste</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paiementsAffiches.map((p, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td>CMD-{data.commande.id}</Table.Td>
                    <Table.Td>{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</Table.Td>
                    <Table.Td>{p.mode === 'cash' ? 'Espèce' : p.mode === 'mobile' ? 'Mobile Money' : p.mode}</Table.Td>
                    <Table.Td ta="right">{totalCommande.toLocaleString()}</Table.Td>
                    <Table.Td ta="right">{p.montant.toLocaleString()}</Table.Td>
                    <Table.Td ta="right">{p.cumul.toLocaleString()}</Table.Td>
                    <Table.Td ta="right">{p.reste.toLocaleString()}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <SimpleGrid cols={{ base: 2 }} spacing="md" mt="xl">
              <Box><Text fw={600}>Montant versé :</Text><Text size="xl" fw={700} c="green">{montantVersement.toLocaleString()} FCFA</Text></Box>
              <Box ta="right"><Text fw={600}>Reste à payer :</Text><Text size="xl" fw={700} c={reste > 0 ? "red" : "green"}>{reste.toLocaleString()} FCFA</Text></Box>
            </SimpleGrid>

            <Paper p="md" mt="md" style={{ backgroundColor: '#f8f9fa', borderRadius: 8 }}>
              <Text size="sm">Arrêté le présent reçu à la somme de : <strong>{montantLettres} ({montantVersement.toLocaleString()}) Francs CFA</strong></Text>
            </Paper>

            <SimpleGrid cols={{ base: 2 }} spacing="md" mt="xl">
              <Box ta="right"><Text size="sm" fw={600}>Signature et cachet</Text><Box mt={20} style={{ borderTop: '1px solid #000', width: 150, marginLeft: 'auto' }} /></Box>
            </SimpleGrid>

            {config?.message_facture && <Text size="xs" c="dimmed" ta="center" mt="xl" fs="italic">{config.message_facture}</Text>}
          </Paper>
        </Stack>
      </div>

      <Divider />
      <Group justify="flex-end" p="md" className="no-print">
        <Button variant="light" onClick={onClose} leftSection={<IconX size={16} />}>Fermer</Button>
        <Button onClick={handlePrint} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }} leftSection={<IconPrinter size={16} />}>Imprimer</Button>
      </Group>
    </Modal>
  );
};

export default ModalRecu;