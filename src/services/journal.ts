import {

  apiPost

} from "./api";

import {

  getUtilisateurConnecte

} from "./session";

interface JournalParams {

  utilisateur?: string;

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

/**
 * =========================
 * JOURNALISATION
 * =========================
 */
export async function journaliserAction({

  utilisateur,

  action,

  table,

  idEnregistrement = '',

  details

}: JournalParams) {

  /**
   * LES ACTIONS CRUD
   * SONT MAINTENANT GÉRÉES
   * PAR LES TRIGGERS POSTGRESQL
   */
  if (

    action === 'CREATE'
    ||
    action === 'UPDATE'
    ||
    action === 'DELETE'

  ) {

    return;
  }

  try {

    await apiPost(

      "/journal",

      {

        utilisateur:

          getUtilisateurConnecte()?.nom
          ||
          utilisateur
          ||
          'Utilisateur',

        action,

        table_concernee:
          table,

        id_enregistrement:
          String(
            idEnregistrement
          ),

        details
      }
    );

  } catch (error) {

    console.error(

      "Erreur journalisation:",

      error
    );
  }
}