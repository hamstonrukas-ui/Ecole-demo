import React, { useState } from "react";
import { X } from "lucide-react";

export default function AddSubjectModal({ onAdd, onClose }) {
  const [nom, setNom] = useState("");
  const [pond, setPond] = useState(20);

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 text-lg">Ajouter un cours</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom du cours</label>
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex: Géographie" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400" />
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Pondération par période (points)</label>
        <input type="number" value={pond} onChange={(e) => setPond(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-sky-400" />
        <p className="text-[11px] text-slate-400 mb-4">Cette pondération se répète pour chaque période et double automatiquement à l'examen.</p>
        <button onClick={() => nom.trim() && pond && onAdd({ nom: nom.trim(), ponderation: Number(pond) })} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors">Ajouter le cours</button>
      </div>
    </div>
  );
}
