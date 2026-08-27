import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { fetchSoldeTheorique, preparerCloture } from "../../../lib/api/finance";

export default function ClotureCaisseModal({ tresorerieId, preparateurId, onClose, onSuccess }) {
  const [soldeTheorique, setSoldeTheorique] = useState(null);
  const [soldePhysique, setSoldePhysique] = useState("");
  const [motifEcart, setMotifEcart] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSoldeTheorique(tresorerieId).then(setSoldeTheorique).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [tresorerieId]);

  const ecart = soldePhysique !== "" && soldeTheorique !== null ? Number(soldePhysique) - soldeTheorique : null;
  const ecartNonNul = ecart !== null && ecart !== 0;

  async function submit() {
    if (soldePhysique === "" || (ecartNonNul && !motifEcart.trim())) return;
    setSaving(true);
    try {
      await preparerCloture({
        tresorerieId,
        dateCloture: new Date().toISOString().slice(0, 10),
        soldeTheorique,
        soldePhysique: Number(soldePhysique),
        motifEcart: ecartNonNul ? motifEcart.trim() : null,
        preparateurId,
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 text-lg">Clôturer la caisse</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-4"><Loader2 size={16} className="animate-spin" /> Calcul du solde théorique…</div>
        ) : (
          <>
            <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-sky-800">Solde théorique</span>
              <span className="font-black text-sky-800">{soldeTheorique.toLocaleString("fr-FR")} FC</span>
            </div>

            <label className="block text-xs font-bold text-slate-500 mb-1.5">Argent physiquement compté</label>
            <input type="number" min={0} value={soldePhysique} onChange={(e) => setSoldePhysique(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />

            {ecart !== null && (
              <div className={`rounded-xl px-4 py-3 mb-4 text-sm font-bold ${ecart === 0 ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                Écart : {ecart.toLocaleString("fr-FR")} FC
              </div>
            )}

            {ecartNonNul && (
              <>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Motif de l'écart (obligatoire)</label>
                <input value={motifEcart} onChange={(e) => setMotifEcart(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />
              </>
            )}

            <p className="text-[11px] text-slate-400 mb-4">La clôture reste "préparée" jusqu'à validation par le Contrôleur.</p>

            <button disabled={saving || soldePhysique === "" || (ecartNonNul && !motifEcart.trim())} onClick={submit} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {saving ? "Envoi…" : "Soumettre la clôture"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
