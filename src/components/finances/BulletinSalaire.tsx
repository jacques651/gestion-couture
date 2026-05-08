import { useEffect, useState } from "react";
import {
  Modal,
  Group,
  Button,
  Divider,
  Paper,
  LoadingOverlay,
  Text,
} from '@mantine/core';
import {
  IconPrinter,
  IconFile,
  IconX,
} from '@tabler/icons-react';
import { getDb } from "../../database/db";
import html2pdf from "html2pdf.js";

// ================= TYPES =================
interface Employe {
  id: number;
  nom_prenom: string;
  salaire_base: number;
  telephone?: string;
  personne_a_prevenir?: string;
  lieu_residence?: string;
  date_embauche?: string;
  type_remuneration: 'fixe' | 'prestation';
  est_actif: number;
  est_supprime: number;
}

interface Atelier {
  id: number;
  nom_atelier: string;
  telephone: string;
  adresse: string;
  ville: string;
  pays: string;
  email: string;
  ifu: string;
  rccm: string;
  message_facture_defaut: string;
  logo_base64: string;
  devise: string;
}

interface Emprunt {
  id: number;
  employe_id: number;
  montant: number;
  date_emprunt: string;
  deduit: number;
  date_deduction: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SalairePaye {
  id: number;
  montant_brut: number;
  montant_net: number;
  montant_emprunts: number;
  mode: string;
  date_paiement: string;
  observation: string | null;
  periode_debut: string | null;
  periode_fin: string | null;
}

interface PrestationRealisee {
  id: number;
  employe_id: number;
  type_prestation_id: number | null;
  date_prestation: string;
  designation: string;
  valeur: number;
  nombre: number;
  total: number;
  paye: number;
  created_at?: string;
}

interface BulletinData {
  employe: Employe;
  atelier: Atelier | null;
  salairePaye: SalairePaye | null;
  avoirs: Array<{ code: string; libelle: string; montant: number }>;
  totalAvoirs: number;
  retenues: Array<{ code: string; libelle: string; montant: number }>;
  totalRetenues: number;
  netAPayer: number;
}

interface Props {
  employeId: number;
  onClose: () => void;
}

const BulletinSalaire = ({ employeId, onClose }: Props) => {
  const [data, setData] = useState<BulletinData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeId) return;

    const load = async () => {
      setLoading(true);
      const db = await getDb();

      // 1. Récupérer l'employé
      const emp = await db.select<Employe[]>(
        `SELECT 
          id, 
          nom_prenom, 
          COALESCE(salaire_base, 0) as salaire_base, 
          telephone, 
          date_embauche, 
          type_remuneration, 
          lieu_residence,
          personne_a_prevenir,
          est_actif,
          est_supprime
         FROM employes 
         WHERE id = ? AND est_actif = 1 AND est_supprime = 0`,
        [employeId]
      );

      if (!emp.length) {
        setLoading(false);
        return;
      }

      const employe = emp[0];

      // 2. Récupérer l'atelier
      const atelierRows = await db.select<Atelier[]>(
        `SELECT 
          id, nom_atelier, telephone, adresse, ville, pays, email, 
          ifu, rccm, message_facture_defaut, logo_base64, devise
         FROM atelier WHERE id = 1`
      );
      const atelier = atelierRows.length ? atelierRows[0] : null;

      // 3. Récupérer le dernier salaire payé (non annulé)
      const salairesPayes = await db.select<SalairePaye[]>(
        `SELECT 
          id, montant_brut, montant_net, montant_emprunts, mode, 
          date_paiement, observation, periode_debut, periode_fin
         FROM salaires 
         WHERE employe_id = ? 
         AND annule = 0
         ORDER BY date_paiement DESC
         LIMIT 1`,
        [employeId]
      );

      const salairePaye = salairesPayes.length > 0 ? salairesPayes[0] : null;

      let avoirs: Array<{ code: string; libelle: string; montant: number }> = [];
      let totalAvoirs = 0;
      let retenues: Array<{ code: string; libelle: string; montant: number }> = [];
      let totalRetenues = 0;
      let netAPayer = 0;

      if (salairePaye) {
        netAPayer = salairePaye.montant_net;
        totalRetenues = salairePaye.montant_emprunts;

        // 4. Récupérer les détails des AVOIRS selon le type d'employé
        if (employe.type_remuneration === 'fixe') {
          // Pour un fixe, les avoirs = salaire de base
          avoirs.push({
            code: "SALA",
            libelle: "Salaire de base mensuel",
            montant: salairePaye.montant_brut
          });
          totalAvoirs = salairePaye.montant_brut;
        } else {

          // Pour un prestataire, récupérer les prestations payées (paye = 1)
          const prestationsPayees = await db.select<PrestationRealisee[]>(
            `SELECT 
    id, employe_id, type_prestation_id, date_prestation, 
    designation, valeur, nombre, total, paye
   FROM prestations_realisees 
   WHERE employe_id = ? AND paye = 1`,
            [employeId]
          );

          if (prestationsPayees.length > 0) {
            prestationsPayees.forEach((p, idx) => {
              avoirs.push({
                code: `P${String(idx + 1).padStart(4, '0')}`,
                libelle: p.designation,
                montant: p.total
              });
              totalAvoirs += p.total;
            });
          } else {
            // Si pas de prestations trouvées, afficher le montant brut
            avoirs.push({
              code: "PRES",
              libelle: "Prestations du mois",
              montant: salairePaye.montant_brut
            });
            totalAvoirs = salairePaye.montant_brut;
          }
        }

        // 5. Récupérer les emprunts déduits sur ce salaire
        const empruntsDeduits = await db.select<Emprunt[]>(
          `SELECT id, employe_id, montant, date_emprunt, deduit, date_deduction
   FROM emprunts 
   WHERE employe_id = ? AND deduit = 1`,
          [employeId]
        );

        empruntsDeduits.forEach((e, idx) => {
          retenues.push({
            code: `E${String(idx + 1).padStart(4, '0')}`,
            libelle: `Emprunt du ${new Date(e.date_emprunt).toLocaleDateString('fr-FR')}`,
            montant: e.montant
          });
        });
      } else {
        // Aucun salaire trouvé
        avoirs = [];
        totalAvoirs = 0;
        retenues = [];
        totalRetenues = 0;
        netAPayer = 0;
      }

      setData({
        employe,
        atelier,
        salairePaye,
        avoirs,
        totalAvoirs,
        retenues,
        totalRetenues,
        netAPayer,
      });
      setLoading(false);
    };

