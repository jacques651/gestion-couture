// src/components/AssistantIA.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Card,
  Text,
  Button,
  Group,
  TextInput,
  ScrollArea,
  Avatar,
  Box,
  Paper,
  Popover,
  Badge,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconRobot,
  IconSend,
  IconX,
  IconMicrophone,
  IconVolume,
  IconTrash,
  IconMessageCircle,
  IconArrowRight,
} from '@tabler/icons-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  /** Lien d'action proposé avec le message (navigation) */
  link?: string;
  linkLabel?: string;
}

const ASSISTANT_KNOWLEDGE: Record<string, { title: string; content: string; link?: string; linkLabel?: string }> = {
  // Dashboard
  dashboard: {
    title: '📊 Tableau de bord',
    content: "Le tableau de bord affiche les indicateurs clés : chiffre d'affaires, encaissements, dépenses, valeur du stock, bénéfices et alertes de rupture de stock. Les accès rapides permettent de naviguer vers les sections principales.",
    link: '/',
    linkLabel: 'Voir le tableau de bord'
  },
  
  // Commandes
  commandes: {
    title: '📝 Créer une commande sur mesure',
    content: "Pour créer une commande sur mesure :\n1. Allez dans Ventes → Nouvelle vente\n2. Sélectionnez 'Commande (Sur mesure)'\n3. Renseignez le client (obligatoire)\n4. Décrivez le produit, la quantité et le prix\n5. Générez la facture et procédez au paiement",
    link: '/ventes',
    linkLabel: 'Aller aux ventes'
  },
  etat_commande: {
    title: '📋 Suivi des commandes',
    content: "Les commandes ont 3 statuts : PAYEE (payée), PARTIEL (partiellement payée), EN_ATTENTE (non payée). Vous pouvez voir les détails, modifier, générer une facture (sur mesure) ou un reçu depuis la liste des ventes.",
  },
  
  // Ventes prêt-à-porter
  ventes_pret_a_porter: {
    title: '👕 Vente prêt-à-porter',
    content: "Pour une vente d'article en stock :\n1. Ventes → Nouvelle vente\n2. Sélectionnez 'Prêt-à-porter'\n3. Choisissez l'article (modèle + taille + couleur)\n4. Ajoutez au panier\n5. Finalisez la vente et générez le reçu",
    link: '/ventes',
    linkLabel: 'Aller aux ventes'
  },
  
  // Ventes matières
  ventes_matieres: {
    title: '📦 Vente de matière',
    content: "Pour vendre une matière première :\n1. Ventes → Nouvelle vente\n2. Sélectionnez 'Matière'\n3. Ajoutez les matières au panier\n4. Finalisez la vente",
    link: '/ventes',
    linkLabel: 'Aller aux ventes'
  },
  
  // Clients
  clients: {
    title: '👥 Gestion des clients',
    content: "La liste des clients est accessible dans CLIENTS → Liste des clients. Vous pouvez y ajouter, modifier, supprimer des clients et voir leurs mesures associées.",
    link: '/clients',
    linkLabel: 'Voir les clients'
  },
  mesures: {
    title: '📏 Types de mesures',
    content: "Les types de mesures (tour de poitrine, tour de taille, etc.) se configurent dans CLIENTS → Types de mesures (admin seulement). Vous pouvez ajouter des mesures classées par catégorie : haut, bas, général, accessoire.",
    link: '/types-mesures',
    linkLabel: 'Configurer les mesures'
  },
  ajout_client: {
    title: '➕ Ajouter un client',
    content: "Depuis la liste des clients, cliquez sur 'Ajouter un client'. Remplissez le nom, téléphone, adresse, email. Vous pourrez ensuite lui associer des mesures personnalisées.",
  },
  
  // Référentiels
  referentiels: {
    title: '⚙️ Référentiels',
    content: "Les référentiels (admin seulement) comprennent : Tailles (XS, S, M, L, XL...), Couleurs (avec code hex), Textures/Matières, Modèles de tenues, Catégories de matières, Types de prestations, Configuration atelier.",
  },
  tailles: {
    title: '📏 Gestion des tailles',
    content: "Les tailles sont configurables dans RÉFÉRENTIELS → Tailles. Chaque taille a un code (XS, S, M, L, XL, XXL...), un libellé et une catégorie (adulte/enfant/universel).",
    link: '/tailles',
    linkLabel: 'Gérer les tailles'
  },
  couleurs: {
    title: '🎨 Gestion des couleurs',
    content: "Les couleurs sont configurables avec leur code hexadécimal pour un affichage visuel. Accessible dans RÉFÉRENTIELS → Couleurs.",
    link: '/couleurs',
    linkLabel: 'Gérer les couleurs'
  },
  modeles_tenues: {
    title: '👔 Modèles de tenues',
    content: "Créez des modèles de base (Chemise, Robe, Pantalon...) avec leur catégorie (femme/homme/enfant/accessoire). Le code est généré automatiquement. Accessible dans RÉFÉRENTIELS → Modèles de tenues.",
    link: '/modeles-tenues',
    linkLabel: 'Gérer les modèles'
  },
  categories_matieres: {
    title: '📦 Catégories de matières',
    content: "Organisez vos matières par catégories (Tissus, Doublures, Fournitures, Fils, Outils...). Chaque catégorie a une couleur distinctive. Accessible dans RÉFÉRENTIELS → Catégories matières.",
    link: '/categories-matieres',
    linkLabel: 'Gérer les catégories'
  },
  types_prestations: {
    title: '🔧 Types de prestations',
    content: "Définissez les prestations possibles (Confection, Retouche, Broderie...) avec leur prix par défaut. Utilisé pour le calcul des salaires des employés à la prestation.",
    link: '/ListeTypesPrestations',
    linkLabel: 'Gérer les prestations'
  },
  atelier: {
    title: '🏭 Configuration atelier',
    content: "Configurez les infos de votre atelier : nom, téléphone, email, adresse, ville, pays, IFU, RCCM, devise, logo et message de facture. Ces infos apparaissent sur les factures et reçus.",
    link: '/atelier',
    linkLabel: 'Configurer l\'atelier'
  },
  
  // Stock & Inventaire
  stock_inventaire: {
    title: '📦 Stock & Inventaire',
    content: "Cette section comprend :\n• Inventaire (Tenues) : articles combinant modèle + taille + couleur\n• Matières premières : tissus, fils, fournitures\n• Mouvements de stock : historique des entrées/sorties",
  },
  articles: {
    title: '👕 Inventaire des tenues',
    content: "Créez des articles en combinant un modèle, une taille, une couleur et optionnellement une texture. Définissez le prix d'achat, prix de vente, stock initial et seuil d'alerte. Accessible dans STOCK → Inventaire (Tenues).",
    link: '/articles',
    linkLabel: 'Voir l\'inventaire'
  },
  matieres: {
    title: '🧵 Matières premières',
    content: "Gérez vos matières (tissus, fils, boutons...) avec leur unité (mètre, pièce, kg, rouleau, bobine). Suivez le stock et définissez un seuil d'alerte. Accessible dans STOCK → Matières premières.",
    link: '/matieres',
    linkLabel: 'Voir les matières'
  },
  mouvements_stock: {
    title: '📋 Mouvements de stock',
    content: "Consultez l'historique de toutes les entrées et sorties de stock. Les mouvements sont générés automatiquement lors des achats et des ventes. Accessible dans STOCK → Mouvements de stock (admin).",
    link: '/mouvements-stock',
    linkLabel: 'Voir les mouvements'
  },
  alerte_stock: {
    title: '⚠️ Alertes de stock',
    content: "Le tableau de bord affiche les alertes pour les matières et articles dont le stock est inférieur ou égal au seuil d'alerte. Les ruptures apparaissent en rouge. Configurez le seuil dans chaque fiche article ou matière.",
  },
  
  // Finances
  finances: {
    title: '💰 Finances',
    content: "Section finances (admin/caissier) : Dépenses, Bilan financier, Journal de caisse.",
  },
  depenses: {
    title: '💸 Gestion des dépenses',
    content: "Enregistrez vos dépenses (loyer, électricité, fournitures...) avec leur catégorie, montant et responsable. Accessible dans FINANCES → Dépenses.",
    link: '/depenses',
    linkLabel: 'Gérer les dépenses'
  },
  bilan: {
    title: '📊 Bilan financier',
    content: "Le bilan affiche le chiffre d'affaires, les encaissements, les dépenses et le bénéfice. Le taux de recouvrement mesure l'efficacité des encaissements. Accessible dans FINANCES → Bilan financier.",
    link: '/bilan',
    linkLabel: 'Voir le bilan'
  },
  journal: {
    title: '📒 Journal de caisse',
    content: "Le journal de caisse enregistre toutes les transactions (ventes, dépenses) avec leurs dates et montants. Accessible dans FINANCES → Journal de caisse.",
    link: '/journal',
    linkLabel: 'Voir le journal'
  },
  
  // RH
  rh: {
    title: '👷 Ressources Humaines',
    content: "Section RH (admin) : Employés, Prestations réalisées, Salaires, Emprunts.",
  },
  employes: {
    title: '👤 Gestion des employés',
    content: "Ajoutez vos employés avec leur type de rémunération (fixe ou à la prestation). Accessible dans RH → Employés.",
    link: '/employes',
    linkLabel: 'Gérer les employés'
  },
  salaires: {
    title: '💵 Gestion des salaires',
    content: "Calculez et payez les salaires. Pour les employés fixes : salaire de base. Pour les prestations : total des prestations réalisées. Les emprunts sont déduits automatiquement. Accessible dans RH → Salaires.",
    link: '/salaires',
    linkLabel: 'Gérer les salaires'
  },
  emprunts: {
    title: '🏦 Emprunts employés',
    content: "Enregistrez les emprunts des employés. Ils seront automatiquement déduits lors du paiement des salaires. Accessible dans RH → Emprunts.",
    link: '/emprunts',
    linkLabel: 'Gérer les emprunts'
  },
  prestations_realisees: {
    title: '🔨 Prestations réalisées',
    content: "Enregistrez les prestations effectuées par chaque employé. Utilisé pour le calcul des salaires à la prestation. Accessible dans RH → Prestations réalisées.",
    link: '/prestations-realisees',
    linkLabel: 'Voir les prestations'
  },
  
  // Paramètres
  parametres: {
    title: '🔧 Paramètres',
    content: "Section paramètres (admin) : Utilisateurs, Configuration réseau, Import/Export.",
  },
  utilisateurs: {
    title: '👥 Gestion des utilisateurs',
    content: "Gérez les comptes utilisateurs (admin, caissier, couturier). Chaque rôle a des permissions différentes. L'admin a accès à tout. Accessible dans PARAMÈTRES → Utilisateurs.",
    link: '/utilisateurs',
    linkLabel: 'Gérer les utilisateurs'
  },
  config_reseau: {
    title: '🌐 Configuration réseau',
    content: "Configurez l'application pour une utilisation multi-postes en partageant la base de données sur le réseau.local",
    link: '/config-reseau',
    linkLabel: 'Configurer le réseau'
  },
  import_export: {
    title: '📥 Import/Export',
    content: "Importez des clients depuis un fichier Excel. Exportez la configuration des mesures pour la partager entre postes.",
    link: '/import-export',
    linkLabel: 'Import/Export'
  },
  
  // Support
  support: {
    title: '🆘 Support',
    content: "Section support : Guide d'utilisation, Support technique, Exporter pour support.",
  },
  aide: {
    title: '📖 Guide d\'utilisation',
    content: "Consultez le guide d'utilisation complet de l'application. Accessible dans SUPPORT → Guide d'utilisation.",
    link: '/aide',
    linkLabel: 'Voir le guide'
  },
  export_support: {
    title: '💾 Exporter pour support',
    content: "Exportez la base de données pour l'envoyer au support technique en cas de problème.",
    link: '/export-support',
    linkLabel: 'Exporter'
  },
  
  // Factures & Reçus
  factures_recus: {
    title: '📄 Factures & Reçus',
    content: "Consultez toutes les factures (commandes sur mesure) et reçus (toutes ventes avec paiement). Filtrez par type, statut, ou recherchez par client/code.",
    link: '/factures-recus',
    linkLabel: 'Voir les documents'
  },
};

