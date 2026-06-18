-- ============================================
-- SUPPRIMER LES ANCIENNES TABLES (optionnel)
-- ============================================
DROP TABLE IF EXISTS vente_details CASCADE;
DROP TABLE IF EXISTS ventes CASCADE;
DROP TABLE IF EXISTS paiements_ventes CASCADE;
DROP TABLE IF EXISTS rendezvous_commandes CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS modeles_tenues CASCADE;
DROP TABLE IF EXISTS tailles CASCADE;
DROP TABLE IF EXISTS couleurs CASCADE;
DROP TABLE IF EXISTS textures CASCADE;
DROP TABLE IF EXISTS matieres CASCADE;
DROP TABLE IF EXISTS categories_matieres CASCADE;
DROP TABLE IF EXISTS types_prestations CASCADE;
DROP TABLE IF EXISTS prestations_realisees CASCADE;
DROP TABLE IF EXISTS paiements_salaires CASCADE;
DROP TABLE IF EXISTS employes CASCADE;
DROP TABLE IF EXISTS emprunts CASCADE;
DROP TABLE IF EXISTS depenses CASCADE;
DROP TABLE IF EXISTS journal_modifications CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;
DROP TABLE IF EXISTS mesures_clients CASCADE;
DROP TABLE IF EXISTS types_mesures CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS atelier CASCADE;

-- ============================================
-- TABLE: atelier
-- ============================================
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

-- ============================================
-- TABLE: clients
-- ============================================
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

-- ============================================
-- TABLE: types_mesures
-- ============================================
CREATE TABLE IF NOT EXISTS types_mesures (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) UNIQUE NOT NULL,
    unite VARCHAR(50) DEFAULT 'cm',
    ordre_affichage INTEGER DEFAULT 1,
    est_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: mesures_clients
