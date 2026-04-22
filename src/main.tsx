import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { getDb } from "./database/db";

function Root() {
  const [pret, setPret] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialisation de la base de données
        const db = await getDb();
        console.log("✅ Base de données prête");
        
        // Création admin si inexistant
        await db.execute(`
          INSERT OR IGNORE INTO utilisateurs 
          (nom, login, mot_de_passe_hash, role, est_actif)
          VALUES (?, ?, ?, ?, 1)
        `, [
          'Administrateur',
          'admin',
          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'password'
          'admin'
        ]);

        console.log("✅ Admin créé (si inexistant)");
        setPret(true);
      } catch (err) {
        console.error("❌ Erreur initialisation:", err);
      }
    };

    init();
  }, []);

  if (!pret) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">
            Initialisation de GestionCouture...
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Chargement de la base de données
          </p>
        </div>
      </div>
    );
  }

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Root />
);