// Mots-clés associés aux réponses
const INTENTS: { keywords: string[]; responseKey: string }[] = [
  { keywords: ['accueil', 'dashboard', 'tableau de bord', 'indicateur', 'kpi'], responseKey: 'dashboard' },
  { keywords: ['commande sur mesure', 'créer commande', 'nouvelle commande', 'commande client'], responseKey: 'commandes' },
  { keywords: ['état commande', 'statut commande', 'suivi commande', 'payee', 'partiel'], responseKey: 'etat_commande' },
  { keywords: ['prêt-à-porter', 'pret a porter', 'article en stock', 'vente article'], responseKey: 'ventes_pret_a_porter' },
  { keywords: ['vente matière', 'vendre matière', 'matière première vente'], responseKey: 'ventes_matieres' },
  { keywords: ['client', 'clients', 'gestion client', 'liste client'], responseKey: 'clients' },
  { keywords: ['mesure', 'mesures', 'type mesure', 'tour de poitrine', 'tour de taille'], responseKey: 'mesures' },
  { keywords: ['ajouter client', 'nouveau client', 'créer client'], responseKey: 'ajout_client' },
  { keywords: ['référentiel', 'referentiel', 'paramétrage base'], responseKey: 'referentiels' },
  { keywords: ['taille', 'tailles', 'xs', 'xl', 'xxl', 'pointure'], responseKey: 'tailles' },
  { keywords: ['couleur', 'couleurs', 'code hex', 'palette'], responseKey: 'couleurs' },
  { keywords: ['modèle tenue', 'modele tenue', 'chemise', 'robe', 'pantalon', 'design'], responseKey: 'modeles_tenues' },
  { keywords: ['catégorie matière', 'categorie matiere', 'tissu', 'fourniture', 'doublure'], responseKey: 'categories_matieres' },
  { keywords: ['type prestation', 'prestation', 'confection', 'retouche', 'brodage'], responseKey: 'types_prestations' },
  { keywords: ['atelier', 'config atelier', 'paramètre atelier', 'logo', 'ifu', 'rccm', 'devise'], responseKey: 'atelier' },
  { keywords: ['stock', 'inventaire', 'inventaire tenue', 'gestion stock'], responseKey: 'stock_inventaire' },
  { keywords: ['article', 'articles', 'tenue', 'tenues', 'inventaire'], responseKey: 'articles' },
  { keywords: ['matière', 'matiere', 'matières premières', 'tissu', 'fil', 'bouton'], responseKey: 'matieres' },
  { keywords: ['mouvement stock', 'entrée stock', 'sortie stock', 'historique stock'], responseKey: 'mouvements_stock' },
  { keywords: ['alerte stock', 'rupture', 'seuil alerte', 'stock bas', 'réapprovisionner'], responseKey: 'alerte_stock' },
  { keywords: ['finance', 'finances', 'financier'], responseKey: 'finances' },
  { keywords: ['dépense', 'depense', 'dépenses', 'loyer', 'électricité'], responseKey: 'depenses' },
  { keywords: ['bilan', 'bénéfice', 'benefice', 'recouvrement', 'trésorerie'], responseKey: 'bilan' },
  { keywords: ['journal caisse', 'journal', 'caisse', 'transaction'], responseKey: 'journal' },
  { keywords: ['rh', 'ressource humaine', 'personnel'], responseKey: 'rh' },
  { keywords: ['employé', 'employe', 'employés', 'couturier', 'personnel'], responseKey: 'employes' },
  { keywords: ['salaire', 'salaires', 'paye', 'paiement salaire', 'rémunération'], responseKey: 'salaires' },
  { keywords: ['emprunt', 'emprunts', 'avance', 'dette employé'], responseKey: 'emprunts' },
  { keywords: ['prestation réalisée', 'prestation faite', 'travail effectué'], responseKey: 'prestations_realisees' },
  { keywords: ['paramètre', 'parametre', 'configuration', 'réglage'], responseKey: 'parametres' },
  { keywords: ['utilisateur', 'utilisateurs', 'compte', 'rôle', 'admin', 'caissier', 'couturier'], responseKey: 'utilisateurs' },
  { keywords: ['réseau', 'reseau', 'partage base', 'multi poste', 'plusieurs pc'], responseKey: 'config_reseau' },
  { keywords: ['import', 'export', 'excel', 'importer client'], responseKey: 'import_export' },
  { keywords: ['support', 'aide', 'problème', 'assistance', 'help'], responseKey: 'support' },
  { keywords: ['guide', 'documentation', 'manuel', 'tutoriel'], responseKey: 'aide' },
  { keywords: ['exporter base', 'sauvegarde base', 'backup'], responseKey: 'export_support' },
  { keywords: ['facture', 'reçu', 'recu', 'document', 'imprimer facture'], responseKey: 'factures_recus' },
  { keywords: ['bonjour', 'salut', 'hello', 'coucou', 'bonsoir', 'hey'], responseKey: 'dashboard' },
];

