// src/components/ventes/FormulaireVente.tsx
import React, { useState, useEffect } from 'react';
import {
  Container, Stack, Card, Title, Text, Group, Button, TextInput, NumberInput,
  Divider, Box, Modal, Select, Tooltip, ActionIcon,
  SimpleGrid, ThemeIcon, SegmentedControl, Textarea, Paper
} from '@mantine/core';
import {
  IconShoppingBag, IconPlus, IconRefresh, IconList, IconUser,
  IconCalendar, IconClock, IconReceipt, IconPhone
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { apiGet, apiPost } from '../../services/api';
import FormulaireClient from '../clients/FormulaireClient';
import ListeProduits from './ListeProduits';
import PanierVente from './PanierVente';
import { usePanier } from '../../hooks/usePanier';
import { useStock } from '../../hooks/useStock';
import { VenteType, Client, Article, Matiere } from '../../types';


interface FormulaireVenteProps {
  codeVente: string;
  onBack: () => void;
  onSuccess: () => void;
  generateCode: () => Promise<void>;
}

const FormulaireVente: React.FC<FormulaireVenteProps> = ({
  codeVente,
  onBack,
  onSuccess,
  generateCode
}) => {
  
  // États
  const [loading, setLoading] = useState(false);
  const [venteType, setVenteType] = useState<VenteType>('commande');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [clientNomSimple, setClientNomSimple] = useState('');
  const [clientTelephoneSimple, setClientTelephoneSimple] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [couleurs, setCouleurs] = useState<any[]>([]);
  const [tailles, setTailles] = useState<any[]>([]);
  const [searchProduitTerm, setSearchProduitTerm] = useState('');
  const [showFormulaireClient, setShowFormulaireClient] = useState(false);
  const [showQuantiteModal, setShowQuantiteModal] = useState(false);
  const [observation, setObservation] = useState('');
  const [dateCommande, setDateCommande] = useState(new Date().toISOString().split('T')[0]);
  const [dateRendezVous, setDateRendezVous] = useState('');
  const [heureRendezVous, setHeureRendezVous] = useState('');
  const [typeRendezVous, setTypeRendezVous] = useState('essayage');
  const [produitCommande, setProduitCommande] = useState('');
  const [montantCommande, setMontantCommande] = useState(0);
  const [quantiteCommande, setQuantiteCommande] = useState(1);
  
  // Hooks personnalisés
  const { 
    panier, 
    setPanier,
    totalPanier,
    selectedArticle,
    setSelectedArticle,
    quantiteCmd,
    setQuantiteCmd,
    ajouterArticleAuPanier,
    ajouterMatiereAuPanier,
    supprimerDuPanier  
  } = usePanier();
  
  const { updateStockForPanier, loading: stockLoading } = useStock();

  // Chargement des données
  const loadFormData = async () => {
    try {
      const [
        clientsData,
        articlesData,
        matieresData,
        couleursData,
        taillesData
      ] = await Promise.all([
        apiGet("/clients"),
        apiGet("/articles"),
        apiGet("/matieres"),
        apiGet("/couleurs"),
        apiGet("/tailles")
      ]);

      setClients(clientsData.filter((c: any) => c.est_supprime === 0).sort((a: any, b: any) => a.nom_prenom.localeCompare(b.nom_prenom)));
      setArticles(articlesData.filter((a: any) => a.est_actif === 1 && a.est_disponible === 1 && Number(a.quantite_stock) > 0));
      setMatieres(matieresData.filter((m: any) => m.est_supprime === 0 && Number(m.stock_actuel) > 0).sort((a: any, b: any) => a.designation.localeCompare(b.designation)));
      setCouleurs(couleursData.filter((c: any) => c.est_actif === 1));
      setTailles(taillesData.filter((t: any) => t.est_actif === 1));
    } catch (err: any) {
      console.error(err);
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    }
  };

  useEffect(() => {
    loadFormData();
    generateCode();
  }, []);

  // Soumission de la vente
  const handleSubmitVente = async () => {
    if (panier.length === 0) {
      notifications.show({ title: 'Erreur', message: 'Ajoutez des articles au panier', color: 'red' });
      return;
    }
    
    setLoading(true);
    
    let finalClientId = null;
    let finalClientNom = 'Client comptoir';
    let finalClientTelephone = null; // 🔥 Ajout du téléphone
    let finalStatut = '';
    let finalMontantRegle = 0;
    
    try {
      const codeResponse = await apiPost("/ventes/generate-code", {});
      const nouveauCode = codeResponse.code;
      
      // 🔥 CORRECTION: Gérer correctement les deux types de clients
      if (venteType === 'commande') {
        // Client existant dans la base
        if (clientId) {
          finalClientId = parseInt(clientId);
          const client = clients.find(c => String(c.id) === clientId || c.telephone_id === clientId);
          if (client) {
            finalClientNom = client.nom_prenom;
            finalClientTelephone = client.telephone_id;
          } else {
            finalClientNom = clientNom || 'Client';
            finalClientTelephone = clientTelephone || null;
          }
        } else {
          finalClientNom = clientNom || 'Client';
          finalClientTelephone = clientTelephone || null;
        }
      } else {
        // 🔥 Vente au détail: utiliser les champs saisis
        finalClientNom = clientNomSimple || 'Client comptoir';
        finalClientTelephone = clientTelephoneSimple || null;
      }

      console.log("📊 Données client - ID:", finalClientId, "Nom:", finalClientNom, "Tél:", finalClientTelephone);

      finalStatut = venteType === 'commande' ? 'EN_ATTENTE' : 'PAYEE';
      finalMontantRegle = venteType === 'commande' ? 0 : totalPanier;

      // Mettre à jour le stock (uniquement pour les articles avec ID)
      await updateStockForPanier(panier);

      // Créer la vente
      const venteData = {
        code_vente: nouveauCode,
        type_vente: venteType,
        date_vente: dateCommande,
        client_id: finalClientId,
        client_nom: finalClientNom,
        client_telephone: finalClientTelephone, // 🔥 Ajout du téléphone
        mode_paiement: 'Espèces',
        montant_total: totalPanier,
        montant_regle: finalMontantRegle,
        statut: finalStatut,
        observation,
        details: panier.map(item => ({
          type_produit: item.type_produit,
          article_id: item.type_produit === 'article' && item.produitId > 0 ? item.produitId : null,
          matiere_id: item.type_produit === 'matiere' ? item.produitId : null,
          designation: item.designation || 'Article',
          quantite: item.quantite,
          prix_unitaire: item.prixUnitaire,
          total: item.total,
          taille_libelle: item.taille || null
        })),
        rendezvous: venteType === 'commande' && finalClientId && dateRendezVous ? {
          client_id: finalClientId,
          type_rendezvous: typeRendezVous,
          date_rendezvous: dateRendezVous,
          heure_rendezvous: heureRendezVous || null,
          statut: 'planifie'
        } : null
      };

      console.log("📊 Données vente envoyées:", JSON.stringify(venteData, null, 2));

      await apiPost('/ventes', venteData);

      notifications.show({
        title: 'Succès',
        message: `Vente ${nouveauCode} enregistrée${finalClientNom ? ' pour ' + finalClientNom : ''}`,
        color: 'green'
      });

      onSuccess();
      resetForm();
    } catch (err: any) {
      console.error('Erreur création vente:', err);
      notifications.show({ 
        title: 'Erreur', 
        message: err.message || String(err), 
        color: 'red' 
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPanier([]);
    setClientId(null);
    setClientNom('');
    setClientTelephone('');
    setClientNomSimple('');
    setClientTelephoneSimple('');
    setObservation('');
    setDateRendezVous('');
    setHeureRendezVous('');
    setTypeRendezVous('essayage');
    setDateCommande(new Date().toISOString().split('T')[0]);
    setProduitCommande('');
    setMontantCommande(0);
    setQuantiteCommande(1);
    generateCode();
  };

  const clientOptions = clients.map(c => ({
    value: String(c.id),
    label: `${c.nom_prenom} (${c.profil === 'principal' ? 'Moi' : c.profil || 'Moi'}) - ${c.telephone_id}`,
  }));

  if (showFormulaireClient) {
    return (
      <FormulaireClient
        onBack={() => setShowFormulaireClient(false)}
        onSuccess={async (cid, cnom) => {
          setShowFormulaireClient(false);
          try {
            const data = await apiGet("/clients");
            setClients(data.filter((c: any) => c.est_supprime === 0).sort((a: any, b: any) => a.nom_prenom.localeCompare(b.nom_prenom)));
            if (cid) {
              const client = data.find((c: any) => c.id === cid);
              setClientId(String(cid));
              setClientNom(client?.nom_prenom || cnom || '');
              setClientTelephone(client?.telephone_id || '');
            }
          } catch (err) {
            console.error(err);
          }
        }}
      />
    );
  }

  return (
    <Container size="lg" p={0}>
      <Stack gap="md" p="md">
        {/* Header */}
        <Card withBorder radius="lg" p="md" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
          <Group justify="space-between">
            <Group gap="sm">
              <ThemeIcon size={42} radius="md" variant="white" color="#1b365d">
                <IconShoppingBag size={22} />
              </ThemeIcon>
              <Box>
                <Title order={4} c="white">Nouvelle vente</Title>
                <Text c="gray.3" size="xs">Code : {codeVente}</Text>
              </Box>
            </Group>
            <Group gap={4}>
              <Tooltip label="Liste">
                <ActionIcon variant="subtle" color="white" onClick={onBack}>
                  <IconList size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Reset">
                <ActionIcon variant="subtle" color="white" onClick={resetForm}>
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Card>

        {/* Section Client */}
        <Card withBorder radius="lg" shadow="sm" p="md">
          <Group justify="space-between" mb="sm">
            <Title order={5}>👤 Client</Title>
            <SegmentedControl 
              value={venteType} 
              onChange={(val) => { 
                setVenteType(val as VenteType); 
                setPanier([]); 
              }} 
              data={[
                { value: 'commande', label: 'Sur mesure' },
                { value: 'pret_a_porter', label: 'Prêt-à-porter' },
                { value: 'matiere', label: 'Matière' }
              ]} 
              size="xs" 
              color="#1b365d" 
            />
          </Group>
          <Divider mb="sm" />
          
          {venteType === 'commande' ? (
            <Stack gap="xs">
              <Select 
                label="Sélectionnez le client" 
                placeholder="Rechercher par nom ou téléphone..." 
                data={clientOptions} 
                value={clientId} 
                onChange={(value) => {
                  console.log("📊 Client sélectionné:", value);
                  setClientId(value);
                  if (value) {
                    const client = clients.find(c => String(c.id) === value || c.telephone_id === value);
                    if (client) {
                      setClientNom(client.nom_prenom);
                      setClientTelephone(client.telephone_id);
                      console.log("✅ Client trouvé:", client.nom_prenom, client.telephone_id);
                    }
                  } else {
                    setClientNom('');
                    setClientTelephone('');
                  }
                }}
                searchable 
                clearable 
                size="sm" 
                radius="md" 
                leftSection={<IconUser size={16} />} 
              />
              <SimpleGrid cols={2} spacing="xs">
                <TextInput 
                  label="Nom complet" 
                  value={clientId ? clients.find(c => String(c.id) === clientId)?.nom_prenom || clientNom : clientNom} 
                  onChange={(e) => setClientNom(e.target.value)} 
                  size="sm" 
                  radius="md" 
                  readOnly={!!clientId}
                  placeholder="Nom du client"
                />
                <TextInput 
                  label="Téléphone" 
                  value={clientId ? clients.find(c => String(c.id) === clientId)?.telephone_id || clientTelephone : clientTelephone} 
                  size="sm" 
                  radius="md" 
                  readOnly 
                  placeholder="Téléphone"
                  leftSection={<IconPhone size={14} />}
                />
              </SimpleGrid>
              <Button variant="subtle" size="compact-xs" leftSection={<IconPlus size={12} />} onClick={() => setShowFormulaireClient(true)}>
                Nouveau client
              </Button>
            </Stack>
          ) : (
            // 🔥 Vente au détail - client saisi directement
            <SimpleGrid cols={2} spacing="xs">
              <TextInput 
                label="Nom client (optionnel)" 
                value={clientNomSimple} 
                onChange={(e) => {
                  setClientNomSimple(e.target.value);
                  // 🔥 Mettre à jour aussi clientNom pour le reçu
                  setClientNom(e.target.value);
                }}
                size="sm" 
                radius="md" 
                placeholder="Nom du client"
              />
              <TextInput 
                label="Téléphone (optionnel)" 
                value={clientTelephoneSimple} 
                onChange={(e) => {
                  setClientTelephoneSimple(e.target.value);
                  // 🔥 Mettre à jour aussi clientTelephone pour le reçu
                  setClientTelephone(e.target.value);
                }}
                size="sm" 
                radius="md" 
                placeholder="Téléphone du client"
                leftSection={<IconPhone size={14} />}
              />
            </SimpleGrid>
          )}
        </Card>

        {/* Liste des produits */}
        {(venteType === 'pret_a_porter' || venteType === 'matiere') && (
          <ListeProduits
            type={venteType}
            articles={articles}
            matieres={matieres}
            searchTerm={searchProduitTerm}
            onSearchChange={setSearchProduitTerm}
            onRefresh={loadFormData}
            onAddArticle={(article) => {
              setSelectedArticle(article);
              setQuantiteCmd(1);
              setShowQuantiteModal(true);
            }}
            onAddMatiere={ajouterMatiereAuPanier}
            couleurs={couleurs}
            tailles={tailles}
          />
        )}

        {/* Ajout manuel pour commande */}
        {venteType === 'commande' && (
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Title order={5} mb="sm">📝 Ajouter un article à la commande</Title>
            <Group align="flex-end" gap="xs" mb="sm">
              <TextInput 
                placeholder="Désignation" 
                value={produitCommande} 
                onChange={(e) => setProduitCommande(e.target.value)} 
                size="sm" 
                radius="md" 
                style={{ flex: 2 }} 
              />
              <NumberInput 
                placeholder="Qté" 
                value={quantiteCommande} 
                onChange={(val) => setQuantiteCommande(Number(val) || 1)} 
                min={1} 
                size="sm" 
                radius="md" 
                style={{ width: 70 }} 
              />
              <NumberInput 
                placeholder="Prix unitaire" 
                value={montantCommande} 
                onChange={(val) => setMontantCommande(Number(val) || 0)} 
                min={0} 
                step={500} 
                size="sm" 
                radius="md" 
                style={{ width: 130 }} 
                rightSection={<Text size="xs">FCFA</Text>} 
              />
              <ActionIcon 
                variant="filled" 
                color="#1b365d" 
                size="lg" 
                radius="md" 
                onClick={() => { 
                  if (!produitCommande || montantCommande <= 0) { 
                    notifications.show({ title: 'Erreur', message: 'Désignation et prix requis', color: 'red' }); 
                    return; 
                  } 
                  setPanier([...panier, { 
                    id: `${Date.now()}`, 
                    produitId: 0, 
                    designation: produitCommande, 
                    quantite: quantiteCommande, 
                    prixUnitaire: montantCommande, 
                    total: quantiteCommande * montantCommande, 
                    type_produit: 'article' 
                  }]); 
                  setProduitCommande(''); 
                  setMontantCommande(0); 
                  setQuantiteCommande(1); 
                }}
              >
                <IconPlus size={18} />
              </ActionIcon>
            </Group>
          </Card>
        )}

        {/* Rendez-vous pour commande */}
        {venteType === 'commande' && (
          <Card withBorder radius="lg" shadow="sm" p="md" style={{ backgroundColor: '#FFF8E7', borderLeft: '4px solid #1b365d' }}>
            <Group gap="xs" mb="sm">
              <IconCalendar size={22} color="#1b365d" />
              <Title order={5} c="#1b365d">📅 Planifier un rendez-vous</Title>
            </Group>
            <Divider mb="sm" />
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <TextInput 
                label="Date" 
                type="date" 
                placeholder="jj/mm/aaaa" 
                leftSection={<IconCalendar size={14} />} 
                value={dateRendezVous} 
                onChange={(e) => setDateRendezVous(e.target.value)} 
                radius="md" 
              />
              <TextInput 
                label="Heure" 
                type="time" 
                leftSection={<IconClock size={14} />} 
                value={heureRendezVous} 
                onChange={(e) => setHeureRendezVous(e.target.value)} 
                radius="md" 
              />
              <Select 
                label="Type de rendez-vous" 
                value={typeRendezVous} 
                onChange={(v) => setTypeRendezVous(v || 'essayage')} 
                data={[
                  { value: 'essayage', label: '👗 Essayage' },
                  { value: 'livraison', label: '🚚 Livraison' },
                  { value: 'retrait', label: '📦 Retrait' }
                ]} 
                radius="md" 
              />
            </SimpleGrid>
            <Text size="xs" c="dimmed" mt="sm">💡 Un rendez-vous sera automatiquement créé pour ce client</Text>
          </Card>
        )}

        {/* Panier */}
        <PanierVente panier={panier} onRemoveItem={supprimerDuPanier} />

        {/* Résumé et actions */}
        <Card withBorder radius="lg" shadow="sm" p="md">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md">
            <Box>
              <Text size="xs" c="dimmed">Nb d'articles</Text>
              <Text fw={700} size="lg">{panier.length}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Nb de pièces</Text>
              <Text fw={700} size="lg">{panier.reduce((sum, item) => sum + item.quantite, 0)}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Montant Total</Text>
              <Text fw={700} size="lg" c="blue">{totalPanier.toLocaleString()} FCFA</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Date</Text>
              <TextInput 
                type="date" 
                value={dateCommande} 
                onChange={(e) => setDateCommande(e.target.value)} 
                size="xs" 
                radius="md" 
              />
            </Box>
          </SimpleGrid>
          <Divider mb="md" />
          <Textarea 
            label="Observation" 
            placeholder="Notes..." 
            value={observation} 
            onChange={(e) => setObservation(e.target.value)} 
            rows={2} 
            size="sm" 
            radius="md" 
            mb="md" 
          />
          
          <Button 
            onClick={handleSubmitVente} 
            loading={loading || stockLoading} 
            size="md" 
            radius="md" 
            variant="gradient" 
            gradient={{ from: 'green', to: 'teal' }} 
            leftSection={<IconReceipt size={18} />} 
            fullWidth 
            disabled={panier.length === 0}
          >
            {venteType === 'commande' ? 'Enregistrer la commande' : 'Finaliser la vente'}
          </Button>
        </Card>

        {/* Modal quantité */}
        <Modal opened={showQuantiteModal} onClose={() => { setShowQuantiteModal(false); setSelectedArticle(null); setQuantiteCmd(1); }} title="Quantité" size="sm" centered radius="md">
          <Stack gap="md">
            {selectedArticle && (
              <Paper p="sm" withBorder radius="md" bg="gray.0">
                <Text size="sm" fw={600}>{selectedArticle.modele} - {selectedArticle.taille} - {selectedArticle.couleur}</Text>
                <Group justify="space-between" mt={4}>
                  <Text size="xs" c="dimmed">Stock : {selectedArticle.quantite_stock}</Text>
                  <Text size="xs" c="dimmed">Prix : {selectedArticle.prix_vente.toLocaleString()} FCFA</Text>
                </Group>
              </Paper>
            )}
            <NumberInput 
              label="Quantité à ajouter" 
              value={quantiteCmd} 
              onChange={(val) => setQuantiteCmd(typeof val === 'number' ? Math.max(1, val) : 1)} 
              min={1} 
              max={selectedArticle?.quantite_stock || 1} 
              size="sm" 
              radius="md" 
              autoFocus 
            />
            <Group justify="flex-end" gap="xs">
              <Button variant="subtle" size="xs" onClick={() => { setShowQuantiteModal(false); setSelectedArticle(null); }}>
                Annuler
              </Button>
              <Button 
                size="xs" 
                onClick={() => { 
                  setShowQuantiteModal(false); 
                  if (selectedArticle) {
                    ajouterArticleAuPanier(selectedArticle, quantiteCmd, tailles);
                  }
                }}
              >
                Ajouter au panier
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};

export default FormulaireVente;