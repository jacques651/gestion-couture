export interface ModeleTenue {

  id: number;

  designation: string;

  description?: string;

  code_modele?: string;

  image_url?: string;

  categorie:
    | 'femme'
    | 'homme'
    | 'enfant'
    | 'accessoire';

  est_actif: number;

  created_at?: string;
}