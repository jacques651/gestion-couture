// src/hooks/useFinance.ts (VERSION ADAPTÉE À LA NOUVELLE ARCHITECTURE)
import { useEffect, useState } from "react";
import { getDb } from "../database/db";

export interface LigneJournal {
  date: string;
  description: string;
  entree: number;
  sortie: number;
  solde: number;
}

export interface FinanceStats {
  ventes: number;
  chiffreAffaires: number;
  encaissements: number;
  depenses: number;
  salaires: number;
  depensesGlobales: number;
  beneficeComptable: number;
  beneficeTresorerie: number;
  resteARecouvrer: number;
  tauxRecouvrement: number;
}

export const useFinance = () => {
  const [stats, setStats] = useState<FinanceStats>({
    ventes: 0,
    chiffreAffaires: 0,
    encaissements: 0,
    depenses: 0,
    salaires: 0,
    depensesGlobales: 0,
    beneficeComptable: 0,
    beneficeTresorerie: 0,
    resteARecouvrer: 0,
    tauxRecouvrement: 0
  });

  const [journal, setJournal] = useState<LigneJournal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const db = await getDb();

    try {
      // ================= REQUÊTES ADAPTÉES =================
      // Ventes (table unique)
      const ventes = await db.select<any[]>(`SELECT * FROM ventes ORDER BY date_vente`);

      // Dépenses
      const depenses = await db.select<any[]>(`SELECT * FROM depenses ORDER BY date_depense`);

      // Salaires
      const salaires = await db.select<any[]>(`
        SELECT s.*, e.nom_prenom as employe_nom
        FROM salaires s
        LEFT JOIN employes e ON s.employe_id = e.id
        ORDER BY s.date_paiement
      `);

      // ================= JOURNAL DE CAISSE =================
      const mouvements: LigneJournal[] = [
        // Entrées (ventes)
        ...ventes.map(v => ({
          date: v.date_vente,
          description: `Vente - ${v.designation || 'Article'}${v.taille ? ` (${v.taille})` : ''}`,
          entree: v.total || 0,
          sortie: 0,
          solde: 0
        })),
        // Paiements complémentaires (si montant_regle > 0)
        ...ventes.filter(v => v.montant_regle > 0).map(v => ({
          date: v.date_vente,
          description: `Paiement - ${v.client_nom || 'Client'}`,
          entree: v.montant_regle || 0,
          sortie: 0,
          solde: 0
        })),
        // Sorties (dépenses)
        ...depenses.map(d => ({
          date: d.date_depense,
          description: `Dépense - ${d.designation || 'Divers'}`,
          entree: 0,
          sortie: d.montant || 0,
          solde: 0
        })),
        // Sorties (salaires)
        ...salaires.map(s => ({
          date: s.date_paiement,
          description: `Salaire - ${s.employe_nom || 'Employé'}`,
          entree: 0,
          sortie: s.montant_net || 0,
          solde: 0
        }))
      ];

      // Trier par date
      mouvements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculer le solde cumulé
      let cumul = 0;
      const journalFinal = mouvements.map(m => {
        cumul += m.entree - m.sortie;
        return { ...m, solde: cumul };
      });
      setJournal(journalFinal);

      // ================= STATISTIQUES =================
      // Chiffre d'affaires (total des ventes)
      const ca = ventes.reduce((sum, v) => sum + (v.total || 0), 0);
      
      // Encaissements (montants réglés)
      const encaissements = ventes.reduce((sum, v) => sum + (v.montant_regle || 0), 0);
      
      // Total dépenses
      const totalDepenses = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);
      
      // Total salaires
      const totalSalaires = salaires.reduce((sum, s) => sum + (s.montant_net || 0), 0);
      
      // Dépenses globales
      const depensesGlobales = totalDepenses + totalSalaires;
      
      // Reste à recouvrer
      const reste = ca - encaissements;
      
      // Taux de recouvrement
      const taux = ca > 0 ? (encaissements / ca) * 100 : 0;

      setStats({
        ventes: ventes.length,
        chiffreAffaires: ca,
        encaissements,
        depenses: totalDepenses,
        salaires: totalSalaires,
        depensesGlobales,
        beneficeComptable: ca - depensesGlobales,
        beneficeTresorerie: encaissements - depensesGlobales,
        resteARecouvrer: reste,
        tauxRecouvrement: taux
      });

    } catch (error) {
      console.error("❌ ERREUR FINANCE:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { stats, journal, loading, refresh: fetchAll };
};