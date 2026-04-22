import React, { useState } from 'react';
import { getDb } from '../../database/db';
import { RotateCcw, Save, X } from 'lucide-react';

interface ModalRetourProps {
  sortieId: number;
  maxRetour: number;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalRetour: React.FC<ModalRetourProps> = ({ sortieId, maxRetour, onClose, onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qte = parseInt(nombre);
    if (isNaN(qte) || qte <= 0) { alert('Quantité invalide'); return; }
    if (qte > maxRetour) { alert(`Quantité trop élevée (max ${maxRetour})`); return; }
    setIsSubmitting(true);
    const db = await getDb();
    try {
      await db.execute(`INSERT INTO retours_tenues (sortie_id, nombre) VALUES (?, ?)`, [sortieId, qte]);
      onSuccess();
      onClose();
    } catch (err: any) { alert('Erreur : ' + err.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-96 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <RotateCcw size={20} /> Enregistrer un retour
          </h2>
          {/* Correction : Ajout de aria-label pour le bouton fermer */}
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-100 rounded"
            aria-label="Fermer le modal"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Correction : Liaison via htmlFor et id */}
          <label htmlFor="quantite-retour" className="block text-sm mb-1">
            Quantité à retourner (max {maxRetour})
          </label>
          <input 
            id="quantite-retour"
            type="number" 
            step="1" 
            className="w-full border rounded-lg p-2 mb-4" 
            value={nombre} 
            onChange={e => setNombre(e.target.value)} 
            required 
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg">
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg flex justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Save size={16} /> Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalRetour;
