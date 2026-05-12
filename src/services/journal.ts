// src/services/journal.ts
import { apiPost } from "./api";
import { getUtilisateurConnecte } from "./session";

interface JournalParams {
  utilisateur?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PRINT' | 'EXPORT' | 'IMPORT';
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
  try {
    // Récupérer l'utilisateur connecté
    const utilisateurConnecte = getUtilisateurConnecte();
    const nomUtilisateur = utilisateurConnecte?.nom || utilisateur || 'Utilisateur';
    
    console.log(`📝 Journalisation: ${action} sur ${table} par ${nomUtilisateur}`);
    
    await apiPost("/journal", {
      utilisateur: nomUtilisateur,
      action: action,
      table_concernee: table,
      id_enregistrement: String(idEnregistrement),
      details: details
    });
    
    console.log(`✅ Action ${action} journalisée avec succès`);
  } catch (error) {
    console.error("Erreur journalisation:", error);
    // Ne pas bloquer l'application si la journalisation échoue
  }
}