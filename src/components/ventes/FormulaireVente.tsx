// src/components/ventes/FormulaireVente.tsx
import React, { useState, useEffect } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  NumberInput,
  Divider,
  Box,
  Modal,
  Select,
  Avatar,
  Paper,
  Tooltip,
  ActionIcon,
  Container,
  Grid,
  Table,
  ScrollArea,
  Badge,
  SimpleGrid,
  Radio,
  Textarea,
  Alert,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconShoppingBag,
  IconInfoCircle,
  IconTrash,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconCash,
} from '@tabler/icons-react';
import { getDb, getNextVenteCode } from '../../database/db';
import { notifications } from '@mantine/notifications';
import FormulaireClient from '../clients/FormulaireClient';

interface FormulaireVenteProps {
  onSuccess: () => void;
  onCancel: () => void;
  prefillClient?: { telephone_id: string; nom_prenom: string };
  defaultType?: VenteType;
}

interface Client {
  telephone_id: string;
  nom_prenom: string;
  adresse?: string;
}

interface Produit {
  id: number;
  code: string;
  designation: string;
  unite: string;
  prix_vente: number;
  stock_actuel: number;
  type_produit: 'matiere' | 'tenue';
}

interface TenueVariante {
  id: number;
  tenue_id: number;
  taille_id: number;
  taille_libelle: string;
  stock_actuel: number;
  prix_vente: number | null;
}

interface PanierItem {
  id: string;
  produitId: number;
  designation: string;
  taille?: string;
  varianteId?: number;
  quantite: number;
  prixUnitaire: number;
  total: number;
  type_produit?: 'matiere' | 'tenue';
}

type VenteType = 'commande' | 'pret_a_porter' | 'matiere';