-- ============================================
CREATE TABLE IF NOT EXISTS mesures_clients (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    type_mesure_id INTEGER REFERENCES types_mesures(id),
    valeur NUMERIC(10,2),
    date_mesure TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: modeles_tenues
-- ============================================
CREATE TABLE IF NOT EXISTS modeles_tenues (
    id SERIAL PRIMARY KEY,
    code_type VARCHAR(50) UNIQUE NOT NULL,
    designation TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    categorie VARCHAR(30) NOT NULL,
    est_actif INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: tailles
-- ============================================
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

-- ============================================
-- TABLE: couleurs
-- ============================================
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

-- ============================================
-- TABLE: textures
-- ============================================
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

-- ============================================
-- TABLE: categories_matieres
-- ============================================
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

-- ============================================
-- TABLE: matieres
-- ============================================
CREATE TABLE IF NOT EXISTS matieres (
    id SERIAL PRIMARY KEY,
    code_matiere VARCHAR(50) UNIQUE NOT NULL,
    designation VARCHAR(255) NOT NULL,
    categorie_id INTEGER REFERENCES categories_matieres(id),
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

-- ============================================
-- TABLE: articles
-- ============================================
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

-- ============================================
-- TABLE: types_prestations
-- ============================================
CREATE TABLE IF NOT EXISTS types_prestations (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) UNIQUE NOT NULL,
    prix_par_defaut NUMERIC(12,2) DEFAULT 0,
    est_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: ventes
-- ============================================
CREATE TABLE IF NOT EXISTS ventes (
    id SERIAL PRIMARY KEY,
    code_vente VARCHAR(100) UNIQUE NOT NULL,
    type_vente VARCHAR(50) NOT NULL CHECK (type_vente IN ('commande', 'pret_a_porter', 'matiere')),
    date_vente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_id INTEGER REFERENCES clients(id),
    client_nom TEXT,
    mode_paiement VARCHAR(100),
    montant_total NUMERIC(12,2) DEFAULT 0,
    montant_regle NUMERIC(12,2) DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE',
    observation TEXT,
    est_supprime INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: vente_details
-- ============================================
CREATE TABLE IF NOT EXISTS vente_details (
    id SERIAL PRIMARY KEY,
    vente_id INTEGER REFERENCES ventes(id) ON DELETE CASCADE,
    matiere_id INTEGER REFERENCES matieres(id),
    article_id INTEGER REFERENCES articles(id),
    designation TEXT NOT NULL,
    quantite NUMERIC(12,2) NOT NULL,
    prix_unitaire NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    taille_libelle TEXT
);

-- ============================================
-- TABLE: paiements_ventes
-- ============================================
CREATE TABLE IF NOT EXISTS paiements_ventes (
    id SERIAL PRIMARY KEY,
    vente_id INTEGER REFERENCES ventes(id) ON DELETE CASCADE,
    montant NUMERIC(12,2) DEFAULT 0,
    mode_paiement VARCHAR(100),
    observation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: rendezvous_commandes
-- ============================================
CREATE TABLE IF NOT EXISTS rendezvous_commandes (
    id SERIAL PRIMARY KEY,
    vente_id INTEGER REFERENCES ventes(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id),
    date_rendezvous TIMESTAMP NOT NULL,
    heure_rendezvous VARCHAR(50),
    type_rendezvous VARCHAR(50) DEFAULT 'essayage',
    statut VARCHAR(50) DEFAULT 'planifie',
    observation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    login VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    role VARCHAR(100) DEFAULT 'couturier',
    est_actif INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: permissions
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    module VARCHAR(255) NOT NULL,
    peut_voir INTEGER DEFAULT 0,
    peut_creer INTEGER DEFAULT 0,
    peut_modifier INTEGER DEFAULT 0,
    peut_supprimer INTEGER DEFAULT 0
);

-- ============================================
-- TABLE: journal_modifications
-- ============================================
CREATE TABLE IF NOT EXISTS journal_modifications (
    id SERIAL PRIMARY KEY,
    utilisateur TEXT,
    action TEXT NOT NULL,
    table_concernee TEXT NOT NULL,
    id_enregistrement TEXT,
    details TEXT,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: depenses (avec responsable)
-- ============================================
CREATE TABLE IF NOT EXISTS depenses (
    id SERIAL PRIMARY KEY,
    designation TEXT NOT NULL,
    categorie VARCHAR(255),
    montant NUMERIC(12,2) DEFAULT 0,
    mode_paiement VARCHAR(100),
    responsable VARCHAR(255) NOT NULL,
    observation TEXT,
    date_depense TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_supprime INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer un index pour les recherches par responsable
CREATE INDEX IF NOT EXISTS idx_depenses_responsable ON depenses(responsable);

-- Créer un index pour les recherches par date
CREATE INDEX IF NOT EXISTS idx_depenses_date ON depenses(date_depense);

-- Créer un index pour les recherches par catégorie
CREATE INDEX IF NOT EXISTS idx_depenses_categorie ON depenses(categorie);

-- ============================================
-- TABLE: employes
-- ============================================
CREATE TABLE IF NOT EXISTS employes (
    id SERIAL PRIMARY KEY,
    nom_prenom TEXT NOT NULL,
    telephone TEXT,
    type_remuneration TEXT,
    salaire_base NUMERIC(12,2) DEFAULT 0,
    est_actif INTEGER DEFAULT 1,
    est_supprime INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: paiements_salaires
-- ============================================
CREATE TABLE IF NOT EXISTS paiements_salaires (
    id SERIAL PRIMARY KEY,
    employe_id INTEGER REFERENCES employes(id) ON DELETE CASCADE,
    montant_brut NUMERIC(12,2),
    retenue NUMERIC(12,2),
    montant_net NUMERIC(12,2),
    periode_mois INTEGER,
    periode_annee INTEGER,
    avantages NUMERIC(12,2) DEFAULT 0,
    charges_sociales NUMERIC(12,2) DEFAULT 0,
    est_supprime INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: prestations_realisees
-- ============================================
CREATE TABLE IF NOT EXISTS prestations_realisees (
    id SERIAL PRIMARY KEY,
    employe_id INTEGER REFERENCES employes(id) ON DELETE CASCADE,
    designation TEXT NOT NULL,
    valeur NUMERIC(12,2) DEFAULT 0,
    nombre INTEGER DEFAULT 1,
    total NUMERIC(12,2) DEFAULT 0,
    date_prestation DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: emprunts
-- ============================================
CREATE TABLE IF NOT EXISTS emprunts (
    id SERIAL PRIMARY KEY,
    employe_id INTEGER REFERENCES employes(id) ON DELETE CASCADE,
    montant NUMERIC(12,2) DEFAULT 0,
    date_emprunt DATE DEFAULT CURRENT_DATE,
    deduit INTEGER DEFAULT 0,
    salaire_id INTEGER,
    date_deduction DATE
);

-- ============================================
-- TABLE: mouvements_stock
-- ============================================
CREATE TABLE IF NOT EXISTS mouvements_stock (
    id SERIAL PRIMARY KEY,
    type_mouvement VARCHAR(50) NOT NULL,
    code_mouvement VARCHAR(100),
    designation VARCHAR(255),
    quantite NUMERIC(12,2) DEFAULT 0,
    cout_unitaire NUMERIC(12,2) DEFAULT 0,
    date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motif TEXT,
    observation TEXT,
    reference_id INTEGER,
    reference_type VARCHAR(50),
    created_by INTEGER,
    est_supprime INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DONNÉES INITIALES
-- ============================================
INSERT INTO utilisateurs (nom, login, mot_de_passe, role)
SELECT 'Administrateur', 'admin', 'admin123', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE login = 'admin');

INSERT INTO atelier (nom_atelier, devise, message_facture_defaut)
SELECT 'Mon Atelier de Couture', 'XOF', 'Merci de votre confiance'
WHERE NOT EXISTS (SELECT 1 FROM atelier);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ventes_client ON ventes(client_id);
CREATE INDEX IF NOT EXISTS idx_vente_details_vente ON vente_details(vente_id);
CREATE INDEX IF NOT EXISTS idx_paiements_vente ON paiements_ventes(vente_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_rendezvous_vente ON rendezvous_commandes(vente_id);
CREATE INDEX IF NOT EXISTS idx_articles_code ON articles(code_article);
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements_stock(date_mouvement);