// components/ventes/ModalFacture.tsx
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
  Badge,
} from '@mantine/core';
import {
  IconPrinter,
  IconX,
  IconBuildingStore,
  IconPhone,
  IconUser,
  IconCash,
  IconShoppingBag,
  IconPackage,
  IconTools,
} from '@tabler/icons-react';
import { getDb, ConfigurationAtelier } from '../../database/db';

interface LigneFacture {
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  type: 'article' | 'matiere' | 'prestation';
}

interface VenteFacture {
  id?: number;
  code_vente?: string;
  type_vente?: 'commande' | 'pret_a_porter' | 'matiere';
  date_vente?: string;
  client_id?: string;
  client_nom?: string;
  mode_paiement?: string;
  montant_total?: number;
  montant_regle?: number;
  montant_restant?: number;
  statut?: string;
  observation?: string;
  lignes?: LigneFacture[];
  total_general?: number;
  avance?: number;
  reste?: number;
  numero?: string;
  date_commande?: string;
}

interface ModalFactureProps {
  vente: VenteFacture;
  onClose: () => void;
  onConfirmPaiement?: (montant: number, mode: string) => void;
  onRefresh?: () => void;
}

const ModalFacture: React.FC<ModalFactureProps> = ({ vente, onClose, onConfirmPaiement, onRefresh }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [atelier, setAtelier] = useState<ConfigurationAtelier | null>(null);
  const [loading, setLoading] = useState(true);
  const [montantPaiement, setMontantPaiement] = useState(0);
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [lignes, setLignes] = useState<LigneFacture[]>(vente.lignes || []);

  const total = vente?.total_general ?? vente?.montant_total ?? 0;
  const regle = vente?.avance ?? vente?.montant_regle ?? 0;
  const reste = vente?.reste ?? vente?.montant_restant ?? (total - regle);
  const codeVente = vente?.numero ?? vente?.code_vente ?? 'N/A';
  const dateVente = vente?.date_commande ?? vente?.date_vente ?? new Date().toISOString();

  useEffect(() => {
    setMontantPaiement(reste);
  }, [reste]);

  useEffect(() => {
    const load = async () => {
      try {
        const db = await getDb();
        const conf = await db.select<ConfigurationAtelier[]>(`
          SELECT * FROM atelier WHERE id = 1
        `);
        setAtelier(conf[0] || null);
        
        if ((!lignes || lignes.length === 0) && vente.id) {
          const details = await db.select<any[]>(
            `SELECT vd.*, 
              CASE 
                WHEN vd.article_id IS NOT NULL THEN 'article'
                WHEN vd.matiere_id IS NOT NULL THEN 'matiere'
                ELSE 'prestation'
              END as type_ligne
             FROM vente_details vd
             WHERE vd.vente_id = ?`,
            [vente.id]
          );
          
          const lignesFormatted = details.map(d => ({
            designation: d.designation || 'Sans désignation',
            quantite: d.quantite || 0,
            prix_unitaire: d.prix_unitaire || 0,
            total: d.total || 0,
            type: d.type_ligne as LigneFacture['type']
          }));
          setLignes(lignesFormatted);
        }
      } catch (e) {
        console.error("Erreur chargement atelier", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vente.id]);

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
        <title>Facture ${codeVente}</title>
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

  const handleConfirmerPaiement = async () => {
    if (onConfirmPaiement) {
      await onConfirmPaiement(montantPaiement, modePaiement);
      setShowPaiementModal(false);
      if (onRefresh) onRefresh();
      onClose();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <IconShoppingBag size={14} />;
      case 'matiere': return <IconPackage size={14} />;
      case 'prestation': return <IconTools size={14} />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'Tenue';
      case 'matiere': return 'Matière';
      case 'prestation': return 'Prestation';
      default: return type;
    }
  };

  const nombreEnUnites = (n: number): string => {
    const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    if (n === 0) return '';
    if (n < 10) return unites[n];
    return n.toString();
  };

  const nombreEnDizaines = (n: number): string => {
    const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    if (n < 10) return nombreEnUnites(n);
    if (n < 20) {
      if (n === 11) return 'onze';
      if (n === 12) return 'douze';
      if (n === 13) return 'treize';
      if (n === 14) return 'quatorze';
      if (n === 15) return 'quinze';
      if (n === 16) return 'seize';
      return dizaines[1] + (n > 10 ? '-' + nombreEnUnites(n - 10) : '');
    }
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (d === 7 || d === 9) {
      return dizaines[d - 1] + (u > 0 ? '-' + nombreEnUnites(u) : '');
    }
    return dizaines[d] + (u > 0 ? '-' + nombreEnUnites(u) : '');
  };

  const nombreEnLettres = (montant: number): string => {
    if (montant === 0) return 'zéro';
    
    const milliards = Math.floor(montant / 1000000000);
    const millions = Math.floor((montant % 1000000000) / 1000000);
    const milliers = Math.floor((montant % 1000000) / 1000);
    const resteMontant = montant % 1000;
    
    let result = '';
    
    if (milliards > 0) {
      result += (milliards === 1 ? 'un milliard ' : nombreEnDizaines(milliards) + ' milliards ');
    }
    if (millions > 0) {
      result += (millions === 1 ? 'un million ' : nombreEnDizaines(millions) + ' millions ');
    }
    if (milliers > 0) {
      if (milliers === 1) result += 'mille ';
      else result += nombreEnDizaines(milliers) + ' mille ';
    }
    if (resteMontant > 0) {
      result += nombreEnDizaines(resteMontant);
    }
    
    return result.trim();
  };

  const montantEnLettres = (montant: number): string => {
    const safeMontant = montant || 0;
    const francs = Math.floor(safeMontant);
    const centimes = Math.round((safeMontant - francs) * 100);
    let result = nombreEnLettres(francs) + ' franc' + (francs > 1 ? 's' : '');
    if (centimes > 0) {
      result += ` ${centimes} centime${centimes > 1 ? 's' : ''}`;
    }
    return result;
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
        title={`Facture N° : ${codeVente}`}
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
                    {atelier?.ifu && <Text size="xs" c="dimmed">IFU: {atelier.ifu}</Text>}
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
                  <Text size="sm">{new Date(dateVente).toLocaleDateString('fr-FR')}</Text>
                </Box>
                <Box ta="right">
                  <Text size="sm" fw={600}>Facture N° :</Text>
                  <Text size="sm" fw={700} c="#1b365d">{codeVente}</Text>
                </Box>
              </SimpleGrid>

              <Divider my="md" />

              <Box mb="md">
                <Text fw={700} size="sm" mb="xs" tt="uppercase">INFORMATIONS DU CLIENT</Text>
                <Paper p="xs" radius="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                  <Group gap="lg" wrap="wrap">
                    <Group gap={4}><IconUser size={14} color="#1b365d" /><Text size="sm" c="dimmed">Nom :</Text><Text fw={600} size="sm">{vente.client_nom || 'Client non renseigné'}</Text></Group>
                    {vente.client_id && <Group gap={4}><IconPhone size={14} color="#1b365d" /><Text size="sm" c="dimmed">Tél :</Text><Text fw={600} size="sm">{vente.client_id}</Text></Group>}
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
                  {lignes && lignes.length > 0 ? (
                    lignes.map((l, i) => (
                      <Table.Tr key={i}>
                        <Table.Td ta="center">{i + 1}</Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            {getTypeIcon(l.type)}
                            <Text size="sm">{l.designation || 'Sans désignation'}</Text>
                            <Badge size="xs" variant="light" color="gray">
                              {getTypeLabel(l.type)}
                            </Badge>
                          </Group>
                        </Table.Td>
                        <Table.Td ta="center">{l.quantite || 0}</Table.Td>
                        <Table.Td ta="right">{(l.prix_unitaire || 0).toLocaleString()} FCFA</Table.Td>
                        <Table.Td ta="right" fw={600}>{(l.total || 0).toLocaleString()} FCFA</Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={5} ta="center" py={20}>
                        <Text c="dimmed">Aucun détail disponible</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>

              <Box mt="xl">
                <SimpleGrid cols={{ base: 2 }} spacing="md">
                  <Box>
                    {regle > 0 && (
                      <>
                        <Text size="sm" c="dimmed">Montant déjà réglé</Text>
                        <Text fw={600} c="green">{(regle || 0).toLocaleString()} FCFA</Text>
                      </>
                    )}
                  </Box>
                  <Box ta="right">
                    <Text size="sm" c="dimmed">Montant total</Text>
                    <Text fw={800} size="xl" c="#1b365d">{(total || 0).toLocaleString()} FCFA</Text>
                    {(reste || 0) > 0 && (
                      <Badge color="orange" size="sm" mt={4}>
                        Reste à payer : {(reste || 0).toLocaleString()} FCFA
                      </Badge>
                    )}
                    {vente.statut === 'PAYEE' && (
                      <Badge color="green" size="sm" mt={4}>
                        Entièrement payée
                      </Badge>
                    )}
                  </Box>
                </SimpleGrid>
              </Box>

              <Paper p="md" mt="xl" style={{ backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                <Text size="sm">
                  Arrêté la présente facture à la somme de : <strong>
                    {montantEnLettres(total || 0)} ({(total || 0).toLocaleString()}) Francs CFA
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

              {atelier?.message_facture_defaut && (
                <Text size="xs" c="dimmed" ta="center" mt="xl" fs="italic">{atelier.message_facture_defaut}</Text>
              )}
            </Paper>
          </Stack>
        </div>

        <Divider />
        <Group justify="flex-end" p="md" className="no-print">
          <Button variant="light" onClick={onClose} leftSection={<IconX size={16} />}>Fermer</Button>
          <Button onClick={handlePrint} variant="outline" color="teal" leftSection={<IconPrinter size={16} />}>Imprimer</Button>
          {vente.statut !== 'PAYEE' && (reste || 0) > 0 && (
            <Button onClick={() => setShowPaiementModal(true)} variant="gradient" gradient={{ from: 'green', to: 'teal' }} leftSection={<IconCash size={16} />}>
              Procéder au paiement
            </Button>
          )}
        </Group>
      </Modal>

      {/* Modal de paiement */}
      <Modal opened={showPaiementModal} onClose={() => setShowPaiementModal(false)} title="💰 Paiement de la facture" size="md" centered radius="lg">
        <Stack gap="md">
          <Text size="sm">Montant total : <strong>{(total || 0).toLocaleString()} FCFA</strong></Text>
          <Text size="sm" c="green">Déjà réglé : <strong>{(regle || 0).toLocaleString()} FCFA</strong></Text>
          <Text size="sm" c="orange">Reste à payer : <strong>{(reste || 0).toLocaleString()} FCFA</strong></Text>
          
          <NumberInput 
            label="Montant du paiement" 
            value={montantPaiement} 
            onChange={(val) => setMontantPaiement(Number(val) || 0)} 
            min={0} 
            max={reste || 0} 
            step={1000} 
            required 
          />
          
          <Select 
            label="Mode de paiement" 
            data={[
              { value: 'Espèces', label: '💵 Espèces' },
              { value: 'Orange money', label: '📱 Orange Money' },
              { value: 'Moov money', label: '📱 Moov Money' },
              { value: 'Telecel money', label: '📱 Telecel Money' },
              { value: 'Wave', label: '🌊 Wave' },
              { value: 'Sank Money', label: '💰 Sank Money' },
              { value: 'Virement bancaire', label: '🏦 Virement bancaire' }
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