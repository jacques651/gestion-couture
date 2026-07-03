// src/hooks/usePanier.ts
import { useState } from 'react';
import { notifications } from '@mantine/notifications';

export interface PanierItem {
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

export const usePanier = () => {
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [quantiteCmd, setQuantiteCmd] = useState(1);

  const totalPanier = panier.reduce((sum, item) => sum + item.total, 0);

  const getArticleDesignation = (article: any, tailles: any[]): string => {
    if (!article) return 'Article non défini';
    
    let designation = article.modele || article.type_tenue || 'Article';
    
    if (article.categorie && article.categorie !== 'undefined') {
      designation += ` (${article.categorie})`;
    }
    
    if (article.taille && article.taille !== 'null' && article.taille !== 'undefined') {
      const tt = tailles?.find(t => t.libelle === article.taille);
      designation += ` - ${tt?.code_taille || article.taille}`;
    }
    
    if (article.couleur && article.couleur !== 'null' && article.couleur !== 'undefined') {
      designation += ` - ${article.couleur}`;
    }
    
    if (article.texture && article.texture !== 'null' && article.texture !== 'undefined') {
      designation += ` (${article.texture})`;
    }
    
    return designation;
  };

  const ajouterArticleAuPanier = (article: any, quantite: number, tailles: any[]) => {
    if (!article) {
      notifications.show({ title: 'Erreur', message: 'Aucun article sélectionné', color: 'red' });
      return false;
    }
    
    if (quantite > article.quantite_stock) {
      notifications.show({ 
        title: 'Erreur', 
        message: `Stock insuffisant (max: ${article.quantite_stock})`, 
        color: 'red' 
      });
      return false;
    }
    
    const designation = getArticleDesignation(article, tailles);
    
    const existingIndex = panier.findIndex(item => 
      item.produitId === article.id && 
      item.type_produit === 'article'
    );
    
    if (existingIndex >= 0) {
      const newPanier = [...panier];
      const newQte = newPanier[existingIndex].quantite + quantite;
      if (newQte > article.quantite_stock) {
        notifications.show({ title: 'Erreur', message: 'Stock insuffisant', color: 'red' });
        return false;
      }
      newPanier[existingIndex].quantite = newQte;
      newPanier[existingIndex].total = newPanier[existingIndex].prixUnitaire * newQte;
      newPanier[existingIndex].designation = designation;
      setPanier(newPanier);
    } else {
      setPanier([...panier, { 
        id: `${Date.now()}-${Math.random()}`, 
        produitId: article.id, 
        designation: designation,
        taille: article.taille, 
        couleur: article.couleur, 
        quantite: quantite, 
        prixUnitaire: article.prix_vente, 
        total: article.prix_vente * quantite, 
        type_produit: 'article' 
      }]);
    }
    
    notifications.show({ 
      title: 'Ajouté', 
      message: `${designation} x${quantite}`, 
      color: 'green' 
    });
    
    return true;
  };

  const ajouterMatiereAuPanier = (matiere: any) => {
    const existingIndex = panier.findIndex(item => 
      item.produitId === matiere.id && 
      item.type_produit === 'matiere'
    );
    
    if (existingIndex >= 0) {
      if (panier[existingIndex].quantite + 1 > matiere.stock_actuel) {
        notifications.show({ title: 'Erreur', message: 'Stock insuffisant', color: 'red' });
        return false;
      }
      const newPanier = [...panier];
      newPanier[existingIndex].quantite += 1;
      newPanier[existingIndex].total = newPanier[existingIndex].prixUnitaire * newPanier[existingIndex].quantite;
      setPanier(newPanier);
    } else {
      setPanier([...panier, { 
        id: `${Date.now()}-${Math.random()}`, 
        produitId: matiere.id, 
        designation: matiere.designation, 
        quantite: 1, 
        prixUnitaire: matiere.prix_vente, 
        total: matiere.prix_vente, 
        type_produit: 'matiere' 
      }]);
    }
    return true;
  };

  const supprimerDuPanier = (index: number) => {
    const newPanier = [...panier];
    newPanier.splice(index, 1);
    setPanier(newPanier);
  };

  const viderPanier = () => {
    setPanier([]);
  };

  return {
    panier,
    setPanier,
    totalPanier,
    selectedArticle,
    setSelectedArticle,
    quantiteCmd,
    setQuantiteCmd,
    ajouterArticleAuPanier,
    ajouterMatiereAuPanier,
    supprimerDuPanier,
    viderPanier,
    getArticleDesignation
  };
};