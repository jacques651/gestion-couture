// src/hooks/useFinance.ts (VERSION ADAPTÉE À LA NOUVELLE ARCHITECTURE)
import { useEffect, useState } from "react";
import {

  apiGet

} from "../services/api";

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

  const fetchAll =
async () => {

  setLoading(true);

  try {

    /**
     * =========================
     * VENTES
     * =========================
     */
    const ventes =
      await apiGet(
        "/ventes"
      );

    /**
     * =========================
     * DEPENSES
     * =========================
     */
    const depenses =
      await apiGet(
        "/depenses"
      );

    /**
     * =========================
     * SALAIRES
     * =========================
     */
    const salaires =
      await apiGet(
        "/salaires/historique"
      );

    /**
     * =========================
     * JOURNAL
     * =========================
     */
    const mouvements: LigneJournal[] = [

      /**
       * VENTES
       */
      ...(ventes || []).map(

        (v: any) => ({

          date:
            v.date_vente,

          description:

            `Vente - ${
              v.designation
              ||
              v.code_vente
              ||
              'Article'
            }`,

          entree:

            Number(
              v.montant_regle || 0
            ),

          sortie:
            0,

          solde:
            0
        })
      ),

      /**
       * DEPENSES
       */
      ...(depenses || []).map(

        (d: any) => ({

          date:
            d.date_depense,

          description:

            `Dépense - ${
              d.designation
              ||
              'Divers'
            }`,

          entree:
            0,

          sortie:

            Number(
              d.montant || 0
            ),

          solde:
            0
        })
      ),

      /**
       * SALAIRES
       */
      ...(salaires || []).map(

        (s: any) => ({

          date:
            s.date_paiement,

          description:

            `Salaire - ${
              s.employe_nom
              ||
              'Employé'
            }`,

          entree:
            0,

          sortie:

            Number(
              s.montant_net || 0
            ),

          solde:
            0
        })
      )
    ];

    /**
     * =========================
     * TRI
     * =========================
     */
    mouvements.sort(

      (a, b) =>

        new Date(a.date)
          .getTime()

        -

        new Date(b.date)
          .getTime()
    );

    /**
     * =========================
     * SOLDE CUMULÉ
     * =========================
     */
    let cumul = 0;

    const journalFinal =

      mouvements.map(m => {

        cumul +=
          m.entree - m.sortie;

        return {

          ...m,

          solde:
            cumul
        };
      });

    setJournal(
      journalFinal
    );

    /**
     * =========================
     * STATS
     * =========================
     */
    const chiffreAffaires =

      (ventes || []).reduce(

        (sum: number, v: any) =>

          sum +

          Number(
            v.montant_total || 0
          ),

        0
      );

    const encaissements =

      (ventes || []).reduce(

        (sum: number, v: any) =>

          sum +

          Number(
            v.montant_regle || 0
          ),

        0
      );

    const totalDepenses =

      (depenses || []).reduce(

        (sum: number, d: any) =>

          sum +

          Number(
            d.montant || 0
          ),

        0
      );

    const totalSalaires =

      (salaires || []).reduce(

        (sum: number, s: any) =>

          sum +

          Number(
            s.montant_net || 0
          ),

        0
      );

    const depensesGlobales =

      totalDepenses
      +
      totalSalaires;

    const resteARecouvrer =

      chiffreAffaires
      -
      encaissements;

    const tauxRecouvrement =

      chiffreAffaires > 0

        ? (
            encaissements
            /
            chiffreAffaires
          ) * 100

        : 0;

    setStats({

      ventes:
        ventes?.length || 0,

      chiffreAffaires,

      encaissements,

      depenses:
        totalDepenses,

      salaires:
        totalSalaires,

      depensesGlobales,

      beneficeComptable:

        chiffreAffaires
        -
        depensesGlobales,

      beneficeTresorerie:

        encaissements
        -
        depensesGlobales,

      resteARecouvrer,

      tauxRecouvrement
    });

  } catch (error) {

    console.error(

      "❌ ERREUR FINANCE:",

      error
    );

  } finally {

    setLoading(false);
  }
};
  useEffect(() => {
    fetchAll();
  }, []);

  return { stats, journal, loading, refresh: fetchAll };
};