// components/ventes/VentesManager.tsx
import React, { useState, useEffect } from 'react';
import { Vente } from '../../database/db';
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
  Tooltip,
  ActionIcon,
  Container,
  Table,
  ScrollArea,
  Badge,
  SimpleGrid,
  Radio,
  Textarea,
  Alert,
  Pagination,
  LoadingOverlay
} from '@mantine/core';
import {
  IconArrowLeft,
  IconShoppingBag,
  IconInfoCircle,
  IconTrash,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconFileInvoice,
  IconReceipt,
  IconEye,
  IconPrinter,
  IconList,
  IconShoppingCart,
  IconEdit
} from '@tabler/icons-react';
import { getDb, getNextVenteCode, getVentes, getVenteDetails, getVenteWithDetails, updateVenteComplete } from '../../database/db';
import { notifications } from '@mantine/notifications';
import FormulaireClient from '../clients/FormulaireClient';
import ModalFacture from '../factures/ModalFacture';
import ModalRecu from '../paiements/ModalRecu';

// ========== TYPES ==========
interface Client {
  telephone_id: string;
  nom_prenom: string;
  adresse?: string;
  email?: string;
}

interface Article {
  id: number;
  code_article: string;
  modele: string;
  modele_id: number;
  taille: string;
  taille_id: number;
  couleur: string;
  couleur_id: number;
  texture: string | null;
  prix_vente: number;
  quantite_stock: number;
  emplacement: string | null;
  est_disponible: number;
}

interface Matiere {
  id: number;
  code_matiere: string;
  designation: string;
  unite: string;
  prix_vente: number;
  stock_actuel: number;
}

interface PanierItem {
  id: string;
  produitId: number;
  designation: string;
  taille?: string;
  couleur?: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  type_produit: 'article' | 'matiere';
}


interface LigneEdit {
  id?: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  article_id?: number;
  matiere_id?: number;
  taille_libelle?: string;
}

type VenteType = 'commande' | 'pret_a_porter' | 'matiere';
type ViewMode = 'list' | 'form';

