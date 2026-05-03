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
  LoadingOverlay,
  Center,
  Image,
  Badge,
} from '@mantine/core';
import {
  IconPrinter,
  IconX,
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
  if (montant === 0) return 'zéro';
  if (montant < 0) return 'moins ' + nombreEnLettres(-montant);

  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  const convertCentaines = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cent';
    
    let result = '';
    const centaines = Math.floor(n / 100);
    const reste = n % 100;

    if (centaines > 0) {
      result += centaines === 1 ? 'cent' : unites[centaines] + ' cent';
      if (reste === 0 && centaines > 1) result += 's';
      if (reste > 0) result += ' ';
    }

    if (reste > 0) {
      if (reste < 10) {
        result += unites[reste];
      } else if (reste < 20) {
        const speciaux: Record<number, string> = {
          10: 'dix', 11: 'onze', 12: 'douze', 13: 'treize', 14: 'quatorze',
          15: 'quinze', 16: 'seize', 17: 'dix-sept', 18: 'dix-huit', 19: 'dix-neuf'
        };
        result += speciaux[reste];
      } else {
        const d = Math.floor(reste / 10);
        const u = reste % 10;
        if (d === 7 || d === 9) {
          result += dizaines[d - 1] + (u > 0 ? '-' + (u === 1 ? 'et-un' : unites[u]) : '');
        } else {
          result += dizaines[d] + (u > 0 ? (u === 1 && d !== 8 ? ' et un' : '-' + unites[u]) : '');
        }
      }
    }

    return result.trim();
  };

  const milliards = Math.floor(montant / 1000000000);
  const millions = Math.floor((montant % 1000000000) / 1000000);
  const milliers = Math.floor((montant % 1000000) / 1000);
  const reste = montant % 1000;

  let result = '';

  if (milliards > 0) {
    result += convertCentaines(milliards) + (milliards === 1 ? ' milliard ' : ' milliards ');
  }
  if (millions > 0) {
    result += convertCentaines(millions) + (millions === 1 ? ' million ' : ' millions ');
  }
  if (milliers > 0) {
    result += (milliers === 1 ? '' : convertCentaines(milliers) + ' ') + 'mille ';
  }
  if (reste > 0 || montant === 0) {
    result += convertCentaines(reste);
  }

  return result.trim();
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
    size="md"
    centered
    title={`Reçu N° ${data.code_vente}`}
    radius="md"
    styles={{
      header: { backgroundColor: '#1b365d', padding: '12px 20px' },
      title: { color: 'white', fontWeight: 600, fontSize: '1rem' },
      body: { padding: 0 },
    }}
  >
    <div ref={printRef}>
      <Stack gap={0}>
        {/* EN-TÊTE COMPACT */}
        <Paper p="md" radius={0} style={{ borderBottom: '2px solid #e9ecef' }}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              {config?.logo_base64 && (
                <Image src={config.logo_base64} w={50} h={50} fit="contain" radius="md" style={{ border: '1px solid #dee2e6', padding: 4 }} />
              )}
              <Box>
                <Title order={4} c="#1b365d">{config?.nom_atelier || "GESTION COUTURE"}</Title>
                <Text size="xs" c="dimmed">{config?.adresse || "Ouagadougou"}</Text>
                <Text size="xs" c="dimmed">Tel: {config?.telephone || "-"} | IFU: {config?.ifu || "-"}</Text>
              </Box>
            </Group>
            <Box ta="right">
              <Text size="xs" c="dimmed">REÇU N°</Text>
              <Text fw={700} size="sm" c="#1b365d">{data.code_vente}</Text>
              <Text size="xs" c="dimmed" mt={4}>{new Date().toLocaleDateString('fr-FR')}</Text>
            </Box>
          </Group>
        </Paper>

        {/* CLIENT + MONTANT */}
        <Paper p="md" radius={0} style={{ borderBottom: '2px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
          <Group justify="space-between" wrap="wrap">
            <Box>
              <Text size="xs" c="dimmed">CLIENT</Text>
              <Text size="sm" fw={600}>{data.client_nom || 'Client non renseigné'}</Text>
              {data.client_id && <Text size="xs" c="dimmed">Tél : {data.client_id}</Text>}
            </Box>
            <Group gap="xl">
              <Box ta="right">
                <Text size="xs" c="dimmed">Total</Text>
                <Text fw={700} size="sm">{total.toLocaleString()} FCFA</Text>
              </Box>
              <Box ta="right">
                <Text size="xs" c="dimmed">Payé</Text>
                <Text fw={700} size="sm" c="green">{paye.toLocaleString()} FCFA</Text>
              </Box>
              {reste > 0 && (
                <Box ta="right">
                  <Text size="xs" c="dimmed">Reste</Text>
                  <Text fw={700} size="sm" c="red">{reste.toLocaleString()} FCFA</Text>
                </Box>
              )}
            </Group>
          </Group>
        </Paper>

        {/* TABLEAU */}
        <Paper p="md" radius={0}>
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#1b365d' }}>
              <Table.Tr>
                <Table.Th style={{ color: 'white', width: 30 }}>N°</Table.Th>
                <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'center', width: 60 }}>Qté</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right', width: 100 }}>Prix unit.</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right', width: 100 }}>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {details.length === 0 ? (
                <Table.Tr><Table.Td colSpan={5} ta="center" py={20}><Text c="dimmed">Aucun détail</Text></Table.Td></Table.Tr>
              ) : (
                details.map((detail, idx) => (
                  <Table.Tr key={detail.id}>
                    <Table.Td ta="center">{idx + 1}</Table.Td>
                    <Table.Td><Text size="sm">{detail.designation}</Text></Table.Td>
                    <Table.Td ta="center">{detail.quantite}</Table.Td>
                    <Table.Td ta="right">{detail.prix_unitaire.toLocaleString()} FCFA</Table.Td>
                    <Table.Td ta="right" fw={600}>{detail.total.toLocaleString()} FCFA</Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>

          {/* RÉCAP + SIGNATURE */}
          <Group justify="space-between" mt="md" p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: 8 }}>
            <Box>
              <Text size="xs" c="dimmed">Arrêté à la somme de :</Text>
              <Text size="sm" fs="italic">{montantLettres}</Text>
              <Badge color={reste === 0 ? 'green' : 'orange'} size="sm" mt={4}>
                {reste === 0 ? 'Payé' : paye > 0 ? 'Partiel' : 'Non payé'}
              </Badge>
            </Box>
            <Box ta="center" style={{ width: 120 }}>
              <Box mb={20} />
              <Divider />
              <Text size="xs" c="dimmed" mt={4}>Signature & cachet</Text>
            </Box>
          </Group>

          {config?.message_facture_defaut && (
            <Text size="xs" c="dimmed" ta="center" mt="xl" fs="italic">{config.message_facture_defaut}</Text>
          )}
        </Paper>
      </Stack>
    </div>

    <Divider />
    <Group justify="flex-end" p="md" gap="xs">
      <Button variant="light" size="xs" onClick={onClose} leftSection={<IconX size={14} />}>Fermer</Button>
      <Button size="xs" onClick={handlePrint} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }} leftSection={<IconPrinter size={14} />}>Imprimer</Button>
    </Group>
  </Modal>
);
};

export default ModalRecu;