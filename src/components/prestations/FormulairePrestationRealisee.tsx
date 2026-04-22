import React, { useEffect, useState } from 'react';
import { getDb } from '../../database/db';
import { ArrowLeft } from 'lucide-react';

interface Employe {
  id: number;
  nom_prenom: string;
}

interface TypePrestation {
  id: number;
  nom: string;
  valeur_par_defaut: number;
}

interface Props {
  prestation?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const FormulairePrestationRealisee: React.FC<Props> = ({ prestation, onSuccess, onCancel }) => {

  const [employeId, setEmployeId] = useState<number | ''>(prestation?.employe_id || '');
  const [typeId, setTypeId] = useState<number | ''>(prestation?.type_prestation_id || '');
  const [designation, setDesignation] = useState(prestation?.designation || '');
  const [valeur, setValeur] = useState<string>(prestation?.valeur?.toString() || '');
  const [nombre, setNombre] = useState<string>(prestation?.nombre?.toString() || '1');
  const [total, setTotal] = useState<number>(prestation?.total || 0);
  const [loading, setLoading] = useState(false);

  const [employes, setEmployes] = useState<Employe[]>([]);
  const [types, setTypes] = useState<TypePrestation[]>([]);

  // ================= LOAD =================
  useEffect(() => {
    const load = async () => {
      const db = await getDb();

      // 🔥 FILTRE CORRIGÉ
      const emp = await db.select<Employe[]>(`
        SELECT id, nom_prenom 
        FROM employes 
        WHERE est_actif = 1 
        AND type_remuneration = 'prestation'
      `);

      const tp = await db.select<TypePrestation[]>(`
        SELECT id, nom, valeur_par_defaut 
        FROM types_prestations 
        WHERE est_active = 1
      `);

      setEmployes(emp || []);
      setTypes(tp || []);
    };

    load();
  }, []);

  // ================= CALCUL =================
  useEffect(() => {
    const v = Number(valeur) || 0;
    const n = Number(nombre) || 1;
    setTotal(v * n);
  }, [valeur, nombre]);

  // ================= TYPE AUTO =================
  const handleTypeChange = (id: number) => {
    const t = types.find(x => x.id === id);
    if (t) {
      setDesignation(t.nom);
      setValeur(t.valeur_par_defaut.toString());
    } else {
      setDesignation('');
      setValeur('');
    }
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeId) return alert("Choisir un employé");
    if (!designation.trim()) return alert("Saisir une désignation");

    const v = Number(valeur);
    const n = Number(nombre);

    if (v <= 0) return alert("Valeur invalide");
    if (n <= 0) return alert("Quantité invalide");

    setLoading(true);

    try {
      const db = await getDb();

      if (prestation) {
        await db.execute(
          `UPDATE prestations_realisees 
           SET employe_id=?, type_prestation_id=?, designation=?, valeur=?, nombre=?, total=? 
           WHERE id=?`,
          [employeId, typeId || null, designation, v, n, v * n, prestation.id]
        );
      } else {
        await db.execute(
          `INSERT INTO prestations_realisees 
           (employe_id, type_prestation_id, designation, valeur, nombre, total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [employeId, typeId || null, designation, v, n, v * n]
        );
      }

      onSuccess();
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold">
            {prestation ? "✏️ Modifier prestation" : "➕ Nouvelle prestation"}
          </h2>
        </div>

        {/* ALERT SI VIDE */}
        {employes.length === 0 && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            Aucun employé en mode prestation disponible
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* EMPLOYE */}
          <div>
            <label className="text-sm text-gray-600">Employé *</label>
            <select
              value={employeId}
              onChange={(e) => setEmployeId(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              required
            >
              <option value="">-- Choisir --</option>
              {employes.map(e => (
                <option key={e.id} value={e.id}>{e.nom_prenom}</option>
              ))}
            </select>
          </div>

          {/* TYPE */}
          <div>
            <label className="text-sm text-gray-600">Type prestation</label>
            <select
              value={typeId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setTypeId(id);
                if (id) handleTypeChange(id);
              }}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            >
              <option value="">-- Optionnel --</option>
              {types.map(t => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
            </select>
          </div>

          {/* DESIGNATION */}
          <div>
            <label className="text-sm text-gray-600">Désignation *</label>
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              required
            />
          </div>

          {/* VALEUR + NOMBRE */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Valeur"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              className="border rounded-lg px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Quantité"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="border rounded-lg px-3 py-2"
              required
            />
          </div>

          {/* TOTAL */}
          <div className="bg-blue-50 p-3 rounded text-center">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold text-blue-700">
              {total.toLocaleString()} FCFA
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-1/2 bg-gray-200 py-2 rounded-lg"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-blue-600 text-white py-2 rounded-lg"
            >
              {loading ? "..." : "Enregistrer"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default FormulairePrestationRealisee;