import React, { useState, useEffect } from "react";
import { FileText, Wallet, PlusCircle, ArrowLeftRight, Loader2 } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";
import SectionCard from "../../components/ui/SectionCard";
import { fetchSoldeFonds, fetchMesDepenses } from "../../lib/api/finance";
import NouvelleDepenseModal from "../finance/modals/NouvelleDepenseModal";
import TransfertFondsModal from "../finance/modals/TransfertFondsModal";

const STATUT_LABEL = {
  brouillon: ["Brouillon", "white"],
  en_attente_approbation: ["En attente", "yellow"],
  approuvee: ["Approuvée", "sky"],
  refusee: ["Refusée", "red"],
  retournee: ["À corriger", "red"],
  payee: ["Payée", "sky"],
};

export default function RespFinancierHome({ role, onLogout, userId }) {
  const [fonds, setFonds] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDepense, setShowDepense] = useState(false);
  const [showTransfert, setShowTransfert] = useState(false);

  function reload() {
    setLoading(true);
    Promise.all([fetchSoldeFonds(), fetchMesDepenses(userId)])
      .then(([f, d]) => { setFonds(f); setDemandes(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(reload, [userId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} title="Finances" subtitle="Accueil responsable financier" />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={() => setShowDepense(true)} className="flex items-center justify-between bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-3 rounded-xl text-sm">
            Nouvelle demande de dépense <PlusCircle size={16} />
          </button>
          <button onClick={() => setShowTransfert(true)} className="flex items-center justify-between bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-3 rounded-xl text-sm">
            Transfert entre fonds <ArrowLeftRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : (
          <>
            <SectionCard icon={Wallet} title="Solde des fonds">
              <div className="space-y-2">
                {fonds.map((f) => (
                  <div key={f.fonds_id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                    <span className="text-slate-700">{f.nom}</span>
                    <span className="font-bold text-slate-800">{Number(f.solde).toLocaleString("fr-FR")} FC</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard icon={FileText} title="Mes demandes de dépense">
              <div className="space-y-2">
                {demandes.length === 0 && <div className="text-sm text-slate-400">Aucune demande pour l'instant.</div>}
                {demandes.map((d) => {
                  const [label, tone] = STATUT_LABEL[d.statut] || ["—", "white"];
                  return (
                    <div key={d.id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                      <div>
                        <div className="font-bold text-slate-700">{d.motif}</div>
                        <div className="text-xs text-slate-400">{d.reference}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{Number(d.montant).toLocaleString("fr-FR")} FC</span>
                        <Chip tone={tone}>{label}</Chip>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </>
        )}
      </div>

      {showDepense && (
        <NouvelleDepenseModal demandeurId={userId} onClose={() => setShowDepense(false)} onSuccess={reload} />
      )}
      {showTransfert && (
        <TransfertFondsModal demandeurId={userId} onClose={() => setShowTransfert(false)} onSuccess={reload} />
      )}
    </div>
  );
}
