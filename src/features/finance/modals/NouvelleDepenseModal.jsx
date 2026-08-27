import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { fetchFondsListe, fetchCategoriesDepense, createDepense } from "../../../lib/api/finance";

export default function NouvelleDepenseModal({ demandeurId, onClose, onSuccess }) {
  const [fonds, setFonds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fondsId, setFondsId] = useState("");
  const [categorieId, setCategorieId] = useState("");
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchFondsListe(), fetchCategoriesDepense()])
      .then(([f, c]) => { setFonds(f); setCategories(c); if (f[0]) setFondsId(f[0].id); if (c[0]) setCategorieId(c[0].id); })
      .catch((e) => setError(e.message));
  }, []);

  async function submit() {
    if (!fondsId || !categorieId || !montant || !motif.trim()) return;
    setSaving(true);
    try {
      await createDepense({ fondsId, categorieDepenseId: categorieId, montant: Number(montant), motif: motif.trim(), fournisseur: fournisseur.trim() || null, demandeurId });
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
          <h3 className="font-black text-slate-800 text-lg">Nouvelle demande de dépense</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Fonds concerné</label>
        <select value={fondsId} onChange={(e) => setFondsId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4">
          {fonds.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Catégorie de dépense</label>
        <select value={categorieId} onChange={(e) => setCategorieId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Montant (FC)</label>
        <input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Motif</label>
        <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="ex: Achat de tôles" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Fournisseur (optionnel)</label>
        <input value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-5" />

        <p className="text-[11px] text-slate-400 mb-4">La demande part au statut "en attente d'approbation" — un Directeur devra la valider avant tout paiement.</p>

        <button disabled={saving} onClick={submit} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {saving ? "Envoi…" : "Soumettre la demande"}
        </button>
      </div>
    </div>
  );
}
