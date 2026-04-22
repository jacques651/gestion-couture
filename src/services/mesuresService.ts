import { getDb } from "../database/db";

export const getMesuresClient = async (clientId: string) => {
  const db = await getDb();

  return await db.select<any>(
    `SELECT 
        mc.id,
        mc.valeur,
        tm.nom,
        tm.unite
     FROM mesures_clients mc
     JOIN types_mesures tm ON tm.id = mc.type_mesure_id
     WHERE mc.client_id = ?`,
    [clientId]
  );
};