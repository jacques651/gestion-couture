// components/stocks/SortiesStockManager.tsx
import React, { useState, useEffect } from 'react';
import { 
  getDb, 
  getMatieres, 
  updateStockMatiere,
  Matiere, 
  getMatiereById
} from '../../database/db';
import { Table } from 'lucide-react';

interface SortieStock {
  id: number;
  code_sortie: string;
  matiere_id: number;
  quantite: number;
  cout_unitaire: number;
  motif: string;
  date_sortie: string;
  observation: string;
  matiere_designation?: string;
  matiere_unite?: string;
}

const SortiesStockManager: React.FC = () => {
  const [sorties, setSorties] = useState<SortieStock[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    matiere_id: 0,
    quantite: 1,
    motif: 'vente',
    observation: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const db = await getDb();
      
      // Charger les matières
      const matieresData = await getMatieres();
      setMatieres(matieresData);
      
      // Charger les sorties
      const sortiesData = await db.select<SortieStock[]>(`
        SELECT s.*, m.designation as matiere_designation, m.unite as matiere_unite
        FROM sorties_stock s
        LEFT JOIN matieres m ON s.matiere_id = m.id
        WHERE s.matiere_id IS NOT NULL
        ORDER BY s.date_sortie DESC
      `);
      setSorties(sortiesData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      matiere_id: 0,
      quantite: 1,
      motif: 'vente',
      observation: ''
    });
    setSelectedMatiere(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleMatiereChange = (matiereId: number) => {
    const matiere = matieres.find(m => m.id === matiereId);
    setSelectedMatiere(matiere || null);
    setFormData({ ...formData, matiere_id: matiereId });
  };

  const getNextSortieCode = async (): Promise<string> => {
    const db = await getDb();
    const result = await db.select<{ code_sortie: string }[]>(`
      SELECT code_sortie FROM sorties_stock 
      WHERE code_sortie LIKE 'SOR-%' 
      ORDER BY id DESC LIMIT 1
    `);
    
    if (result.length === 0) return 'SOR-0001';
    const lastNumber = parseInt(result[0].code_sortie.split('-')[1]);
    return `SOR-${(lastNumber + 1).toString().padStart(4, '0')}`;
  };

  const handleSave = async () => {
    if (!formData.matiere_id) {
      setError('Veuillez sélectionner une matière');
      return;
    }
    if (formData.quantite <= 0) {
      setError('La quantité doit être supérieure à 0');
      return;
    }
    if (!selectedMatiere) {
      setError('Matière non trouvée');
      return;
    }
    if (selectedMatiere.stock_actuel < formData.quantite) {
      setError(`Stock insuffisant. Stock actuel: ${selectedMatiere.stock_actuel} ${selectedMatiere.unite}`);
      return;
    }

    try {
      setError(null);
      const db = await getDb();
      const code_sortie = await getNextSortieCode();
      
      // Récupérer le prix unitaire (prix de vente ou prix d'achat)
      const matiere = await getMatiereById(formData.matiere_id);
      const cout_unitaire = matiere?.prix_vente || matiere?.prix_achat || 0;
      
      // Insérer la sortie
      await db.execute(`
        INSERT INTO sorties_stock (
          code_sortie, matiere_id, quantite, cout_unitaire, 
          motif, observation, date_sortie
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        code_sortie,
        formData.matiere_id,
        formData.quantite,
        cout_unitaire,
        formData.motif,
        formData.observation || null
      ]);
      
      // Mettre à jour le stock
      await updateStockMatiere(formData.matiere_id, formData.quantite, 'remove');
      
      setShowModal(false);
      await loadData();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: number, code_sortie: string) => {
    if (confirm(`Annuler la sortie "${code_sortie}" ? Cette action restaurera le stock.`)) {
      try {
        setError(null);
        const db = await getDb();
        
        // Récupérer la sortie avant suppression
        const sortie = await db.select<SortieStock[]>(
          'SELECT matiere_id, quantite FROM sorties_stock WHERE id = ?',
          [id]
        );
        
        if (sortie[0]) {
          // Restaurer le stock
          await updateStockMatiere(sortie[0].matiere_id, sortie[0].quantite, 'add');
          
          // Supprimer la sortie
          await db.execute('DELETE FROM sorties_stock WHERE id = ?', [id]);
          
          await loadData();
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors de l\'annulation');
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR');
  };

  const getMotifLabel = (motif: string) => {
    const motifs: Record<string, { label: string; color: string }> = {
      vente: { label: 'Vente', color: 'bg-blue-100 text-blue-800' },
      utilisation: { label: 'Utilisation interne', color: 'bg-purple-100 text-purple-800' },
      perte: { label: 'Perte', color: 'bg-red-100 text-red-800' },
      retour_fournisseur: { label: 'Retour fournisseur', color: 'bg-orange-100 text-orange-800' },
      donation: { label: 'Don', color: 'bg-green-100 text-green-800' },
      autre: { label: 'Autre', color: 'bg-gray-100 text-gray-800' }
    };
    return motifs[motif] || { label: motif, color: 'bg-gray-100 text-gray-800' };
  };

  // Filtrer les sorties
  const filteredSorties = sorties.filter(sortie =>
    sortie.matiere_designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sortie.code_sortie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredSorties.length / itemsPerPage);
  const paginatedSorties = filteredSorties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Chargement des sorties...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sorties de Stock</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les sorties de matières (ventes, pertes, utilisation...)</p>
        </div>
        <button 
          onClick={openAddModal} 
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>📤</span> Nouvelle sortie
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par matière ou code..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tableau des sorties */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <Table>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matière</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantité</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valeur unitaire</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valeur totale</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Motif</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </Table>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedSorties.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'Aucune sortie ne correspond à votre recherche' : 'Aucune sortie enregistrée'}
                </td>
              </tr>
            ) : (
              paginatedSorties.map((sortie) => {
                const motif = getMotifLabel(sortie.motif);
                const valeurTotale = sortie.quantite * sortie.cout_unitaire;
                return (
                  <tr key={sortie.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{sortie.code_sortie}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(sortie.date_sortie)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{sortie.matiere_designation}</div>
                        <div className="text-xs text-gray-500">{sortie.matiere_unite}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-orange-600">
                      -{sortie.quantite}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatPrice(sortie.cout_unitaire)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatPrice(valeurTotale)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${motif.color}`}>
                        {motif.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button 
                        onClick={() => handleDelete(sortie.id, sortie.code_sortie)} 
                        className="text-red-600 hover:text-red-800"
                        title="Annuler la sortie"
                      >
                        ↩️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={5} className="px-4 py-3 text-right font-medium">Total sorties:</td>
              <td className="px-4 py-3 font-bold text-red-600">
                {formatPrice(paginatedSorties.reduce((sum, s) => sum + (s.quantite * s.cout_unitaire), 0))}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4 border-t">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ←
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Modal nouvelle sortie */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">Nouvelle sortie de stock</h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
                  <select
                    value={formData.matiere_id}
                    onChange={(e) => handleMatiereChange(parseInt(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="0">Sélectionner une matière</option>
                    {matieres.filter(m => m.est_supprime === 0 && m.stock_actuel > 0).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.designation} - Stock: {m.stock_actuel} {m.unite}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMatiere && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Stock disponible: <strong>{selectedMatiere.stock_actuel} {selectedMatiere.unite}</strong>
                    </p>
                    <p className="text-sm text-blue-800">
                      Prix unitaire: <strong>{formatPrice(selectedMatiere.prix_vente || selectedMatiere.prix_achat)}</strong>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                  <input
                    type="number"
                    value={formData.quantite}
                    onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="1"
                    step="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motif *</label>
                  <select
                    value={formData.motif}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="vente">Vente</option>
                    <option value="utilisation">Utilisation interne</option>
                    <option value="perte">Perte / Casse</option>
                    <option value="retour_fournisseur">Retour fournisseur</option>
                    <option value="donation">Don</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observation</label>
                  <textarea
                    value={formData.observation}
                    onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="Motif détaillé de la sortie..."
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Enregistrer la sortie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SortiesStockManager;