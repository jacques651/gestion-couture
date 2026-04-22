import { getDb } from '../database/db';

export interface SalaireDetail {
  brut: number;
  retenues: number;
  net: number;
  dejaPaye: number;
  resteAPayer: number;
}

// 🔹 CALCUL SALAIRE
export const calculerSalaireEmploye = async (employeId: number): Promise<SalaireDetail> => {
  const db = await getDb();

  // 🔸 BRUT = prestations_realisees
  const brutRes = await db.select<{ total: number }[]>(
    `SELECT COALESCE(SUM(total), 0) as total
     FROM prestations_realisees
     WHERE employe_id = ?`,
    [employeId]
  );

  const brut = brutRes[0]?.total || 0;

  // 🔸 RETENUES = emprunts NON déduits
  const retenueRes = await db.select<{ total: number }[]>(
    `SELECT COALESCE(SUM(montant), 0) as total
     FROM emprunts
     WHERE employe_id = ? AND deduit = 0`,
    [employeId]
  );

  const retenues = retenueRes[0]?.total || 0;

  // 🔸 NET
  const net = brut - retenues;

  // 🔸 DÉJÀ PAYÉ = paiements_salaires
  const payeRes = await db.select<{ total: number }[]>(
    `SELECT COALESCE(SUM(montant), 0) as total
     FROM paiements_salaires
     WHERE employe_id = ?`,
    [employeId]
  );

  const dejaPaye = payeRes[0]?.total || 0;

  // 🔸 RESTE
  const resteAPayer = net - dejaPaye;

  return {
    brut,
    retenues,
    net,
    dejaPaye,
    resteAPayer
  };
};

// 🔹 PAIEMENT
export const payerSalaire = async (
  employeId: number,
  montant: number,
  mode: string,
  observation: string
) => {
  const db = await getDb();

  const salaire = await calculerSalaireEmploye(employeId);

  if (montant <= 0) {
    throw new Error("Montant invalide");
  }

  if (montant > salaire.resteAPayer) {
    throw new Error("Montant supérieur au reste à payer");
  }

  // 🔸 INSERT paiement
  await db.execute(
    `INSERT INTO paiements_salaires (employe_id, montant, mode, observation)
     VALUES (?, ?, ?, ?)`,
    [employeId, montant, mode, observation]
  );

  // 🔸 Marquer emprunts comme déduits
  await db.execute(
    `UPDATE emprunts 
     SET deduit = 1, date_deduction = CURRENT_TIMESTAMP
     WHERE employe_id = ? AND deduit = 0`,
    [employeId]
  );
};