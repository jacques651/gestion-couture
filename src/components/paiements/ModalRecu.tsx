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

import { ToWords } from 'to-words';

import { apiGet } from '../../services/api';

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

interface ConfigurationAtelier {
  id?: number;
  nom_atelier?: string;
  adresse?: string;
  telephone?: string;
  ifu?: string;
  logo_base64?: string;
  message_facture_defaut?: string;
}

interface Props {
  commande: { id: number } | VenteRecu;
  onClose: () => void;
}

const ModalRecu: React.FC<Props> = ({
  commande,
  onClose,
}) => {

  const [data, setData] =
    useState<VenteRecu | null>(null);

  const [details, setDetails] =
    useState<DetailRecu[]>([]);

  const [config, setConfig] =
    useState<ConfigurationAtelier | null>(null);

  const [loading, setLoading] =
    useState(true);

  const printRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {

    const load = async () => {

      try {

        setLoading(true);

        let venteData:
          VenteRecu | null = null;

        /**
         * Vente déjà fournie
         */
        if (
          'code_vente' in commande
          &&
          commande.code_vente
        ) {

          venteData =
            commande as VenteRecu;

        } else {

          /**
           * Charger vente
           */
          venteData =
            await apiGet(
              `/ventes/${commande.id}`
            );
        }

        /**
         * IMPORTANT
         */
        if (!venteData) {

          setLoading(false);
          return;
        }

        /**
         * Détails
         */
        const detailsData =
          await apiGet(
            `/ventes/${venteData.id}/details`
          );

        /**
         * Atelier
         */
        const conf =
          await apiGet(
            '/atelier'
          );

        setData(
          venteData
        );

        setDetails(
          detailsData || []
        );

        setConfig(
          conf || null
        );

      } catch (e) {

        console.error(
          'Erreur chargement reçu:',
          e
        );

      } finally {

        setLoading(false);
      }
    };

    load();

  }, [commande]);

  const total =
    Number(data?.montant_total || 0);

  const paye =
    Number(data?.montant_regle || 0);

  const reste =
    total - paye;

  /**
   * Montant en lettres
   */
  const toWords =
    new ToWords({
      localeCode: 'fr-FR',
    });

  const montantLettresBrut =
    toWords.convert(
      Math.round(
        Number(paye)
      )
    );

  const montantLettres =
    montantLettresBrut.charAt(0).toUpperCase()
    +
    montantLettresBrut.slice(1)
    +
    ' francs CFA';

  /**
   * Impression
   */
  const handlePrint = () => {

    const printContent =
      printRef.current;

    if (!printContent) return;

    const styles =
      document.querySelectorAll(
        'style, link[rel="stylesheet"]'
      );

    let stylesHTML = '';

    styles.forEach((style) => {

      if (
        style.tagName === 'STYLE'
      ) {

        stylesHTML +=
          style.outerHTML;

      } else if (
        style.tagName === 'LINK'
      ) {

        stylesHTML += `
          <link
            rel="stylesheet"
            href="${(style as HTMLLinkElement).href}"
          >
        `;
      }
    });

    const printWindow =
      window.open(
        '',
        '_blank'
      );

    if (!printWindow) {

      alert(
        "Veuillez autoriser les popups pour l'impression"
      );

      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>

      <head>

        <meta charset="UTF-8">

        <title>
          Reçu ${data?.code_vente || ''}
        </title>

        ${stylesHTML}

        <style>

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 20px;
            margin: 0;
            background: white;
          }

          .print-container {
            max-width: 800px;
            margin: 0 auto;
          }

        </style>

      </head>

      <body>

        <div class="print-container">
          ${printContent.innerHTML}
        </div>

      </body>

      </html>
    `);

    printWindow.document.close();

    printWindow.print();
  };

  /**
   * Loading
   */
  if (loading) {

    return (
      <Modal
        opened={true}
        onClose={onClose}
        size="lg"
        centered
        title="Reçu de paiement"
      >

        <Center
          style={{
            height: 200,
          }}
        >
          <LoadingOverlay visible />
        </Center>

      </Modal>
    );
  }

  /**
   * Erreur
   */
  if (!data) {

    return (
      <Modal
        opened={true}
        onClose={onClose}
        size="lg"
        centered
        title="Reçu de paiement"
      >

        <Center>
          <Text c="red">
            Erreur: Données non trouvées
          </Text>
        </Center>

        <Group
          justify="center"
          mt="md"
        >
          <Button onClick={onClose}>
            Fermer
          </Button>
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
        header: {
          backgroundColor: '#1b365d',
          padding: '12px 20px',
        },

        title: {
          color: 'white',
          fontWeight: 600,
          fontSize: '1rem',
        },

        body: {
          padding: 0,
        },
      }}
    >

      <div ref={printRef}>

        <Stack gap={0}>

          {/* EN-TÊTE */}
          <Paper
            p="md"
            radius={0}
            style={{
              borderBottom:
                '2px solid #e9ecef',
            }}
          >

            <Group
              justify="space-between"
              align="flex-start"
              wrap="nowrap"
            >

              <Group
                gap="sm"
                wrap="nowrap"
              >

                {config?.logo_base64 && (

                  <Image
                    src={config.logo_base64}
                    w={50}
                    h={50}
                    fit="contain"
                    radius="md"
                    style={{
                      border:
                        '1px solid #dee2e6',
                      padding: 4,
                    }}
                  />
                )}

                <Box>

                  <Title
                    order={4}
                    c="#1b365d"
                  >
                    {config?.nom_atelier ||
                      'GESTION COUTURE'}
                  </Title>

                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    {config?.adresse ||
                      'Ouagadougou'}
                  </Text>

                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    Tel:
                    {' '}
                    {config?.telephone || '-'}
                    {' '}
                    |
                    {' '}
                    IFU:
                    {' '}
                    {config?.ifu || '-'}
                  </Text>

                </Box>

              </Group>

              <Box ta="right">

                <Text
                  size="xs"
                  c="dimmed"
                >
                  REÇU N°
                </Text>

                <Text
                  fw={700}
                  size="sm"
                  c="#1b365d"
                >
                  {data.code_vente}
                </Text>

                <Text
                  size="xs"
                  c="dimmed"
                  mt={4}
                >
                  {new Date()
                    .toLocaleDateString(
                      'fr-FR'
                    )}
                </Text>

              </Box>

            </Group>

          </Paper>

          {/* CLIENT */}
          <Paper
            p="md"
            radius={0}
            style={{
              borderBottom:
                '2px solid #e9ecef',

              backgroundColor:
                '#f8f9fa',
            }}
          >

            <Group
              justify="space-between"
              wrap="wrap"
            >

              <Box>

                <Text
                  size="xs"
                  c="dimmed"
                >
                  CLIENT
                </Text>

                <Text
                  size="sm"
                  fw={600}
                >
                  {data.client_nom ||
                    'Client non renseigné'}
                </Text>

                {data.client_id && (

                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    Tél :
                    {' '}
                    {data.client_id}
                  </Text>
                )}

                <Text
                  size="xs"
                  c="dimmed"
                >
                  Mode :
                  {' '}
                  {data.mode_paiement || '-'}
                </Text>

              </Box>

              {/* MONTANTS */}
              <Group
                gap="lg"
                wrap="nowrap"
              >

                <Box ta="center">

                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    Total dû
                  </Text>

                  <Text
                    fw={700}
                    size="sm"
                  >
                    {Number(total)
                      .toLocaleString(
                        'fr-FR'
                      )}
                    {' '}
                    FCFA
                  </Text>

                </Box>

                <Box ta="center">

                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    Cumul payé
                  </Text>

                  <Text
                    fw={700}
                    size="sm"
                    c="green"
                  >
                    {Number(paye)
                      .toLocaleString(
                        'fr-FR'
                      )}
                    {' '}
                    FCFA
                  </Text>

                </Box>

                <Box ta="center">

                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    Reste à payer
                  </Text>

                  <Text
                    fw={700}
                    size="sm"
                    c="red"
                  >
                    {Number(reste)
                      .toLocaleString(
                        'fr-FR'
                      )}
                    {' '}
                    FCFA
                  </Text>

                </Box>

              </Group>

            </Group>

          </Paper>

          {/* TABLEAU */}
          <Paper
            p="md"
            radius={0}
          >

            <Table
              striped
              highlightOnHover
            >

              <Table.Thead
                style={{
                  backgroundColor:
                    '#1b365d',
                }}
              >

                <Table.Tr>

                  <Table.Th
                    style={{
                      color: 'white',
                      width: 40,
                    }}
                  >
                    N°
                  </Table.Th>

                  <Table.Th
                    style={{
                      color: 'white',
                    }}
                  >
                    Désignation
                  </Table.Th>

                  <Table.Th
                    style={{
                      color: 'white',
                      textAlign: 'right',
                      width: 140,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Montant
                  </Table.Th>

                </Table.Tr>

              </Table.Thead>

              <Table.Tbody>

                {details.length === 0 ? (

                  <Table.Tr>

                    <Table.Td
                      colSpan={3}
                      ta="center"
                      py={20}
                    >

                      <Text c="dimmed">
                        Aucun détail
                      </Text>

                    </Table.Td>

                  </Table.Tr>

                ) : (

                  details.map(
                    (
                      detail,
                      idx
                    ) => (

                      <Table.Tr
                        key={detail.id}
                      >

                        <Table.Td ta="center">
                          {idx + 1}
                        </Table.Td>

                        <Table.Td>

                          <Text size="sm">
                            {detail.designation}
                          </Text>

                        </Table.Td>

                        <Table.Td
                          ta="right"
                          fw={600}
                          style={{
                            whiteSpace:
                              'nowrap',
                          }}
                        >

                          {Number(detail.total)
                            .toLocaleString(
                              'fr-FR'
                            )}
                          {' '}
                          FCFA

                        </Table.Td>

                      </Table.Tr>
                    )
                  )
                )}

              </Table.Tbody>

            </Table>

            {/* BAS */}
            <Group
              justify="space-between"
              mt="md"
              p="sm"
              style={{
                backgroundColor:
                  '#f8f9fa',

                borderRadius: 8,
              }}
            >

              <Box>

                <Text
                  size="xs"
                  c="dimmed"
                >
                  Arrêté à la somme de :
                </Text>

                <Text
                  size="sm"
                  fs="italic"
                >
                  {montantLettres}
                </Text>

                <Badge
                  color={
                    reste === 0
                      ? 'green'
                      : 'orange'
                  }
                  size="sm"
                  mt={6}
                >

                  {reste === 0
                    ? 'Payé'
                    : paye > 0
                      ? 'Partiel'
                      : 'Non payé'}

                </Badge>

              </Box>

              <Box
                ta="center"
                style={{
                  width: 140,
                  paddingTop: 20,
                }}
              >

                <Divider />

                <Text
                  size="xs"
                  c="dimmed"
                  mt={4}
                >
                  Signature & cachet
                </Text>

              </Box>

            </Group>

            {config?.message_facture_defaut && (

              <Text
                size="xs"
                c="dimmed"
                ta="center"
                mt="xl"
                fs="italic"
              >
                {config.message_facture_defaut}
              </Text>
            )}

          </Paper>

        </Stack>

      </div>

      <Divider />

      <Group
        justify="flex-end"
        p="md"
        gap="xs"
      >

        <Button
          variant="light"
          size="xs"
          onClick={onClose}
          leftSection={
            <IconX size={14} />
          }
        >
          Fermer
        </Button>

        <Button
          size="xs"
          onClick={handlePrint}
          variant="gradient"
          gradient={{
            from: '#1b365d',
            to: '#2a4a7a',
          }}
          leftSection={
            <IconPrinter size={14} />
          }
        >
          Imprimer
        </Button>

      </Group>

    </Modal>
  );
};

export default ModalRecu;