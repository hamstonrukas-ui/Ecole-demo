import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { fetchCategoriesArticle, createArticle } from "../../../lib/api/stock";

export default function NouvelArticleModal({ onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [categorieId, setCategorieId] = useState("");
  const [unite, setUnite] = useState("pièce");
  const [seuil, setSeuil] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategoriesArticle().then((c) => { setCategories(c); if (c[0]) setCategorieId(c[0].id); }).catch((e) => setError(e.message));
  }, []);

  async function submit() {
    if (!code.trim() || !nom.trim() || !categorieId) return;
    setSaving(true);
    try {
      await createArticle({ code: code.trim(), nom: nom.trim(), categorieId, uniteMesure: unite.trim() || "pièce", seuilAlerte: Number(seuil) || 0 });
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
          <h3 className="font-black text-slate-800 text-lg">Nouvel article</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Code</label>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ex: CRA-001" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom de l'article</label>
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex: Craie blanche" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Catégorie</label>
        <select value={categorieId} onChange={(e) => setCategorieId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Unité</label>
            <input value={unite} onChange={(e) => setUnite(e.target.value)} placeholder="pièce, carton..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Seuil d'alerte</label>
            <input type="number" min={0} value={seuil} onChange={(e) => setSeuil(e.target.value)} placeholder="0" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm" />
          </div>
        </div>

        <button disabled={saving} onClick={submit} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {saving ? "Création…" : "Créer l'article"}
        </button>
      </div>
    </div>
  );
}
