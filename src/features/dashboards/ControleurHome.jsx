import React, { useState, useEffect } from "react";
import { ClipboardCheck, Scale, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";
import SectionCard from "../../components/ui/SectionCard";
import { fetchRecettesEnAttente, validerPaiement, rejeterPaiement, fetchCloturesEnAttente, validerCloture } from "../../lib/api/finance";

export default function ControleurHome({ role, onLogout, userId }) {
  const [recettes, setRecettes] = useState([]);
  const [clotures, setClotures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function reload() {
    try {
      const [r, c] = await Promise.all([fetchRecettesEnAttente(userId), fetchCloturesEnAttente()]);
      setRecettes(r); setClotures(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(); }, [userId]);

  async function onValider(id) {
    try { await validerPaiement(id, userId); reload(); } catch (e) { setError(e.message); }
  }
  async function onRejeter(id) {
    const motif = prompt("Motif du rejet :");
    if (!motif) return;
    try { await rejeterPaiement(id, userId, motif); reload(); } catch (e) { setError(e.message); }
  }
  async function onValiderCloture(id) {
    try { await validerCloture(id, userId); reload(); } catch (e) { setError(e.message); }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} title="Contrôle de caisse" subtitle="Accueil contrôleur" />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : (
          <>
            <SectionCard icon={ClipboardCheck} title={`Recettes à valider (${recettes.length})`}>
              <div className="space-y-2">
                {recettes.length === 0 && <div className="text-sm text-slate-400">Rien à valider pour l'instant.</div>}
                {recettes.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                    <div>
                      <div className="font-bold text-slate-700">{r.eleve?.prenom} {r.eleve?.nom} · {Number(r.montant_total).toLocaleString("fr-FR")} FC</div>
                      <div className="text-xs text-slate-400">{r.numero_recu}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onValider(r.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700"><Check size={15} /></button>
                      <button onClick={() => onRejeter(r.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 text-red-700"><X size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard icon={Scale} title={`Clôtures en attente (${clotures.length})`}>
              <div className="space-y-2">
                {clotures.length === 0 && <div className="text-sm text-slate-400">Aucune clôture en attente.</div>}
                {clotures.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                    <div>
                      <div className="font-bold text-slate-700">{c.tresorerie?.nom}</div>
                      <div className="text-xs text-slate-400">{c.date_cloture}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {Number(c.ecart) !== 0 && <Chip tone="red"><AlertTriangle size={11} /> Écart {Number(c.ecart).toLocaleString("fr-FR")} FC</Chip>}
                      <button onClick={() => onValiderCloture(c.id)} className="text-xs font-bold text-sky-600 hover:underline">Valider</button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
