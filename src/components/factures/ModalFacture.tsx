// components/ventes/ModalFacture.tsx
import { useRef, useState, useEffect } from 'react';
import { journaliserAction } from "../../services/journal";
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
  Center,
  NumberInput,
  Select,
  Badge,
  Loader,
} from '@mantine/core';
import {
  IconPrinter,
  IconX,
  IconCash,
} from '@tabler/icons-react';

interface LigneFacture {
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  type: 'article' | 'matiere' | 'prestation';
}

interface ConfigurationAtelier {

  id?: number;

  nom_atelier?: string;

  adresse?: string;

  telephone?: string;

  ifu?: string;

  logo_base64?: string;

  message_facture_defaut?: string;
}
interface VenteFacture {

  id?: number;

  code_vente?: string;

  type_vente?:
  | 'commande'
  | 'pret_a_porter'
  | 'matiere';

  date_vente?: string;

  client_id?: string;

  client_nom?: string;

  client_telephone?: string;

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
  const [atelier] = useState<ConfigurationAtelier | null>(null);
const [

  loading,

  setLoading

] = useState(false);
  const [montantPaiement, setMontantPaiement] = useState(0);
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [lignes, setLignes] = useState<LigneFacture[]>(vente.lignes || []);
  useEffect(() => {

    if (!vente?.id) return;

    const chargerDetails = async () => {

      try {

        const response =
          await fetch(
            `http://localhost:3001/ventes/${vente.id}/details`
          );

        const data =
          await response.json();

        setLignes(data);

      } catch (error) {

        console.error(
          "Erreur chargement détails",
          error
        );
      }
    };

    chargerDetails();

  }, [vente]);

  const total = vente?.total_general ?? vente?.montant_total ?? 0;
  const regle = vente?.avance ?? vente?.montant_regle ?? 0;
  const reste = vente?.reste ?? vente?.montant_restant ?? (total - regle);
  const codeVente = vente?.numero ?? vente?.code_vente ?? 'N/A';
  const dateVente = vente?.date_commande ?? vente?.date_vente ?? new Date().toISOString();

  useEffect(() => {
    setMontantPaiement(reste);
  }, [reste]);

  useEffect(() => {

  if (!vente?.id) {

    setLignes([]);

    setLoading(false);

    return;
  }

  const chargerDetails =
    async () => {

      try {

        console.log(
          "FACTURE VENTE ID:",
          vente.id
        );

        setLoading(true);

        const response =
          await fetch(
            `http://localhost:4000/ventes/${vente.id}/details`
          );

        console.log(
          "STATUS:",
          response.status
        );

        const data =
          await response.json();

        console.log(
          "DETAILS FACTURE:",
          data
        );

        setLignes(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          "ERREUR FACTURE:",
          error
        );

        setLignes([]);

      } finally {

        setLoading(false);
      }
    };

  chargerDetails();

}, [vente?.id]);

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

