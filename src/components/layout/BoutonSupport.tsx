import React, { useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { info, error as logError } from '@tauri-apps/plugin-log';
import { Download } from 'lucide-react';

const BoutonSupport: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const exporterPourSupport = async () => {
    try {
      setLoading(true);

      // 📁 Choix du fichier destination
      const cheminDestination = await save({
        title: "Exporter la base pour le support technique",
        filters: [{ name: 'Base de données', extensions: ['db'] }],
        defaultPath: 'SAV_Gestion_Couture.db'
      });

      if (!cheminDestination) {
        setLoading(false);
        return;
      }

      // 📥 Lire la base locale (Tauri v2 → baseDir)
      const data = await readFile('gestion-couture.db', {
        baseDir: BaseDirectory.AppData
      });

      // 📤 Écrire vers le fichier choisi
      await writeFile(cheminDestination, data);

      await info("Base exportée avec succès");

      alert("✅ Export réussi ! Envoyez le fichier au support.");

    } catch (err: any) {
      console.error(err);
      await logError(`Erreur export support : ${err?.message || err}`);

      alert("❌ Erreur lors de l’exportation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={exporterPourSupport}
      disabled={loading}
      className="flex items-center gap-3 px-4 py-2 text-sm text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50 w-full"
      title="Exporter la base de données pour le support"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Download size={18} />
      )}

      <span>{loading ? "Export en cours..." : "Export support"}</span>
    </button>
  );
};

export default BoutonSupport;