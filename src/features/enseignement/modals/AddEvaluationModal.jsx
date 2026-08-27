import React, { useState } from "react";
import { X } from "lucide-react";

export default function AddEvaluationModal({ subjects, defaultCours, onAdd, onClose }) {
  const [cours, setCours] = useState(defaultCours);
  const [nom, setNom] = useState("");
  const [max, setMax] = useState(40);

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 text-lg">Nouvelle évaluation</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Cours</label>
        <select value={cours} onChange={(e) => setCours(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400">
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom de l'évaluation</label>
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex: Interro 3" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400" />
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Points maximum</label>
        <input type="number" value={max} onChange={(e) => setMax(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-sky-400" />
        <button onClick={() => nom.trim() && max && onAdd({ cours, nom: nom.trim(), max: Number(max) })} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors">Ajouter</button>
      </div>
    </div>
  );
}
