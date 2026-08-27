import React, { useState, useEffect } from "react";
import { Wallet, PlusCircle, Receipt, ArrowRight, Loader2 } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";
import SectionCard from "../../components/ui/SectionCard";
import { fetchDernieresOperations } from "../../lib/api/finance";
import NouveauPaiementModal from "../finance/modals/NouveauPaiementModal";
import ClotureCaisseModal from "../finance/modals/ClotureCaisseModal";

export default function CaissierHome({ role, onLogout, tresorerieId, userId }) {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaiement, setShowPaiement] = useState(false);
  const [showCloture, setShowCloture] = useState(false);

  function reload() {
    if (!tresorerieId) { setLoading(false); return; }
    setLoading(true);
    fetchDernieresOperations(tresorerieId)
      .then(setOperations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(reload, [tresorerieId]);

  const soldeTheorique = operations
    .filter((o) => o.statut === "validee")
    .reduce((s, o) => s + Number(o.montant_total), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} title="Caisse principale" subtitle="Accueil caissier" />
      <div className="max-w-4xl mx-auto p-6">
        {!tresorerieId && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-xl px-4 py-3 mb-6">
            Aucune caisse n'est encore affectée à ce compte (voir <code>utilisateur.caisse_id</code>, à définir par l'Admin Technique).
          </div>
        )}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>}

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <SectionCard icon={Wallet} title="Solde (opérations validées)">
            <div className="text-2xl font-black text-slate-800">{soldeTheorique.toLocaleString("fr-FR")} FC</div>
            <div className="text-xs text-slate-400 mt-1">{operations.length} opérations récentes</div>
          </SectionCard>
          <SectionCard icon={Receipt} title="Actions rapides">
            <div className="flex flex-col gap-2">
              <button onClick={() => setShowPaiement(true)} className="flex items-center justify-between bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
                Nouveau paiement <PlusCircle size={16} />
              </button>
              <button onClick={() => setShowCloture(true)} className="flex items-center justify-between bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm">
                Clôturer la caisse <ArrowRight size={16} />
              </button>
            </div>
          </SectionCard>
        </div>

        <SectionCard icon={Receipt} title="Dernières opérations">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
          ) : operations.length === 0 ? (
            <div className="text-sm text-slate-400">Aucune opération pour l'instant.</div>
          ) : (
            <div className="space-y-2">
              {operations.map((op) => (
                <div key={op.numero_recu} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                  <div>
                    <div className="font-bold text-slate-700">{op.eleve?.prenom} {op.eleve?.nom}</div>
                    <div className="text-xs text-slate-400">{op.numero_recu}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{Number(op.montant_total).toLocaleString("fr-FR")} FC</span>
                    <Chip tone={op.statut === "validee" ? "sky" : op.statut === "rejetee" ? "red" : "yellow"}>
                      {op.statut === "validee" ? "Validée" : op.statut === "rejetee" ? "Rejetée" : "En attente"}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {showPaiement && (
        <NouveauPaiementModal tresorerieId={tresorerieId} caissierId={userId} onClose={() => setShowPaiement(false)} onSuccess={reload} />
      )}
      {showCloture && (
        <ClotureCaisseModal tresorerieId={tresorerieId} preparateurId={userId} onClose={() => setShowCloture(false)} onSuccess={reload} />
      )}
    </div>
  );
}
