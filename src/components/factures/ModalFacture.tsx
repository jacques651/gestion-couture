// src/components/factures/ModalFacture.tsx
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
  LoadingOverlay,
  Center,
  NumberInput,
  Select,
} from '@mantine/core';
import {
  IconPrinter,
  IconX,
  IconBuildingStore,
  IconMail,
  IconMapPin,
  IconPhone,
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
  email?: string;
  adresse?: string;
}

interface CommandeFacture {
  id?: number;
  client: ClientFacture;
  lignes: LigneFacture[];
  numero?: string;
  avance?: number;
  reste?: number;
  total_general?: number;
  date_commande?: string;
}

interface ModalFactureProps {
  commande: CommandeFacture;
  onClose: () => void;
  onConfirmPaiement?: (montant: number, mode: string) => void;
}

const ModalFacture: React.FC<ModalFactureProps> = ({ commande, onClose, onConfirmPaiement }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [atelier, setAtelier] = useState<ConfigurationAtelier | null>(null);
  const [loading, setLoading] = useState(true);
  const [montantPaiement, setMontantPaiement] = useState(commande.total_general || 0);
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [showPaiementModal, setShowPaiementModal] = useState(false);

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

  const total = commande.total_general ?? commande.lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
  const reste = total - (commande.avance || 0);

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
        <title>Facture ${commande.numero || commande.id}</title>
        ${stylesHTML}
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 20px; margin: 0; background: white; }
          .print-container { max-width: 800px; margin: 0 auto; }
          @media print { body { padding: 0; margin: 0; } }
          .facture-table th, .facture-table td { border: 1px solid #dee2e6; }
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

  const handleConfirmerPaiement = () => {
    if (onConfirmPaiement) {
      onConfirmPaiement(montantPaiement, modePaiement);
    }
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
      <Modal opened={true} onClose={onClose} size="xl" centered title="Facture">
        <Center style={{ height: 200 }}><LoadingOverlay visible={true} /></Center>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        opened={true}
        onClose={onClose}
        size="xl"
        centered
        title={`Facture N° : ${commande.numero || `FAC-${Date.now()}`}`}
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
                  <Text size="sm" fw={600}>Date :</Text>
                  <Text size="sm">{new Date().toLocaleDateString('fr-FR')}</Text>
                </Box>
              </SimpleGrid>

              <Group justify="space-between" align="center" wrap="nowrap" mb="md">
                <Box style={{ flex: 1 }}>
                  <Group justify="center" mb={4}>
                    <IconBuildingStore size={28} color="#1b365d" />
                    <Title order={2} size="h3" c="#1b365d">
                      {atelier?.nom_atelier || "GESTION COUTURE"}
                    </Title>
                  </Group>
                  <Stack gap={2} align="center">
                    <Text size="xs" c="dimmed">{atelier?.adresse || "Ouagadougou, Burkina Faso"}</Text>
                    <Text size="xs" c="dimmed">Tel: {atelier?.telephone || "70 00 00 00"}</Text>
                    {atelier?.email && <Text size="xs" c="dimmed">Email: {atelier.email}</Text>}
                    {atelier?.nif && <Text size="xs" c="dimmed">NIF: {atelier.nif}</Text>}
                  </Stack>
                </Box>
                {atelier?.logo_base64 && (
                  <Box>
                    <Image src={atelier.logo_base64} w={100} h={100} fit="contain" radius="md" style={{ border: '1px solid #dee2e6', padding: 8 }} />
                  </Box>
                )}
              </Group>

              <Divider my="md" />

              <SimpleGrid cols={{ base: 2 }} spacing="md">
                <Box>
                  <Text size="sm" fw={600}>Date de la Facture</Text>
                  <Text size="sm">{commande.date_commande ? new Date(commande.date_commande).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</Text>
                </Box>
                <Box ta="right">
                  <Text size="sm" fw={600}>Facture N° :</Text>
                  <Text size="sm" fw={700} c="#1b365d">{commande.numero || `FAC-${Date.now()}`}</Text>
                </Box>
              </SimpleGrid>

              <Divider my="md" />

              <Box mb="md">
                <Text fw={700} size="sm" mb="xs" tt="uppercase">INFORMATIONS DU CLIENT</Text>
                <Paper p="xs" radius="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                  <Group gap="lg" wrap="wrap">
                    <Group gap={4}><IconUser size={14} color="#1b365d" /><Text size="sm" c="dimmed">Nom :</Text><Text fw={600} size="sm">{commande.client.nom_prenom}</Text></Group>
                    <Group gap={4}><IconPhone size={14} color="#1b365d" /><Text size="sm" c="dimmed">Tél :</Text><Text fw={600} size="sm">{commande.client.telephone_id}</Text></Group>
                    {commande.client.email && <Group gap={4}><IconMail size={14} color="#1b365d" /><Text size="sm" c="dimmed">Email :</Text><Text fw={500} size="sm">{commande.client.email}</Text></Group>}
                    {commande.client.adresse && <Group gap={4}><IconMapPin size={14} color="#1b365d" /><Text size="sm" c="dimmed">Adresse :</Text><Text fw={500} size="sm">{commande.client.adresse}</Text></Group>}
                  </Group>
                </Paper>
              </Box>

              <Divider my="md" />

              <Table striped highlightOnHover className="facture-table">
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
                  {commande.lignes.map((l, i) => (
                    <Table.Tr key={i}>
                      <Table.Td ta="center">{i + 1}</Table.Td>
                      <Table.Td>{l.designation}</Table.Td>
                      <Table.Td ta="center">{l.quantite}</Table.Td>
                      <Table.Td ta="right">{l.prix_unitaire.toLocaleString()} FCFA</Table.Td>
                      <Table.Td ta="right" fw={600}>{(l.quantite * l.prix_unitaire).toLocaleString()} FCFA</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              <Box mt="xl">
                <SimpleGrid cols={{ base: 2 }} spacing="md">
                  <Box>
                    {commande.avance !== undefined && commande.avance > 0 && (
                      <>
                        <Text size="sm" c="dimmed">Avance</Text>
                        <Text fw={600} c="green">{commande.avance.toLocaleString()} FCFA</Text>
                      </>
                    )}
                  </Box>
                  <Box ta="right">
                    <Text size="sm" c="dimmed">Montant total</Text>
                    <Text fw={800} size="xl" c="#1b365d">{total.toLocaleString()} FCFA</Text>
                    {reste > 0 && <Text size="sm" c="red">Reste à payer : {reste.toLocaleString()} FCFA</Text>}
                  </Box>
                </SimpleGrid>
              </Box>

              <Paper p="md" mt="xl" style={{ backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                <Text size="sm">
                  Arrêté la présente facture à la somme de : <strong>
                    {montantEnLettres(total)} ({total.toLocaleString()}) Francs CFA
                  </strong>
                </Text>
              </Paper>

              <SimpleGrid cols={{ base: 2 }} spacing="md" mt="xl">
                <Box ta="right">
                  <Text size="sm" fw={600}>Signature et cachet</Text>
                  <Box mt={20} style={{ borderTop: '1px solid #000', width: 150, marginLeft: 'auto' }} />
                </Box>
              </SimpleGrid>

              {atelier?.message_facture && (
                <Text size="xs" c="dimmed" ta="center" mt="xl" fs="italic">{atelier.message_facture}</Text>
              )}
            </Paper>
          </Stack>
        </div>

        <Divider />
        <Group justify="flex-end" p="md" className="no-print">
          <Button variant="light" onClick={onClose} leftSection={<IconX size={16} />}>Fermer</Button>
          <Button onClick={handlePrint} variant="outline" color="teal" leftSection={<IconPrinter size={16} />}>Imprimer</Button>
          <Button onClick={() => setShowPaiementModal(true)} variant="gradient" gradient={{ from: 'green', to: 'teal' }} leftSection={<IconCash size={16} />}>
            Procéder au paiement
          </Button>
        </Group>
      </Modal>

      {/* Modal de paiement */}
      <Modal opened={showPaiementModal} onClose={() => setShowPaiementModal(false)} title="💰 Paiement de la facture" size="md" centered radius="lg">
        <Stack gap="md">
          <Text size="sm">Montant total à payer : <strong>{total.toLocaleString()} FCFA</strong></Text>
          {reste > 0 && <Text size="sm" c="orange">Reste à payer : <strong>{reste.toLocaleString()} FCFA</strong></Text>}
          
          <NumberInput 
            label="Montant du paiement" 
            value={montantPaiement} 
            onChange={(val) => setMontantPaiement(Number(val) || 0)} 
            min={0} 
            max={total} 
            step={1000} 
            required 
          />
          
          <Select 
            label="Mode de paiement" 
            data={[
              { value: 'Espèces', label: '💵 Espèces' },
              { value: 'Orange money', label: '📱 Orange Money' },
              { value: 'Moov money', label: '📱 Moov Money' },
              { value: 'Wave', label: '🌊 Wave' }
            ]} 
            value={modePaiement} 
            onChange={(val) => setModePaiement(val || 'Espèces')} 
          />
          
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setShowPaiementModal(false)}>Annuler</Button>
            <Button variant="gradient" gradient={{ from: 'green', to: 'teal' }} onClick={handleConfirmerPaiement}>Confirmer le paiement</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default ModalFacture;