// src/components/ventes/VentesManager.tsx
import React, { useState, useEffect } from 'react';
import { journaliserAction } from "../../services/journal";
import {
  Stack, Card, Title, Text, Group, Button, TextInput, NumberInput,
  Divider, Box, Modal, Select, Avatar, Tooltip, ActionIcon,
  Container, Table, ScrollArea, Badge, SimpleGrid, ThemeIcon, SegmentedControl,
  Textarea, Alert, Pagination, LoadingOverlay, Paper
} from '@mantine/core';
import {
  IconShoppingBag, IconTrash, IconPlus, IconSearch, IconRefresh,
  IconFileInvoice, IconReceipt, IconEye, IconList, IconEdit, IconX, IconUser,
  IconCheck
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import FormulaireClient from '../clients/FormulaireClient';
import ModalFacture from '../factures/ModalFacture';
import ModalRecu from '../paiements/ModalRecu';


import {
  getVentes,
  getVente,
  createVente,
  updateVente,
  deleteVente,
  annulerVente,
  getVenteDetails,
  getRendezVous,
  terminerRendezVous,
  annulerRendezVous,
  payerVente
} from "../../services/ventes";
import {
  apiGet,
  apiPost
} from '../../services/api';
import { Vente } from '../../types/ventes';


// ========== TYPES ==========
interface Client {

  id: number;

  profil: string;

  telephone_id: string;

  nom_prenom: string;

  adresse?: string;

  email?: string;
}

interface Article { id: number; code_article: string; modele: string; modele_id: number; taille: string; taille_id: number; couleur: string; couleur_id: number; texture: string | null; prix_vente: number; quantite_stock: number; emplacement: string | null; est_disponible: number; }
interface Matiere { id: number; code_matiere: string; designation: string; unite: string; prix_vente: number; stock_actuel: number; }
interface PanierItem { id: string; produitId: number; designation: string; taille?: string; couleur?: string; quantite: number; prixUnitaire: number; total: number; type_produit: 'article' | 'matiere'; }
interface LigneEdit { id?: number; designation: string; quantite: number; prix_unitaire: number; total: number; article_id?: number; matiere_id?: number; taille_libelle?: string; }
type VenteType = 'commande' | 'pret_a_porter' | 'matiere';
type ViewMode = 'list' | 'form';

const VentesManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(false);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [
    ,
    setSelectedDetails
  ] = useState<any[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVente, setSelectedVente] = useState<Vente | null>(null);
  const [details] = useState<any[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const itemsPerPage = 10;
  const [venteType, setVenteType] = useState<VenteType>('commande');
  const [codeVente, setCodeVente] = useState('');
  const [deleteVenteModalOpen, setDeleteVenteModalOpen] = useState(false);
  const [deleteVenteId, setDeleteVenteId] = useState<number | null>(null);
  const [deleteVenteCode, setDeleteVenteCode] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [clientNomSimple, setClientNomSimple] = useState('');
  const [clientTelephoneSimple, setClientTelephoneSimple] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [quantiteCmd, setQuantiteCmd] = useState(1);
  const [searchProduitTerm, setSearchProduitTerm] = useState('');
  const [produitCommande, setProduitCommande] = useState('');
  const [montantCommande, setMontantCommande] = useState(0);
  const [quantiteCommande, setQuantiteCommande] = useState(1);
  const [observation, setObservation] = useState('');
  const [dateRendezVous, setDateRendezVous] =
    useState('');

  const [heureRendezVous, setHeureRendezVous] =
    useState('');

  const [typeRendezVous, setTypeRendezVous] =
    useState('essayage');
  const [dateCommande, setDateCommande] = useState(new Date().toISOString().split('T')[0]);
  const [showFormulaireClient, setShowFormulaireClient] = useState(false);
  const [showFacture, setShowFacture] = useState(false);
  const [showRecu, setShowRecu] = useState(false);
  const [factureData, setFactureData] = useState<any>(null);
  const [venteIdForRecu, setVenteIdForRecu] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editVenteData, setEditVenteData] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [modeles, setModeles] = useState<any[]>([]);
  const [couleurs, setCouleurs] = useState<any[]>([]);
  const [tailles, setTailles] = useState<any[]>([]);
  const [showQuantiteModal, setShowQuantiteModal] = useState(false);
  const totalPanier = panier.reduce((sum, item) => sum + item.total, 0);

  // ========== FONCTIONS (toutes les fonctions restent identiques) ==========
  const loadVentes =
    async () => {

      try {

        setLoading(true);

        const data =
          await getVentes();

        setVentes(data);

      } catch (err: any) {

        notifications.show({
          title: 'Erreur',

          message:
            err.message,

          color: 'red'
        });

      } finally {

        setLoading(false);
      }
    };
  const handleAnnulerVente = async (
    venteId: number,
    codeVente: string
  ) => {

    if (
      !globalThis.confirm(
        `Annuler la vente "${codeVente}" ?`
      )
    ) return;

    try {

      setLoading(true);

      /**
       * API
       */
      await annulerVente(
        venteId
      );

      /**
       * Journalisation
       */
      await journaliserAction({

        utilisateur:
          'Utilisateur',

        action:
          'UPDATE',

        table:
          'ventes',

        idEnregistrement:
          venteId,

        details:
          `Annulation vente : ${codeVente}`
      });

      notifications.show({

        title:
          'Succès',

        message:
          `Vente ${codeVente} annulée`,

        color:
          'green'
      });

      await loadVentes();

    } catch (err: any) {

      console.error(err);

      notifications.show({

        title:
          'Erreur',

        message:
          err.message,

        color:
          'red'
      });

    } finally {

      setLoading(false);
    }
  };
  const handleDeleteVente = async () => {

    if (!deleteVenteId) return;

    try {

      setLoading(true);

      await deleteVente(
        deleteVenteId
      );

      // Journalisation
      await journaliserAction({
        utilisateur:
          'Utilisateur',

        action:
          'DELETE',

        table:
          'ventes',

        idEnregistrement:
          deleteVenteId,

        details:
          `Suppression vente : ${deleteVenteCode}`
      });

      notifications.show({
        title: 'Succès',

        message:
          `Vente ${deleteVenteCode} supprimée`,

        color: 'green'
      });

      setDeleteVenteModalOpen(false);

      setDeleteVenteId(null);

      setDeleteVenteCode('');

      await loadVentes();

    } catch (err: any) {

      notifications.show({
        title: 'Erreur',

        message:
          err.message,

        color: 'red'
      });

    } finally {

      setLoading(false);
    }
  };
  const loadFormData = async () => {

    try {

      const [
        clientsData,
        articlesData,
        matieresData,
        modelesData,
        couleursData,
        taillesData
      ] = await Promise.all([

        apiGet("/clients"),

        apiGet("/articles"),

        apiGet("/matieres"),

        apiGet("/modeles-tenues"),

        apiGet("/couleurs"),

        apiGet("/tailles")
      ]);

      /**
       * Clients
       */
      setClients(

        clientsData

          .filter(
            (c: any) =>
              c.est_supprime === 0
          )

          .sort(
            (a: any, b: any) =>
              a.nom_prenom.localeCompare(
                b.nom_prenom
              )
          )
      );

      /**
       * Articles
       */
      setArticles(

        articlesData

          .filter(
            (a: any) =>

              a.est_actif === 1

              &&

              a.est_disponible === 1

              &&

              Number(a.quantite_stock) > 0
          )
      );

      /**
       * Matières
       */
      setMatieres(

        matieresData

          .filter(
            (m: any) =>

              m.est_supprime === 0

              &&

              Number(m.stock_actuel) > 0
          )

          .sort(
            (a: any, b: any) =>
              a.designation.localeCompare(
                b.designation
              )
          )
      );

      /**
       * Modèles
       */
      setModeles(

        modelesData.filter(
          (m: any) =>
            m.est_actif === 1
        )
      );

      /**
       * Couleurs
       */
      setCouleurs(

        couleursData.filter(
          (c: any) =>
            c.est_actif === 1
        )
      );

      /**
       * Tailles
       */
      setTailles(

        taillesData.filter(
          (t: any) =>
            t.est_actif === 1
        )
      );

    } catch (err: any) {

      console.error(err);

      notifications.show({
        title: 'Erreur',

        message:
          err.message,

        color: 'red'
      });
    }
  };
  const generateCode = async () => {

    try {

      const data =
        await apiPost(
          "/ventes/generate-code",
          {}
        );

      setCodeVente(
        data.code
      );

    } catch {

      setCodeVente(
        `VTE-${Date.now()}`
      );
    }
  };
  const handleViewDetails =
    async (vente: Vente) => {

      try {

        setLoading(true);

        const details =
          await getVenteDetails(
            vente.id
          );

        setSelectedVente(vente);

        setSelectedDetails(
          details || []
        );

        setDetailsModalOpen(true);

      } catch (err: any) {

        notifications.show({
          title: 'Erreur',

          message:
            err.message,

          color: 'red'
        });

      } finally {

        setLoading(false);
      }
    };
  const handleEditVente =
    async (vente: Vente) => {

      try {

        setLoading(true);

        /**
         * Vente
         */
        const data =
          await getVente(
            vente.id
          );

        /**
         * Détails
         */
        const details =
          await getVenteDetails(
            vente.id
          );

        /**
         * Injecter les lignes
         */
        setEditVenteData({

          ...data,

          lignes:
            details || []
        });

        setEditModalOpen(true);

      } catch (err: any) {

        console.error(err);

        notifications.show({

          title:
            'Erreur',

          message:
            err.message,

          color:
            'red'
        });

      } finally {

        setLoading(false);
      }
    };

  const handleSaveEditVente = async () => {

    if (!editVenteData) return;

    setEditLoading(true);

    try {

      const newTotal =

        (editVenteData.lignes || [])

          .reduce(

            (
              s: number,
              l: LigneEdit
            ) =>

              s +

              (
                l.quantite
                *
                l.prix_unitaire
              ),

            0
          );
      console.log(editVenteData);
      await updateVente(

        editVenteData.id,

        {
          client_id:
            editVenteData.client_id,

          client_nom:
            editVenteData.client_nom,

          date_vente:
            editVenteData.date_vente,

          observation:
            editVenteData.observation,

          type_vente:
            editVenteData.type_vente,

          montant_total:
            newTotal,

          montant_regle:
            editVenteData.montant_regle,

          details:
            editVenteData.lignes
        }
      );

      notifications.show({
        title: 'Succès',

        message:
          'Vente modifiée',

        color: 'green'
      });

      // Journalisation
      await journaliserAction({

        utilisateur:
          'Utilisateur',

        action:
          'UPDATE',

        table:
          'ventes',

        idEnregistrement:
          editVenteData.id,

        details:

          `Modification vente : ${editVenteData.code_vente} - ` +

          `${newTotal.toLocaleString()} FCFA`
      });

      setEditModalOpen(false);

      setEditVenteData(null);

      await loadVentes();

    } catch (err: any) {

      console.error(err);

      notifications.show({

        title:
          'Erreur',

        message:
          err.message,

        color:
          'red'
      });

    } finally {

      setEditLoading(false);
    }
  };

  const handleAddEditLigne = () => setEditVenteData({ ...editVenteData, lignes: [...(editVenteData?.lignes || []), { designation: '', quantite: 1, prix_unitaire: 0, total: 0 }] });
  const handleEditLigneChange = (i: number, f: string, v: any) => { const nl = [...(editVenteData?.lignes || [])]; nl[i][f] = v; nl[i].total = (nl[i].quantite || 0) * (nl[i].prix_unitaire || 0); setEditVenteData({ ...editVenteData, lignes: nl }); };
  const handleRemoveEditLigne = (i: number) => { const nl = [...(editVenteData?.lignes || [])]; nl.splice(i, 1); setEditVenteData({ ...editVenteData, lignes: nl }); };
  const getEditTotal = () => (editVenteData?.lignes || []).reduce((s: number, l: LigneEdit) => s + (l.quantite * l.prix_unitaire), 0);
  const handleShowFacture = (
    vente: Vente
  ) => {

    if (
      vente.type_vente !== 'commande'
    ) {

      notifications.show({

        title: 'Info',

        message:
          'Seules les commandes sur mesure ont une facture',

        color: 'blue'
      });

      return;
    }

    setFactureData(
      vente
    );

    setShowFacture(
      true
    );
  };
  const handleShowRecu = (vente: Vente) => { setVenteIdForRecu(vente.id); setShowRecu(true); };
  const handleAjouterAuPanier = () => { if (!selectedArticle || quantiteCmd > selectedArticle.quantite_stock) { notifications.show({ title: 'Erreur', message: `Stock insuffisant (max: ${selectedArticle?.quantite_stock})`, color: 'red' }); return; } const mm = modeles?.find(m => m.designation === selectedArticle.modele); const tt = tailles?.find(t => t.libelle === selectedArticle.taille); let des = selectedArticle.modele; if (mm) des += ` (${mm.categorie})`; des += ` - ${tt?.code_taille || selectedArticle.taille} - ${selectedArticle.couleur}`; if (selectedArticle.texture) des += ` - (${selectedArticle.texture})`; const ex = panier.findIndex(item => item.produitId === selectedArticle.id && item.type_produit === 'article'); if (ex >= 0) { const up = [...panier]; const nq = up[ex].quantite + quantiteCmd; if (nq > selectedArticle.quantite_stock) { notifications.show({ title: 'Erreur', message: 'Stock insuffisant', color: 'red' }); return; } up[ex].quantite = nq; up[ex].total = up[ex].prixUnitaire * nq; setPanier(up); notifications.show({ title: 'Mis à jour', message: `${des} : ${nq} x ${up[ex].prixUnitaire.toLocaleString()} FCFA`, color: 'green' }); } else { setPanier([...panier, { id: `${Date.now()}-${Math.random()}`, produitId: selectedArticle.id, designation: des, taille: tt?.code_taille || selectedArticle.taille, couleur: selectedArticle.couleur, quantite: quantiteCmd, prixUnitaire: selectedArticle.prix_vente, total: selectedArticle.prix_vente * quantiteCmd, type_produit: 'article' }]); notifications.show({ title: 'Ajouté', message: `${des} x${quantiteCmd}`, color: 'green' }); } setSelectedArticle(null); setQuantiteCmd(1); setSearchProduitTerm(''); };
  const handleAjouterMatiereAuPanier = (matiere: Matiere) => { const ex = panier.findIndex(item => item.produitId === matiere.id && item.type_produit === 'matiere'); if (ex >= 0) { if (panier[ex].quantite + 1 > matiere.stock_actuel) { notifications.show({ title: 'Erreur', message: 'Stock insuffisant', color: 'red' }); return; } const up = [...panier]; up[ex].quantite += 1; up[ex].total = up[ex].prixUnitaire * up[ex].quantite; setPanier(up); notifications.show({ title: 'Mis à jour', message: `${matiere.designation} : ${up[ex].quantite} unité(s)`, color: 'green' }); } else { setPanier([...panier, { id: `${Date.now()}-${Math.random()}`, produitId: matiere.id, designation: matiere.designation, quantite: 1, prixUnitaire: matiere.prix_vente, total: matiere.prix_vente, type_produit: 'matiere' }]); notifications.show({ title: 'Ajouté', message: `${matiere.designation} x1`, color: 'green' }); } };
  const handleSupprimerPanier = (id: string) => setPanier(panier.filter(item => item.id !== id));
  const handleGenererFacture = () => { if (panier.length === 0) { notifications.show({ title: 'Erreur', message: 'Ajoutez des articles à la commande', color: 'red' }); return; } setFactureData({ client: { nom_prenom: clientNom || (clientId ? clients.find(c => c.telephone_id === clientId)?.nom_prenom : 'Client'), telephone_id: clientTelephone || clientId || '' }, lignes: panier.map(item => ({ designation: item.designation, quantite: item.quantite, prix_unitaire: item.prixUnitaire, total: item.total })), total_general: totalPanier, avance: 0, reste: totalPanier, numero: codeVente, date_commande: dateCommande }); setShowFacture(true); };
  const handleSubmitVente = async () => {

    if (panier.length === 0) {

      notifications.show({
        title: 'Erreur',

        message:
          'Ajoutez des articles au panier',

        color: 'red'
      });

      return;
    }

    setLoading(true);

    try {

      let finalClientId =
        null;

      let finalClientNom =
        'Client comptoir';

      /**
       * CLIENT
       */
      if (venteType === 'commande') {

        if (clientId) {

          finalClientId =
            parseInt(clientId);

          const client =
            clients.find(
              c =>

                String(c.id)
                === clientId

                ||

                c.telephone_id
                === clientId
            );

          finalClientNom =
            client?.nom_prenom
            ||
            clientNom
            ||
            'Client';

        } else {

          finalClientNom =
            clientNom
            || 'Client';
        }

      } else {

        finalClientNom =
          clientNomSimple
          || 'Client comptoir';
      }

      /**
       * STATUT
       */
      const statut =

        venteType === 'commande'
          ? 'EN_ATTENTE'
          : 'PAYEE';

      const montantRegle =

        venteType === 'commande'
          ? 0
          : totalPanier;

      /**
       * API CREATE
       */
      const vente =
        await createVente({

          code_vente:
            codeVente,

          type_vente:
            venteType,

          date_vente:
            dateCommande,

          client_id:
            finalClientId,

          client_nom:
            finalClientNom,

          mode_paiement:
            'Espèces',

          montant_total:
            totalPanier,

          montant_regle:
            montantRegle,

          statut,

          observation,

          details:

            panier.map(item => ({

              type_produit:
                item.type_produit,

              article_id:

                item.type_produit
                  === 'article'

                  &&

                  item.produitId > 0

                  ? item.produitId

                  : null,

              matiere_id:

                item.type_produit
                  === 'matiere'

                  ? item.produitId

                  : null,

              designation:
                item.designation,

              quantite:
                item.quantite,

              prix_unitaire:
                item.prixUnitaire,

              total:
                item.total,

              taille_libelle:
                item.taille || null
            })),

          rendezvous:

            venteType === 'commande'

              &&

              finalClientId

              &&

              dateRendezVous

              ? {

                client_id:
                  finalClientId,

                type_rendezvous:
                  typeRendezVous,

                date_rendezvous:
                  dateRendezVous,

                heure_rendezvous:
                  heureRendezVous || null,

                statut:
                  'planifie'
              }

              : null
        });

      /**
       * Journalisation
       */
      await journaliserAction({

        utilisateur:
          'Utilisateur',

        action:
          'CREATE',

        table:
          'ventes',

        idEnregistrement:
          vente.id,

        details:

          `Création vente : ${codeVente} - ` +

          `${finalClientNom} - ` +

          `${totalPanier.toLocaleString()} FCFA`
      });

      notifications.show({

        title:
          'Succès',

        message:
          `Vente ${codeVente} enregistrée`,

        color:
          'green'
      });

      setVenteIdForRecu(
        vente.id
      );

      setShowRecu(true);

      await loadVentes();

      resetForm();

    } catch (err: any) {

      console.error(err);

      notifications.show({

        title:
          'Erreur',

        message:
          err.message || String(err),

        color:
          'red'
      });

    } finally {

      setLoading(false);
    }
  };

  const submitVenteAvecPaiement = async (
    montantRegle: number,
    mode: string
  ) => {

    if (!factureData?.id) {

      notifications.show({
        title: 'Erreur',

        message:
          'Vente introuvable',

        color:
          'red'
      });

      return;
    }

    try {

      setLoading(true);

      await payerVente(
        factureData.id,
        montantRegle,
        mode
      );

      // Journalisation
      await journaliserAction({

        utilisateur:
          'Utilisateur',

        action:
          'UPDATE',

        table:
          'ventes',

        idEnregistrement:
          factureData.id,

        details:

          `Paiement vente : ${factureData.code_vente} - ` +

          `${montantRegle.toLocaleString()} FCFA`
      });

      notifications.show({

        title:
          'Succès',

        message:
          'Paiement enregistré',

        color:
          'green'
      });

      setShowFacture(false);

      await loadVentes();

    } catch (err: any) {

      console.error(err);

      notifications.show({

        title:
          'Erreur',

        message:
          err.message,

        color:
          'red'
      });

    } finally {

      setLoading(false);
    }
  };
  const resetForm = () => { setVenteType('commande'); setClientId(null); setClientNom(''); setClientTelephone(''); setClientNomSimple(''); setClientTelephoneSimple(''); setPanier([]); setSelectedArticle(null); setMontantCommande(0); setQuantiteCommande(1); setObservation(''); setProduitCommande(''); setSearchProduitTerm(''); generateCode(); };
  const backToList = () => { setViewMode('list'); loadVentes(); };
  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(price);
  const getStatusBadge = (statut: string) => { switch (statut) { case 'PAYEE': return <Badge color="green">Payée</Badge>; case 'PARTIEL': return <Badge color="orange">Partiel</Badge>; case 'ANNULEE': return <Badge color="red">Annulée</Badge>; default: return <Badge color="blue">En cours</Badge>; } };
  const filteredVentes = ventes.filter(

    v =>

      (v.code_vente || '')
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )

      ||

      (v.client_nom || '')
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )
  );
  const paginatedVentes = filteredVentes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredVentes.length / itemsPerPage);

  const handleTerminerRendezVous =
    async (id: number) => {

      try {

        await terminerRendezVous(id);

        loadRendezVous();

      } catch (err) {

        console.error(err);
      }
    };

  const handleAnnulerRendezVous =
    async (id: number) => {

      try {

        await annulerRendezVous(id);

        loadRendezVous();

      } catch (err) {

        console.error(err);
      }
    };

  const [rendezVous, setRendezVous] =
    useState<any[]>([]);

  const loadRendezVous =
    async () => {

      try {

        const rows =
          await getRendezVous();

        setRendezVous(rows);

      } catch (err) {

        console.error(err);
      }
    };

  const clientOptions = clients.map(c => ({
    value: String(c.id),  // Utilise l'ID numérique maintenant
    label: `${c.nom_prenom} (${c.profil === 'principal' ? 'Moi' : c.profil || 'Moi'}) - ${c.telephone_id}`,
  }));
  useEffect(() => {

    loadVentes();

    loadRendezVous();

  }, []);

  // ========== RENDU ==========

  // SOUS-MODALS
  if (showFormulaireClient)

    return (

      <FormulaireClient

        onBack={() =>
          setShowFormulaireClient(false)
        }

        onSuccess={
          async (
            cid,
            cnom
          ) => {

            setShowFormulaireClient(false);

            try {

              const data =
                await apiGet(
                  "/clients"
                );

              setClients(

                data

                  .filter(
                    (c: any) =>
                      c.est_supprime === 0
                  )

                  .sort(
                    (a: any, b: any) =>
                      a.nom_prenom.localeCompare(
                        b.nom_prenom
                      )
                  )
              );

              if (cid) {

                setClientId(
                  String(cid)
                );

                setClientNom(
                  cnom || ''
                );
              }

            } catch (err) {

              console.error(err);
            }
          }
        }
      />
    );

  if (
    showFacture
    &&
    factureData
  )

    return (

      <ModalFacture

        vente={factureData}

        onClose={() =>
          setShowFacture(false)
        }

        onConfirmPaiement={(
          m,
          mode
        ) => {

          submitVenteAvecPaiement(
            m,
            mode
          );
        }}

        onRefresh={loadVentes}
      />
    );

  if (
    showRecu
    &&
    venteIdForRecu
  )

    return (

      <ModalRecu

        commande={{
          id:
            venteIdForRecu
        }}

        onClose={() => {

          setShowRecu(false);

          setVenteIdForRecu(null);

          backToList();
        }}
      />
    );
  // VUE LISTE
  if (viewMode === 'list') {
    return (
      <Box p="md"><Container size="full"><Stack gap="lg">
        <Card withBorder radius="lg" p="lg" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
          <Group justify="space-between">
            <Group gap="md"><Avatar size={50} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}><IconShoppingBag size={24} color="black" /></Avatar><Box><Title order={2} c="white">Gestion des Ventes</Title><Text c="gray.3" size="sm">Consultez l'historique et créez de nouvelles ventes</Text></Box></Group>
            <Button leftSection={<IconPlus size={16} />} onClick={() => { resetForm(); generateCode(); loadFormData(); setViewMode('form'); }} variant="white" color="dark">Nouvelle vente</Button>
          </Group>
        </Card>
        <Card withBorder radius="lg" shadow="sm" p="lg">
          <Group mb="md"><TextInput placeholder="Rechercher par code ou client..." leftSection={<IconSearch size={16} />} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={{ flex: 1 }} /><Tooltip label="Actualiser"><ActionIcon variant="light" onClick={loadVentes} size="lg"><IconRefresh size={18} /></ActionIcon></Tooltip></Group>
          <LoadingOverlay visible={loading} />

          <Card
            withBorder
            radius="lg"
            shadow="sm"
            p="md"
            mb="md"
          >

            <Title order={5} mb="sm">
              📅 Rendez-vous
            </Title>

            <Table striped highlightOnHover>

              <Table.Thead>

                <Table.Tr>

                  <Table.Th>Date</Table.Th>

                  <Table.Th>Heure</Table.Th>

                  <Table.Th>Client</Table.Th>

                  <Table.Th>Commande</Table.Th>

                  <Table.Th>Type</Table.Th>

                  <Table.Th>Statut</Table.Th>


                  <Table.Th>
                    Actions
                  </Table.Th>

                </Table.Tr>

              </Table.Thead>

              <Table.Tbody>

                {rendezVous.map((r) => (

                  <Table.Tr key={r.id}>

                    <Table.Td>
                      {r.date_rendezvous}
                    </Table.Td>

                    <Table.Td>
                      {r.heure_rendezvous || '-'}
                    </Table.Td>

                    <Table.Td>
                      {r.nom_prenom}
                    </Table.Td>

                    <Table.Td>
                      {r.code_vente}
                    </Table.Td>

                    <Table.Td>

                      <Badge color="blue">

                        {r.type_rendezvous}

                      </Badge>

                    </Table.Td>

                    <Table.Td>

                      <Badge
                        color={
                          r.statut === 'planifie'
                            ? 'orange'
                            : r.statut === 'termine'
                              ? 'green'
                              : 'red'
                        }
                      >
                        {r.statut}
                      </Badge>

                    </Table.Td>

                    <Table.Td>

                      <Group gap={4}>

                        <Tooltip label="Terminer">

                          <ActionIcon
                            color="green"
                            variant="light"
                            onClick={() =>
                              handleTerminerRendezVous(r.id)
                            }
                          >
                            <IconCheck size={16} />
                          </ActionIcon>

                        </Tooltip>

                        <Tooltip label="Annuler">

                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() =>
                              handleAnnulerRendezVous(r.id)
                            }
                          >
                            <IconX size={16} />
                          </ActionIcon>

                        </Tooltip>

                      </Group>

                    </Table.Td>

                  </Table.Tr>

                ))}

              </Table.Tbody>

            </Table>

          </Card>

          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Code</Table.Th><Table.Th>Type</Table.Th><Table.Th>Date</Table.Th><Table.Th>Client</Table.Th><Table.Th>Total</Table.Th><Table.Th>Réglé</Table.Th><Table.Th>Reste</Table.Th><Table.Th>Statut</Table.Th><Table.Th>
              Actions
            </Table.Th><Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {paginatedVentes.length === 0 ? <Table.Tr><Table.Td colSpan={10} style={{ textAlign: 'center' }}>Aucune vente trouvée</Table.Td></Table.Tr> :
                paginatedVentes.map((vente) => {
                  const isCommandeSurMesure = vente.type_vente === 'commande';
                  return (
                    <Table.Tr key={vente.id}>
                      <Table.Td><Badge variant="light" color="blue">{vente.code_vente}</Badge></Table.Td>
                      <Table.Td><Badge size="sm" variant="light" color={isCommandeSurMesure ? 'violet' : 'cyan'}>{isCommandeSurMesure ? '📝 Sur mesure' : vente.type_vente === 'pret_a_porter' ? '👕 Prêt-à-porter' : '📦 Matière'}</Badge></Table.Td>
                      <Table.Td>{new Date(vente.date_vente).toLocaleDateString('fr-FR')}</Table.Td>
                      <Table.Td>{vente.client_nom || '-'}</Table.Td>
                      <Table.Td>{formatPrice(vente.montant_total)}</Table.Td>
                      <Table.Td>{formatPrice(vente.montant_regle)}</Table.Td>
                      <Table.Td>{formatPrice(vente.montant_restant)}</Table.Td>
                      <Table.Td>{getStatusBadge(vente.statut)}</Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="center" wrap="nowrap">
                          <Tooltip label="Voir les détails">
                            <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleViewDetails(vente)}>
                              <IconEye size={14} />
                            </ActionIcon>
                          </Tooltip>

                          <Tooltip label="Modifier la vente">
                            <ActionIcon variant="light" color="yellow" size="sm" onClick={() => handleEditVente(vente)}>
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>

                          {/* Facture - uniquement pour commandes */}
                          {isCommandeSurMesure && (
                            <Tooltip label="Voir la facture">
                              <ActionIcon variant="light" color="teal" size="sm" onClick={() => handleShowFacture(vente)}>
                                <IconFileInvoice size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}

                          {/* Reçu - si paiement effectué */}
                          {vente.montant_regle > 0 && (
                            <Tooltip label="Voir le reçu">
                              <ActionIcon variant="light" color="grape" size="sm" onClick={() => handleShowRecu(vente)}>
                                <IconReceipt size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}

                          {/* Annuler - si pas encore payée ni annulée */}
                          {vente.statut !== 'ANNULEE' && vente.statut !== 'PAYEE' && (
                            <Tooltip label="Annuler cette vente">
                              <ActionIcon variant="light" color="orange" size="sm" onClick={() => handleAnnulerVente(vente.id, vente.code_vente)}>
                                <IconX size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}

                          {/* Supprimer - si pas annulée */}
                          {vente.statut !== 'ANNULEE' && (
                            <Tooltip label="Supprimer définitivement">
                              <ActionIcon variant="light" color="red" size="sm" onClick={() => { setDeleteVenteId(vente.id); setDeleteVenteCode(vente.code_vente); setDeleteVenteModalOpen(true); }}>
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              }
            </Table.Tbody>
          </Table>
          {totalPages > 1 && <Group justify="center" mt="md"><Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="#1b365d" /></Group>}
        </Card>
      </Stack></Container>

        {/* MODALS DE LA LISTE - À L'INTÉRIEUR DU RETURN */}
        <Modal opened={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title={<Group gap="sm"><IconEye size={20} color="white" /><Text fw={700} c="white">Détails vente {selectedVente?.code_vente}</Text></Group>} size="lg" centered radius="md" styles={{ header: { backgroundColor: '#1b365d', padding: '14px 20px' }, title: { color: 'white' }, body: { padding: '20px' } }}>
          {selectedVente && <Stack gap="md">
            <Paper p="md" radius="md" withBorder bg="gray.0"><SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md"><Box><Text size="xs" c="dimmed">Type</Text><Badge variant="light" color={selectedVente.type_vente === 'commande' ? 'violet' : selectedVente.type_vente === 'pret_a_porter' ? 'cyan' : 'teal'}>{selectedVente.type_vente === 'commande' ? 'Sur mesure' : selectedVente.type_vente === 'pret_a_porter' ? 'Prêt-à-porter' : 'Matière'}</Badge></Box><Box><Text size="xs" c="dimmed">Client</Text><Text size="sm" fw={500}>{selectedVente.client_nom || '-'}</Text></Box><Box><Text size="xs" c="dimmed">Date</Text><Text size="sm">{new Date(selectedVente.date_vente).toLocaleDateString('fr-FR')}</Text></Box><Box><Text size="xs" c="dimmed">Paiement</Text><Text size="sm">{selectedVente.mode_paiement || '-'}</Text></Box></SimpleGrid></Paper>
            <Paper p="md" radius="md" withBorder><Text fw={600} size="sm" mb="sm">📋 Articles</Text><Table striped highlightOnHover><Table.Thead><Table.Tr><Table.Th>Désignation</Table.Th><Table.Th ta="center">Qté</Table.Th><Table.Th ta="right">Prix unit.</Table.Th><Table.Th ta="right">Total</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{details.map((d, i) => (<Table.Tr key={d.id || i}><Table.Td><Text size="sm" fw={500}>{d.designation}</Text>{d.taille_libelle && d.taille_libelle !== 'null' && <Text size="xs" c="dimmed">{d.taille_libelle}</Text>}</Table.Td><Table.Td ta="center">{d.quantite}</Table.Td><Table.Td ta="right">{formatPrice(d.prix_unitaire)}</Table.Td><Table.Td ta="right"><Text fw={600}>{formatPrice(d.total)}</Text></Table.Td></Table.Tr>))}</Table.Tbody></Table><Divider my="sm" /><Group justify="space-between"><Text fw={700}>Total général</Text><Text fw={700} size="lg" c="blue">{formatPrice(selectedVente.montant_total)}</Text></Group><Group justify="space-between" mt={4}><Text size="sm" c="dimmed">Réglé</Text><Text size="sm" c="green">{formatPrice(selectedVente.montant_regle)}</Text></Group><Group justify="space-between"><Text size="sm" c="dimmed">Reste</Text><Text size="sm" c="red">{formatPrice(selectedVente.montant_restant)}</Text></Group></Paper>
            {selectedVente.observation && <Paper p="md" radius="md" withBorder bg="gray.0"><Text size="xs" c="dimmed" mb={4}>📝 Observation</Text><Text size="sm">{selectedVente.observation}</Text></Paper>}
            <Group justify="flex-end" gap="sm"><Button variant="light" onClick={() => setDetailsModalOpen(false)}>Fermer</Button><Button leftSection={<IconReceipt size={16} />} variant="light" color="grape" onClick={() => { setDetailsModalOpen(false); handleShowRecu(selectedVente); }}>Reçu</Button>{selectedVente.type_vente === 'commande' && <Button leftSection={<IconFileInvoice size={16} />} variant="light" color="teal" onClick={() => { setDetailsModalOpen(false); handleShowFacture(selectedVente); }}>Facture</Button>}</Group>
          </Stack>}
        </Modal>

        <Modal opened={editModalOpen} onClose={() => { setEditModalOpen(false); setEditVenteData(null); }} title={<Group gap="sm"><IconEdit size={20} color="white" /><Text fw={700} c="white">Modifier vente {editVenteData?.code_vente || ''}</Text></Group>} size="xl" centered radius="md" styles={{ header: { backgroundColor: '#1b365d', padding: '14px 20px' }, title: { color: 'white' }, body: { padding: '20px' } }}>
          {editVenteData && <Stack gap="md">
            <Paper p="md" radius="md" withBorder><SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md"><TextInput label="Date" type="date" value={
              editVenteData.date_vente
                ?.split('T')[0] || ''
            } onChange={(e) => setEditVenteData({ ...editVenteData, date_vente: e.target.value })} size="sm" radius="md" /><Select label="Type" data={[{ value: 'commande', label: '📝 Sur mesure' }, { value: 'pret_a_porter', label: '👕 Prêt-à-porter' }, { value: 'matiere', label: '📦 Matière' }]} value={editVenteData.type_vente} onChange={(val) => setEditVenteData({ ...editVenteData, type_vente: val })} size="sm" radius="md" /></SimpleGrid><SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="sm"><TextInput label="Client" value={editVenteData.client_nom || ''} onChange={(e) => setEditVenteData({ ...editVenteData, client_nom: e.target.value })} size="sm" radius="md" /><TextInput label="Téléphone" value={
              editVenteData.client_telephone || ''
            } onChange={(e) => setEditVenteData({ ...editVenteData, client_id: e.target.value })} size="sm" radius="md" /></SimpleGrid><Textarea label="Observation" value={editVenteData.observation || ''} onChange={(e) => setEditVenteData({ ...editVenteData, observation: e.target.value })} rows={2} size="sm" radius="md" mt="sm" /></Paper>
            <Paper p="md" radius="md" withBorder><Group justify="space-between" mb="sm"><Text fw={600} size="sm">📋 Articles</Text><Button variant="light" size="compact-sm" onClick={handleAddEditLigne} leftSection={<IconPlus size={14} />}>Ajouter</Button></Group><ScrollArea h={300}><Table striped highlightOnHover><Table.Thead><Table.Tr><Table.Th>Désignation</Table.Th><Table.Th w={70} ta="center">Qté</Table.Th><Table.Th w={110} ta="right">Prix unit.</Table.Th><Table.Th w={110} ta="right">Total</Table.Th><Table.Th w={40}></Table.Th></Table.Tr></Table.Thead><Table.Tbody>{(editVenteData.lignes || []).map((l: LigneEdit, i: number) => (<Table.Tr key={i}><Table.Td><TextInput size="xs" value={l.designation} onChange={(e) => handleEditLigneChange(i, 'designation', e.target.value)} /></Table.Td><Table.Td><NumberInput size="xs" min={1} value={l.quantite} onChange={(val) => handleEditLigneChange(i, 'quantite', val)} /></Table.Td><Table.Td><NumberInput size="xs" min={0} step={100} value={l.prix_unitaire} onChange={(val) => handleEditLigneChange(i, 'prix_unitaire', val)} /></Table.Td><Table.Td><Text size="sm" ta="right" fw={600}>{(l.quantite * l.prix_unitaire).toLocaleString()} FCFA</Text></Table.Td><Table.Td><ActionIcon color="red" variant="subtle" onClick={() => handleRemoveEditLigne(i)}><IconTrash size={14} /></ActionIcon></Table.Td></Table.Tr>))}</Table.Tbody></Table></ScrollArea></Paper>
            <Paper p="md" radius="md" withBorder><Group justify="space-between" mb="xs"><Text fw={600}>Total</Text><Text fw={700} size="lg" c="blue">{getEditTotal().toLocaleString()} FCFA</Text></Group><Divider my="xs" /><SimpleGrid cols={2} spacing="md"><NumberInput label="Montant réglé" value={editVenteData.montant_regle} onChange={(val) => setEditVenteData({ ...editVenteData, montant_regle: val || 0 })} min={0} step={1000} size="sm" radius="md" /><Box><Text size="xs" fw={500} mb={4}>Reste à payer</Text><Text fw={600} c="red">{(getEditTotal() - (editVenteData.montant_regle || 0)).toLocaleString()} FCFA</Text></Box></SimpleGrid></Paper>
            <Group justify="flex-end" gap="sm"><Button variant="light" onClick={() => setEditModalOpen(false)} radius="md">Annuler</Button><Button onClick={handleSaveEditVente} loading={editLoading} radius="md" variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }}>Enregistrer</Button></Group>
          </Stack>}
        </Modal>

        <Modal opened={deleteVenteModalOpen} onClose={() => { setDeleteVenteModalOpen(false); setDeleteVenteId(null); setDeleteVenteCode(''); }} title="Confirmation de suppression" size="sm" centered radius="md" styles={{ header: { backgroundColor: '#e03131', padding: '14px 20px' }, title: { color: 'white', fontWeight: 600 }, body: { padding: '20px' } }}>
          <Stack gap="md"><Alert color="red" variant="light" radius="md"><Stack gap={4}><Text size="sm" fw={600}>Supprimer la vente "{deleteVenteCode}" ?</Text><Text size="xs">Cette action est irréversible. Le stock sera restauré.</Text></Stack></Alert><Group justify="flex-end" gap="sm"><Button variant="light" onClick={() => { setDeleteVenteModalOpen(false); setDeleteVenteId(null); setDeleteVenteCode(''); }} disabled={loading} radius="md">Annuler</Button><Button color="red" onClick={handleDeleteVente} loading={loading} leftSection={<IconTrash size={16} />} radius="md">Supprimer définitivement</Button></Group></Stack>
        </Modal>
      </Box>
    );
  }


  // VUE FORMULAIRE
  return (
    <Container size="lg" p={0}><Stack gap="md" p="md">
      <Card withBorder radius="lg" p="md" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}><Group justify="space-between"><Group gap="sm"><ThemeIcon size={42} radius="md" variant="white" color="#1b365d"><IconShoppingBag size={22} /></ThemeIcon><Box><Title order={4} c="white">Nouvelle vente</Title><Text c="gray.3" size="xs">Code : {codeVente}</Text></Box></Group><Group gap={4}><Tooltip label="Liste"><ActionIcon variant="subtle" color="white" onClick={backToList}><IconList size={18} /></ActionIcon></Tooltip><Tooltip label="Reset"><ActionIcon variant="subtle" color="white" onClick={resetForm}><IconRefresh size={18} /></ActionIcon></Tooltip></Group></Group></Card>
      <Card withBorder radius="lg" shadow="sm" p="md"><Group justify="space-between" mb="sm"><Title order={5}>👤 Client</Title><SegmentedControl value={venteType} onChange={(val) => { setVenteType(val as VenteType); setPanier([]); }} data={[{ value: 'commande', label: 'Sur mesure' }, { value: 'pret_a_porter', label: 'Prêt-à-porter' }, { value: 'matiere', label: 'Matière' }]} size="xs" color="#1b365d" /></Group><Divider mb="sm" />{venteType === 'commande' ? <Stack gap="xs"><Select label="Sélectionnez le client" placeholder="Rechercher..." data={clientOptions} value={clientId} onChange={setClientId} searchable clearable size="sm" radius="md" leftSection={<IconUser size={16} />} /><SimpleGrid cols={2} spacing="xs"><TextInput label="Nom complet" value={clientNom} onChange={(e) => setClientNom(e.target.value)} size="sm" radius="md" />
        <TextInput
          label="Téléphone"
          value={
            editVenteData?.client_telephone || ''
          }
          size="sm"
          radius="md"
          readOnly
        />
      </SimpleGrid><Button variant="subtle" size="compact-xs" leftSection={<IconPlus size={12} />} onClick={() => setShowFormulaireClient(true)}>Nouveau client</Button></Stack> : <SimpleGrid cols={2} spacing="xs"><TextInput label="Nom client (optionnel)" value={clientNomSimple} onChange={(e) => setClientNomSimple(e.target.value)} size="sm" radius="md" /><TextInput label="Téléphone (optionnel)" value={clientTelephoneSimple} onChange={(e) => setClientTelephoneSimple(e.target.value)} size="sm" radius="md" /></SimpleGrid>}</Card>
      {(venteType === 'pret_a_porter' || venteType === 'matiere') && <Card withBorder radius="lg" shadow="sm" p="md"><Group justify="space-between" mb="sm"><Title order={5}>📦 {venteType === 'pret_a_porter' ? 'Articles disponibles' : 'Matières disponibles'}</Title><Group gap="xs"><TextInput placeholder="Rechercher..." leftSection={<IconSearch size={14} />} value={searchProduitTerm} onChange={(e) => setSearchProduitTerm(e.target.value)} size="xs" radius="md" style={{ width: 200 }} /><Tooltip label="Actualiser"><ActionIcon variant="light" onClick={loadFormData} size="sm" radius="md"><IconRefresh size={14} /></ActionIcon></Tooltip></Group></Group><ScrollArea h={350} offsetScrollbars><Table striped highlightOnHover style={{ fontSize: 12 }}><Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0, zIndex: 1 }}><Table.Tr><Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px' }}>Désignation</Table.Th><Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 50, textAlign: 'center' }}>Taille</Table.Th><Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 80 }}>Couleur</Table.Th><Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 80, textAlign: 'right' }}>Prix vente</Table.Th><Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 50, textAlign: 'center' }}>Stock</Table.Th><Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 50 }}></Table.Th></Table.Tr></Table.Thead><Table.Tbody>{venteType === 'pret_a_porter' ? articles.filter(a => a.modele.toLowerCase().includes(searchProduitTerm.toLowerCase()) || a.couleur.toLowerCase().includes(searchProduitTerm.toLowerCase()) || a.taille.toLowerCase().includes(searchProduitTerm.toLowerCase())).map(article => { const mm = modeles?.find(m => m.designation === article.modele); const cc = couleurs?.find(c => c.nom_couleur === article.couleur); const tt = tailles?.find(t => t.libelle === article.taille); return (<Table.Tr key={article.id}><Table.Td style={{ padding: '4px 8px' }}><Text size="xs" fw={600}>{article.modele}</Text>{mm && <Text size="10px" c="dimmed">{mm.categorie}</Text>}</Table.Td><Table.Td style={{ padding: '4px 8px', textAlign: 'center' }}><Badge size="xs" variant="light" color="blue">{tt?.code_taille || article.taille}</Badge></Table.Td><Table.Td style={{ padding: '4px 8px' }}><Group gap={6} wrap="nowrap"><Box w={12} h={12} style={{ backgroundColor: cc?.code_hex || '#ccc', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.2)' }} /><Text size="xs">{article.couleur}</Text></Group></Table.Td><Table.Td style={{ padding: '4px 8px', textAlign: 'right' }}><Text size="xs" fw={600} c="green">{article.prix_vente.toLocaleString()} FCFA</Text></Table.Td><Table.Td style={{ padding: '4px 8px', textAlign: 'center' }}><Badge size="xs" color={article.quantite_stock < 5 ? 'orange' : 'green'}>{article.quantite_stock}</Badge></Table.Td><Table.Td style={{ padding: '4px 8px' }}><ActionIcon variant="light" color="blue" size="sm" onClick={() => { setSelectedArticle(article); setQuantiteCmd(1); setShowQuantiteModal(true); }}><IconPlus size={14} /></ActionIcon></Table.Td></Table.Tr>); }) : matieres.filter(m => m.designation.toLowerCase().includes(searchProduitTerm.toLowerCase())).map(matiere => (<Table.Tr key={matiere.id}><Table.Td colSpan={3} style={{ padding: '4px 8px' }}><Text size="xs" fw={600}>{matiere.designation}</Text><Text size="10px" c="dimmed">{matiere.code_matiere} - {matiere.unite}</Text></Table.Td><Table.Td style={{ padding: '4px 8px', textAlign: 'right' }}><Text size="xs" c="dimmed">-</Text></Table.Td><Table.Td style={{ padding: '4px 8px', textAlign: 'center' }}><Badge size="xs" color={matiere.stock_actuel < 5 ? 'orange' : 'green'}>{matiere.stock_actuel}</Badge></Table.Td><Table.Td style={{ padding: '4px 8px' }}><ActionIcon variant="light" color="blue" size="sm" onClick={() => handleAjouterMatiereAuPanier(matiere)}><IconPlus size={14} /></ActionIcon></Table.Td></Table.Tr>))}</Table.Tbody></Table></ScrollArea></Card>}
      {venteType === 'commande' && <Card withBorder radius="lg" shadow="sm" p="md"><Title order={5} mb="sm">📝 Ajouter un article à la commande</Title><Group align="flex-end" gap="xs" mb="sm"><TextInput placeholder="Désignation" value={produitCommande} onChange={(e) => setProduitCommande(e.target.value)} size="sm" radius="md" style={{ flex: 2 }} /><NumberInput placeholder="Qté" value={quantiteCommande} onChange={(val) => setQuantiteCommande(Number(val) || 1)} min={1} size="sm" radius="md" style={{ width: 70 }} /><NumberInput placeholder="Prix unitaire" value={montantCommande} onChange={(val) => setMontantCommande(Number(val) || 0)} min={0} step={500} size="sm" radius="md" style={{ width: 130 }} rightSection={<Text size="xs">FCFA</Text>} /><ActionIcon variant="filled" color="#1b365d" size="lg" radius="md" onClick={() => { if (!produitCommande || montantCommande <= 0) { notifications.show({ title: 'Erreur', message: 'Désignation et prix requis', color: 'red' }); return; } setPanier([...panier, { id: `${Date.now()}`, produitId: 0, designation: produitCommande, quantite: quantiteCommande, prixUnitaire: montantCommande, total: quantiteCommande * montantCommande, type_produit: 'article' }]); setProduitCommande(''); setMontantCommande(0); setQuantiteCommande(1); }}><IconPlus size={18} /></ActionIcon></Group></Card>}
      <Card
        withBorder
        radius="lg"
        shadow="sm"
        p="md"
      >

        <Title order={5} mb="sm">
          📅 Rendez-vous
        </Title>

        <SimpleGrid
          cols={{ base: 1, sm: 3 }}
          spacing="md"
        >

          <TextInput
            label="Date"
            type="date"
            value={dateRendezVous}
            onChange={(e) =>
              setDateRendezVous(
                e.target.value
              )
            }
            radius="md"
          />

          <TextInput
            label="Heure"
            type="time"
            value={heureRendezVous}
            onChange={(e) =>
              setHeureRendezVous(
                e.target.value
              )
            }
            radius="md"
          />

          <Select
            label="Type"
            value={typeRendezVous}
            onChange={(v) =>
              setTypeRendezVous(
                v || 'essayage'
              )
            }
            data={[
              {
                value: 'essayage',
                label: 'Essayage'
              },
              {
                value: 'livraison',
                label: 'Livraison'
              },
              {
                value: 'retrait',
                label: 'Retrait'
              }
            ]}
            radius="md"
          />

        </SimpleGrid>

      </Card>
      {panier.length > 0 && <Card withBorder radius="lg" shadow="sm" p="md"><Title order={5} mb="sm">🛒 Produits sélectionnés ({panier.length})</Title><ScrollArea h={250} offsetScrollbars><Table striped highlightOnHover style={{ fontSize: 12 }}><Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0, zIndex: 1 }}><Table.Tr><Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px' }}>Désignation</Table.Th><Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 90, textAlign: 'right' }}>Prix unitaire</Table.Th><Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 50, textAlign: 'center' }}>Qté</Table.Th><Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 100, textAlign: 'right' }}>Total</Table.Th><Table.Th style={{ color: 'white', fontSize: 11, padding: '6px 8px', width: 40 }}></Table.Th></Table.Tr></Table.Thead><Table.Tbody>{panier.map((item, idx) => (<Table.Tr key={`${item.id}-${idx}`}><Table.Td style={{ padding: '4px 8px' }}><Text size="xs" fw={500}>{item.designation}</Text></Table.Td><Table.Td style={{ padding: '4px 8px', textAlign: 'right' }}><Text size="xs">{item.prixUnitaire.toLocaleString()} FCFA</Text></Table.Td><Table.Td style={{ padding: '4px 8px', textAlign: 'center' }}><Text size="xs" fw={600}>{item.quantite}</Text></Table.Td><Table.Td style={{ padding: '4px 8px', textAlign: 'right' }}><Text size="xs" fw={600} c="green">{item.total.toLocaleString()} FCFA</Text></Table.Td><Table.Td style={{ padding: '4px 8px' }}><ActionIcon color="red" size="xs" variant="subtle" onClick={() => handleSupprimerPanier(item.id)}><IconTrash size={12} /></ActionIcon></Table.Td></Table.Tr>))}</Table.Tbody></Table></ScrollArea></Card>}
      <Card withBorder radius="lg" shadow="sm" p="md"><SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md"><Box><Text size="xs" c="dimmed">Nb d'articles</Text><Text fw={700} size="lg">{panier.length}</Text></Box><Box><Text size="xs" c="dimmed">Nb de pièces</Text><Text fw={700} size="lg">{panier.reduce((sum, item) => sum + item.quantite, 0)}</Text></Box><Box><Text size="xs" c="dimmed">Montant Total</Text><Text fw={700} size="lg" c="blue">{totalPanier.toLocaleString()} FCFA</Text></Box><Box><Text size="xs" c="dimmed">Date</Text><TextInput type="date" value={dateCommande} onChange={(e) => setDateCommande(e.target.value)} size="xs" radius="md" /></Box></SimpleGrid><Divider mb="md" /><Textarea label="Observation" placeholder="Notes..." value={observation} onChange={(e) => setObservation(e.target.value)} rows={2} size="sm" radius="md" mb="md" />{venteType === 'commande' ? <Stack gap="sm"><Button onClick={handleGenererFacture} size="md" radius="md" variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }} leftSection={<IconFileInvoice size={18} />} fullWidth disabled={panier.length === 0}>Générer la facture</Button><Button onClick={handleSubmitVente} loading={loading} size="md" radius="md" variant="gradient" gradient={{ from: 'green', to: 'teal' }} leftSection={<IconReceipt size={18} />} fullWidth disabled={panier.length === 0}>Enregistrer la commande</Button></Stack> : <Button onClick={handleSubmitVente} loading={loading} size="md" radius="md" variant="gradient" gradient={{ from: 'green', to: 'teal' }} leftSection={<IconReceipt size={18} />} fullWidth disabled={panier.length === 0}>Finaliser la vente</Button>}</Card>
      <Modal opened={showQuantiteModal} onClose={() => { setShowQuantiteModal(false); setSelectedArticle(null); setQuantiteCmd(1); }} title="Quantité" size="sm" centered radius="md"><Stack gap="md">{selectedArticle && <Paper p="sm" withBorder radius="md" bg="gray.0"><Text size="sm" fw={600}>{selectedArticle.modele} - {selectedArticle.taille} - {selectedArticle.couleur}</Text><Group justify="space-between" mt={4}><Text size="xs" c="dimmed">Stock : {selectedArticle.quantite_stock}</Text><Text size="xs" c="dimmed">Prix : {selectedArticle.prix_vente.toLocaleString()} FCFA</Text></Group></Paper>}<NumberInput label="Quantité à ajouter" value={quantiteCmd} onChange={(val) => setQuantiteCmd(typeof val === 'number' ? Math.max(1, val) : 1)} min={1} max={selectedArticle?.quantite_stock || 1} size="sm" radius="md" autoFocus /><Group justify="flex-end" gap="xs"><Button variant="subtle" size="xs" onClick={() => { setShowQuantiteModal(false); setSelectedArticle(null); }}>Annuler</Button><Button size="xs" onClick={() => { setShowQuantiteModal(false); handleAjouterAuPanier(); }}>Ajouter au panier</Button></Group></Stack></Modal>
    </Stack></Container>
  );
};

export default VentesManager;

