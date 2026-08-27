import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { fetchFondsListe, createTransfertFonds } from "../../../lib/api/finance";

export default function TransfertFondsModal({ demandeurId, onClose, onSuccess }) {
  const [fonds, setFonds] = useState([]);
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFondsListe().then((f) => { setFonds(f); if (f[0]) setSourceId(f[0].id); if (f[1]) setDestId(f[1].id); }).catch((e) => setError(e.message));
  }, []);

  async function submit() {
    if (!sourceId || !destId || sourceId === destId || !montant || !motif.trim()) {
      if (sourceId === destId) setError("Le fonds source et le fonds destination doivent être différents.");
      return;
    }
    setSaving(true);
    try {
      await createTransfertFonds({ fondsSourceId: sourceId, fondsDestinationId: destId, montant: Number(montant), motif: motif.trim(), demandeurId });
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
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 text-lg">Transfert entre fonds</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Fonds source</label>
        <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4">
          {fonds.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Fonds destination</label>
        <select value={destId} onChange={(e) => setDestId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4">
          {fonds.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Montant (FC)</label>
        <input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Motif</label>
        <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="ex: Compléter le budget Bulletin" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-5" />

        <p className="text-[11px] text-slate-400 mb-4">Le transfert reste "en attente" jusqu'à validation du Directeur — jamais automatique.</p>

        <button disabled={saving} onClick={submit} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {saving ? "Envoi…" : "Soumettre le transfert"}
        </button>
      </div>
    </div>
  );
}
