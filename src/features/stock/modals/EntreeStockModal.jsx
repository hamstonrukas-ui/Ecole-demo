import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { fetchArticles, fetchDepensesApprouveesLiables, enregistrerEntree } from "../../../lib/api/stock";

export default function EntreeStockModal({ utilisateurId, onClose, onSuccess }) {
  const [articles, setArticles] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [articleId, setArticleId] = useState("");
  const [quantite, setQuantite] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [depenseId, setDepenseId] = useState("");
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchArticles(), fetchDepensesApprouveesLiables()])
      .then(([a, d]) => { setArticles(a); setDepenses(d); if (a[0]) setArticleId(a[0].id); })
      .catch((e) => setError(e.message));
  }, []);

  async function submit() {
    if (!articleId || !quantite) return;
    setSaving(true);
    try {
      await enregistrerEntree({ articleId, quantite: Number(quantite), fournisseur: fournisseur.trim() || null, depenseId: depenseId || null, motif: motif.trim() || null, utilisateurId });
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
          <h3 className="font-black text-slate-800 text-lg">Entrée de stock</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Article</label>
        <select value={articleId} onChange={(e) => setArticleId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4">
          {articles.map((a) => <option key={a.id} value={a.id}>{a.nom} ({a.unite_mesure})</option>)}
        </select>

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Quantité reçue</label>
        <input type="number" min={0} value={quantite} onChange={(e) => setQuantite(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Fournisseur (optionnel)</label>
        <input value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Lier à une dépense approuvée (optionnel)</label>
        <select value={depenseId} onChange={(e) => setDepenseId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4">
          <option value="">— Aucune —</option>
          {depenses.map((d) => <option key={d.id} value={d.id}>{d.reference} — {d.motif} ({Number(d.montant).toLocaleString("fr-FR")} FC)</option>)}
        </select>

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Note (optionnel)</label>
        <input value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-5" />

        <button disabled={saving} onClick={submit} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {saving ? "Enregistrement…" : "Enregistrer l'entrée"}
        </button>
      </div>
    </div>
  );
}