const FormulaireVente: React.FC<FormulaireVenteProps> = ({
  onSuccess,
  onCancel,
  prefillClient,
  defaultType
}) => {
  // État principal
  const [venteType, setVenteType] = useState<VenteType>(defaultType || 'commande');
  const [codeVente, setCodeVente] = useState('');

  // Client - Commande (obligatoire)
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');

  // Client - Prêt-à-porter et Matière (optionnel)
  const [clientNomSimple, setClientNomSimple] = useState('');
  const [clientTelephoneSimple, setClientTelephoneSimple] = useState('');

  // Produit - Commande
  const [produitCommande, setProduitCommande] = useState('');
  const [montantCommande, setMontantCommande] = useState(0);
  const [avanceMontant, setAvanceMontant] = useState(0);
  const [avanceMode, setAvanceMode] = useState('Espèces');

  // Produit - Prêt-à-porter (panier)
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [variantes, setVariantes] = useState<TenueVariante[]>([]);
  const [selectedVariante, setSelectedVariante] = useState<TenueVariante | null>(null);
  const [quantiteCmd, setQuantiteCmd] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Données
  const [clients, setClients] = useState<Client[]>([]);
  const [matieres, setMatieres] = useState<Produit[]>([]);
  const [gammesTenues, setGammesTenues] = useState<Produit[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [tailleModalOpen, setTailleModalOpen] = useState(false);
  const [nouveauClientModalOpen, setNouveauClientModalOpen] = useState(false);
  const [nouveauClient, setNouveauClient] = useState({ nom: '', telephone: '', adresse: '' });
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [avanceModalOpen, setAvanceModalOpen] = useState(false);
  const [observation, setObservation] = useState('');
  const [dateCommande, setDateCommande] = useState(new Date().toISOString().split('T')[0]);
  const [showFormulaireClient, setShowFormulaireClient] = useState(false);

  // Calculs
  const totalPanier = panier.reduce((sum, item) => sum + item.total, 0);
  const montantTotal = venteType === 'commande' ? montantCommande : totalPanier;
  const resteAPayer = montantTotal - avanceMontant;

  // Pré-remplir le client si fourni
  useEffect(() => {
    if (prefillClient) {
      setClientId(prefillClient.telephone_id);
      setClientNom(prefillClient.nom_prenom);
    }
  }, [prefillClient]);

  // Générer le code vente
  useEffect(() => {
    const generateCode = async () => {
      try {
        const code = await getNextVenteCode();
        setCodeVente(code);
      } catch (error) {
        setCodeVente(`VTE-${Date.now()}`);
      }
    };
    generateCode();
  }, []);

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      const db = await getDb();

      const clientsData = await db.select<Client[]>(`
        SELECT telephone_id, nom_prenom, adresse 
        FROM clients WHERE est_supprime = 0 ORDER BY nom_prenom
      `);
      setClients(clientsData);

      const matieresData = await db.select<Produit[]>(`
        SELECT id, code_matiere as code, designation, unite, prix_vente, stock_actuel, 'matiere' as type_produit
        FROM matieres WHERE est_supprime = 0 AND stock_actuel > 0 ORDER BY designation
      `);
      setMatieres(matieresData);

      const tenuesData = await db.select<Produit[]>(`
        SELECT id, code_tenue as code, designation, 'pièce' as unite, prix_base as prix_vente, 0 as stock_actuel, 'tenue' as type_produit
        FROM gammes_tenues WHERE est_actif = 1 ORDER BY designation
      `);
      setGammesTenues(tenuesData);
    };
    loadData();
  }, []);

  // Charger variantes
  useEffect(() => {
    const loadVariantes = async () => {
      if (selectedProduit && selectedProduit.type_produit === 'tenue') {
        const db = await getDb();
        const data = await db.select<TenueVariante[]>(`
          SELECT tv.id, tv.tenue_id, tv.taille_id, t.libelle as taille_libelle, tv.stock_actuel, tv.prix_vente
          FROM tenues_variantes tv
          JOIN tailles t ON tv.taille_id = t.id
          WHERE tv.tenue_id = ? AND tv.stock_actuel > 0
          ORDER BY t.ordre
        `, [selectedProduit.id]);
        setVariantes(data);
        setSelectedVariante(null);
      } else {
        setVariantes([]);
        setSelectedVariante(null);
      }
    };
    loadVariantes();
  }, [selectedProduit]);

  // Créer client
  const handleCreerClient = async () => {
    if (!nouveauClient.nom || !nouveauClient.telephone) {
      notifications.show({ title: 'Erreur', message: 'Nom et téléphone requis', color: 'red' });
      return;
    }
    const db = await getDb();
    try {
      await db.execute(`INSERT INTO clients (telephone_id, nom_prenom, adresse, est_supprime) VALUES (?, ?, ?, 0)`,
        [nouveauClient.telephone, nouveauClient.nom, nouveauClient.adresse]);
      notifications.show({ title: 'Succès', message: 'Client créé', color: 'green' });
      const clientsData = await db.select<Client[]>(`SELECT telephone_id, nom_prenom, adresse FROM clients WHERE est_supprime = 0 ORDER BY nom_prenom`);
      setClients(clientsData);
      setNouveauClientModalOpen(false);
      setNouveauClient({ nom: '', telephone: '', adresse: '' });
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    }
  };

  // Ajouter au panier (prêt-à-porter)
  const handleAjouterAuPanier = () => {
    if (!selectedProduit) return;

    let prix = selectedProduit.prix_vente;
    let designation = selectedProduit.designation;
    let taille = undefined;
    let varianteId = undefined;
    let typeProduit = selectedProduit.type_produit;

    if (selectedProduit.type_produit === 'tenue') {
      if (!selectedVariante) {
        notifications.show({ title: 'Erreur', message: 'Sélectionnez une taille', color: 'red' });
        return;
      }
      prix = selectedVariante.prix_vente || selectedProduit.prix_vente;
      designation = `${selectedProduit.designation} - ${selectedVariante.taille_libelle}`;
      taille = selectedVariante.taille_libelle;
      varianteId = selectedVariante.id;

      if (quantiteCmd > selectedVariante.stock_actuel) {
        notifications.show({ title: 'Erreur', message: `Stock insuffisant (max: ${selectedVariante.stock_actuel})`, color: 'red' });
        return;
      }
    } else if (selectedProduit.type_produit === 'matiere') {
      if (quantiteCmd > selectedProduit.stock_actuel) {
        notifications.show({ title: 'Erreur', message: `Stock insuffisant (max: ${selectedProduit.stock_actuel})`, color: 'red' });
        return;
      }
    }

    const newItem: PanierItem = {
      id: `${Date.now()}-${Math.random()}`,
      produitId: selectedProduit.id,
      designation,
      taille,
      varianteId,
      quantite: quantiteCmd,
      prixUnitaire: prix,
      total: prix * quantiteCmd,
      type_produit: typeProduit,
    };

    setPanier([...panier, newItem]);
    setSelectedProduit(null);
    setSelectedVariante(null);
    setQuantiteCmd(1);
    setTailleModalOpen(false);

    notifications.show({ title: 'Ajouté', message: `${designation} x${quantiteCmd}`, color: 'green' });
  };

  // Supprimer du panier
  const handleSupprimerPanier = (id: string) => {
    setPanier(panier.filter(item => item.id !== id));
  };

  // Soumettre la vente
  const handleSubmit = async () => {
    setLoading(true);

    // Validation
    if (venteType === 'commande' && (!produitCommande || montantCommande <= 0)) {
      notifications.show({ title: 'Erreur', message: 'Renseignez le produit et le montant', color: 'red' });
      setLoading(false);
      return;
    }

    if (venteType === 'pret_a_porter' && panier.length === 0) {
      notifications.show({ title: 'Erreur', message: 'Ajoutez des produits au panier', color: 'red' });
      setLoading(false);
      return;
    }

    if (venteType === 'matiere' && panier.length === 0) {
      notifications.show({ title: 'Erreur', message: 'Ajoutez des matières au panier', color: 'red' });
      setLoading(false);
      return;
    }

    if (venteType === 'commande' && !clientId && !clientNom) {
      notifications.show({ title: 'Erreur', message: 'Client requis pour une commande', color: 'red' });
      setLoading(false);
      return;
    }

    try {
      const db = await getDb();

      // Déterminer le client final
      let finalClientId = null;
      let finalClientNom = '';
      let finalClientTel = '';

      if (venteType === 'commande') {
        if (clientId) {
          finalClientId = clientId;
          const client = clients.find(c => c.telephone_id === clientId);
          finalClientNom = client?.nom_prenom || '';
          finalClientTel = client?.telephone_id || '';
        } else if (clientNom) {
          finalClientNom = clientNom;
          finalClientTel = clientTelephone;
        }
      } else {
        finalClientNom = clientNomSimple || 'Client anonyme';
        finalClientTel = clientTelephoneSimple;
      }

      const montantTotalVente = venteType === 'commande' ? montantCommande : totalPanier;
      const montantRegle = venteType === 'commande' ? avanceMontant : montantTotalVente;
      const statut = montantRegle >= montantTotalVente ? 'PAYEE' : (montantRegle > 0 ? 'PARTIEL' : 'EN_ATTENTE');

      // Insérer l'entête
      const result = await db.execute(`
        INSERT INTO ventes (code_vente, type_vente, date_vente, client_id, client_nom, client_telephone,
          mode_paiement, montant_total, montant_regle, statut, observation, date_livraison)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        codeVente, venteType, dateCommande, finalClientId, finalClientNom, finalClientTel,
        venteType === 'commande' ? avanceMode : 'Espèces',
        montantTotalVente, montantRegle, statut, observation, null
      ]);

      const venteId = result.lastInsertId;

      // Insérer les détails
      if (venteType === 'commande') {
        await db.execute(`
          INSERT INTO vente_details (vente_id, designation, quantite, prix_unitaire, total, observation)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [venteId, produitCommande, 1, montantCommande, montantCommande, `Commande sur mesure - Avance: ${avanceMontant} FCFA`]);
      } else {
        for (const item of panier) {
          await db.execute(`
            INSERT INTO vente_details (vente_id, matiere_id, tenue_variante_id, designation, quantite, prix_unitaire, total, taille_libelle)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            venteId,
            item.type_produit === 'matiere' ? item.produitId : null,
            item.varianteId || null,
            item.designation,
            item.quantite,
            item.prixUnitaire,
            item.total,
            item.taille || null
          ]);

          // Mise à jour stock
          if (item.varianteId) {
            await db.execute(`UPDATE tenues_variantes SET stock_actuel = stock_actuel - ? WHERE id = ?`, [item.quantite, item.varianteId]);
          } else if (item.type_produit === 'matiere') {
            await db.execute(`UPDATE matieres SET stock_actuel = stock_actuel - ? WHERE id = ?`, [item.quantite, item.produitId]);
          }
        }
      }

      notifications.show({ title: 'Succès', message: `Vente ${codeVente} enregistrée`, color: 'green' });
      setTimeout(() => onSuccess(), 1500);

    } catch (err: any) {
      console.error(err);
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVenteType(defaultType || 'commande');
    setClientId(null);
    setClientNom('');
    setClientTelephone('');
    setClientNomSimple('');
    setClientTelephoneSimple('');
    setPanier([]);
    setSelectedProduit(null);
    setMontantCommande(0);
    setAvanceMontant(0);
    setObservation('');
    setProduitCommande('');
    setSearchTerm('');
  };

  const clientOptions = clients.map(c => ({ value: c.telephone_id, label: `${c.nom_prenom} - ${c.telephone_id}` }));

 if (showFormulaireClient) {
  return (
    <FormulaireClient
      onBack={() => setShowFormulaireClient(false)}
      onSuccess={(clientId, clientNom) => {
        setShowFormulaireClient(false);
        // Recharger les clients
        const loadClients = async () => {
          const db = await getDb();
          const clientsData = await db.select<Client[]>(`
            SELECT telephone_id, nom_prenom, adresse 
            FROM clients WHERE est_supprime = 0 ORDER BY nom_prenom
          `);
          setClients(clientsData);
          // Présélectionner le client créé
          if (clientId) {
            setClientId(clientId);
            setClientNom(clientNom || '');
          }
        };
        loadClients();
      }}
    />
  );
}

  return (
    <Container size="xl" p={0}>
      <Box style={{ maxWidth: 1400, margin: '0 auto' }} p="md">
        <Stack gap="md">
          {/* HEADER */}
          <Card withBorder radius="lg" p="md" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={50} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconShoppingBag size={24} color="white" />
                </Avatar>
                <Box>
                  <Title order={3} c="white" size="h3">Nouvelle vente</Title>
                  <Text c="gray.3" size="sm">Code: {codeVente}</Text>
                </Box>
              </Group>
              <Group gap="xs">
                <Tooltip label="Aide"><ActionIcon variant="light" color="white" size="lg" onClick={() => setInfoModalOpen(true)}><IconInfoCircle size={20} /></ActionIcon></Tooltip>
                <Tooltip label="Réinitialiser"><ActionIcon variant="light" color="white" size="lg" onClick={resetForm}><IconRefresh size={20} /></ActionIcon></Tooltip>
                <Tooltip label="Retour"><ActionIcon variant="light" color="white" size="lg" onClick={onCancel}><IconArrowLeft size={20} /></ActionIcon></Tooltip>
              </Group>
            </Group>
          </Card>

          {/* TYPE DE VENTE */}
          <Card withBorder radius="lg" shadow="sm" p="lg">
            <Title order={4} mb="md">📋 Type de vente</Title>
            <Radio.Group value={venteType} onChange={(val) => setVenteType(val as VenteType)}>
              <Group grow>
                <Radio value="commande" label="👔 Commande (Sur mesure)" />
                <Radio value="pret_a_porter" label="👕 Prêt-à-porter" />
                <Radio value="matiere" label="📦 Matière" />
              </Group>
            </Radio.Group>
          </Card>

          {/* SECTION CLIENT SELON TYPE */}
          <Card withBorder radius="lg" shadow="sm" p="lg">
            <Title order={4} mb="md">👤 Informations client</Title>

            {venteType === 'commande' ? (
              <Stack>
                <Select
                  label="Client existant"
                  placeholder="Choisir un client"
                  data={clientOptions}
                  value={clientId}
                  onChange={setClientId}
                  searchable
                  clearable
                />
                <Divider label="OU" labelPosition="center" />
                <SimpleGrid cols={2} spacing="md">
                  <TextInput label="Nom complet" placeholder="Nom du client" value={clientNom} onChange={(e) => setClientNom(e.target.value)} />
                  <TextInput label="Téléphone" placeholder="Numéro" value={clientTelephone} onChange={(e) => setClientTelephone(e.target.value)} />
                </SimpleGrid>
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => setShowFormulaireClient(true)}
                >
                  + Nouveau client
                </Button>
              </Stack>
            ) : (
              <SimpleGrid cols={2} spacing="md">
                <TextInput label="Nom du client (optionnel)" placeholder="Nom" value={clientNomSimple} onChange={(e) => setClientNomSimple(e.target.value)} />
                <TextInput label="Téléphone (optionnel)" placeholder="Numéro" value={clientTelephoneSimple} onChange={(e) => setClientTelephoneSimple(e.target.value)} />
              </SimpleGrid>
            )}
          </Card>

          {/* SECTION PRODUIT SELON TYPE */}
          {venteType === 'commande' && (
            <Card withBorder radius="lg" shadow="sm" p="lg">
              <Title order={4} mb="md">📝 Détails de la commande</Title>
              <Stack>
                <TextInput
                  label="Produit commandé"
                  placeholder="Ex: Costume 3 pièces, Robe de mariée..."
                  value={produitCommande}
                  onChange={(e) => setProduitCommande(e.target.value)}
                  required
                />
                <SimpleGrid cols={2} spacing="md">
                  <NumberInput
                    label="Quantité"
                    placeholder="1"
                    value={quantiteCmd}
                    onChange={(val) => setQuantiteCmd(Number(val) || 1)}
                    min={1}
                    required
                  />
                  <NumberInput
                    label="Prix unitaire (FCFA)"
                    placeholder="0"
                    value={montantCommande}
                    onChange={(val) => setMontantCommande(Number(val) || 0)}
                    min={0}
                    step={1000}
                    required
                  />
                </SimpleGrid>
                {avanceMontant > 0 && (
                  <Alert color="blue" variant="light">
                    <Group justify="space-between">
                      <Text>Avance :</Text>
                      <Text fw={700}>{avanceMontant.toLocaleString()} FCFA</Text>
                      <Text>Mode :</Text>
                      <Text fw={500}>{avanceMode}</Text>
                      <Text>Reste :</Text>
                      <Text fw={700} c="orange">{resteAPayer.toLocaleString()} FCFA</Text>
                    </Group>
                  </Alert>
                )}
                <Button
                  leftSection={<IconCash size={16} />}
                  onClick={() => setAvanceModalOpen(true)}
                  variant="outline"
                  disabled={montantCommande <= 0}
                >
                  {avanceMontant > 0 ? 'Modifier l\'avance' : 'Ajouter une avance'}
                </Button>
              </Stack>
            </Card>
          )}

          {/* SECTION PRODUITS POUR PRÊT-À-PORTER ET MATIÈRE */}
          {(venteType === 'pret_a_porter' || venteType === 'matiere') && (
            <Card withBorder radius="lg" shadow="sm" p="lg">
              <Title order={4} mb="md">
                {venteType === 'pret_a_porter' ? '👕 Tenues disponibles' : '📦 Matières disponibles'}
              </Title>

              <TextInput
                placeholder="Rechercher un produit..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                mb="md"
              />

              <ScrollArea style={{ maxHeight: 300 }}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Désignation</Table.Th>
                      <Table.Th>Prix</Table.Th>
                      <Table.Th>Stock</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {venteType === 'pret_a_porter' ? (
                      gammesTenues
                        .filter(tenue =>
                          tenue.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenue.code.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((tenue) => (
                          <Table.Tr key={tenue.id}>
                            <Table.Td fw={500}>{tenue.designation}</Table.Td>
                            <Table.Td>{tenue.prix_vente.toLocaleString()} FCFA</Table.Td>
                            <Table.Td>
                              <Badge color="blue" variant="light">Voir tailles</Badge>
                            </Table.Td>
                            <Table.Td>
                              <Button size="xs" variant="light" onClick={() => {
                                setSelectedProduit(tenue);
                                setTailleModalOpen(true);
                              }}>
                                Sélectionner
                              </Button>
                            </Table.Td>
                          </Table.Tr>
                        ))
                    ) : (
                      matieres
                        .filter(matiere =>
                          matiere.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          matiere.code.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((matiere) => (
                          <Table.Tr key={matiere.id}>
                            <Table.Td fw={500}>{matiere.designation}</Table.Td>
                            <Table.Td>{matiere.prix_vente.toLocaleString()} FCFA</Table.Td>
                            <Table.Td>
                              <Badge color={matiere.stock_actuel < 5 ? 'orange' : 'green'}>
                                {matiere.stock_actuel} {matiere.unite}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Button size="xs" variant="light" onClick={() => {
                                setSelectedProduit(matiere);
                                handleAjouterAuPanier();
                              }}>
                                Ajouter
                              </Button>
                            </Table.Td>
                          </Table.Tr>
                        ))
                    )}
                  </Table.Tbody>
                </Table>
              </ScrollArea>

              {/* Panier pour prêt-à-porter et matière */}
              {panier.length > 0 && (
                <>
                  <Divider my="md" label="🛒 Panier" labelPosition="center" />
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Produit</Table.Th>
                        <Table.Th>Qté</Table.Th>
                        <Table.Th>Prix unitaire</Table.Th>
                        <Table.Th>Total</Table.Th>
                        <Table.Th></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {panier.map((item, idx) => (
                        <Table.Tr key={`${item.id}-${idx}`}>
                          <Table.Td>
                            <Text size="sm">{item.designation}</Text>
                            {item.taille && <Text size="xs" c="dimmed">Taille: {item.taille}</Text>}
                          </Table.Td>
                          <Table.Td>{item.quantite}</Table.Td>
                          <Table.Td>{item.prixUnitaire.toLocaleString()} FCFA</Table.Td>
                          <Table.Td fw={600}>{item.total.toLocaleString()} FCFA</Table.Td>
                          <Table.Td>
                            <ActionIcon color="red" onClick={() => handleSupprimerPanier(item.id)}>
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  <Divider />
                  <Group justify="space-between" mt="md">
                    <Text fw={700}>Total général :</Text>
                    <Text fw={700} size="xl" c="blue">{totalPanier.toLocaleString()} FCFA</Text>
                  </Group>
                </>
              )}
            </Card>
          )}

          {/* SECTION COMMUNE */}
          <Card withBorder radius="lg" shadow="sm" p="lg">
            <Title order={4} mb="md">ℹ️ Informations complémentaires</Title>
            <SimpleGrid cols={2} spacing="md">
              <TextInput
                label="Date de vente"
                type="date"
                value={dateCommande}
                onChange={(e) => setDateCommande(e.target.value)}
              />
              <Textarea
                label="Observation"
                placeholder="Notes..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                rows={2}
              />
            </SimpleGrid>
          </Card>

          {/* ACTIONS */}
          <Group justify="flex-end">
            <Button variant="outline" color="red" onClick={onCancel} size="md">Annuler</Button>
            <Button onClick={handleSubmit} loading={loading} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }} size="md">
              Enregistrer la vente
            </Button>
          </Group>

          {/* MODAL AVANCE */}
          <Modal opened={avanceModalOpen} onClose={() => setAvanceModalOpen(false)} title="💰 Paiement de l'avance" size="md" centered>
            <Stack>
              <NumberInput
                label="Montant de l'avance (FCFA)"
                value={avanceMontant}
                onChange={(val) => setAvanceMontant(Number(val) || 0)}
                min={0}
                max={montantCommande}
              />
              <Select
                label="Mode de paiement"
                data={[
                  { value: 'Espèces', label: '💵 Espèces' },
                  { value: 'Orange money', label: '📱 Orange Money' },
                  { value: 'Wave', label: '🌊 Wave' }
                ]}
                value={avanceMode}
                onChange={(val) => setAvanceMode(val || 'Espèces')}
              />
              <Group justify="flex-end">
                <Button variant="light" onClick={() => setAvanceModalOpen(false)}>Annuler</Button>
                <Button onClick={() => setAvanceModalOpen(false)}>Valider</Button>
              </Group>
            </Stack>
          </Modal>

          {/* MODAL TAILLES */}
          <Modal opened={tailleModalOpen} onClose={() => setTailleModalOpen(false)} title={`Choisir une taille - ${selectedProduit?.designation}`} size="lg" centered>
            <SimpleGrid cols={3} spacing="md">
              {variantes.map((v) => (
                <Paper
                  key={v.id}
                  p="md"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedVariante?.id === v.id ? '#e0f7fa' : 'white'
                  }}
                  onClick={() => setSelectedVariante(v)}
                >
                  <Stack align="center">
                    <Badge size="lg" color="blue">{v.taille_libelle}</Badge>
                    <Text fw={700}>{(v.prix_vente || selectedProduit?.prix_vente || 0).toLocaleString()} FCFA</Text>
                    <Text size="xs">Stock: {v.stock_actuel}</Text>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
            {selectedVariante && (
              <Paper p="md" mt="md" bg="blue.0">
                <Grid align="flex-end">
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Quantité"
                      value={quantiteCmd}
                      onChange={(val) => setQuantiteCmd(Number(val) || 1)}
                      min={1}
                      max={selectedVariante.stock_actuel}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Button fullWidth onClick={handleAjouterAuPanier} leftSection={<IconPlus size={16} />}>
                      Ajouter au panier
                    </Button>
                  </Grid.Col>
                </Grid>
              </Paper>
            )}
          </Modal>

          {/* MODAL NOUVEAU CLIENT */}
          <Modal opened={nouveauClientModalOpen} onClose={() => setNouveauClientModalOpen(false)} title="➕ Nouveau client" size="md" centered>
            <Stack>
              <TextInput
                label="Nom complet"
                value={nouveauClient.nom}
                onChange={(e) => setNouveauClient({ ...nouveauClient, nom: e.target.value })}
                required
              />
              <TextInput
                label="Téléphone"
                value={nouveauClient.telephone}
                onChange={(e) => setNouveauClient({ ...nouveauClient, telephone: e.target.value })}
                required
              />
              <TextInput
                label="Adresse"
                value={nouveauClient.adresse}
                onChange={(e) => setNouveauClient({ ...nouveauClient, adresse: e.target.value })}
              />
              <Group justify="flex-end">
                <Button variant="light" onClick={() => setNouveauClientModalOpen(false)}>Annuler</Button>
                <Button onClick={handleCreerClient}>Créer</Button>
              </Group>
            </Stack>
          </Modal>

          {/* MODAL AIDE */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📖 Guide" size="md" centered>
            <Stack>
              <Text fw={600}>1️⃣ Commande (Sur mesure)</Text>
              <Text size="sm">- Client obligatoire (existant ou nouveau)</Text>
              <Text size="sm">- Décrivez le produit commandé</Text>
              <Text size="sm">- Ajoutez une avance si nécessaire</Text>
              <Divider />
              <Text fw={600}>2️⃣ Prêt-à-porter</Text>
              <Text size="sm">- Client optionnel</Text>
              <Text size="sm">- Sélectionnez produits et tailles</Text>
              <Text size="sm">- Ajoutez au panier, plusieurs produits possibles</Text>
              <Divider />
              <Text fw={600}>3️⃣ Matière</Text>
              <Text size="sm">- Client optionnel</Text>
              <Text size="sm">- Vente directe de matières en stock</Text>
            </Stack>
          </Modal>
        </Stack>
      </Box>
    </Container>
  );
};

export default FormulaireVente;