// components/ventes/ModalFacture.tsx
import { useState, useEffect } from 'react';
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
  Center,
  NumberInput,
  Select,
  Loader,
  Alert,
} from '@mantine/core';
import {
  IconPrinter,
  IconX,
  IconCash,
  IconAlertCircle,
} from '@tabler/icons-react';
import { apiGet } from '../../services/api';

interface LigneFacture {
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  type?: 'article' | 'matiere' | 'prestation';
  taille_libelle?: string;
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
  client: any;
  id?: number;
  code_vente?: string;
  type_vente?: 'commande' | 'pret_a_porter' | 'matiere';
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
  details?: any[]; // Pour la compatibilité
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

const ModalFacture: React.FC<ModalFactureProps> = ({ vente, onClose, onConfirmPaiement }) => {
  const [loading, setLoading] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [montantPaiement, setMontantPaiement] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<string>('Espèces');
  const [atelier, setAtelier] = useState<ConfigurationAtelier | null>(null);

  // Log pour déboguer
  console.log('Vente reçue dans ModalFacture:', vente);
  console.log('Lignes:', vente?.lignes);
  console.log('Details:', vente?.details);

  // Récupérer les lignes de différentes sources possibles
  const getLignes = (): LigneFacture[] => {
    // Source 1: vente.lignes
    if (vente?.lignes && Array.isArray(vente.lignes) && vente.lignes.length > 0) {
      return vente.lignes;
    }

    // Source 2: vente.details (backend)
    if (vente?.details && Array.isArray(vente.details) && vente.details.length > 0) {
      return vente.details.map((detail: any) => ({
        designation: detail.designation || 'Article',
        quantite: Number(detail.quantite) || 1,
        prix_unitaire: Number(detail.prix_unitaire) || 0,
        total: Number(detail.total) || (Number(detail.quantite) * Number(detail.prix_unitaire)) || 0,
        type: detail.type_produit || 'article',
        taille_libelle: detail.taille_libelle
      }));
    }

    // Source 3: construction à partir du montant total (fallback)
    if (vente?.montant_total && vente.montant_total > 0) {
      return [{
        designation: 'Prestation de couture',
        quantite: 1,
        prix_unitaire: vente.montant_total,
        total: vente.montant_total,
        type: 'prestation'
      }];
    }

    return [];
  };

  // Récupérer les détails de la vente depuis l'API si nécessaire
  useEffect(() => {
    const fetchVenteDetails = async () => {
      if (vente?.id && (!vente.lignes || vente.lignes.length === 0) && (!vente.details || vente.details.length === 0)) {
        setLoading(true);
        try {
          const details = await apiGet(`/ventes/${vente.id}/details`);
          if (details && details.length > 0) {
            vente.details = details;
          }
        } catch (error) {
          console.error('Erreur chargement détails:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchVenteDetails();
  }, [vente]);

  // Charger la configuration de l'atelier
  useEffect(() => {
    const fetchAtelier = async () => {
      try {
        const data = await apiGet('/atelier');
        if (data && data.length > 0) {
          setAtelier(data[0]);
        }
      } catch (error) {
        console.error('Erreur chargement atelier:', error);
      }
    };
    fetchAtelier();
  }, []);

  const lignesFacture = getLignes();
  const totalGeneral = vente?.total_general || vente?.montant_total || 0;
  const montantRegle = vente?.montant_regle || vente?.avance || 0;
  const resteAPayer = totalGeneral - montantRegle;
  const numeroFacture = vente?.code_vente || vente?.numero || 'N/A';
  const dateFacture = vente?.date_vente || vente?.date_commande || new Date().toISOString().split('T')[0];

  // Formater le montant en lettres (simplifié)
  const nombreEnLettres = (montant: number): string => {
    if (montant === 0) return 'zéro';
    const unite = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const dizaine = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

    if (montant < 20) return unite[montant];
    if (montant < 100) {
      const d = Math.floor(montant / 10);
      const u = montant % 10;
      if (u === 0) return dizaine[d];
      if (d === 7 || d === 9) return `${dizaine[d - 1]}-${unite[u + 10]}`;
      return `${dizaine[d]}-${unite[u]}`;
    }
    if (montant < 1000) {
      const c = Math.floor(montant / 100);
      const r = montant % 100;
      if (r === 0) return `${unite[c]} cent${c > 1 ? 's' : ''}`;
      return `${unite[c]} cent ${nombreEnLettres(r)}`;
    }
    if (montant < 1000000) {
      const m = Math.floor(montant / 1000);
      const r = montant % 1000;
      if (r === 0) return `${nombreEnLettres(m)} mille`;
      return `${nombreEnLettres(m)} mille ${nombreEnLettres(r)}`;
    }
    return `${nombreEnLettres(Math.floor(montant / 1000000))} million${Math.floor(montant / 1000000) > 1 ? 's' : ''} ${nombreEnLettres(montant % 1000000)}`;
  };

  const handlePrint = () => {
    const printContent = document.getElementById('facture-print-content');
    if (!printContent) return;

    const originalTitle = document.title;
    document.title = `Facture ${numeroFacture}`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Facture ${numeroFacture}</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .facture-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #1b365d; margin: 0; }
            .infos { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #1b365d; color: white; }
            .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="facture-container">
            ${printContent.innerHTML}
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }

    document.title = originalTitle;
  };

  const handleConfirmPaiement = () => {
    if (onConfirmPaiement && montantPaiement > 0) {
      onConfirmPaiement(montantPaiement, modePaiement);
      setShowPaiement(false);
    }
  };

  if (loading) {
    return (
      <Modal opened={true} onClose={onClose} size="lg" title="Chargement..." centered>
        <Center py="xl">
          <Loader />
          <Text ml="md">Chargement des détails de la facture...</Text>
        </Center>
      </Modal>
    );
  }

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="lg"
      title={`Facture ${numeroFacture}`}
      centered
      radius="md"
      padding="xl"
    >
      <Stack gap="md">
        {/* Contenu à imprimer */}
        <div id="facture-print-content">
          {/* En-tête */}
          <Box style={{ textAlign: 'center', marginBottom: 20 }}>
            <Title order={2} c="#1b365d">{atelier?.nom_atelier || 'GESTION COUTURE'}</Title>
            <Text size="sm">{atelier?.adresse || 'Ouagadougou, Burkina Faso'}</Text>
            <Text size="sm">Tel: {atelier?.telephone || '70 00 00 00'} | IFU: {atelier?.ifu || '-'}</Text>
            <Divider my="md" />
            <Title order={3}>FACTURE N° {numeroFacture}</Title>
            <Text size="sm">Date : {new Date(dateFacture).toLocaleDateString('fr-FR')}</Text>
          </Box>

          {/* Infos client */}
          <Paper p="md" withBorder mb="md">
            <Text fw={700} size="sm">CLIENT</Text>
            <Text size="sm">
              {vente?.client_nom || vente?.client?.nom_prenom || 'Client non renseigné'}
            </Text>
            {vente?.client_telephone && <Text size="xs" c="dimmed">Tél: {vente.client_telephone}</Text>}
            {vente?.client?.telephone_id && !vente?.client_telephone && (
              <Text size="xs" c="dimmed">Tél: {vente.client.telephone_id}</Text>
            )}
          </Paper>

          {/* Tableau des articles */}
          {lignesFacture.length > 0 ? (
            <>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white' }}>N°</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center' }}>Qté</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Prix unitaire</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Total</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {lignesFacture.map((item, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>{index + 1}</Table.Td>
                      <Table.Td>
                        {item.designation}
                        {item.taille_libelle && <Text size="xs" c="dimmed">Taille: {item.taille_libelle}</Text>}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>{item.quantite}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>{item.prix_unitaire.toLocaleString()} FCFA</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>{item.total.toLocaleString()} FCFA</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {/* Totaux */}
              <Box style={{ textAlign: 'right', marginTop: 20 }}>
                <Text fw={700} size="lg">Total: {totalGeneral.toLocaleString()} FCFA</Text>
                {montantRegle > 0 && (
                  <>
                    <Text size="sm" c="green">Montant réglé: {montantRegle.toLocaleString()} FCFA</Text>
                    <Text size="sm" c="orange">Reste à payer: {resteAPayer.toLocaleString()} FCFA</Text>
                  </>
                )}
              </Box>

              {/* Montant en lettres */}
              <Box mt="md" p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                <Text size="sm" fw={500}>Arrêté à la somme de :</Text>
                <Text size="sm" fs="italic">{nombreEnLettres(Math.floor(totalGeneral))} francs</Text>
              </Box>
            </>
          ) : (
            <Alert icon={<IconAlertCircle size={16} />} color="yellow" title="Information">
              Aucun détail disponible pour cette facture. Le montant total est de {totalGeneral.toLocaleString()} FCFA.
            </Alert>
          )}

          {/* Message personnalisé */}
          {atelier?.message_facture_defaut && (
            <Box mt="md" p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: 8 }}>
              <Text size="xs" c="dimmed" fs="italic">{atelier.message_facture_defaut}</Text>
            </Box>
          )}

          {/* Signature */}
          <Box mt={50} style={{ textAlign: 'right' }}>
            <Text size="sm">Signature & cachet</Text>
            <Divider style={{ width: 200, marginLeft: 'auto' }} />
          </Box>
        </div>

        <Divider />

        {/* Boutons d'action */}
        <Group justify="space-between">
          <Button variant="light" onClick={onClose} leftSection={<IconX size={16} />}>
            Fermer
          </Button>
          <Group>
            <Button variant="outline" onClick={handlePrint} leftSection={<IconPrinter size={16} />}>
              Imprimer
            </Button>
            {resteAPayer > 0 && onConfirmPaiement && (
              <Button
                variant="gradient"
                gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                onClick={() => setShowPaiement(true)}
                leftSection={<IconCash size={16} />}
              >
                Enregistrer un paiement
              </Button>
            )}
          </Group>
        </Group>

        {/* Modal de paiement */}
        {showPaiement && (
          <Modal
            opened={showPaiement}
            onClose={() => setShowPaiement(false)}
            title="Enregistrer un paiement"
            size="sm"
            centered
          >
            <Stack>
              <Text size="sm">
                Montant restant à payer: <strong>{resteAPayer.toLocaleString()} FCFA</strong>
              </Text>
              <NumberInput
                label="Montant à payer"
                value={montantPaiement}
                onChange={(val) => setMontantPaiement(typeof val === 'number' ? val : 0)}
                min={1}
                max={resteAPayer}
                step={1000}
                required
              />
              <Select
                label="Mode de paiement"
                value={modePaiement}
                onChange={(val) => setModePaiement(val || 'Espèces')}
                data={[
                  { value: 'Espèces', label: '💵 Espèces' },
                  { value: 'Carte Bancaire', label: '💳 Carte Bancaire' },
                  { value: 'Mobile Money', label: '📱 Mobile Money' },
                  { value: 'Virement', label: '🏦 Virement' },
                  { value: 'Chèque', label: '📝 Chèque' },
                ]}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={() => setShowPaiement(false)}>Annuler</Button>
                <Button
                  color="green"
                  onClick={handleConfirmPaiement}
                  disabled={montantPaiement <= 0 || montantPaiement > resteAPayer}
                >
                  Confirmer le paiement
                </Button>
              </Group>
            </Stack>
          </Modal>
        )}
      </Stack>
    </Modal>
  );
};

export default ModalFacture;