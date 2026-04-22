// useFinance.ts (VERSION PRO OPTIMISÉE + JOURNAL)
import { useEffect, useState } from "react";
import { dbInterface, selectSafe } from "../database/db";

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

    try {
      // ================= REQUETES BRUTES =================
      const ventes = await dbInterface.select<any>(`SELECT * FROM ventes`);

      const paiements = await dbInterface.select<any>(`
        SELECT p.*, c.nom_prenom as client_nom
        FROM paiements_commandes p
        LEFT JOIN commandes cmd ON p.commande_id = cmd.id
        LEFT JOIN clients c ON cmd.client_id = c.telephone_id
      `);

      const depenses = await dbInterface.select<any>(`SELECT * FROM depenses`);

      const salaires = await dbInterface.select<any>(`
        SELECT s.*, e.nom_prenom as employe_nom
        FROM salaires s
        LEFT JOIN employes e ON s.employe_id = e.id
      `);

      // ================= JOURNAL =================
      const mouvements: LigneJournal[] = [
        ...ventes.map(v => ({
          date: v.date_vente,
          description: `Vente - ${v.designation || 'Article'}`,
          entree: v.total || 0,
          sortie: 0,
          solde: 0
        })),
        ...paiements.map(p => ({
          date: p.date_paiement,
          description: `Paiement - ${p.client_nom || 'Client'}`,
          entree: p.montant || 0,
          sortie: 0,
          solde: 0
        })),
        ...depenses.map(d => ({
          date: d.date_depense,
          description: `Dépense - ${d.designation || 'Divers'}`,
          entree: 0,
          sortie: d.montant || 0,
          solde: 0
        })),
        ...salaires.map(s => ({
          date: s.date_paiement,
          description: `Salaire - ${s.employe_nom || 'Employé'}`,
          entree: 0,
          sortie: s.montant_net || 0,
          solde: 0
        }))
      ];

      mouvements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let cumul = 0;
      const journalFinal = mouvements.map(m => {
        cumul += m.entree - m.sortie;
        return { ...m, solde: cumul };
      });

      setJournal(journalFinal);

      // ================= STATS OPTIMISÉES =================
      const commandesAgg = await selectSafe<{ total: number }>(
        `SELECT SUM(total) as total FROM commandes WHERE est_supprime = 0`
      );

      const ventesAgg = await selectSafe<{ total: number }>(
        `SELECT SUM(total) as total FROM ventes`
      );

      const paiementsAgg = await selectSafe<{ total: number }>(
        `SELECT SUM(montant) as total FROM paiements_commandes`
      );

      const depensesAgg = await selectSafe<{ total: number }>(
        `SELECT SUM(montant) as total FROM depenses`
      );

      const salairesAgg = await selectSafe<{ total: number }>(
        `SELECT SUM(montant_net) as total FROM salaires`
      );

      const ca = (commandesAgg[0]?.total || 0) + (ventesAgg[0]?.total || 0);
      const encaissements = (paiementsAgg[0]?.total || 0) + (ventesAgg[0]?.total || 0);

      const totalDepenses = depensesAgg[0]?.total || 0;
      const totalSalaires = salairesAgg[0]?.total || 0;
      const depensesGlobales = totalDepenses + totalSalaires;

      const reste = ca - encaissements;
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

    } catch (e) {
      console.error("❌ ERREUR FINANCE:", e);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { stats, journal, loading, refresh: fetchAll };
};
