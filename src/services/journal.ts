import { getDb } from "../database/db";
import {
  getUtilisateurConnecte
} from './session';

interface JournalParams {
  utilisateur: string;

  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'PRINT'
    | 'EXPORT'
    | 'IMPORT';

  table: string;

  idEnregistrement?: string | number;

  details: string;
}

export async function journaliserAction({
  utilisateur,
  action,
  table,
  idEnregistrement = '',
  details
}: JournalParams) {

  try {

    const db = await getDb();

    await db.execute(
      `
      INSERT INTO journal_modifications (
        utilisateur,
        action,
        table_concernee,
        id_enregistrement,
        details
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        getUtilisateurConnecte()?.nom
          || utilisateur,

        action,

        table,

        String(idEnregistrement),

        details
      ]
    );

  } catch (error) {

    console.error(
      "Erreur journalisation:",
      error
    );

  }
}