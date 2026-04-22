// src/components/tenues/FormulaireSortieTenue.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Truck } from 'lucide-react';
import { getDb } from '../../database/db';

interface SortieTenue {
  id?: number;
  tenue_id: number;
  commande_id?: number | null;
  date_sortie: string;
  quantite: number;
  observation?: string;
}

interface Tenue {
  id: number;
  designation: string;
}

interface Commande {
  id: number;
  designation: string;
  client_nom: string;
}

const FormulaireSortieTenue: React.FC<{
  sortieEdition?: SortieTenue | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ sortieEdition, onClose, onSuccess }) => {
  const [tenues, setTenues] = useState<Tenue[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [tenueId, setTenueId] = useState(sortieEdition?.tenue_id || 0);
  const [commandeId, setCommandeId] = useState(sortieEdition?.commande_id?.toString() || '');
  const [dateSortie, setDateSortie] = useState(
    sortieEdition?.date_sortie?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [quantite, setQuantite] = useState(sortieEdition?.quantite?.toString() || '');
  const [observation, setObservation] = useState(sortieEdition?.observation || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const db = await getDb();
      
      // Correction TypeScript pour tenues
      const tenuesData = await db.select<Tenue>(
        "SELECT id, designation FROM tenues WHERE est_supprime = 0 ORDER BY designation"
      );
      setTenues(Array.isArray(tenuesData) ? tenuesData as Tenue[] : []);
      
      // Correction TypeScript pour commandes
      const commandesData = await db.select<Commande>(
        `SELECT c.id, c.designation, cl.nom_prenom as client_nom
         FROM commandes
         JOIN clients cl ON c.client_id = cl.telephone_id
         WHERE c.est_supprime = 0
         ORDER BY c.date_commande DESC`
      );
      setCommandes(Array.isArray(commandesData) ? commandesData as Commande[] : []);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(quantite);
    if (!tenueId) {
      setError('Veuillez sélectionner une tenue');
      return;
    }
    if (isNaN(q) || q <= 0) {
      setError('Quantité invalide');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const db = await getDb();
    try {
      if (sortieEdition?.id) {
        await db.execute(
          `UPDATE sorties_tenues SET tenue_id = ?, commande_id = ?, date_sortie = ?, quantite = ?, observation = ? WHERE id = ?`,
          [tenueId, commandeId ? Number(commandeId) : null, dateSortie, q, observation, sortieEdition.id]
        );
      } else {
        await db.execute(
          `INSERT INTO sorties_tenues (tenue_id, commande_id, date_sortie, quantite, observation) VALUES (?, ?, ?, ?, ?)`,
          [tenueId, commandeId ? Number(commandeId) : null, dateSortie, q, observation]
        );
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full md:w-2/3 lg:w-1/2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Truck size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {sortieEdition ? 'Modifier la sortie' : 'Nouvelle sortie de tenue'}
            </h2>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tenue" className="block text-xs font-medium text-slate-600 mb-1">
              Tenue *
            </label>
            <select
              id="tenue"
              value={tenueId}
              onChange={e => setTenueId(Number(e.target.value))}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="">Sélectionnez une tenue</option>
              {tenues.map(t => (
                <option key={t.id} value={t.id}>{t.designation}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="commande" className="block text-xs font-medium text-slate-600 mb-1">
              Commande (optionnelle)
            </label>
            <select
              id="commande"
              value={commandeId}
              onChange={e => setCommandeId(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Aucune commande</option>
              {commandes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.client_nom} - {c.designation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dateSortie" className="block text-xs font-medium text-slate-600 mb-1">
              Date de sortie
            </label>
            <input
              id="dateSortie"
              type="date"
              value={dateSortie}
              onChange={e => setDateSortie(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label htmlFor="quantite" className="block text-xs font-medium text-slate-600 mb-1">
              Quantité
            </label>
            <input
              id="quantite"
              type="number"
              step="1"
              value={quantite}
              onChange={e => setQuantite(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label htmlFor="observation" className="block text-xs font-medium text-slate-600 mb-1">
              Observation
            </label>
            <textarea
              id="observation"
              rows={2}
              value={observation}
              onChange={e => setObservation(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  {sortieEdition ? 'Modifier' : 'Ajouter'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormulaireSortieTenue;