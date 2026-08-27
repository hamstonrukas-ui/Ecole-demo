import React from "react";
import { History, X, Lock } from "lucide-react";
import Chip from "../../../components/ui/Chip";
import { fmtDateShort } from "../../../utils/dates";

// `closedDays` : tableau de [dateISO ('YYYY-MM-DD'), { presents }], le plus récent en premier.
export default function HistoriqueModal({ closedDays, onSelectDay, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><History size={18} /> Historique</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto space-y-2 pr-1">
          {closedDays.length === 0 && <div className="text-sm text-slate-400 text-center py-4">Aucune journée clôturée pour l'instant.</div>}
          {closedDays.map(([dateIso, d]) => (
            <button key={dateIso} onClick={() => onSelectDay(dateIso)} className="w-full text-left flex items-center justify-between bg-slate-50 hover:bg-sky-50 rounded-xl px-4 py-3 border border-slate-100">
              <div>
                <div className="font-bold text-slate-700 text-sm capitalize">{fmtDateShort(new Date(dateIso))}</div>
                <div className="text-xs text-slate-400">{d.presents} élèves dans la classe</div>
              </div>
              <Chip tone="sky"><Lock size={11} /> Clôturé</Chip>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
