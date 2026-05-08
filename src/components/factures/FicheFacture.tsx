import React, { useEffect, useState } from 'react';
import { getDb } from '../../database/db';
import { toWords } from 'number-to-words';

// ==============================
// TYPES
// ==============================
type ConfigAtelier = {
  id: number;
  nom_atelier: string;
  telephone: string;
  adresse: string;
  ville: string;              // ajouté
  pays: string;              // ajouté
  email: string;
  ifu: string;              
  rccm: string;             // ajouté
  message_facture_defaut: string;  // remplace message_facture
  logo_base64: string;
  devise: string;           // ajouté
  updated_at: string;       // ajouté
};
interface Props {
  client: any;
  lignes: any[];
  numero?: string;
  avance?: number;
  reste?: number;
  statut?: string;
}

const FicheFacture: React.FC<Props> = ({
  client,
  lignes,
  numero,
  avance = 0,
  reste,
  statut
}) => {

  const [config, setConfig] = useState<ConfigAtelier | null>(null);

  // ==============================
  // TOTAL
  // ==============================
  const total = lignes.reduce(
    (s: number, l: any) => s + l.quantite * l.prix_unitaire,
    0
  );

  const resteFinal = reste ?? (total - avance);

  // ==============================
  // LOAD CONFIG
  // ==============================
  useEffect(() => {
    const load = async () => {
      try {
        const db = await getDb();

        const res = await db.select<ConfigAtelier[]>(
          "SELECT * FROM atelier WHERE id = 1"
        );

        setConfig(res[0] || null);

      } catch (error) {
        console.error("Erreur config atelier", error);
      }
    };

    load();
  }, []);

  return (
    <div className="p-8 bg-white text-sm">

      {/* HEADER */}
      <div className="flex justify-between mb-6 border-b pb-4">
        <div>
          {config?.logo_base64 && (
            <img src={config.logo_base64} className="h-20 object-contain" />
          )}
        </div>

        <div className="text-right">
          <h1 className="font-bold text-lg">
            {config?.nom_atelier || "Mon Atelier"}
          </h1>
          <p>{config?.adresse}</p>
          <p>{config?.telephone}</p>
        </div>
      </div>

      {/* TITRE */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">FACTURE</h2>
        <p>N° {numero}</p>
      </div>

      {/* CLIENT */}
      <div className="mb-4">
        <p><strong>Client :</strong> {client.nom_prenom}</p>
        <p><strong>Tél :</strong> {client.telephone_id}</p>
      </div>

      {/* TABLE */}
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Désignation</th>
            <th className="border p-2">Qté</th>
            <th className="border p-2">P.U</th>
            <th className="border p-2">Total</th>
          </tr>
        </thead>

        <tbody>
          {lignes.map((l, i) => (
            <tr key={i}>
              <td className="border p-2">{l.designation}</td>
              <td className="border p-2 text-center">{l.quantite}</td>
              <td className="border p-2 text-right">{l.prix_unitaire}</td>
              <td className="border p-2 text-right">
                {l.quantite * l.prix_unitaire}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTAL */}
      <div className="mt-6 text-right space-y-1">
        <p><strong>Total :</strong> {total} FCFA</p>
        <p><strong>Avance :</strong> {avance} FCFA</p>
        <p className="text-red-600">
          <strong>Reste :</strong> {resteFinal} FCFA
        </p>
        <p><strong>Statut :</strong> {statut}</p>

        <p className="italic text-xs mt-2">
          Arrêté la présente facture à : {toWords(total)} francs CFA
        </p>
      </div>

    </div>
  );
};

export default FicheFacture;