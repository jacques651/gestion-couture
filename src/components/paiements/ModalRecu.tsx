// components/paiements/ModalRecu.tsx
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
  Center,
  Badge,
  SimpleGrid,
  Loader,
} from '@mantine/core';
import {
  IconPrinter,
  IconX,
  IconCalendarEvent,
  IconUser,
} from '@tabler/icons-react';
import { apiGet } from '../../services/api';

// Interface VenteRecu avec rendezvous
interface VenteRecu {
  id: number;
  code_vente?: string;
  date_vente?: string;
  client_nom?: string;
  client_telephone?: string;
  montant_total?: number;
  montant_regle?: number;
  montant_restant?: number;
  mode_paiement?: string;
  statut?: string;
  observation?: string;
  lignes?: Array<{
    designation: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
  }>;
  rendezvous?: {
    date_rendezvous: string;
    heure_rendezvous?: string;
    type_rendezvous: string;
    statut: string;
    client_id?: number;
    observation?: string;
  };
}

interface ModalRecuProps {
  commande: VenteRecu | { id: number };
  onClose: () => void;
}

const ModalRecu: React.FC<ModalRecuProps> = ({ commande, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [venteData, setVenteData] = useState<VenteRecu | null>(null);
  const [atelier, setAtelier] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const vente = await apiGet(`/ventes/${commande.id}`);
        const details = await apiGet(`/ventes/${commande.id}/details`);
        
        let rendezvous = null;
        try {
          const rendezvousList = await apiGet('/rendezvous');
          const rdv = rendezvousList.find((r: any) => r.vente_id === commande.id);
          if (rdv) {
            rendezvous = rdv;
          }
        } catch (err) {
          console.warn('Aucun rendez-vous trouvé');
        }
        
        setVenteData({
          ...vente,
          lignes: details || [],
          rendezvous: rendezvous
        });
        
        const atelierData = await apiGet('/atelier');
        if (atelierData && atelierData.length > 0) {
          setAtelier(atelierData[0]);
        }
      } catch (error) {
        console.error('Erreur chargement reçu:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [commande.id]);

  const handlePrint = () => {
    if (!printRef.current || !venteData) return;
    
    // Créer une iframe pour l'impression
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const totalGeneral = venteData.montant_total || 0;
    const montantRegle = venteData.montant_regle || 0;
    const resteAPayer = totalGeneral - montantRegle;

    // Générer le HTML pour l'impression
    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu ${venteData.code_vente || 'N°' + commande.id}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Times New Roman', Arial, sans-serif; 
            padding: 20px; 
            background: white; 
          }
          .print-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            padding-bottom: 15px;
            border-bottom: 2px solid #1b365d;
          }
          .header h1 { 
            color: #1b365d; 
            margin: 0 0 10px 0;
            font-size: 22px;
          }
          .header p { 
            color: #666; 
            margin: 5px 0;
            font-size: 11px;
          }
          .section {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 12px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
          }
          th, td { 
            border: 1px solid #333; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background: #1b365d;
            color: white;
            font-weight: bold;
            font-size: 11px;
          }
          td { 
            font-size: 11px;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-line {
            margin: 5px 0;
            text-align: right;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
          }
          .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
          }
          .badge-green { background: #d4edda; color: #155724; }
          .badge-orange { background: #fff3cd; color: #856404; }
          .badge-red { background: #f8d7da; color: #721c24; }
          @page {
            size: A4;
            margin: 15mm;
          }
          @media print {
            body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- En-tête -->
          <div class="header">
            <h1>${atelier?.nom_atelier || 'GESTION COUTURE'}</h1>
            <p>${atelier?.adresse || 'Ouagadougou, Burkina Faso'}</p>
            <p>Tel: ${atelier?.telephone || '70 00 00 00'} | IFU: ${atelier?.ifu || '-'}</p>
            <h2 style="margin-top: 15px; color: #1b365d;">REÇU N° ${venteData.code_vente || commande.id}</h2>
            <p>Date : ${venteData.date_vente ? new Date(venteData.date_vente).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          <!-- Infos client -->
          <div class="section">
            <div class="section-title">🧑 CLIENT</div>
            <p><strong>${venteData.client_nom || 'Client non renseigné'}</strong></p>
            ${venteData.client_telephone ? `<p style="font-size: 10px; color: #666;">Tél: ${venteData.client_telephone}</p>` : ''}
          </div>

          <!-- Rendez-vous -->
          ${venteData.rendezvous && venteData.rendezvous.date_rendezvous ? `
          <div class="section" style="background: #FFF8E7; border-left: 4px solid #1b365d;">
            <div class="section-title">📅 RENDEZ-VOUS</div>
            <table style="width: 100%; border: none;">
              <tr>
                <td style="border: none; width: 25%;"><strong>Date:</strong></td>
                <td style="border: none;">${new Date(venteData.rendezvous.date_rendezvous).toLocaleDateString('fr-FR')}</td>
                <td style="border: none; width: 25%;"><strong>Heure:</strong></td>
                <td style="border: none;">${venteData.rendezvous.heure_rendezvous || '--:--'}</td>
              </tr>
              <tr>
                <td style="border: none;"><strong>Type:</strong></td>
                <td style="border: none;">${venteData.rendezvous.type_rendezvous === 'essayage' ? '👗 Essayage' : venteData.rendezvous.type_rendezvous === 'livraison' ? '🚚 Livraison' : '📦 Retrait'}</td>
                <td style="border: none;"><strong>Statut:</strong></td>
                <td style="border: none;">${venteData.rendezvous.statut === 'planifie' ? '⏳ Planifié' : venteData.rendezvous.statut === 'termine' ? '✅ Terminé' : '❌ Annulé'}</td>
              </tr>
            </table>
            ${venteData.rendezvous.observation ? `<p style="margin-top: 8px; font-size: 10px;"><strong>Note:</strong> ${venteData.rendezvous.observation}</p>` : ''}
          </div>
          ` : ''}

          <!-- Tableau des articles -->
          <table>
            <thead>
              <tr>
                <th>Désignation</th>
                <th style="width: 60px; text-align: center;">Qté</th>
                <th style="width: 110px; text-align: right;">Prix unit.</th>
                <th style="width: 110px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${venteData.lignes && venteData.lignes.length > 0 ? 
                venteData.lignes.map(item => `
                  <tr>
                    <td>${item.designation}</td>
                    <td class="text-center">${item.quantite}</td>
                    <td class="text-right">${item.prix_unitaire.toLocaleString()} FCFA</td>
                    <td class="text-right"><strong>${item.total.toLocaleString()} FCFA</strong></td>
                  </tr>
                `).join('') :
                '<tr><td colspan="4" class="text-center">Aucun détail disponible</td></tr>'
              }
            </tbody>
          </table>

          <!-- Totaux -->
          <div style="margin-top: 15px; text-align: right;">
            <div class="total-line"><strong>Total : ${totalGeneral.toLocaleString()} FCFA</strong></div>
            ${montantRegle > 0 ? `<div class="total-line" style="color: green;">Montant réglé : ${montantRegle.toLocaleString()} FCFA</div>` : ''}
            ${resteAPayer > 0 ? `<div class="total-line" style="color: orange;">Reste à payer : ${resteAPayer.toLocaleString()} FCFA</div>` : ''}
            <div class="total-line">Mode de paiement : ${venteData.mode_paiement || 'Espèces'}</div>
          </div>

          <!-- Statut -->
          <div style="margin-top: 15px; text-align: center;">
            <span class="badge ${venteData.statut === 'PAYEE' ? 'badge-green' : venteData.statut === 'PARTIEL' ? 'badge-orange' : 'badge-red'}">
              ${venteData.statut === 'PAYEE' ? '✅ PAYÉE' : venteData.statut === 'PARTIEL' ? '⚠️ PAIEMENT PARTIEL' : '❌ EN ATTENTE'}
            </span>
          </div>

          <!-- Observations -->
          ${venteData.observation ? `
          <div style="margin-top: 15px;">
            <p style="font-size: 10px; color: #666;"><strong>Observations:</strong></p>
            <p style="font-size: 10px;">${venteData.observation}</p>
          </div>
          ` : ''}

          <!-- Signature -->
          <div class="footer">
            <p>Signature & cachet</p>
            <p style="margin-top: 10px;">Document généré automatiquement - ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 500);
      };
      
      // Si l'événement onload ne se déclenche pas
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 500);
        }
      }, 1000);
    }
  };

  if (loading) {
    return (
      <Modal opened={true} onClose={onClose} size="lg" title="Reçu" centered padding="md">
        <Center py="xl">
          <Loader />
          <Text ml="md">Chargement du reçu...</Text>
        </Center>
      </Modal>
    );
  }

  if (!venteData) {
    return (
      <Modal opened={true} onClose={onClose} size="lg" title="Reçu" centered padding="md">
        <Text ta="center" c="red">Erreur lors du chargement du reçu</Text>
      </Modal>
    );
  }

  const totalGeneral = venteData.montant_total || 0;
  const montantRegle = venteData.montant_regle || 0;
  const resteAPayer = totalGeneral - montantRegle;

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="lg"
      title={`Reçu ${venteData.code_vente || 'N°' + commande.id}`}
      centered
      radius="md"
      padding="md"
      styles={{
        body: {
          padding: '16px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }
      }}
    >
      {/* Contenu visible à l'écran (identique à l'impression mais référence) */}
      <div ref={printRef}>
        <Stack gap="sm">
          {/* En-tête compact */}
          <Box style={{ textAlign: 'center', marginBottom: 15 }}>
            <Title order={3} c="#1b365d" size="h4">{atelier?.nom_atelier || 'GESTION COUTURE'}</Title>
            <Text size="xs">{atelier?.adresse || 'Ouagadougou, Burkina Faso'}</Text>
            <Text size="xs">Tel: {atelier?.telephone || '70 00 00 00'} | IFU: {atelier?.ifu || '-'}</Text>
            <Divider my="sm" />
            <Title order={4} size="h5">REÇU N° {venteData.code_vente || commande.id}</Title>
            <Text size="xs">Date : {venteData.date_vente ? new Date(venteData.date_vente).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</Text>
          </Box>

          {/* Infos client compactes */}
          <Paper p="sm" withBorder mb="sm">
            <Group gap="xs">
              <IconUser size={14} />
              <Text fw={600} size="sm">CLIENT</Text>
            </Group>
            <Text size="sm">{venteData.client_nom || 'Client non renseigné'}</Text>
            {venteData.client_telephone && <Text size="xs" c="dimmed">Tél: {venteData.client_telephone}</Text>}
          </Paper>

          {/* Section Rendez-vous compacte */}
          {venteData.rendezvous && venteData.rendezvous.date_rendezvous && (
            <Paper p="sm" withBorder mb="sm" style={{ backgroundColor: '#FFF8E7', borderLeft: '4px solid #1b365d' }}>
              <Group gap="xs" mb="xs">
                <IconCalendarEvent size={16} color="#1b365d" />
                <Text fw={600} size="sm">Rendez-vous</Text>
              </Group>
              <SimpleGrid cols={4} spacing="xs" mb="xs">
                <Box>
                  <Text size="xs" c="dimmed">Date</Text>
                  <Text size="sm" fw={500}>
                    {new Date(venteData.rendezvous.date_rendezvous).toLocaleDateString('fr-FR')}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Heure</Text>
                  <Text size="sm" fw={500}>{venteData.rendezvous.heure_rendezvous || '--:--'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Type</Text>
                  <Badge 
                    color={venteData.rendezvous.type_rendezvous === 'essayage' ? 'pink' :
                           venteData.rendezvous.type_rendezvous === 'livraison' ? 'cyan' : 'orange'} 
                    size="xs"
                  >
                    {venteData.rendezvous.type_rendezvous === 'essayage' ? '👗 Essayage' :
                     venteData.rendezvous.type_rendezvous === 'livraison' ? '🚚 Livraison' : '📦 Retrait'}
                  </Badge>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Statut</Text>
                  <Badge 
                    color={venteData.rendezvous.statut === 'planifie' ? 'orange' :
                           venteData.rendezvous.statut === 'termine' ? 'green' : 'red'} 
                    size="xs"
                  >
                    {venteData.rendezvous.statut === 'planifie' ? '⏳ Planifié' :
                     venteData.rendezvous.statut === 'termine' ? '✅ Terminé' : '❌ Annulé'}
                  </Badge>
                </Box>
              </SimpleGrid>
              {venteData.rendezvous.observation && (
                <Text size="xs" c="dimmed">
                  <strong>Note:</strong> {venteData.rendezvous.observation}
                </Text>
              )}
            </Paper>
          )}

          {/* Tableau compact */}
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#1b365d' }}>
              <Table.Tr>
                <Table.Th style={{ color: 'white', fontSize: 11 }}>Désignation</Table.Th>
                <Table.Th style={{ color: 'white', fontSize: 11, textAlign: 'center', width: 60 }}>Qté</Table.Th>
                <Table.Th style={{ color: 'white', fontSize: 11, textAlign: 'right', width: 110 }}>Prix unit.</Table.Th>
                <Table.Th style={{ color: 'white', fontSize: 11, textAlign: 'right', width: 110 }}>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {venteData.lignes && venteData.lignes.length > 0 ? (
                venteData.lignes.map((item, index) => (
                  <Table.Tr key={index}>
                    <Table.Td style={{ fontSize: 11 }}>{item.designation}</Table.Td>
                    <Table.Td style={{ textAlign: 'center', fontSize: 11 }}>{item.quantite}</Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontSize: 11 }}>{item.prix_unitaire.toLocaleString()} FCFA</Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontSize: 11, fontWeight: 500 }}>{item.total.toLocaleString()} FCFA</Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={4} style={{ textAlign: 'center', fontSize: 11 }}>
                    Aucun détail disponible
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          {/* Totaux compacts */}
          <Box style={{ textAlign: 'right', marginTop: 15 }}>
            <Group justify="flex-end" gap="md">
              <Text size="sm">Total:</Text>
              <Text fw={700} size="md" c="blue">{totalGeneral.toLocaleString()} FCFA</Text>
            </Group>
            {montantRegle > 0 && (
              <Group justify="flex-end" gap="md">
                <Text size="xs" c="green">Montant réglé:</Text>
                <Text size="sm" c="green">{montantRegle.toLocaleString()} FCFA</Text>
              </Group>
            )}
            {resteAPayer > 0 && (
              <Group justify="flex-end" gap="md">
                <Text size="xs" c="orange">Reste à payer:</Text>
                <Text size="sm" c="orange">{resteAPayer.toLocaleString()} FCFA</Text>
              </Group>
            )}
            <Group justify="flex-end" gap="md" mt="xs">
              <Text size="xs" c="dimmed">Mode de paiement:</Text>
              <Text size="sm">{venteData.mode_paiement || 'Espèces'}</Text>
            </Group>
          </Box>

          {/* Statut compact */}
          <Box mt="sm" p="xs" style={{ backgroundColor: '#f8f9fa', borderRadius: 6 }}>
            <Group justify="center" gap="xs">
              <Text size="sm" fw={500}>Statut:</Text>
              <Badge 
                color={venteData.statut === 'PAYEE' ? 'green' : venteData.statut === 'PARTIEL' ? 'orange' : 'red'} 
                size="sm"
              >
                {venteData.statut === 'PAYEE' ? '✅ Payée' : 
                 venteData.statut === 'PARTIEL' ? '⚠️ Paiement partiel' : '❌ En attente'}
              </Badge>
            </Group>
          </Box>

          {/* Observations compactes */}
          {venteData.observation && (
            <Box mt="sm">
              <Text size="xs" c="dimmed">Observations:</Text>
              <Text size="xs">{venteData.observation}</Text>
            </Box>
          )}

          {/* Signature compacte */}
          <Box mt={30} style={{ textAlign: 'right' }}>
            <Text size="xs">Signature & cachet</Text>
            <Divider style={{ width: 150, marginLeft: 'auto' }} />
          </Box>
        </Stack>
      </div>

      <Divider my="sm" />

      {/* Boutons d'action */}
      <Group justify="flex-end" gap="sm">
        <Button variant="light" onClick={onClose} leftSection={<IconX size={16} />} size="sm">
          Fermer
        </Button>
        <Button variant="outline" onClick={handlePrint} leftSection={<IconPrinter size={16} />} size="sm">
          Imprimer
        </Button>
      </Group>
    </Modal>
  );
};

export default ModalRecu;