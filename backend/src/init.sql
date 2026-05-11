CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    telephone_id VARCHAR(50) UNIQUE NOT NULL,
    nom_prenom TEXT NOT NULL,
    profil TEXT DEFAULT 'principal',
    adresse TEXT,
    email TEXT,
    date_enregistrement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observations TEXT,
    est_supprime INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS types_mesures (

    id SERIAL PRIMARY KEY,

    nom VARCHAR(255)
    UNIQUE NOT NULL,

    unite VARCHAR(50)
    DEFAULT 'cm',

    ordre_affichage INTEGER
    DEFAULT 1,

    est_active INTEGER
    DEFAULT 1,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mesures_clients (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  type_mesure_id INTEGER REFERENCES types_mesures(id),
  valeur NUMERIC(10,2),
  date_mesure TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS modeles_tenues (
    id SERIAL PRIMARY KEY,
    code_modele VARCHAR(50) UNIQUE NOT NULL,
    designation TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    categorie VARCHAR(30) NOT NULL,
    est_actif INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tailles (
    id SERIAL PRIMARY KEY,
    code_taille VARCHAR(20) UNIQUE NOT NULL,
    libelle TEXT NOT NULL,
    ordre INTEGER DEFAULT 0,
    categorie VARCHAR(20) DEFAULT 'universel',
    description TEXT,
    est_actif INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS couleurs (
    id SERIAL PRIMARY KEY,
    nom_couleur VARCHAR(100) UNIQUE NOT NULL,
    code_hex VARCHAR(20),
    code_rgb VARCHAR(50),
    code_cmyk VARCHAR(50),
    description TEXT,
    est_actif INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS textures (
    id SERIAL PRIMARY KEY,
    nom_texture VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    densite VARCHAR(100),
    composition TEXT,
    est_actif INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,

    code_article VARCHAR(100) UNIQUE NOT NULL,

    modele_id INTEGER REFERENCES modeles_tenues(id),

    taille_id INTEGER REFERENCES tailles(id),

    couleur_id INTEGER REFERENCES couleurs(id),

    texture_id INTEGER REFERENCES textures(id),

    prix_achat NUMERIC(12,2),

    prix_vente NUMERIC(12,2) NOT NULL,

    quantite_stock INTEGER DEFAULT 0,

    seuil_alerte INTEGER DEFAULT 5,

    emplacement TEXT,

    code_barre TEXT,

    notes TEXT,

    est_disponible INTEGER DEFAULT 1,

    est_actif INTEGER DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories_matieres (
    id SERIAL PRIMARY KEY,

    code_categorie VARCHAR(50) UNIQUE NOT NULL,

    nom_categorie VARCHAR(150) UNIQUE NOT NULL,

    description TEXT,

    couleur_affichage VARCHAR(20),

    est_active INTEGER DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matieres (
    id SERIAL PRIMARY KEY,

    code_matiere VARCHAR(50) UNIQUE NOT NULL,

    designation VARCHAR(255) NOT NULL,

    categorie_id INTEGER
    REFERENCES categories_matieres(id),

    unite VARCHAR(50),

    prix_achat NUMERIC(12,2) DEFAULT 0,

    stock_actuel NUMERIC(12,2) DEFAULT 0,

    seuil_alerte NUMERIC(12,2) DEFAULT 0,

    reference_fournisseur VARCHAR(255),

    emplacement VARCHAR(255),

    est_supprime INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS atelier (
    id SERIAL PRIMARY KEY,

    nom_atelier VARCHAR(255),

    telephone VARCHAR(100),

    email VARCHAR(255),

    adresse TEXT,

    ville VARCHAR(255),

    pays VARCHAR(255),

    ifu VARCHAR(255),

    rccm VARCHAR(255),

    message_facture_defaut TEXT,

    logo_base64 TEXT,

    devise VARCHAR(20) DEFAULT 'XOF',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS types_prestations (

    id SERIAL PRIMARY KEY,

    nom VARCHAR(255)
    UNIQUE NOT NULL,

    prix_par_defaut NUMERIC(12,2)
    DEFAULT 0,

    est_active INTEGER
    DEFAULT 1,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventes (

    id SERIAL PRIMARY KEY,

    code_vente VARCHAR(100)
    UNIQUE NOT NULL,

    type_vente VARCHAR(50)
    NOT NULL
    CHECK (
      type_vente IN (
        'commande',
        'pret_a_porter',
        'matiere'
      )
    ),

    date_vente TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    client_id INTEGER
    REFERENCES clients(id),

    client_nom TEXT,

    mode_paiement VARCHAR(100),

    montant_total NUMERIC(12,2)
    DEFAULT 0,

    montant_regle NUMERIC(12,2)
    DEFAULT 0,

    statut VARCHAR(50)
    DEFAULT 'EN_ATTENTE',

    observation TEXT,

    est_supprime INTEGER
    DEFAULT 0,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS vente_details (

    id SERIAL PRIMARY KEY,

    vente_id INTEGER
    REFERENCES ventes(id)
    ON DELETE CASCADE,

    matiere_id INTEGER
    REFERENCES matieres(id),

    article_id INTEGER
    REFERENCES articles(id),

    designation TEXT NOT NULL,

    quantite NUMERIC(12,2)
    NOT NULL,

    prix_unitaire NUMERIC(12,2)
    NOT NULL,

    total NUMERIC(12,2)
    NOT NULL,

    taille_libelle TEXT
);

/**
 * =========================
 * UTILISATEURS
 * =========================
 */
CREATE TABLE IF NOT EXISTS utilisateurs (

    id SERIAL PRIMARY KEY,

    nom VARCHAR(255)
    NOT NULL,

    login VARCHAR(255)
    UNIQUE NOT NULL,

    mot_de_passe TEXT
    NOT NULL,

    role VARCHAR(100)
    DEFAULT 'couturier',

    est_actif INTEGER
    DEFAULT 1,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);

/**
 * =========================
 * PERMISSIONS
 * =========================
 */
CREATE TABLE IF NOT EXISTS permissions (

    id SERIAL PRIMARY KEY,

    utilisateur_id INTEGER
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE,

    module VARCHAR(255)
    NOT NULL,

    peut_voir INTEGER
    DEFAULT 0,

    peut_creer INTEGER
    DEFAULT 0,

    peut_modifier INTEGER
    DEFAULT 0,

    peut_supprimer INTEGER
    DEFAULT 0
);

/**
 * =====================================
 * JOURNAL MODIFICATIONS
 * =====================================
 */
CREATE TABLE IF NOT EXISTS journal_modifications (

    id SERIAL PRIMARY KEY,

    utilisateur TEXT,

    action TEXT NOT NULL,

    table_concernee TEXT NOT NULL,

    id_enregistrement TEXT,

    details TEXT,

    date_modification TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);
/**
 * =====================================
 * PAIEMENTS VENTES
 * =====================================
 */
CREATE TABLE IF NOT EXISTS paiements_ventes (

    id SERIAL PRIMARY KEY,

    vente_id INTEGER
    REFERENCES ventes(id)
    ON DELETE CASCADE,

    montant NUMERIC(12,2)
    DEFAULT 0,

    mode_paiement VARCHAR(100),

    observation TEXT,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);

/**
 * =====================================
 * DEPENSES
 * =====================================
 */
CREATE TABLE IF NOT EXISTS depenses (

    id SERIAL PRIMARY KEY,

    designation TEXT
    NOT NULL,

    categorie VARCHAR(255),

    montant NUMERIC(12,2)
    DEFAULT 0,

    mode_paiement VARCHAR(100),

    observation TEXT,

    date_depense TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);

/**
 * =====================================
 * RENDEZ-VOUS COMMANDES
 * =====================================
 */
CREATE TABLE IF NOT EXISTS rendezvous_commandes (

    id SERIAL PRIMARY KEY,

    vente_id INTEGER
    REFERENCES ventes(id)
    ON DELETE CASCADE,

    date_rendezvous TIMESTAMP
    NOT NULL,

    statut VARCHAR(50)
    DEFAULT 'EN_ATTENTE',

    observation TEXT,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);
/**
 * =====================================
 * INDEXES
 * =====================================
 */

CREATE INDEX IF NOT EXISTS idx_ventes_client
ON ventes(client_id);

CREATE INDEX IF NOT EXISTS idx_vente_details_vente
ON vente_details(vente_id);

CREATE INDEX IF NOT EXISTS idx_paiements_vente
ON paiements_ventes(vente_id);

CREATE INDEX IF NOT EXISTS idx_permissions_user
ON permissions(utilisateur_id);

CREATE INDEX IF NOT EXISTS idx_rendezvous_vente
ON rendezvous_commandes(vente_id);

CREATE TABLE IF NOT EXISTS employes (

    id SERIAL PRIMARY KEY,

    nom_prenom TEXT NOT NULL,

    telephone TEXT,

    type_remuneration TEXT,

    salaire_base NUMERIC(12,2) DEFAULT 0,

    est_actif INTEGER DEFAULT 1,

    est_supprime INTEGER DEFAULT 0,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paiements_salaires (

    id SERIAL PRIMARY KEY,

    employe_id INTEGER
    REFERENCES employes(id)
    ON DELETE CASCADE,

    montant_brut NUMERIC(12,2),

    retenue NUMERIC(12,2),

    montant_net NUMERIC(12,2),

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prestations_realisees (

    id SERIAL PRIMARY KEY,

    employe_id INTEGER
    REFERENCES employes(id)
    ON DELETE CASCADE,

    designation TEXT NOT NULL,

    valeur NUMERIC(12,2) DEFAULT 0,

    nombre INTEGER DEFAULT 1,

    total NUMERIC(12,2) DEFAULT 0,

    date_prestation DATE
    DEFAULT CURRENT_DATE,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS emprunts (

    id SERIAL PRIMARY KEY,

    employe_id INTEGER
    REFERENCES employes(id)
    ON DELETE CASCADE,

    montant NUMERIC(12,2)
    DEFAULT 0,

    date_emprunt DATE
    DEFAULT CURRENT_DATE,

    deduit INTEGER
    DEFAULT 0,

    salaire_id INTEGER,

    date_deduction DATE
);