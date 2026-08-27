import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { fetchArticles, fetchSoldeStock, enregistrerSortie } from "../../../lib/api/stock";
import { fetchClasses } from "../../../lib/api/classes";

const MOTIFS = [
  { value: "distribution_classe", label: "Distribution à une classe" },
  { value: "distribution_service", label: "Distribution à un service" },
  { value: "consommation", label: "Consommation interne" },
  { value: "perte_casse", label: "Perte / casse" },
  { value: "peremption", label: "Péremption" },
  { value: "autre", label: "Autre" },
];

export default function SortieStockModal({ utilisateurId, onClose, onSuccess }) {
  const [articles, setArticles] = useState([]);
  const [soldes, setSoldes] = useState({});
  const [classes, setClasses] = useState([]);
  const [articleId, setArticleId] = useState("");
  const [quantite, setQuantite] = useState("");
  const [motifSortie, setMotifSortie] = useState("distribution_classe");
  const [classeId, setClasseId] = useState("");
  const [beneficiaire, setBeneficiaire] = useState("");
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchArticles(), fetchSoldeStock(), fetchClasses()])
      .then(([a, s, c]) => {
        setArticles(a);
        setSoldes(Object.fromEntries(s.map((row) => [row.article_id, row.quantite_disponible])));
        setClasses(c);
        if (a[0]) setArticleId(a[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  const disponible = soldes[articleId];
  const necessiteMotifTexte = motifSortie === "perte_casse" || motifSortie === "peremption";

  async function submit() {
    if (!articleId || !quantite) return;
    if (necessiteMotifTexte && !motif.trim()) { setError("Un motif détaillé est requis pour une perte, casse ou péremption."); return; }
    setSaving(true);
    try {
      await enregistrerSortie({
        articleId, quantite: Number(quantite), motifSortie,
        classeId: motifSortie === "distribution_classe" ? classeId || null : null,
        beneficiaire: motifSortie === "distribution_service" ? beneficiaire.trim() || null : null,
        motif: motif.trim() || null, utilisateurId,
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
          <h3 className="font-black text-slate-800 text-lg">Sortie de stock</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Article</label>
        <select value={articleId} onChange={(e) => setArticleId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-1">
          {articles.map((a) => <option key={a.id} value={a.id}>{a.nom} ({a.unite_mesure})</option>)}
        </select>
        {disponible !== undefined && <p className="text-[11px] text-slate-400 mb-4">Disponible : {disponible}</p>}

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Quantité</label>
        <input type="number" min={0} value={quantite} onChange={(e) => setQuantite(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Motif</label>
        <select value={motifSortie} onChange={(e) => setMotifSortie(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4">
          {MOTIFS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        {motifSortie === "distribution_classe" && (
          <>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Classe bénéficiaire</label>
            <select value={classeId} onChange={(e) => setClasseId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4">
              <option value="">— Choisir —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </>
        )}
        {motifSortie === "distribution_service" && (
          <>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Service / personne bénéficiaire</label>
            <input value={beneficiaire} onChange={(e) => setBeneficiaire(e.target.value)} placeholder="ex: Secrétariat" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />
          </>
        )}

        <label className="block text-xs font-bold text-slate-500 mb-1.5">
          Note {necessiteMotifTexte && <span className="text-red-500">(obligatoire)</span>}
        </label>
        <input value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-5" />

        <button disabled={saving} onClick={submit} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {saving ? "Enregistrement…" : "Enregistrer la sortie"}
        </button>
      </div>
    </div>
  );
}
