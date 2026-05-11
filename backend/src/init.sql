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

