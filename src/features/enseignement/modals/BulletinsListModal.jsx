import React from "react";
import { BookOpenCheck, X } from "lucide-react";

export default function BulletinsListModal({ classe, onSelectEleve, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><BookOpenCheck size={18} /> Bulletins — {classe.nom}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto space-y-2 pr-1">
          {classe.eleves.map((e) => (
            <button key={e} onClick={() => onSelectEleve(e)} className="w-full text-left flex items-center justify-between bg-slate-50 hover:bg-sky-50 rounded-xl px-4 py-3 border border-slate-100">
              <span className="font-bold text-slate-700 text-sm">{e}</span>
              <span className="text-xs font-bold text-sky-600">Voir →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
