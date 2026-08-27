import React from "react";
import { Lock, Trophy, X } from "lucide-react";
import Chip from "../../../components/ui/Chip";

// Utilisée à la fois pour le classement d'une période/examen et d'un trimestre —
// même structure d'affichage, seul le titre/icône changent.
export default function ClassementModal({ title, icon: Icon = Lock, rows, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Icon size={16} /> {title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-semibold w-14">Place</th>
                <th className="pb-2 font-semibold">Élève</th>
                <th className="pb-2 font-semibold text-right">Total</th>
                <th className="pb-2 font-semibold text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].sort((a, b) => a.place - b.place).map((b) => (
                <tr key={b.eleve} className="border-b border-slate-50 last:border-0">
                  <td className="py-2"><Chip tone={b.place === 1 ? "yellow" : "slate"}>{b.place}ᵉ</Chip></td>
                  <td className="py-2 text-slate-700 font-medium">{b.eleve}</td>
                  <td className="py-2 text-right font-bold text-slate-800">{b.total}/{b.totalMax}</td>
                  <td className="py-2 text-right text-slate-500">{b.pourcentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