const generateResponse = (question: string): { title: string; content: string; link?: string; linkLabel?: string } | null => {
  const lowerQuestion = question.toLowerCase();

  for (const intent of INTENTS) {
    for (const keyword of intent.keywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        return ASSISTANT_KNOWLEDGE[intent.responseKey] || null;
      }
    }
  }

  return null;
};

// ============================================================
// 🎮 MOTEUR DE COMMANDES : l'assistant CONTRÔLE l'application
// "Ouvre-moi la fonctionnalité client", "va aux ventes",
// "affiche le bilan", "montre-moi le stock"... → navigation directe
// ============================================================

/** Normalise le texte : minuscules + sans accents */
const normaliser = (texte: string): string =>
  texte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Verbes qui déclenchent une ACTION (et non une question d'aide) */
const VERBES_ACTION = [
  'ouvre', 'ouvrir', 'ouvres',
  'va ', 'vas ', 'aller', 'allez',
  'affiche', 'afficher', 'affiches',
  'montre', 'montrer', 'montres',
  'accede', 'acceder',
  'navigue', 'naviguer',
  'lance', 'lancer',
  'amene', 'amener', 'emmene',
  'fais moi voir', 'fait moi voir',
  'je veux voir', 'je veux aller',
];

/** Cibles de navigation : mots-clés (normalisés) → route + libellé */
const CIBLES_NAVIGATION: { keywords: string[]; path: string; label: string }[] = [
  { keywords: ['tableau de bord', 'dashboard', 'accueil'], path: '/', label: 'le Tableau de bord' },
  { keywords: ['type de mesure', 'types de mesures', 'configuration mesure'], path: '/types-mesures', label: 'les Types de mesures' },
  { keywords: ['client'], path: '/clients', label: 'la Liste des clients' },
  { keywords: ['historique des paiements', 'historique paiement', 'paiement'], path: '/historique-paiements', label: "l'Historique des paiements" },
  { keywords: ['facture', 'recu', 'reçu'], path: '/factures-recus', label: 'les Factures & Reçus' },
  { keywords: ['rendez-vous', 'rendez vous', 'rendezvous', 'rdv'], path: '/rendezvous', label: 'les Rendez-vous' },
  { keywords: ['vente'], path: '/ventes', label: 'la Gestion des ventes' },
  { keywords: ['mouvement de stock', 'mouvements de stock', 'mouvement stock'], path: '/mouvements-stock', label: 'les Mouvements de stock' },
  { keywords: ['matiere premiere', 'matieres premieres', 'matiere'], path: '/matieres', label: 'les Matières premières' },
  { keywords: ['article', 'inventaire', 'stock'], path: '/articles', label: "l'Inventaire des tenues" },
  { keywords: ['taille'], path: '/tailles', label: 'les Tailles' },
  { keywords: ['couleur'], path: '/couleurs', label: 'les Couleurs' },
  { keywords: ['texture'], path: '/textures', label: 'les Textures' },
  { keywords: ['type de tenue', 'types de tenues', 'modele de tenue', 'modeles de tenues', 'tenue'], path: '/types-tenues', label: 'les Types de tenues' },
  { keywords: ['categorie matiere', 'categories matieres', 'categorie'], path: '/categories-matieres', label: 'les Catégories de matières' },
  { keywords: ['prestation realisee', 'prestations realisees'], path: '/prestations-realisees', label: 'les Prestations réalisées' },
  { keywords: ['type de prestation', 'types de prestations', 'prestation'], path: '/ListeTypesPrestations', label: 'les Types de prestations' },
  { keywords: ['atelier', 'configuration atelier'], path: '/atelier', label: "la Configuration de l'atelier" },
  { keywords: ['depense'], path: '/depenses', label: 'les Dépenses' },
  { keywords: ['bilan'], path: '/bilan', label: 'le Bilan financier' },
  { keywords: ['journal de caisse', 'journal caisse', 'caisse'], path: '/journal', label: 'le Journal de caisse' },
  { keywords: ['journal des modifications', 'journal modification'], path: '/journal-modifications', label: 'le Journal des modifications' },
  { keywords: ['employe'], path: '/employes', label: 'les Employés' },
  { keywords: ['historique salaire', 'historiques salaires'], path: '/historiques-salaires', label: "l'Historique des salaires" },
  { keywords: ['salaire'], path: '/salaires', label: 'la Gestion des salaires' },
  { keywords: ['emprunt'], path: '/emprunts', label: 'les Emprunts' },
  { keywords: ['utilisateur'], path: '/utilisateurs', label: 'les Utilisateurs' },
  { keywords: ['configuration serveur', 'config serveur', 'serveur', 'reseau'], path: '/config-serveur', label: 'la Configuration serveur' },
  { keywords: ['import', 'export excel', 'excel'], path: '/import-export', label: "l'Import/Export" },
  { keywords: ['guide', 'aide', 'documentation', 'manuel'], path: '/aide', label: "le Guide d'utilisation" },
  { keywords: ['support technique', 'support'], path: '/support', label: 'le Support technique' },
];

interface CommandeDetectee {
  path: string;
  label: string;
}

/** Détecte une commande de navigation dans la phrase de l'utilisateur */
const detecterCommande = (texte: string): CommandeDetectee | null => {
  const normalise = normaliser(texte);

  const contientVerbe = VERBES_ACTION.some((v) => normalise.includes(v));
  if (!contientVerbe) return null;

  // Chercher la cible la plus spécifique (mot-clé le plus long en premier)
  let meilleure: { cible: CommandeDetectee; longueur: number } | null = null;
  for (const cible of CIBLES_NAVIGATION) {
    for (const kw of cible.keywords) {
      if (normalise.includes(kw) && (!meilleure || kw.length > meilleure.longueur)) {
        meilleure = { cible: { path: cible.path, label: cible.label }, longueur: kw.length };
      }
    }
  }
  return meilleure?.cible || null;
};

const AssistantIA: React.FC = () => {
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Bonjour ! Je suis votre assistant Gestion Couture. Je peux :\n\n🎮 CONTRÔLER l'application — dites par exemple :\n• « Ouvre-moi la fonctionnalité client »\n• « Va aux ventes »\n• « Affiche le bilan »\n\n💬 VOUS GUIDER — demandez :\n• « Comment créer une commande ? »\n• « Comment payer un salaire ? »\n\n🎤 Utilisez le micro pour me parler en vocal !",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollViewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollViewport.current) {
      scrollViewport.current.scrollTo({
        top: scrollViewport.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, '').replace(/👉/g, '').replace(/[•🎮💬🎤✅📂]/g, ''));
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  /**
   * Envoi d'un message.
   * @param texteDirect - texte explicite (indispensable pour le vocal : ne pas
   *   dépendre de inputValue qui n'est pas encore à jour dans la closure)
   * @param depuisVocal - si true, la réponse est aussi lue à voix haute
   */
  const sendMessage = (texteDirect?: string, depuisVocal = false) => {
    const texte = (texteDirect ?? inputValue).trim();
    if (!texte) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: texte,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let assistantMessage: Message;

      // 1️⃣ COMMANDE D'ACTION ? → exécuter (navigation)
      const commande = detecterCommande(texte);
      if (commande) {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          text: `✅ C'est fait ! J'ouvre ${commande.label}.`,
          sender: 'assistant',
          timestamp: new Date(),
          link: commande.path,
          linkLabel: `Rouvrir ${commande.label}`,
        };
        navigate(commande.path);
      } else {
        // 2️⃣ Sinon : réponse d'aide (base de connaissances)
        const response = generateResponse(texte);
        const responseText = response
          ? `**${response.title}**\n\n${response.content}`
          : "Je n'ai pas compris. Vous pouvez :\n\n• Me donner un ordre : « ouvre les clients », « va aux ventes », « affiche le bilan »...\n• Me poser une question : « comment créer une commande ? »\n\nOu consulter le guide dans SUPPORT → Guide d'utilisation.";

        assistantMessage = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'assistant',
          timestamp: new Date(),
          link: response?.link,
          linkLabel: response?.linkLabel,
        };
      }

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);

      // 🔊 Si la demande était vocale, répondre en vocal
      if (depuisVocal) {
        speakResponse(assistantMessage.text);
      }
    }, 400);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      text: "🧹 Chat nettoyé. Comment puis-je vous aider ?",
      sender: 'assistant',
      timestamp: new Date(),
    }]);
  };

  const startListening = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "🎤 La reconnaissance vocale n'est pas disponible dans cet environnement. Utilisez le navigateur Chrome (téléphone ou PC) pour me parler en vocal, ou tapez votre commande.",
        sender: 'assistant',
        timestamp: new Date(),
      }]);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        // ✅ Passer le texte DIRECTEMENT (corrige le bug de closure qui envoyait un message vide)
        sendMessage(transcript, true);
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const suggestions = [
    "Ouvre les clients",
    "Va aux ventes",
    "Affiche le bilan",
    "Comment créer une commande ?",
  ];

  return (
    <Box style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      <Popover width={420} position="top-end" opened={opened} onClose={() => setOpened(false)} trapFocus={false}>
        <Popover.Target>
          <Button
            onClick={() => setOpened(!opened)}
            variant="gradient"
            gradient={{ from: '#1b365d', to: '#2a4a7a' }}
            size="lg"
            radius="xl"
            style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
          >
            <Group gap="xs">
              <IconMessageCircle size={22} />
              {!opened && <Text fw={600}>Assistant</Text>}
            </Group>
          </Button>
        </Popover.Target>

        <Popover.Dropdown style={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}>
          <Card p={0} radius="md" withBorder>
            {/* Header */}
            <Box p="sm" style={{ backgroundColor: '#1b365d' }}>
              <Group justify="space-between">
                <Group gap="xs">
                  <Avatar size="md" radius="xl" color="blue">
                    <IconRobot size={20} color="white" />
                  </Avatar>
                  <Box>
                    <Text size="sm" fw={600} c="white">Assistant Gestion Couture</Text>
                    <Text size="xs" c="gray.3">Disponible 24/7</Text>
                  </Box>
                </Group>
                <Group gap={4}>
                  <ActionIcon variant="subtle" color="gray" onClick={clearChat}><IconTrash size={16} /></ActionIcon>
                  <ActionIcon variant="subtle" color="gray" onClick={() => setOpened(false)}><IconX size={16} /></ActionIcon>
                </Group>
              </Group>
            </Box>

            {/* Messages */}
            <ScrollArea h={380} viewportRef={scrollViewport} p="md">
              <Stack gap="sm">
                {messages.map((message) => (
                  <Group key={message.id} justify={message.sender === 'user' ? 'flex-end' : 'flex-start'} align="flex-start" wrap="nowrap">
                    {message.sender === 'assistant' && (
                      <Avatar size="sm" radius="xl" color="blue"><IconRobot size={12} color="white" /></Avatar>
                    )}
                    <Paper p="sm" radius="md" bg={message.sender === 'user' ? '#1b365d' : 'gray.1'} style={{ maxWidth: '85%', whiteSpace: 'pre-wrap' }}>
                      <Text size="sm" c={message.sender === 'user' ? 'white' : 'dark'}>{message.text}</Text>
                      {message.sender === 'assistant' && message.link && (
                        <Button
                          size="xs"
                          mt={8}
                          variant="light"
                          rightSection={<IconArrowRight size={12} />}
                          onClick={() => navigate(message.link!)}
                        >
                          {message.linkLabel || 'Accéder'}
                        </Button>
                      )}
                      <Text size="10px" c={message.sender === 'user' ? 'blue.1' : 'dimmed'} mt={4}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Paper>
                    {message.sender === 'assistant' && (
                      <ActionIcon variant="subtle" size="sm" onClick={() => speakResponse(message.text)}>
                        <IconVolume size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                ))}
                {isTyping && (
                  <Group gap="xs">
                    <Avatar size="sm" radius="xl" color="blue"><IconRobot size={12} color="white" /></Avatar>
                    <Paper p="sm" radius="md" bg="gray.1">
                      <Group gap={4}>
                        <Box w={6} h={6} bg="gray.4" style={{ borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                        <Box w={6} h={6} bg="gray.4" style={{ borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }} />
                        <Box w={6} h={6} bg="gray.4" style={{ borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }} />
                      </Group>
                    </Paper>
                  </Group>
                )}
              </Stack>
            </ScrollArea>

            {/* Suggestions */}
            {messages.length < 3 && (
              <Box p="xs" style={{ borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                <Text size="xs" c="dimmed" mb={4}>Suggestions :</Text>
                <Group gap="xs" wrap="wrap">
                  {suggestions.map((s, i) => (
                    <Badge key={i} variant="light" color="blue" style={{ cursor: 'pointer' }}
                      onClick={() => sendMessage(s)}>
                      {s}
                    </Badge>
                  ))}
                </Group>
              </Box>
            )}

            {/* Input */}
            <Box p="sm" style={{ borderTop: '1px solid #e9ecef' }}>
              <Group gap="xs">
                <TextInput
                  placeholder="Votre question..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{ flex: 1 }}
                  radius="xl"
                  disabled={isTyping}
                />
                <Tooltip label={isListening ? 'Je vous écoute…' : 'Commande vocale'}>
                  <ActionIcon
                    variant={isListening ? 'filled' : 'subtle'}
                    color={isListening ? 'red' : undefined}
                    onClick={startListening}
                    disabled={isTyping}
                    style={isListening ? { animation: 'pulse 1s infinite' } : undefined}
                  >
                    <IconMicrophone size={18} />
                  </ActionIcon>
                </Tooltip>
                <ActionIcon variant="filled" color="#1b365d" onClick={() => sendMessage()} disabled={isTyping || !inputValue.trim()} radius="xl">
                  <IconSend size={16} />
                </ActionIcon>
              </Group>
            </Box>
          </Card>
        </Popover.Dropdown>
      </Popover>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default AssistantIA;