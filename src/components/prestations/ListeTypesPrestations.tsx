import React, { useEffect, useState } from 'react';
import { getDb } from '../../database/db';
import { Layers, Plus, Edit2, Trash2, Search } from 'lucide-react';
import FormulaireTypePrestation from './FormulaireTypePrestation';

interface TypePrestation {
  id: number;
  nom: string;
  valeur_par_defaut: number;
  est_active: number;
}

const ListeTypesPrestations: React.FC = () => {
  const [types, setTypes] = useState<TypePrestation[]>([]);
  const [recherche, setRecherche] = useState('');
  const [vueForm, setVueForm] = useState(false);
  const [typeEdition, setTypeEdition] = useState<TypePrestation | null>(null);

  const chargerTypes = async () => {
    const db = await getDb();
    // Correction : On passe le type de l'élément seul, pas du tableau
    const result = await db.select<TypePrestation[]>(`
  SELECT id, nom, valeur_par_defaut, est_active
  FROM types_prestations
  WHERE est_active = 1
  ORDER BY nom
`);

    setTypes(result || []);
    setTypes(result as unknown as TypePrestation[]);
    // Note: Si ton wrapper est strict, utilise : setTypes(result); 
    // après avoir corrigé le <TypePrestation> ci-dessus.
  };

  useEffect(() => { chargerTypes(); }, []);

  const supprimerType = async (id: number) => {
    if (!window.confirm('Supprimer ce type de prestation ?')) return;
    const db = await getDb();
    await db.execute("UPDATE types_prestations SET est_active = 0 WHERE id = ?", [id]);
    chargerTypes();
  };

  const typesFiltres = types.filter(t => t.nom.toLowerCase().includes(recherche.toLowerCase()));

  if (vueForm) {
    return (
      <FormulaireTypePrestation
        type={typeEdition || undefined}
        onSuccess={() => { setVueForm(false); setTypeEdition(null); chargerTypes(); }}
        onCancel={() => { setVueForm(false); setTypeEdition(null); }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers size={24} className="text-blue-600" /> Types de prestations
          </h2>
          <p className="text-slate-500 text-sm">{typesFiltres.length} type(s)</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-2 border rounded-xl text-sm"
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
            />
          </div>
          <button onClick={() => setVueForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-1">
            <Plus size={16} /> Nouveau type
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Valeur par défaut (FCFA)</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {typesFiltres.map(t => (
              <tr key={t.id} className="border-b hover:bg-slate-50">
                <td className="p-3 font-medium">{t.nom}</td>
                <td className="p-3">{t.valeur_par_defaut.toLocaleString()} FCFA</td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    {/* Correction Accessibilité : ajout aria-label */}
                    <button
                      onClick={() => { setTypeEdition(t); setVueForm(true); }}
                      className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                      aria-label={`Modifier ${t.nom}`}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => supprimerType(t.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      aria-label={`Supprimer ${t.nom}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListeTypesPrestations;