// ========== COMPOSANT PRINCIPAL ==========
const VentesManager: React.FC = () => {
  // ========== ÉTATS ==========
  // Vue
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(false);

  // Liste des ventes
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVente, setSelectedVente] = useState<Vente | null>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const itemsPerPage = 10;

  // Formulaire de vente
  const [venteType, setVenteType] = useState<VenteType>('commande');
  const [codeVente, setCodeVente] = useState('');
  const [deleteVenteModalOpen, setDeleteVenteModalOpen] = useState(false);
  const [deleteVenteId, setDeleteVenteId] = useState<number | null>(null);
  const [deleteVenteCode, setDeleteVenteCode] = useState('');

  // Client
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');
  const [clientNomSimple, setClientNomSimple] = useState('');
  const [clientTelephoneSimple, setClientTelephoneSimple] = useState('');

  // Produits
  const [articles, setArticles] = useState<Article[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [quantiteCmd, setQuantiteCmd] = useState(1);
  const [searchProduitTerm, setSearchProduitTerm] = useState('');

  // Commande commande
  const [produitCommande, setProduitCommande] = useState('');
  const [montantCommande, setMontantCommande] = useState(0);
  const [quantiteCommande, setQuantiteCommande] = useState(1);
  const [avanceMontant, setAvanceMontant] = useState(0);



  // Infos complémentaires
  const [observation, setObservation] = useState('');
  const [dateCommande, setDateCommande] = useState(new Date().toISOString().split('T')[0]);

  // Modals
  const [showFormulaireClient, setShowFormulaireClient] = useState(false);
  const [showFacture, setShowFacture] = useState(false);
  const [showRecu, setShowRecu] = useState(false);
  const [factureData, setFactureData] = useState<any>(null);
  const [venteIdForRecu, setVenteIdForRecu] = useState<number | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Édition
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editVenteData, setEditVenteData] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Ajoute ces états si pas déjà présents
  const [modeles, setModeles] = useState<any[]>([]);
  const [couleurs, setCouleurs] = useState<any[]>([]);
  const [tailles, setTailles] = useState<any[]>([]);
  // Calculs
  const totalPanier = panier.reduce((sum, item) => sum + item.total, 0);

  // ========== FONCTIONS ==========

  // Charger les ventes
  const loadVentes = async () => {
    try {
      setLoading(true);
      const data = await getVentes();
      setVentes(data);
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une vente
  const handleDeleteVente = async () => {
    if (!deleteVenteId) return;

    try {
      setLoading(true);
      const db = await getDb();

      // Supprimer d'abord les détails de la vente
      await db.execute(`DELETE FROM vente_details WHERE vente_id = ?`, [deleteVenteId]);

      // Supprimer la vente
      await db.execute(`DELETE FROM ventes WHERE id = ?`, [deleteVenteId]);

      notifications.show({
        title: 'Succès',
        message: `Vente ${deleteVenteCode} supprimée définitivement`,
        color: 'green'
      });

      setDeleteVenteModalOpen(false);
      setDeleteVenteId(null);
      setDeleteVenteCode('');
      await loadVentes();
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };
  // Charger les données du formulaire
  const loadFormData = async () => {
    try {
      const db = await getDb();

      // Clients
      const clientsData = await db.select<Client[]>(`
        SELECT telephone_id, nom_prenom, adresse, email 
        FROM clients WHERE est_supprime = 0 ORDER BY nom_prenom
      `);
      setClients(clientsData);

      // Articles
      const articlesData = await db.select<Article[]>(`
        SELECT 
          a.id, a.code_article, a.prix_vente, a.quantite_stock, a.est_disponible,
          m.designation as modele, m.id as modele_id,
          t.libelle as taille, t.id as taille_id,
          c.nom_couleur as couleur, c.id as couleur_id,
          tx.nom_texture as texture
        FROM articles a
        LEFT JOIN modeles_tenues m ON a.modele_id = m.id
        LEFT JOIN tailles t ON a.taille_id = t.id
        LEFT JOIN couleurs c ON a.couleur_id = c.id
        LEFT JOIN textures tx ON a.texture_id = tx.id
        WHERE a.est_actif = 1 AND a.est_disponible = 1 AND a.quantite_stock > 0
        ORDER BY m.designation, t.ordre, c.nom_couleur
      `);
      setArticles(articlesData);

      // Matières
      const matieresData = await db.select<Matiere[]>(`
        SELECT id, code_matiere, designation, unite, prix_vente, stock_actuel
        FROM matieres WHERE est_supprime = 0 AND stock_actuel > 0 ORDER BY designation
      `);
      setMatieres(matieresData);

      // Modèles (pour la catégorie) - AJOUT DU TYPE
      const modelesData = await db.select<{ id: number; designation: string; categorie: string }[]>(`
        SELECT id, designation, categorie FROM modeles_tenues WHERE est_actif = 1
      `);
      setModeles(modelesData);

      // Couleurs (pour le visuel) - AJOUT DU TYPE
      const couleursData = await db.select<{ id: number; nom_couleur: string; code_hex: string }[]>(`
        SELECT id, nom_couleur, code_hex FROM couleurs WHERE est_actif = 1
      `);
      setCouleurs(couleursData);

      // Tailles (pour le code taille) - AJOUT DU TYPE
      const taillesData = await db.select<{ id: number; libelle: string; code_taille: string }[]>(`
        SELECT id, libelle, code_taille FROM tailles WHERE est_actif = 1
      `);
      setTailles(taillesData);

    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    }
  };
  // Générer le code vente
  const generateCode = async () => {
    try {
      const code = await getNextVenteCode();
      setCodeVente(code);
    } catch (error) {
      setCodeVente(`VTE-${Date.now()}`);
    }
  };

  // Voir détails d'une vente
  const handleViewDetails = async (vente: Vente) => {
    setSelectedVente(vente);
    try {
      const detailsData = await getVenteDetails(vente.id);
      setDetails(detailsData);
      setDetailsModalOpen(true);
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    }
  };

  // Modifier une vente existante
  const handleEditVente = async (vente: Vente) => {
    try {
      setLoading(true);
      const venteComplete = await getVenteWithDetails(vente.id);

      const lignesEdit: LigneEdit[] = (venteComplete.details || []).map((d: any) => ({
        id: d.id,
        designation: d.designation,
        quantite: d.quantite,
        prix_unitaire: d.prix_unitaire,
        total: d.total,
        article_id: d.article_id,
        matiere_id: d.matiere_id,
        taille_libelle: d.taille_libelle
      }));

      setEditVenteData({
        id: venteComplete.id,
        code_vente: venteComplete.code_vente,
        type_vente: venteComplete.type_vente,
        date_vente: venteComplete.date_vente?.split('T')[0] || new Date().toISOString().split('T')[0],
        client_id: venteComplete.client_id,
        client_nom: venteComplete.client_nom,
        observation: venteComplete.observation || '',
        montant_total: venteComplete.montant_total,
        montant_regle: venteComplete.montant_regle,
        lignes: lignesEdit
      });

      setEditModalOpen(true);
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les modifications
  const handleSaveEditVente = async () => {
    if (!editVenteData) return;

    setEditLoading(true);
    try {
      const newTotal = (editVenteData.lignes || []).reduce((sum: number, l: LigneEdit) => sum + (l.quantite * l.prix_unitaire), 0);

      await updateVenteComplete(editVenteData.id, {
        client_id: editVenteData.client_id,
        client_nom: editVenteData.client_nom,
        date_vente: editVenteData.date_vente,
        observation: editVenteData.observation,
        type_vente: editVenteData.type_vente,
        montant_total: newTotal,
        montant_regle: editVenteData.montant_regle,
        details: editVenteData.lignes
      });

      notifications.show({ title: 'Succès', message: 'Vente modifiée avec succès', color: 'green' });
      setEditModalOpen(false);
      setEditVenteData(null);
      await loadVentes();
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setEditLoading(false);
    }
  };

  // Ajouter une ligne dans l'édition
  const handleAddEditLigne = () => {
    const newLigne: LigneEdit = {
      designation: '',
      quantite: 1,
      prix_unitaire: 0,
      total: 0
    };
    setEditVenteData({
      ...editVenteData,
      lignes: [...(editVenteData?.lignes || []), newLigne]
    });
  };

  // Modifier une ligne dans l'édition
  const handleEditLigneChange = (index: number, field: string, value: any) => {
    const newLignes = [...(editVenteData?.lignes || [])];
    newLignes[index][field] = value;
    newLignes[index].total = (newLignes[index].quantite || 0) * (newLignes[index].prix_unitaire || 0);
    setEditVenteData({ ...editVenteData, lignes: newLignes });
  };

  // Supprimer une ligne dans l'édition
  const handleRemoveEditLigne = (index: number) => {
    const newLignes = [...(editVenteData?.lignes || [])];
    newLignes.splice(index, 1);
    setEditVenteData({ ...editVenteData, lignes: newLignes });
  };

  // Calcul du total dans l'édition
  const getEditTotal = () => {
    return (editVenteData?.lignes || []).reduce((sum: number, l: LigneEdit) => sum + (l.quantite * l.prix_unitaire), 0);
  };

  // Afficher la facture (UNIQUEMENT pour les commandes commande)
  const handleShowFacture = (vente: Vente) => {
    if (vente.type_vente !== 'commande') {
      notifications.show({
        title: 'Information',
        message: 'Seules les commandes sur mesure ont une facture détaillée',
        color: 'blue'
      });
      return;
    }

    // Afficher immédiatement avec les données de base

    setFactureData({
      client: {
        nom_prenom: vente.client_nom || 'Client non renseigné',
        telephone_id: vente.client_id || '',
      },
      lignes: [], // Sera chargé dans le modal
      total_general: vente.montant_total || 0,
      avance: vente.montant_regle || 0,
      reste: (vente.montant_total || 0) - (vente.montant_regle || 0),
      numero: vente.code_vente || 'N/A',
      date_commande: vente.date_vente || new Date().toISOString(),
      id: vente.id,
      statut: vente.statut,
    });
    setShowFacture(true);
  };

  // Afficher le reçu (pour tous les types de vente)
  const handleShowRecu = (vente: Vente) => {
  // Passer directement l'ID pour que ModalRecu charge les données
  setVenteIdForRecu(vente.id);
  setShowRecu(true);
};
  const [showQuantiteModal, setShowQuantiteModal] = useState(false);
  // Ajouter au panier (avec gestion des doublons)
  // Ajouter au panier (avec gestion des doublons)
  const handleAjouterAuPanier = () => {
    if (!selectedArticle) return;

    if (quantiteCmd > selectedArticle.quantite_stock) {
      notifications.show({
        title: 'Erreur',
        message: `Stock insuffisant (max: ${selectedArticle.quantite_stock})`,
        color: 'red'
      });
      return;
    }

    // Récupérer les infos pour le format d'affichage
    const modeleAssocie = modeles?.find(m => m.designation === selectedArticle.modele);
    const tailleAssociee = tailles?.find(t => t.libelle === selectedArticle.taille);

    // Construire la désignation au format souhaité
    let designation = selectedArticle.modele;

    // Ajouter la catégorie entre parenthèses
    if (modeleAssocie) {
      designation += ` (${modeleAssocie.categorie})`;
    }

    // Ajouter la taille en code (XL, L, XXL...)
    designation += ` - ${tailleAssociee?.code_taille || selectedArticle.taille}`;

    // Ajouter la couleur
    designation += ` - ${selectedArticle.couleur}`;

    // Ajouter la texture entre parenthèses
    if (selectedArticle.texture) {
      designation += ` - (${selectedArticle.texture})`;
    }

    // Vérifier si l'article existe déjà dans le panier
    const existingItemIndex = panier.findIndex(
      item => item.produitId === selectedArticle.id && item.type_produit === 'article'
    );

    if (existingItemIndex >= 0) {
      // L'article existe déjà : mettre à jour la quantité et le total
      const updatedPanier = [...panier];
      const existingItem = updatedPanier[existingItemIndex];
      const newQuantite = existingItem.quantite + quantiteCmd;

      // Vérifier le stock
      if (newQuantite > selectedArticle.quantite_stock) {
        notifications.show({
          title: 'Erreur',
          message: `Stock insuffisant. Panier: ${existingItem.quantite}, Ajout: ${quantiteCmd}, Max: ${selectedArticle.quantite_stock}`,
          color: 'red'
        });
        return;
      }

      existingItem.quantite = newQuantite;
      existingItem.total = existingItem.prixUnitaire * newQuantite;
      updatedPanier[existingItemIndex] = existingItem;
      setPanier(updatedPanier);

      notifications.show({
        title: 'Mis à jour',
        message: `${designation} : ${existingItem.quantite} x ${existingItem.prixUnitaire.toLocaleString()} FCFA`,
        color: 'green'
      });
    } else {
      // Nouvel article dans le panier
      const newItem: PanierItem = {
        id: `${Date.now()}-${Math.random()}`,
        produitId: selectedArticle.id,
        designation,
        taille: tailleAssociee?.code_taille || selectedArticle.taille, // Stocker le code taille
        couleur: selectedArticle.couleur,
        quantite: quantiteCmd,
        prixUnitaire: selectedArticle.prix_vente,
        total: selectedArticle.prix_vente * quantiteCmd,
        type_produit: 'article',
      };

      setPanier([...panier, newItem]);

      notifications.show({
        title: 'Ajouté',
        message: `${designation} x${quantiteCmd}`,
        color: 'green'
      });
    }

    setSelectedArticle(null);
    setQuantiteCmd(1);
    setSearchProduitTerm('');
  };

  // Ajouter matière au panier (avec gestion des doublons)
  const handleAjouterMatiereAuPanier = (matiere: Matiere) => {
    // Vérifier si la matière existe déjà dans le panier
    const existingItemIndex = panier.findIndex(
      item => item.produitId === matiere.id && item.type_produit === 'matiere'
    );

    if (existingItemIndex >= 0) {
      // La matière existe déjà : incrémenter la quantité
      const updatedPanier = [...panier];
      const existingItem = updatedPanier[existingItemIndex];

      // Vérifier le stock
      if (existingItem.quantite + 1 > matiere.stock_actuel) {
        notifications.show({
          title: 'Erreur',
          message: `Stock insuffisant (max: ${matiere.stock_actuel})`,
          color: 'red'
        });
        return;
      }

      existingItem.quantite += 1;
      existingItem.total = existingItem.prixUnitaire * existingItem.quantite;
      updatedPanier[existingItemIndex] = existingItem;
      setPanier(updatedPanier);

      notifications.show({
        title: 'Mis à jour',
        message: `${matiere.designation} : ${existingItem.quantite} unité(s)`,
        color: 'green'
      });
    } else {
      // Nouvelle matière dans le panier
      const newItem: PanierItem = {
        id: `${Date.now()}-${Math.random()}`,
        produitId: matiere.id,
        designation: matiere.designation,
        quantite: 1,
        prixUnitaire: matiere.prix_vente,
        total: matiere.prix_vente,
        type_produit: 'matiere',
      };
      setPanier([...panier, newItem]);

      notifications.show({
        title: 'Ajouté',
        message: `${matiere.designation} x1`,
        color: 'green'
      });
    }
  };

  // Supprimer du panier
  const handleSupprimerPanier = (id: string) => {
    setPanier(panier.filter(item => item.id !== id));
  };

  // Générer la facture (commande)
  const handleGenererFacture = () => {
    if (!produitCommande || montantCommande <= 0 || quantiteCommande <= 0) {
      notifications.show({ title: 'Erreur', message: 'Renseignez le produit, la quantité et le prix', color: 'red' });
      return;
    }

    const total = quantiteCommande * montantCommande;

    setFactureData({
      client: {
        nom_prenom: clientNom || (clientId ? clients.find(c => c.telephone_id === clientId)?.nom_prenom : ''),
        telephone_id: clientTelephone || clientId || '',
        email: clientEmail,
        adresse: clientAdresse,
      },
      lignes: [{
        designation: produitCommande,
        quantite: quantiteCommande,
        prix_unitaire: montantCommande
      }],
      total_general: total,
      avance: avanceMontant,
      reste: total - avanceMontant,
      numero: codeVente,
      date_commande: dateCommande
    });

    setShowFacture(true);
  };

  // Soumettre vente commande
  const submitVenteAvecPaiement = async (montantRegle: number, mode: string) => {
    setLoading(true);

    try {
      const db = await getDb();

      let finalClientId = null;
      let finalClientNom = clientNom;

      if (clientId) {
        finalClientId = clientId;
        const client = clients.find(c => c.telephone_id === clientId);
        finalClientNom = client?.nom_prenom || '';
      }

      const totalVente = quantiteCommande * montantCommande;
      const statut = montantRegle >= totalVente ? 'PAYEE' : (montantRegle > 0 ? 'PARTIEL' : 'EN_ATTENTE');

      const result = await db.execute(`
        INSERT INTO ventes (code_vente, type_vente, date_vente, client_id, client_nom, mode_paiement,
          montant_total, montant_regle, statut, observation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        codeVente, 'commande', dateCommande, finalClientId, finalClientNom, mode,
        totalVente, montantRegle, statut, observation
      ]);

      const venteId = result.lastInsertId as number;

      if (venteId) {
        await db.execute(`
          INSERT INTO vente_details (vente_id, designation, quantite, prix_unitaire, total, taille_libelle)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [venteId, produitCommande, quantiteCommande, montantCommande, totalVente, `Commande commande`]);

        notifications.show({ title: 'Succès', message: `Vente ${codeVente} enregistrée`, color: 'green' });

        setVenteIdForRecu(venteId);
        setShowFacture(false);
        setShowRecu(true);
      }
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // Soumettre vente prêt-à-porter ou matière
  const handleSubmitVente = async () => {
    setLoading(true);

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

    try {
      const db = await getDb();
      const finalClientNom = clientNomSimple || 'Client comptoir';
      const montantTotalVente = totalPanier;
      const typeVenteValue = venteType === 'matiere' ? 'matiere' : 'pret_a_porter';

      // Étape 1 : Insérer la vente
      const result = await db.execute(`
      INSERT INTO ventes (code_vente, type_vente, date_vente, client_id, client_nom, mode_paiement,
        montant_total, montant_regle, statut, observation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        codeVente, typeVenteValue, dateCommande, null, finalClientNom, 'Espèces',
        montantTotalVente, montantTotalVente, 'PAYEE', observation
      ]);

      // Récupérer l'ID de la vente créée
      const venteId = Number(result.lastInsertId);
      console.log('Vente créée, ID:', venteId);

      if (!venteId || isNaN(venteId)) {
        throw new Error('Impossible de récupérer l\'ID de la vente');
      }

      // Étape 2 : Insérer les détails et mettre à jour les stocks
      for (const item of panier) {
        if (item.type_produit === 'article') {
          await db.execute(`
          INSERT INTO vente_details (vente_id, article_id, designation, quantite, prix_unitaire, total, taille_libelle)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [venteId, item.produitId, item.designation, item.quantite, item.prixUnitaire, item.total, item.taille || null]);

          await db.execute(
            `UPDATE articles SET quantite_stock = quantite_stock - ? WHERE id = ?`,
            [item.quantite, item.produitId]
          );
        } else if (item.type_produit === 'matiere') {
          await db.execute(`
          INSERT INTO vente_details (vente_id, matiere_id, designation, quantite, prix_unitaire, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [venteId, item.produitId, item.designation, item.quantite, item.prixUnitaire, item.total]);

          await db.execute(
            `UPDATE matieres SET stock_actuel = stock_actuel - ? WHERE id = ?`,
            [item.quantite, item.produitId]
          );
        }
      }

      console.log('Détails insérés, stocks mis à jour');

      notifications.show({ title: 'Succès', message: `Vente ${codeVente} enregistrée`, color: 'green' });
      setVenteIdForRecu(venteId);
      setShowRecu(true);

    } catch (err: any) {
      console.error('ERREUR VENTE:', err);
      notifications.show({
        title: 'Erreur',
        message: err.message || String(err),
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setVenteType('commande');
    setClientId(null);
    setClientNom('');
    setClientTelephone('');
    setClientEmail('');
    setClientAdresse('');
    setClientNomSimple('');
    setClientTelephoneSimple('');
    setPanier([]);
    setSelectedArticle(null);
    setMontantCommande(0);
    setQuantiteCommande(1);
    setAvanceMontant(0);
    setObservation('');
    setProduitCommande('');
    setSearchProduitTerm('');
    generateCode();
  };

  // Passer en mode formulaire
  const openForm = () => {
    resetForm();
    generateCode();
    loadFormData();
    setViewMode('form');
  };

  // Retour à la liste
  const backToList = () => {
    setViewMode('list');
    loadVentes();
  };

  // Formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(price);
  };

  // Fonction de correction de la base de données (à utiliser une seule fois)
  const fixDatabase = async () => {
    try {
      setLoading(true);
      const db = await getDb();

      // Sauvegarder les données existantes
      await db.execute(`CREATE TABLE IF NOT EXISTS ventes_backup AS SELECT * FROM ventes`);

      // Supprimer l'ancienne table
      await db.execute(`DROP TABLE IF EXISTS ventes`);

      // Recréer avec la nouvelle contrainte
      await db.execute(`CREATE TABLE ventes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_vente TEXT UNIQUE NOT NULL,
      type_vente TEXT NOT NULL CHECK(type_vente IN ('commande', 'pret_a_porter', 'matiere')),
      date_vente DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      client_id TEXT,
      client_nom TEXT,
      mode_paiement TEXT CHECK(mode_paiement IN ('Espèces', 'Orange money', 'Moov money', 'Telecel money', 'Wave', 'Sank Money', 'Virement bancaire')),
      montant_total REAL NOT NULL,
      montant_regle REAL DEFAULT 0,
      statut TEXT DEFAULT 'EN_ATTENTE',
      observation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (client_id) REFERENCES clients(telephone_id)
    )`);

      // Restaurer les données
      await db.execute(`INSERT INTO ventes SELECT * FROM ventes_backup`);

      // Supprimer la sauvegarde
      await db.execute(`DROP TABLE IF EXISTS ventes_backup`);

      notifications.show({ title: 'Succès', message: 'Base de données corrigée avec succès !', color: 'green' });
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // Statut badge
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'PAYEE': return <Badge color="green">Payée</Badge>;
      case 'PARTIEL': return <Badge color="orange">Partiel</Badge>;
      case 'ANNULEE': return <Badge color="red">Annulée</Badge>;
      default: return <Badge color="blue">En cours</Badge>;
    }
  };

  // Filtrage et pagination des ventes
  const filteredVentes = ventes.filter(v =>
    v.code_vente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.client_nom && v.client_nom.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const paginatedVentes = filteredVentes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredVentes.length / itemsPerPage);

  // Clients pour select
  const clientOptions = clients.map(c => ({ value: c.telephone_id, label: `${c.nom_prenom} - ${c.telephone_id}` }));

  // Chargement initial
  useEffect(() => {
    loadVentes();
  }, []);

  useEffect(() => {
    const checkDB = async () => {
      try {
        const db = await getDb();
        const tables = await db.select<{ name: string }[]>(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
        console.log('=== TABLES DISPONIBLES ===');
        console.table(tables);

        for (const table of tables) {
          const info = await db.select(`PRAGMA table_info(${table.name})`);
          console.log(`\n=== STRUCTURE ${table.name} ===`);
          console.table(info);
        }
        console.log('✅ Vérification terminée');
      } catch (err) {
        console.error('Erreur vérification:', err);
      }
    };
    checkDB();
  }, []);
  // ========== RENDU ==========

  // Vue Liste des ventes
  if (viewMode === 'list') {
    return (
      <Box p="md">
        <Container size="full">
          <Stack gap="lg">
            <Card withBorder radius="lg" p="lg" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
              <Group justify="space-between">
                <Group gap="md">
                  <Avatar size={50} radius="md" style={{ backgroundColor: 'rgba(19, 65, 134, 0.2)' }}>
                    <IconShoppingBag size={24} color="black" />
                  </Avatar>
                  <Box>
                    <Title order={2} c="white">Gestion des Ventes</Title>
                    <Text c="gray.3" size="sm">Consultez l'historique et créez de nouvelles ventes</Text>
                  </Box>
                </Group>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={openForm}
                  variant="white"
                  color="dark"
                >
                  Nouvelle vente
                </Button>
              </Group>
            </Card>

            <Card withBorder radius="lg" shadow="sm" p="lg">
              <Group mb="md">
                <TextInput
                  placeholder="Rechercher par code ou client..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{ flex: 1 }}
                />
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" onClick={loadVentes} size="lg">
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <LoadingOverlay visible={loading} />

              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Client</Table.Th>
                    <Table.Th>Total</Table.Th>
                    <Table.Th>Réglé</Table.Th>
                    <Table.Th>Reste</Table.Th>
                    <Table.Th>Statut</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedVentes.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={9} style={{ textAlign: 'center' }}>Aucune vente trouvée</Table.Td>
                    </Table.Tr>
                  ) : (
                    paginatedVentes.map((vente) => {
                      const isCommandeSurMesure = vente.type_vente === 'commande';

                      return (
                        <Table.Tr key={vente.id}>
                          <Table.Td><Badge variant="light" color="blue">{vente.code_vente}</Badge></Table.Td>
                          <Table.Td>
                            <Badge size="sm" variant="light" color={isCommandeSurMesure ? 'violet' : 'cyan'}>
                              {isCommandeSurMesure ? '📝 Sur mesure' : vente.type_vente === 'pret_a_porter' ? '👕 Prêt-à-porter' : '📦 Matière'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>{new Date(vente.date_vente).toLocaleDateString('fr-FR')}</Table.Td>
                          <Table.Td>{vente.client_nom || '-'}</Table.Td>
                          <Table.Td>{formatPrice(vente.montant_total)}</Table.Td>
                          <Table.Td>{formatPrice(vente.montant_regle)}</Table.Td>
                          <Table.Td>{formatPrice(vente.montant_restant)}</Table.Td>
                          <Table.Td>{getStatusBadge(vente.statut)}</Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="center">
                              <Tooltip label="Détails">
                                <ActionIcon color="blue" onClick={() => handleViewDetails(vente)}>
                                  <IconEye size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Modifier">
                                <ActionIcon color="yellow" onClick={() => handleEditVente(vente)}>
                                  <IconEdit size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Imprimer">
                                <ActionIcon color="gray">
                                  <IconPrinter size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Supprimer la vente">
                                <ActionIcon
                                  color="red"
                                  onClick={() => {
                                    setDeleteVenteId(vente.id);
                                    setDeleteVenteCode(vente.code_vente);
                                    setDeleteVenteModalOpen(true);
                                  }}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Tooltip>

                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  )}
                </Table.Tbody>
              </Table>

              {totalPages > 1 && (
                <Group justify="center" mt="md">
                  <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="#1b365d" />
                </Group>
              )}
            </Card>
          </Stack>
        </Container>

        {/* Modal Détails Vente */}
        <Modal opened={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title={`Détails de la vente ${selectedVente?.code_vente}`} size="lg">
          <Stack>
            <SimpleGrid cols={2}>
              <div>
                <Text size="sm" c="dimmed">Type de vente</Text>
                <Badge size="md" variant="light" color={selectedVente?.type_vente === 'commande' ? 'violet' : 'cyan'}>
                  {selectedVente?.type_vente === 'commande' ? '📝 Sur mesure' : selectedVente?.type_vente === 'pret_a_porter' ? '👕 Prêt-à-porter' : '📦 Matière'}
                </Badge>
              </div>
              <div>
                <Text size="sm" c="dimmed">Client</Text>
                <Text fw={500}>{selectedVente?.client_nom || '-'}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Date</Text>
                <Text fw={500}>{selectedVente?.date_vente ? new Date(selectedVente.date_vente).toLocaleString('fr-FR') : '-'}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Mode de paiement</Text>
                <Text fw={500}>{selectedVente?.mode_paiement || '-'}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Statut</Text>
                {getStatusBadge(selectedVente?.statut || '')}
              </div>
            </SimpleGrid>
            <Divider label="Articles" />
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '45%' }}>Désignation</Table.Th>
                  <Table.Th style={{ width: '15%' }}>Quantité</Table.Th>
                  <Table.Th style={{ width: '20%' }}>Prix unitaire</Table.Th>
                  <Table.Th style={{ width: '20%' }}>Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {details.map((detail, index) => (
                  <Table.Tr key={detail.id || index}>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm" fw={500}>{detail.designation}</Text>
                        {detail.taille_libelle && detail.taille_libelle !== 'null' && detail.taille_libelle !== 'Commande commande' && (
                          <Text size="xs" c="dimmed">Info: {detail.taille_libelle}</Text>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>{detail.quantite}</Table.Td>
                    <Table.Td>{formatPrice(detail.prix_unitaire)}</Table.Td>
                    <Table.Td>{formatPrice(detail.total)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {selectedVente && (
              <Box mt="md">
                <Divider />
                <Group justify="space-between" mt="md">
                  <Text fw={700}>Total général :</Text>
                  <Text fw={700} size="lg" c="blue">{formatPrice(selectedVente.montant_total)}</Text>
                </Group>
                {selectedVente.observation && (
                  <Box mt="md" p="xs" bg="gray.0" style={{ borderRadius: '8px' }}>
                    <Text size="sm" fw={500} c="dimmed">Observation :</Text>
                    <Text size="sm">{selectedVente.observation}</Text>
                  </Box>
                )}
              </Box>
            )}
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={() => setDetailsModalOpen(false)}>Fermer</Button>
              <Button
                leftSection={<IconReceipt size={16} />}
                color="grape"
                onClick={() => {
                  if (selectedVente) {
                    setDetailsModalOpen(false);
                    handleShowRecu(selectedVente);
                  }
                }}
              >
                Voir reçu
              </Button>
              {selectedVente?.type_vente === 'commande' && (
                <Button
                  leftSection={<IconFileInvoice size={16} />}
                  color="teal"
                  onClick={() => {
                    if (selectedVente) {
                      setDetailsModalOpen(false);
                      handleShowFacture(selectedVente);
                    }
                  }}
                >
                  Voir facture
                </Button>
              )}
            </Group>
          </Stack>
        </Modal>

        {/* Modal d'édition de vente */}
        <Modal
          opened={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditVenteData(null);
          }}
          title={`Modifier la vente ${editVenteData?.code_vente || ''}`}
          size="xl"
          radius="md"
        >
          {editVenteData && (
            <Stack>
              <SimpleGrid cols={2}>
                <TextInput
                  label="Date de vente"
                  type="date"
                  value={editVenteData.date_vente}
                  onChange={(e) => setEditVenteData({ ...editVenteData, date_vente: e.target.value })}
                />
                <Select
                  label="Type de vente"
                  data={[
                    { value: 'commande', label: '📝 Commande (commande)' },
                    { value: 'article', label: '👕 Prêt-à-porter' },
                    { value: 'matiere', label: '📦 Matière' }
                  ]}
                  value={editVenteData.type_vente}
                  onChange={(val) => setEditVenteData({ ...editVenteData, type_vente: val })}
                />
              </SimpleGrid>

              <TextInput
                label="Client"
                placeholder="Nom du client"
                value={editVenteData.client_nom || ''}
                onChange={(e) => setEditVenteData({ ...editVenteData, client_nom: e.target.value })}
              />

              <TextInput
                label="Téléphone client"
                placeholder="Téléphone"
                value={editVenteData.client_id || ''}
                onChange={(e) => setEditVenteData({ ...editVenteData, client_id: e.target.value })}
              />

              <Textarea
                label="Observation"
                value={editVenteData.observation || ''}
                onChange={(e) => setEditVenteData({ ...editVenteData, observation: e.target.value })}
                rows={2}
              />

              <Divider label="Articles" labelPosition="center" />

              <ScrollArea style={{ maxHeight: 400 }}>
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: '40%' }}>Désignation</Table.Th>
                      <Table.Th style={{ width: '15%' }}>Quantité</Table.Th>
                      <Table.Th style={{ width: '20%' }}>Prix unitaire</Table.Th>
                      <Table.Th style={{ width: '15%' }}>Total</Table.Th>
                      <Table.Th style={{ width: '10%' }}></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(editVenteData.lignes || []).map((ligne: LigneEdit, index: number) => (
                      <Table.Tr key={index}>
                        <Table.Td>
                          <TextInput
                            size="xs"
                            placeholder="Désignation"
                            value={ligne.designation}
                            onChange={(e) => handleEditLigneChange(index, 'designation', e.target.value)}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            size="xs"
                            min={1}
                            value={ligne.quantite}
                            onChange={(val) => handleEditLigneChange(index, 'quantite', val)}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            size="xs"
                            min={0}
                            step={100}
                            value={ligne.prix_unitaire}
                            onChange={(val) => handleEditLigneChange(index, 'prix_unitaire', val)}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" ta="right" fw={600}>
                            {(ligne.quantite * ligne.prix_unitaire).toLocaleString()} FCFA
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon color="red" onClick={() => handleRemoveEditLigne(index)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>

              <Button variant="light" size="sm" onClick={handleAddEditLigne} leftSection={<IconPlus size={14} />}>
                Ajouter une ligne
              </Button>

              <Divider />

              <Group justify="space-between">
                <Text fw={700}>Total général :</Text>
                <Text fw={700} size="xl" c="blue">
                  {getEditTotal().toLocaleString()} FCFA
                </Text>
              </Group>

              <Divider />

              <SimpleGrid cols={2}>
                <NumberInput
                  label="Montant déjà réglé"
                  value={editVenteData.montant_regle}
                  onChange={(val) => setEditVenteData({ ...editVenteData, montant_regle: val || 0 })}
                  min={0}
                  step={1000}
                />
                <TextInput
                  label="Reste à payer"
                  value={(getEditTotal() - (editVenteData.montant_regle || 0)).toLocaleString() + ' FCFA'}
                  readOnly
                />
              </SimpleGrid>

              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={() => setEditModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveEditVente} loading={editLoading} color="green">
                  Enregistrer les modifications
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
        {/* Modal confirmation suppression */}
        <Modal
          opened={deleteVenteModalOpen}
          onClose={() => {
            setDeleteVenteModalOpen(false);
            setDeleteVenteId(null);
            setDeleteVenteCode('');
          }}
          title="Confirmation de suppression"
          size="sm"
          radius="md"
          padding="lg"
          centered
        >
          <Stack gap="md">
            <Alert color="red" variant="light">
              <Text size="md" fw={500}>
                Êtes-vous sûr de vouloir supprimer définitivement la vente "{deleteVenteCode}" ?
              </Text>
              <Text size="sm" mt={8}>
                Cette action est irréversible. Toutes les données associées seront perdues.
              </Text>
            </Alert>

            <Group justify="flex-end" gap="md">
              <Button
                variant="subtle"
                onClick={() => {
                  setDeleteVenteModalOpen(false);
                  setDeleteVenteId(null);
                  setDeleteVenteCode('');
                }}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                color="red"
                onClick={handleDeleteVente}
                loading={loading}
                leftSection={<IconTrash size={18} />}
              >
                Supprimer définitivement
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Box>
    );
  }

  // ========== VUE FORMULAIRE ==========

  // Sous-modals
  if (showFormulaireClient) {
    return (
      <FormulaireClient
        onBack={() => setShowFormulaireClient(false)}
        onSuccess={(clientId, clientNom) => {
          setShowFormulaireClient(false);
          const loadClients = async () => {
            const db = await getDb();
            const clientsData = await db.select<Client[]>(`
              SELECT telephone_id, nom_prenom, adresse, email 
              FROM clients WHERE est_supprime = 0 ORDER BY nom_prenom
            `);
            setClients(clientsData);
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

  if (showFacture && factureData) {
    return (
      <ModalFacture
        vente={factureData}
        onClose={() => setShowFacture(false)}
        onConfirmPaiement={(montant, mode) => {
          setAvanceMontant(montant);
          submitVenteAvecPaiement(montant, mode);
        }}
        onRefresh={() => {
          loadVentes();
        }}
      />
    );
  }

  if (showRecu && venteIdForRecu) {
    return (
      <ModalRecu
        commande={{ id: venteIdForRecu }}
        onClose={() => {
          setShowRecu(false);
          setVenteIdForRecu(null);
          backToList();
        }}
      />
    );
  }

  // Formulaire principal
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
                <Tooltip label="Liste des ventes">
                  <ActionIcon variant="light" color="white" size="lg" onClick={backToList}>
                    <IconList size={20} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Aide">
                  <ActionIcon variant="light" color="white" size="lg" onClick={() => setInfoModalOpen(true)}>
                    <IconInfoCircle size={20} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Réinitialiser">
                  <ActionIcon variant="light" color="white" size="lg" onClick={resetForm}>
                    <IconRefresh size={20} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Retour">
                  <ActionIcon variant="light" color="white" size="lg" onClick={backToList}>
                    <IconArrowLeft size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Card>

          <Button onClick={fixDatabase} color="red" size="xs">
            🔧 Corriger la base de données
          </Button>

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

          {/* SECTION CLIENT */}
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
                <SimpleGrid cols={2} spacing="md">
                  <TextInput label="Email" placeholder="Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                  <TextInput label="Adresse" placeholder="Adresse" value={clientAdresse} onChange={(e) => setClientAdresse(e.target.value)} />
                </SimpleGrid>
                <Button variant="light" size="xs" onClick={() => setShowFormulaireClient(true)}>+ Nouveau client</Button>
              </Stack>
            ) : (
              <SimpleGrid cols={2} spacing="md">
                <TextInput label="Nom du client (optionnel)" placeholder="Nom" value={clientNomSimple} onChange={(e) => setClientNomSimple(e.target.value)} />
                <TextInput label="Téléphone (optionnel)" placeholder="Numéro" value={clientTelephoneSimple} onChange={(e) => setClientTelephoneSimple(e.target.value)} />
              </SimpleGrid>
            )}
          </Card>

          {/* SECTION COMMANDE */}
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
                  <NumberInput label="Quantité" value={quantiteCommande} onChange={(val) => setQuantiteCommande(Number(val) || 1)} min={1} required />
                  <NumberInput label="Prix unitaire (FCFA)" value={montantCommande} onChange={(val) => setMontantCommande(Number(val) || 0)} min={0} step={1000} required />
                </SimpleGrid>
                {quantiteCommande > 0 && montantCommande > 0 && (
                  <Alert color="blue" variant="light">
                    <Group justify="space-between">
                      <Text fw={600}>Total TTC :</Text>
                      <Text fw={700} size="lg" c="blue">{(quantiteCommande * montantCommande).toLocaleString()} FCFA</Text>
                    </Group>
                  </Alert>
                )}
                <Button onClick={handleGenererFacture} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }} disabled={!produitCommande || montantCommande <= 0 || quantiteCommande <= 0} leftSection={<IconFileInvoice size={16} />} fullWidth>
                  Générer la facture
                </Button>
              </Stack>
            </Card>
          )}

          {/* SECTION PRÊT-À-PORTER / MATIÈRE */}
          {(venteType === 'pret_a_porter' || venteType === 'matiere') && (
            <Card withBorder radius="lg" shadow="sm" p="lg">
              <Title order={4} mb="md">
                {venteType === 'pret_a_porter' ? '👕 Articles disponibles' : '📦 Matières disponibles'}
              </Title>

              <TextInput
                placeholder="Rechercher..."
                leftSection={<IconSearch size={16} />}
                value={searchProduitTerm}
                onChange={(e) => setSearchProduitTerm(e.target.value)}
                mb="md"
                radius="md"
              />

              <ScrollArea style={{ maxHeight: 500 }} offsetScrollbars>
                <Table striped highlightOnHover withColumnBorders style={{ fontSize: '13px' }}>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600 }}>Modèle</Table.Th>
                      <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600 }}>Taille</Table.Th>
                      <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600 }}>Couleur</Table.Th>
                      {venteType === 'pret_a_porter' && (
                        <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600 }}>Texture</Table.Th>
                      )}
                      <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Prix</Table.Th>
                      <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Stock</Table.Th>
                      <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Action</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {venteType === 'pret_a_porter' ? (
                      articles
                        .filter(a =>
                          a.modele.toLowerCase().includes(searchProduitTerm.toLowerCase()) ||
                          a.couleur.toLowerCase().includes(searchProduitTerm.toLowerCase()) ||
                          a.taille.toLowerCase().includes(searchProduitTerm.toLowerCase())
                        )
                        .map((article) => {
                          // Trouver le modèle pour la catégorie
                          const modeleAssocie = modeles?.find(m => m.designation === article.modele);
                          // Trouver la couleur pour le visuel
                          const couleurAssociee = couleurs?.find(c => c.nom_couleur === article.couleur);
                          // Trouver le code taille (XL, L, XXL...)
                          const tailleAssociee = tailles?.find(t => t.libelle === article.taille);

                          return (
                            <Table.Tr key={article.id}>
                              {/* Modèle avec catégorie */}
                              <Table.Td style={{ fontSize: '13px', padding: '8px 8px' }}>
                                <Text size="sm" fw={600}>{article.modele}</Text>
                                {modeleAssocie && (
                                  <Badge size="xs" variant="light" color="gray" mt={2}>
                                    {modeleAssocie.categorie}
                                  </Badge>
                                )}
                              </Table.Td>

                              {/* Taille en lettres (XL, L, XXL...) */}
                              <Table.Td style={{ fontSize: '13px', padding: '8px 8px', textAlign: 'center' }}>
                                <Badge variant="light" color="blue" size="md">
                                  {tailleAssociee?.code_taille || article.taille}
                                </Badge>
                              </Table.Td>

                              {/* Couleur avec visuel */}
                              <Table.Td style={{ fontSize: '13px', padding: '8px 8px' }}>
                                <Group gap={8} wrap="nowrap">
                                  <Box
                                    w={20}
                                    h={20}
                                    style={{
                                      backgroundColor: couleurAssociee?.code_hex || '#ccc',
                                      borderRadius: '50%',
                                      border: '2px solid rgba(0,0,0,0.2)',
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Text size="sm">{article.couleur}</Text>
                                </Group>
                              </Table.Td>

                              {/* Texture */}
                              {venteType === 'pret_a_porter' && (
                                <Table.Td style={{ fontSize: '13px', padding: '8px 8px' }}>
                                  {article.texture ? (
                                    <Badge variant="light" color="grape" size="sm">{article.texture}</Badge>
                                  ) : (
                                    <Text size="xs" c="dimmed">-</Text>
                                  )}
                                </Table.Td>
                              )}

                              {/* Prix */}
                              <Table.Td style={{ fontSize: '13px', padding: '8px 8px', textAlign: 'right' }}>
                                <Text size="sm" fw={600} c="green">
                                  {article.prix_vente.toLocaleString()} FCFA
                                </Text>
                              </Table.Td>

                              {/* Stock */}
                              <Table.Td style={{ fontSize: '13px', padding: '8px 8px', textAlign: 'center' }}>
                                <Badge
                                  color={article.quantite_stock < 5 ? 'orange' : 'green'}
                                  variant="filled"
                                  size="md"
                                >
                                  {article.quantite_stock}
                                </Badge>
                              </Table.Td>

                              {/* Action */}
                              <Table.Td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="blue"
                                  leftSection={<IconShoppingCart size={14} />}
                                  onClick={() => {
                                    setSelectedArticle(article);
                                    setQuantiteCmd(1);
                                    setShowQuantiteModal(true);
                                  }}
                                >
                                  Ajouter
                                </Button>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })
                    ) : (
                      // Matières (inchangé mais avec le même style)
                      matieres
                        .filter(m => m.designation.toLowerCase().includes(searchProduitTerm.toLowerCase()))
                        .map((matiere) => (
                          <Table.Tr key={matiere.id}>
                            {/* Fusionner les colonnes - colSpan doit être 4 (Modèle + Taille + Couleur + Texture) */}
                            <Table.Td colSpan={4}>
                              <Text size="sm" fw={600}>{matiere.designation}</Text>
                              <Text size="xs" c="dimmed">{matiere.code_matiere} - {matiere.unite}</Text>
                            </Table.Td>
                            {/* Prix */}
                            <Table.Td style={{ fontSize: '13px', padding: '8px 8px', textAlign: 'right' }}>
                              <Text size="sm" fw={600} c="green">{matiere.prix_vente.toLocaleString()} FCFA</Text>
                            </Table.Td>
                            {/* Stock */}
                            <Table.Td style={{ fontSize: '13px', padding: '8px 8px', textAlign: 'center' }}>
                              <Badge color={matiere.stock_actuel < 5 ? 'orange' : 'green'} variant="filled" size="md">
                                {matiere.stock_actuel} {matiere.unite}
                              </Badge>
                            </Table.Td>
                            {/* Action */}
                            <Table.Td style={{ padding: '8px 8px', textAlign: 'center' }}>
                              <Button
                                size="xs"
                                variant="light"
                                color="blue"
                                leftSection={<IconShoppingCart size={14} />}
                                onClick={() => handleAjouterMatiereAuPanier(matiere)}
                              >
                                Ajouter
                              </Button>
                            </Table.Td>
                          </Table.Tr>
                        ))
                    )}
                  </Table.Tbody>
                </Table>
              </ScrollArea>

              {/* Panier (inchangé) */}
              {panier.length > 0 && (
                <>
                  <Divider my="md" label={
                    <Group gap="xs">
                      <IconShoppingCart size={16} />
                      <Text fw={600}>Panier ({panier.length} article{panier.length > 1 ? 's' : ''})</Text>
                    </Group>
                  } labelPosition="center" />
                  <Table striped highlightOnHover withColumnBorders style={{ fontSize: '13px' }}>
                    <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                      <Table.Tr>
                        <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600 }}>Produit</Table.Th>
                        <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Qté</Table.Th>
                        <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Prix unitaire</Table.Th>
                        <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Total</Table.Th>
                        <Table.Th style={{ color: 'white', fontSize: '13px', padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {panier.map((item, idx) => (
                        <Table.Tr key={`${item.id}-${idx}`}>
                          <Table.Td style={{ fontSize: '13px', padding: '8px 8px' }}>
                            <Text size="sm" fw={500}>{item.designation}</Text>
                            {/* Supprime cette ligne qui affiche "Taille: Extra Large" */}
                            {/* {item.taille && (
    <Badge size="xs" variant="light" color="blue" mt={2}>Taille: {item.taille}</Badge>
  )} */}
                          </Table.Td>
                          <Table.Td style={{ fontSize: '13px', padding: '8px 8px', textAlign: 'center' }}>
                            <Text size="sm" fw={600}>{item.quantite}</Text>
                          </Table.Td>
                          <Table.Td style={{ fontSize: '13px', padding: '8px 8px', textAlign: 'right' }}>
                            <Text size="sm">{item.prixUnitaire.toLocaleString()} FCFA</Text>
                          </Table.Td>
                          <Table.Td style={{ fontSize: '13px', padding: '8px 8px', textAlign: 'right' }}>
                            <Text size="sm" fw={600} c="green">{item.total.toLocaleString()} FCFA</Text>
                          </Table.Td>
                          <Table.Td style={{ padding: '8px 8px', textAlign: 'center' }}>
                            <ActionIcon color="red" onClick={() => handleSupprimerPanier(item.id)} size="md">
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>

                  <Divider mt="md" />
                  <Group justify="space-between" mt="md" p="md" bg="gray.0" style={{ borderRadius: '8px' }}>
                    <Text size="lg" fw={700}>Total général :</Text>
                    <Text size="xl" fw={700} c="blue">{totalPanier.toLocaleString()} FCFA</Text>
                  </Group>
                  <Button
                    onClick={handleSubmitVente}
                    loading={loading}
                    variant="gradient"
                    gradient={{ from: 'green', to: 'teal' }}
                    leftSection={<IconReceipt size={18} />}
                    fullWidth
                    mt="md"
                    size="md"
                  >
                    Finaliser la vente et générer le reçu
                  </Button>
                </>
              )}
            </Card>
          )}

          {/* SECTION COMMUNE */}
          <Card withBorder radius="lg" shadow="sm" p="lg">
            <Title order={4} mb="md">ℹ️ Informations complémentaires</Title>
            <SimpleGrid cols={2} spacing="md">
              <TextInput label="Date de vente" type="date" value={dateCommande} onChange={(e) => setDateCommande(e.target.value)} />
              <Textarea label="Observation" placeholder="Notes..." value={observation} onChange={(e) => setObservation(e.target.value)} rows={2} />
            </SimpleGrid>
          </Card>

          {/* MODAL AIDE */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📖 Guide d'utilisation" size="md" centered>
            <Stack>
              <Text fw={600}>1️⃣ Commande (commande)</Text>
              <Text size="sm">- Client obligatoire</Text>
              <Text size="sm">- Remplissez le produit, quantité et prix</Text>
              <Text size="sm">- Générez la facture</Text>
              <Text size="sm">- Procédez au paiement</Text>
              <Divider />
              <Text fw={600}>2️⃣ Prêt-à-porter</Text>
              <Text size="sm">- Client optionnel</Text>
              <Text size="sm">- Sélectionnez les articles (modèle + taille + couleur)</Text>
              <Text size="sm">- Ajoutez au panier</Text>
              <Text size="sm">- Finalisez et obtenez le reçu</Text>
              <Divider />
              <Text fw={600}>3️⃣ Matière</Text>
              <Text size="sm">- Client optionnel</Text>
              <Text size="sm">- Ajoutez les matières au panier</Text>
              <Text size="sm">- Validez la vente</Text>
            </Stack>
          </Modal>
        </Stack>
      </Box>
      {/* Modal pour choisir la quantité */}
      <Modal
        opened={showQuantiteModal}
        onClose={() => {
          setShowQuantiteModal(false);
          setSelectedArticle(null);
          setQuantiteCmd(1);
        }}
        title="Quantité à ajouter"
        size="sm"
        radius="md"
        centered
      >
        <Stack gap="md">
          {selectedArticle && (
            <>
              <Text size="sm" fw={500}>
                Article : {selectedArticle.modele} - {selectedArticle.taille} - {selectedArticle.couleur}
              </Text>
              <Text size="sm" c="dimmed">
                Prix unitaire : {selectedArticle.prix_vente.toLocaleString()} FCFA
              </Text>
              <Text size="sm" c="dimmed">
                Stock disponible : {selectedArticle.quantite_stock}
              </Text>

              {/* Vérifier si l'article est déjà dans le panier */}
              {panier.find(item => item.produitId === selectedArticle.id && item.type_produit === 'article') && (
                <Alert color="blue" variant="light">
                  <Text size="sm">
                    Déjà dans le panier : {panier.find(item => item.produitId === selectedArticle.id && item.type_produit === 'article')?.quantite} unité(s)
                  </Text>
                </Alert>
              )}
            </>
          )}

          <NumberInput
            label="Quantité"
            description={`Maximum : ${selectedArticle?.quantite_stock || 0}`}
            value={quantiteCmd}
            onChange={(value) => setQuantiteCmd(typeof value === 'number' ? Math.max(1, value) : 1)}
            min={1}
            max={selectedArticle?.quantite_stock || 1}
            size="md"
            radius="md"
            autoFocus
          />

          <Group justify="flex-end" gap="md">
            <Button
              variant="subtle"
              onClick={() => {
                setShowQuantiteModal(false);
                setSelectedArticle(null);
                setQuantiteCmd(1);
              }}
            >
              Annuler
            </Button>
            <Button
              color="blue"
              onClick={() => {
                setShowQuantiteModal(false);
                handleAjouterAuPanier();
              }}
            >
              Ajouter au panier
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default VentesManager;