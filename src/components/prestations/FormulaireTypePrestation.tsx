import React, { useState } from 'react';
import { getDb } from '../../database/db';
import { Layers, Save, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

// ======================
// TYPES
// ======================
interface TypePrestation {
  id?: number;
  nom: string;
  valeur_par_defaut: number;
}

interface Props {
  type?: TypePrestation;
  onSuccess: () => void;
  onCancel: () => void;
}

// ======================
// COMPONENT
// ======================
const FormulaireTypePrestation: React.FC<Props> = ({ type, onSuccess, onCancel }) => {

  const [nom, setNom] = useState(type?.nom || '');
  const [valeur, setValeur] = useState(
    type?.valeur_par_defaut !== undefined
      ? type.valeur_par_defaut.toString()
      : '0'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ======================
  // SUBMIT
  // ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!nom.trim()) {
      return setError("Le nom est obligatoire");
    }

    const v = parseFloat(valeur);
    if (isNaN(v)) {
      return setError("Valeur invalide");
    }

    setLoading(true);

    try {
      const db = await getDb();

      if (type?.id) {
        await db.execute(
          `UPDATE types_prestations 
           SET nom = ?, valeur_par_defaut = ?
           WHERE id = ?`,
          [nom.trim(), v, type.id]
        );

        setSuccess("Type modifié avec succès");
      } else {
        await db.execute(
          `INSERT INTO types_prestations 
           (nom, valeur_par_defaut, est_active)
           VALUES (?, ?, 1)`,
          [nom.trim(), v]
        );

        setSuccess("Type ajouté avec succès");
      }

      setTimeout(() => {
        onSuccess();
      }, 800);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de l'opération");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // UI
  // ======================
  return (
    <div className="max-w-lg mx-auto py-6">

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-slate-100"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex h-10 w-10 rounded-full bg-blue-50 text-blue-600 items-center justify-center">
            <Layers size={20} />
          </div>

          <h1 className="text-xl font-semibold">
            {type ? 'Modifier type de prestation' : 'Nouveau type de prestation'}
          </h1>
        </div>

        {/* SUCCESS */}
        {success && (
          <div className="mx-6 mt-6 bg-emerald-50 p-4 rounded-lg flex items-center gap-3 text-emerald-700">
            <CheckCircle size={18} />
            <p>{success}</p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mx-6 mt-6 bg-red-50 p-4 rounded-lg flex items-center gap-3 text-red-600">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* NOM */}
          <div>
            <label htmlFor="nom" className="block text-xs font-medium mb-1">
              Nom *
            </label>
            <input
              id="nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="Ex: Couture, Broderie..."
              required
            />
          </div>

          {/* VALEUR */}
          <div>
            <label htmlFor="valeur" className="block text-xs font-medium mb-1">
              Valeur par défaut (FCFA)
            </label>
            <input
              id="valeur"
              type="number"
              step="0.01"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-4 border-t">

            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2"
            >
              {loading ? (
                "Enregistrement..."
              ) : (
                <>
                  <Save size={16} />
                  {type ? 'Mettre à jour' : 'Enregistrer'}
                </>
              )}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default FormulaireTypePrestation;