      journaliserAction({

        utilisateur:
          'Utilisateur',

        action:
          'CREATE',

        table:
          'factures',

        idEnregistrement:
          codeVente,

        details:
          `Impression facture : ${codeVente} - ` +
          `${vente.client_nom || 'Client comptoir'}`
      });
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  const handleConfirmerPaiement = async () => {
    if (onConfirmPaiement) {
      await onConfirmPaiement(montantPaiement, modePaiement);

      // Journalisation paiement facture
      await journaliserAction({
        utilisateur: 'Utilisateur',
        action: 'CREATE',
        table: 'paiements_factures',
        idEnregistrement: codeVente,
        details:
          `Paiement facture : ${codeVente} - ` +
          `${montantPaiement.toLocaleString()} FCFA (${modePaiement})`
      });

      setShowPaiementModal(false);
      if (onRefresh) onRefresh();
      onClose();
    }
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

    <Center py="xl">

      <Loader />

    </Center>
  );
}

  return (
    <>
      <Modal
        opened={true}
        onClose={onClose}
        size="lg"
        centered
        title={`Facture N° ${codeVente}`}
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
                {/* Logo + Infos atelier */}
                <Group gap="sm" wrap="nowrap">
                  {atelier?.logo_base64 && (
                    <Image src={atelier.logo_base64} w={60} h={60} fit="contain" radius="md" style={{ border: '1px solid #dee2e6', padding: 4 }} />
                  )}
                  <Box>
                    <Title order={4} c="#1b365d">{atelier?.nom_atelier || "GESTION COUTURE"}</Title>
                    <Text size="xs" c="dimmed">{atelier?.adresse || "Ouagadougou, Burkina Faso"}</Text>
                    <Text size="xs" c="dimmed">Tel: {atelier?.telephone || "70 00 00 00"} | IFU: {atelier?.ifu || '-'}</Text>
                  </Box>
                </Group>

                {/* Infos facture */}
                <Box ta="right">
                  <Text size="xs" c="dimmed" mb={2}>FACTURE N°</Text>
                  <Text fw={700} size="sm" c="#1b365d">{codeVente}</Text>
                  <Text size="xs" c="dimmed" mt={4}>Date : {new Date(dateVente).toLocaleDateString('fr-FR')}</Text>
                </Box>
              </Group>
            </Paper>

            {/* CLIENT + TOTAL */}
            <Paper p="md" radius={0} style={{ borderBottom: '2px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
              <Group justify="space-between" wrap="wrap">
                <Group gap="lg">
                  <Box>
                    <Text size="xs" c="dimmed">CLIENT</Text>
                    <Text size="sm" fw={600}>{vente.client_nom || 'Client non renseigné'}</Text>
                    {vente.client_telephone && (
                      <Text size="xs" c="dimmed">
                        Tél : {vente.client_telephone}
                      </Text>
                    )}
                  </Box>
                </Group>
                <Box ta="right">
                  <Text size="xs" c="dimmed">MONTANT TOTAL</Text>
                  <Text fw={800} size="xl" c="#1b365d">{(total || 0).toLocaleString()} FCFA</Text>
                  {(reste || 0) > 0 && (
                    <Badge color="orange" size="sm">Reste : {(reste || 0).toLocaleString()} FCFA</Badge>
                  )}
                  {vente.statut === 'PAYEE' && (
                    <Badge color="green" size="sm">Payée</Badge>
                  )}
                </Box>
              </Group>
            </Paper>

            {/* TABLEAU */}
            <Paper p="md" radius={0}>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white', width: 40 }}>N°</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center', width: 70 }}>Qté</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', width: 110 }}>Prix unitaire</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', width: 110 }}>Total</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {lignes && lignes.length > 0 ? (
                    lignes.map((l, i) => (
                      <Table.Tr key={i}>
                        <Table.Td ta="center">{i + 1}</Table.Td>
                        <Table.Td>
                          <Text size="sm">{l.designation || '-'}</Text>
                        </Table.Td>
                        <Table.Td ta="center">{l.quantite || 0}</Table.Td>
                        <Table.Td ta="right">{(l.prix_unitaire || 0).toLocaleString()} FCFA</Table.Td>
                        <Table.Td ta="right" fw={600}>{(l.total || 0).toLocaleString()} FCFA</Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr><Table.Td colSpan={5} ta="center" py={20}><Text c="dimmed">Aucun détail disponible</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>

              {/* TOTAL + MONTANT EN LETTRES */}
              <Group justify="space-between" mt="md" p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                <Box>
                  <Text size="xs" c="dimmed">Arrêté à la somme de :</Text>
                  <Text size="sm" fs="italic">{montantEnLettres(total || 0)}</Text>
                </Box>
                <Box ta="right">
                  <Text size="sm" c="dimmed">Total</Text>
                  <Text fw={700} size="lg" c="#1b365d">{(total || 0).toLocaleString()} FCFA</Text>
                </Box>
              </Group>

              {/* SIGNATURE */}
              <Group justify="flex-end" mt="xl">
                <Box ta="center" style={{ width: 150 }}>
                  <Box mb={30} />
                  <Divider />
                  <Text size="xs" c="dimmed" mt={4}>Signature & cachet</Text>
                </Box>
              </Group>

              {atelier?.message_facture_defaut && (
                <Text size="xs" c="dimmed" ta="center" mt="xl" fs="italic">{atelier.message_facture_defaut}</Text>
              )}
            </Paper>
          </Stack>
        </div>

        <Divider />
        <Group justify="flex-end" p="md" className="no-print" gap="xs">
          <Button variant="light" size="xs" onClick={onClose} leftSection={<IconX size={14} />}>Fermer</Button>
          <Button size="xs" onClick={handlePrint} variant="outline" color="teal" leftSection={<IconPrinter size={14} />}>Imprimer</Button>
          {vente.statut !== 'PAYEE' && (reste || 0) > 0 && (
            <Button size="xs" onClick={() => setShowPaiementModal(true)} variant="gradient" gradient={{ from: 'green', to: 'teal' }} leftSection={<IconCash size={14} />}>
              Paiement
            </Button>
          )}
        </Group>
      </Modal>

      {/* Modal de paiement (inchangé) */}
      <Modal opened={showPaiementModal} onClose={() => setShowPaiementModal(false)} title="💰 Paiement" size="sm" centered radius="md">
        <Stack gap="md">
          <Paper p="sm" withBorder bg="gray.0">
            <Group justify="space-between"><Text size="xs">Total</Text><Text size="sm" fw={600}>{(total || 0).toLocaleString()} FCFA</Text></Group>
            <Group justify="space-between"><Text size="xs">Réglé</Text><Text size="sm" fw={600} c="green">{(regle || 0).toLocaleString()} FCFA</Text></Group>
            <Group justify="space-between"><Text size="xs">Reste</Text><Text size="sm" fw={600} c="orange">{(reste || 0).toLocaleString()} FCFA</Text></Group>
          </Paper>
          <NumberInput label="Montant" value={montantPaiement} onChange={(val) => setMontantPaiement(Number(val) || 0)} min={0} max={reste || 0} step={500} size="sm" radius="md" />
          <Select label="Mode" data={['Espèces', 'Orange money', 'Moov money', 'Telecel money', 'Wave', 'Sank Money', 'Virement bancaire']} value={modePaiement} onChange={(val) => setModePaiement(val || 'Espèces')} size="sm" radius="md" />
          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" size="xs" onClick={() => setShowPaiementModal(false)}>Annuler</Button>
            <Button size="xs" variant="gradient" gradient={{ from: 'green', to: 'teal' }} onClick={handleConfirmerPaiement}>Confirmer</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default ModalFacture;