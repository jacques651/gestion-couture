// src/components/ventes/hooks/useStock.ts
import { useState } from 'react';
import { apiGet, apiPut } from '../services/api';


export const useStock = () => {
  const [loading] = useState(false);

  const updateStock = async (articleId: number, quantite: number, operation: 'add' | 'subtract') => {
    try {
      console.log(`📦 Mise à jour stock article ID: ${articleId}, quantite: ${quantite}, operation: ${operation}`);
      
      let article;
      try {
        article = await apiGet(`/articles/${articleId}`);
      } catch (err: any) {
        if (err.message?.includes('404')) {
          console.warn(`⚠️ Article ${articleId} non trouvé, skip stock update`);
          return;
        }
        throw err;
      }
      
      if (!article) {
        console.warn(`⚠️ Article ${articleId} non trouvé, skip stock update`);
        return;
      }

      const newStock = operation === 'subtract' 
        ? article.quantite_stock - quantite 
        : article.quantite_stock + quantite;

      if (newStock < 0) {
        throw new Error(`Stock insuffisant pour l'article ${article.code_article}`);
      }

      await apiPut(`/articles/${articleId}`, {
        quantite_stock: newStock
      });

      console.log(`✅ Stock mis à jour pour ${article.code_article}: ${newStock}`);
    } catch (err) {
      console.error('❌ Erreur mise à jour stock:', err);
      throw err;
    }
  };

  const updateStockForPanier = async (panierItems: any[]) => {
    for (const item of panierItems) {
      if (item.type_produit === 'article' && item.produitId && item.produitId > 0) {
        try {
          await updateStock(item.produitId, item.quantite, 'subtract');
        } catch (err) {
          console.warn(`⚠️ Impossible de mettre à jour le stock pour l'article ${item.produitId}:`, err);
        }
      }
    }
  };

  return { updateStock, updateStockForPanier, loading };
};