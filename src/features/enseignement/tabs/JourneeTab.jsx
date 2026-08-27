import React from "react";
import { ChevronLeft, ChevronRight, Lock, History, Check, ClipboardCheck, CalendarClock, FileText, Stamp } from "lucide-react";
import Chip from "../../../components/ui/Chip";
import SectionCard from "../../../components/ui/SectionCard";
import { HORAIRE_SLOTS } from "../../../constants/scolaire";
import { fmtDate } from "../../../utils/dates";

export default function JourneeTab({
  classe, day, currentDate, current, isCloture,
  attendance, horaire, rapport,
  onGoToDay, onToggleEleve, onSetHoraireSlot, onSetRapport,
  onShowHistorique, onCloturerJournee,
}) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="absolute left-10 top-0 bottom-0 w-px bg-red-300" />
        <div className="flex items-center justify-between px-6 py-4 pl-16 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={() => onGoToDay(day - 1)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><ChevronLeft size={16} /></button>
            <div>
              <div className="font-black text-xl text-slate-800 leading-tight capitalize">{fmtDate(currentDate)}</div>
              <div className="text-xs text-slate-400 mt-0.5">Année scolaire 2025-2026</div>
            </div>
            <button onClick={() => onGoToDay(day + 1)} disabled={day >= 0} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
          </div>
          <div className="flex items-center gap-2">
            {isCloture ? <Chip tone="sky"><Lock size={12} /> Clôturé</Chip> : <Chip tone="yellow">En cours</Chip>}
            <button onClick={onShowHistorique} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 px-3 py-2 rounded-lg border border-slate-200">
              <History size={14} /> Historique
            </button>
          </div>
        </div>
      </div>

      {isCloture && (
        <div className="bg-sky-50 border border-sky-200 text-sky-800 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
          <Check size={16} /> Cette journée est clôturée — données archivées et consultables en lecture seule.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <SectionCard icon={ClipboardCheck} title="Appel" done={isCloture}>
          <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {classe.eleves.map((e) => (
              <li key={e} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{e}</span>
                <button disabled={isCloture} onClick={() => onToggleEleve(e)} className={`text-xs font-bold px-2.5 py-1 rounded-full border ${attendance[e] ? "bg-sky-100 text-sky-700 border-sky-300" : "bg-red-100 text-red-700 border-red-300"} ${isCloture ? "opacity-60" : ""}`}>
                  {attendance[e] ? "Présent" : "Absent"}
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard icon={CalendarClock} title="Grille horaire du jour" done={isCloture}>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {HORAIRE_SLOTS.map((slot) =>
              slot.recreation ? (
                <div key={slot.id} className="text-center text-xs font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg py-1.5">☀ {slot.label}</div>
              ) : (
                <div key={slot.id} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-20 shrink-0">{slot.label}</span>
                  {isCloture ? (
                    <span className="text-sm text-slate-700 font-medium">{current?.horaire?.[slot.id] || "—"}</span>
                  ) : (
                    <input
                      value={horaire[slot.id] || ""}
                      onChange={(e) => onSetHoraireSlot(slot.id, e.target.value)}
                      placeholder="Matière"
                      className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  )}
                </div>
              )
            )}
          </div>
        </SectionCard>

        <div className="sm:col-span-2">
          <SectionCard icon={FileText} title="Rapport du jour" done={isCloture}>
            {isCloture ? (
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{current?.rapport}</p>
            ) : (
              <textarea value={rapport} onChange={(e) => onSetRapport(e.target.value)} placeholder="Résumé de la journée, incidents, remarques..." className="w-full h-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
            )}
          </SectionCard>
        </div>
      </div>

      {!isCloture && (
        <button onClick={onCloturerJournee} className="mt-6 w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-200 transition-colors">
          <Stamp size={20} /> Clôturer la journée
        </button>
      )}
    </div>
  );
}