    load();
  }, [employeId]);

  const handlePrint = () => window.print();
  const handlePDF = () => {
    const el = document.getElementById("bulletin-print");
    if (!el) return;
    html2pdf()
      .from(el)
      .set({
        margin: 8,
        filename: `decharge-${data?.employe.nom_prenom?.replace(/\s/g, '-')}.pdf`,
        html2canvas: { scale: 2, letterRendering: true },
        jsPDF: { format: "a4", orientation: "portrait" },
      })
      .save();
  };

  if (loading) {
    return (
      <Modal opened={true} onClose={onClose} size="xl" centered title="Quittance de salaire">
        <Paper p="lg" pos="relative">
          <LoadingOverlay visible={true} />
          <Text>Chargement de la quittance...</Text>
        </Paper>
      </Modal>
    );
  }

  if (!data) return null;

  const currentDate = new Date();
  const matricule = `MAT-${String(data.employe.id).padStart(6, '0')}`;
  const numeroQuittance = `Q-${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(data.employe.id).padStart(4, '0')}`;
  const datePaiement = data.salairePaye
    ? new Date(data.salairePaye.date_paiement).toLocaleDateString('fr-FR')
    : 'Non payé';

  const periodeText = data.salairePaye?.periode_debut && data.salairePaye?.periode_fin
    ? `du ${new Date(data.salairePaye.periode_debut).toLocaleDateString('fr-FR')} au ${new Date(data.salairePaye.periode_fin).toLocaleDateString('fr-FR')}`
    : 'période concernée';

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="1200px"
      centered
      padding={0}
      styles={{
        header: { display: 'none' },
        body: { padding: 0 },
      }}
    >
      <div id="bulletin-print" style={{ backgroundColor: 'white', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px' }}>

        {/* ================= EN-TÊTE ATELIER ================= */}
        <div style={{ padding: '20px 25px 15px 25px', borderBottom: '2px solid #1b365d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              {data.atelier?.logo_base64 && (
                <img src={data.atelier.logo_base64} alt="Logo" style={{ height: '50px', marginBottom: '8px' }} />
              )}
              <h2 style={{ margin: 0, color: '#1b365d', fontSize: '18px', fontWeight: 'bold' }}>
                {data.atelier?.nom_atelier || "GESTION COUTURE"}
              </h2>
              <div style={{ marginTop: '5px', color: '#333', fontSize: '10px', lineHeight: '1.4' }}>
                {data.atelier?.adresse && <div>{data.atelier.adresse}</div>}
                {data.atelier?.ville && <div>{data.atelier.ville}, {data.atelier?.pays}</div>}
                {data.atelier?.telephone && <div>Tél: {data.atelier.telephone}</div>}
                {data.atelier?.email && <div>Email: {data.atelier.email}</div>}
                {data.atelier?.ifu && <div>IFU: {data.atelier.ifu}</div>}
                {data.atelier?.rccm && <div>RCCM: {data.atelier.rccm}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                border: '2px solid #1b365d',
                padding: '10px 20px',
                backgroundColor: '#f8f9fa'
              }}>
                <h1 style={{ margin: 0, fontSize: '20px', letterSpacing: '1px', color: '#1b365d' }}>QUITTANCE</h1>
                <h2 style={{ margin: '3px 0 0 0', fontSize: '14px', fontWeight: 'normal', color: '#333' }}>DE SALAIRE</h2>
              </div>
              <div style={{ marginTop: '8px', fontSize: '10px' }}>
                N°: {numeroQuittance}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>
              Quittance de paiement
            </h3>
            <div style={{ fontSize: '10px', color: '#666' }}>Date d'édition : {currentDate.toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        {/* ================= INFORMATIONS EMPLOYÉ ================= */}
        <div style={{ padding: '15px 25px', backgroundColor: '#fafafa', borderBottom: '1px solid #ddd' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '10px' }}>
            <div><strong>Matricule :</strong> {matricule}</div>
            <div><strong>Nom complet :</strong> {data.employe.nom_prenom}</div>
            <div><strong>Type :</strong> {data.employe.type_remuneration === 'fixe' ? 'Salaire fixe' : 'Prestataire'}</div>
            <div><strong>Téléphone :</strong> {data.employe.telephone || 'Non renseigné'}</div>
            <div><strong>Date d'embauche :</strong> {data.employe.date_embauche ? new Date(data.employe.date_embauche).toLocaleDateString('fr-FR') : 'Non renseignée'}</div>
            <div><strong>Lieu de résidence :</strong> {data.employe.lieu_residence || 'Non renseigné'}</div>
            <div><strong>Personne à prévenir :</strong> {data.employe.personne_a_prevenir || 'Non renseignée'}</div>
            <div><strong>Date paiement :</strong> {datePaiement}</div>
          </div>
        </div>

        {/* ================= TABLEAU PRINCIPAL ================= */}
        <div style={{ padding: '20px 25px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1b365d', color: 'white' }}>
                <th style={{ padding: '8px', textAlign: 'left', width: '10%' }}>Code</th>
                <th style={{ padding: '8px', textAlign: 'left', width: '50%' }}>Libellés des éléments de paie</th>
                <th style={{ padding: '8px', textAlign: 'right', width: '20%' }}>Avoirs (FCFA)</th>
                <th style={{ padding: '8px', textAlign: 'right', width: '20%' }}>Retenues (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {/* Lignes des avoirs */}
              {data.avoirs.map((avoir, idx) => (
                <tr key={`avoir-${idx}`} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px' }}>{avoir.code}</td>
                  <td style={{ padding: '6px' }}>{avoir.libelle}</td>
                  <td style={{ padding: '6px', textAlign: 'right', color: '#2e7d32' }}>{avoir.montant.toLocaleString()}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>-</td>
                </tr>
              ))}

              {/* Lignes des retenues */}
              {data.retenues.map((retenue, idx) => (
                <tr key={`retenue-${idx}`} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px' }}>{retenue.code}</td>
                  <td style={{ padding: '6px' }}>{retenue.libelle}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>-</td>
                  <td style={{ padding: '6px', textAlign: 'right', color: '#d32f2f' }}>{retenue.montant.toLocaleString()}</td>
                </tr>
              ))}

              {/* Ligne vide si nécessaire */}
              {data.avoirs.length === 0 && data.retenues.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    Aucun élément de paie trouvé
                  </td>
                </tr>
              )}
            </tbody>

            {/* Totaux */}
            <tfoot>
              <tr style={{ backgroundColor: '#f0f7ff', fontWeight: 'bold' }}>
                <td colSpan={2} style={{ padding: '8px', textAlign: 'right' }}>TOTAUX :</td>
                <td style={{ padding: '8px', textAlign: 'right', color: '#2e7d32' }}>{data.totalAvoirs.toLocaleString()}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: '#d32f2f' }}>{data.totalRetenues.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ================= RÉCAPITULATIF ================= */}
        <div style={{ padding: '15px 25px', backgroundColor: '#f8f9fa', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ fontSize: '10px' }}>
              <div><strong>Période :</strong> {periodeText}</div>
              {data.salairePaye?.mode && (
                <div><strong>Mode de paiement :</strong> {data.salairePaye.mode}</div>
              )}
            </div>
            <div style={{ fontSize: '12px' }}>
              <table style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 8px' }}><strong>Brut à payer :</strong></td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{data.totalAvoirs.toLocaleString()} FCFA</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #ddd' }}>
                    <td style={{ padding: '4px 8px' }}><strong>NET PAYÉ :</strong></td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#1b365d' }}>{data.netAPayer.toLocaleString()} FCFA</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ================= DÉCHARGE ================= */}
        <div style={{ padding: '20px 25px', textAlign: 'center' }}>
          <div style={{
            border: '1px solid #ddd',
            padding: '20px',
            borderRadius: '8px',
            backgroundColor: '#fefce8'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>
              DÉCHARGE
            </div>
            <div style={{ fontSize: '11px', lineHeight: '1.6', textAlign: 'justify' }}>
              Je soussigné(e) <strong>{data.employe.nom_prenom}</strong>,
              reconnais avoir reçu ce jour <strong>{datePaiement}</strong>,
              la somme de <strong style={{ fontSize: '14px' }}>{data.netAPayer.toLocaleString()} FCFA</strong>
              ({montantEnLettres(data.netAPayer).toUpperCase()}),
              correspondant au paiement de mon salaire pour {periodeText}.
              <br /><br />
              Je déclare que ce paiement est complet et libératoire.
            </div>
          </div>
        </div>

        {/* ================= OBSERVATIONS ================= */}
        <div style={{ padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '9px', color: '#666', fontStyle: 'italic', maxWidth: '60%' }}>
            <strong>Observations :</strong><br />
            {data.salairePaye?.observation || data.atelier?.message_facture_defaut || "Merci pour votre travail."}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ width: '180px', borderTop: '1px solid #000', marginBottom: '3px' }}></div>
            <div style={{ fontSize: '9px', color: '#666' }}>Signature de l'employé</div>
          </div>
        </div>

        {/* ================= PIED DE PAGE ================= */}
        <div style={{ padding: '10px 25px', backgroundColor: '#f0f0f0', textAlign: 'center', borderTop: '1px solid #ddd' }}>
          <div style={{ fontSize: '8px', color: '#999' }}>
            Document généré automatiquement par Gestion Couture - {currentDate.toLocaleString()}
          </div>
          <div style={{ fontSize: '8px', color: '#999', marginTop: '3px' }}>
            Cachet de l'atelier
          </div>
        </div>
      </div>

      {/* BOUTONS D'ACTION */}
      <Divider />
      <Group justify="flex-end" p="md" className="no-print">
        <Button variant="light" onClick={onClose} leftSection={<IconX size={16} />} radius="md">
          Fermer
        </Button>
        <Button onClick={handlePrint} variant="outline" color="teal" leftSection={<IconPrinter size={16} />} radius="md">
          Imprimer
        </Button>
        <Button onClick={handlePDF} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }} leftSection={<IconFile size={16} />} radius="md">
          PDF
        </Button>
      </Group>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          #bulletin-print { margin: 0; padding: 0; }
          body { background: white; margin: 0; }
          .mantine-Modal-root { display: none; }
          @page { margin: 1cm; }
        }
      `}</style>
    </Modal>
  );
};

// Fonction pour convertir un nombre en lettres
function nombreEnLettres(nombre: number): string {
  if (nombre === 0) return 'zéro';

  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  const traiterNombre = (n: number): string => {
    if (n < 10) return unites[n];
    if (n < 20) {
      if (n === 11) return 'onze';
      if (n === 12) return 'douze';
      return `${dizaines[1]}${n > 10 ? '-' + unites[n - 10] : ''}`;
    }
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (d === 7 || d === 9) return `${dizaines[d - 1]}${u > 0 ? '-' + unites[u] : ''}`;
    return `${dizaines[d]}${u > 0 ? '-' + unites[u] : ''}`;
  };

  const milliers = Math.floor(nombre / 1000);
  const reste = nombre % 1000;
  let result = '';

  if (milliers > 0) {
    if (milliers === 1) result += 'mille ';
    else result += `${traiterNombre(milliers)} mille `;
  }
  if (reste > 0) result += traiterNombre(reste);

  return result.trim();
}

function montantEnLettres(montant: number): string {
  const francs = Math.floor(montant);
  if (francs === 0) return 'zéro francs';
  return `${nombreEnLettres(francs)} francs`;
}

export default BulletinSalaire;