import { selectSafe } from "../database/db";

export const getFinanceStats = async () => {
  const ventes = await selectSafe<{ total: number }>(
    "SELECT COALESCE(SUM(total),0) as total FROM ventes"
  );

  const commandes = await selectSafe<{ total: number }>(
    "SELECT COALESCE(SUM(nombre * prix_unitaire),0) as total FROM commandes"
  );

  const paiements = await selectSafe<{ total: number }>(
    "SELECT COALESCE(SUM(montant),0) as total FROM paiements_commandes"
  );

  const depenses = await selectSafe<{ total: number }>(
    "SELECT COALESCE(SUM(montant),0) as total FROM depenses"
  );

  const ca = (ventes[0]?.total || 0) + (commandes[0]?.total || 0);
  const dep = depenses[0]?.total || 0;

  return {
    chiffreAffaires: ca,
    paiements: paiements[0]?.total || 0,
    depenses: dep,
    benefice: ca - dep
  };
};

export const getJournal = async () => {
  const paiements = await selectSafe<any>(
    "SELECT date_paiement as date, montant, observation FROM paiements_commandes"
  );

  const ventes = await selectSafe<any>(
    "SELECT date_vente as date, total as montant, designation FROM ventes"
  );

  const depenses = await selectSafe<any>(
    "SELECT date_depense as date, montant, designation FROM depenses"
  );

  let transactions: any[] = [];

  paiements.forEach(p => {
    transactions.push({
      date: p.date,
      montant: p.montant,
      type: 'entree',
      description: p.observation || 'Paiement'
    });
  });

  ventes.forEach(v => {
    transactions.push({
      date: v.date,
      montant: v.montant,
      type: 'entree',
      description: v.designation
    });
  });

  depenses.forEach(d => {
    transactions.push({
      date: d.date,
      montant: d.montant,
      type: 'sortie',
      description: d.designation
    });
  });

  transactions.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let solde = 0;

  return transactions.map(t => {
    const entree = t.type === 'entree' ? t.montant : 0;
    const sortie = t.type === 'sortie' ? t.montant : 0;

    solde += entree - sortie;

    return {
      ...t,
      entree,
      sortie,
      solde
    };
  });
};