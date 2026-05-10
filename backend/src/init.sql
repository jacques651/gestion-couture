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
  nom TEXT NOT NULL,
  unite TEXT,
  ordre_affichage INTEGER DEFAULT 0,
  est_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS mesures_clients (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  type_mesure_id INTEGER REFERENCES types_mesures(id),
  valeur NUMERIC(10,2),
  date_mesure TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);