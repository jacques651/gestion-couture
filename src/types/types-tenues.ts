// types/types-tenues.ts
export interface TypeTenue {
  id: number;
  nom: string;
  designation?: string; // optionnel, alias de nom
  description?: string;
  code_type?: string;
  image_url?: string;
  categorie: 'femme' | 'homme' | 'enfant' | 'accessoire';
  est_actif: number;
  created_at?: string;
  updated_at?: string;
}

// Pour la rétrocompatibilité
export type ModeleTenue = TypeTenue;