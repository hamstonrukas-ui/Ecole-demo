import React from "react";
import { Check, Trophy, BookOpenCheck, BookMarked, Plus, PenLine, Pencil, Trash2, Award, Stamp } from "lucide-react";
import Chip from "../../../components/ui/Chip";
import SectionCard from "../../../components/ui/SectionCard";
import { TRIMESTRE_PHASES, TRIMESTRE_LABELS, PHASE_LABELS, PHASE_NEXT_LABEL, isExamPhase } from "../../../constants/scolaire";
import { cumulPourCours } from "../../../utils/bulletins";

export default function NotesTab({
  classe, subjects, evaluations, activeEval, activeEvalId, phase, pondMultiplier,
  periodHistory, trimestreResults,
  onSetActiveEvalId, onSetPoint, onValiderEvaluation, onModifierEvaluation, onSupprimerEvaluation,
  onShowAddSubject, onShowAddEval, onCloturerPhase,
  onViewPeriode, onViewTrimestre, onShowBulletins,
}) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Fil de progression de l'année, groupé par trimestre */}
      <div className="mb-6 space-y-2">
        {["t1", "t2", "t3"].map((t) => (
          <div key={t} className="flex items-center gap-1.5 flex-wrap">
            {TRIMESTRE_PHASES[t].map((k) => {
              const done = !!periodHistory[k];
              const isActive = phase === k;
              return (
                <button
                  key={k}
                  onClick={() => done && onViewPeriode(k)}
                  disabled={!done}
                  className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    done ? "bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200" : isActive ? "bg-sky-100 text-sky-800 border-sky-300" : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}
                >
                  {done && <Check size={10} />} {PHASE_LABELS[k]}
                </button>
              );
            })}
            <span className="text-slate-300 text-xs">=</span>
            <button
              onClick={() => trimestreResults[t] && onViewTrimestre(t)}
              disabled={!trimestreResults[t]}
              className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border ${trimestreResults[t] ? "bg-yellow-100 text-yellow-800 border-yellow-400 hover:bg-yellow-200" : "bg-slate-50 text-slate-300 border-slate-200"}`}
            >
              <Trophy size={10} /> {TRIMESTRE_LABELS[t]} {trimestreResults[t] ? "" : "— vide"}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-5">
        <button onClick={onShowBulletins} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold px-4 py-2.5 rounded-xl">
          <BookOpenCheck size={16} /> Bulletins des élèves
        </button>
      </div>

      {phase === "annee_finie" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="text-3xl mb-2">🎓</div>
          <h2 className="font-black text-slate-800 text-lg">Année scolaire terminée</h2>
          <p className="text-sm text-slate-500 mt-1">Les 3 trimestres sont calculés. Consultez les bulletins complets ci-dessus.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-bold text-slate-700 text-sm">Cours de la classe · {PHASE_LABELS[phase]}{isExamPhase(phase) && " (pondération ×2)"}</h2>
            {phase === "p1" ? (
              // En production : réservé au SECRÉTAIRE (préparation), verrouillé après validation du DIRECTEUR
              <button onClick={onShowAddSubject} className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-lg border border-sky-200">
                <BookMarked size={14} /> Ajouter un cours
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">Cours figés depuis la Période 1</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-6">
            {subjects.map((s) => <Chip key={s.id} tone="sky">{s.nom} · pond. {s.ponderation * pondMultiplier}{isExamPhase(phase) && ` (${s.ponderation}×2)`}</Chip>)}
          </div>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {evaluations.map((ev) => (
                <button key={ev.id} onClick={() => onSetActiveEvalId(ev.id)} className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border ${activeEvalId === ev.id ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"}`}>
                  {!ev.valide && <span className={`w-1.5 h-1.5 rounded-full ${activeEvalId === ev.id ? "bg-yellow-300" : "bg-yellow-400"}`} />}
                  {subjects.find((s) => s.id === ev.cours)?.nom} · {ev.nom}
                </button>
              ))}
              {evaluations.length === 0 && <span className="text-sm text-slate-400">Aucune évaluation pour l'instant.</span>}
            </div>
            {/* En production : réservé à l'ENSEIGNANT affecté à cette classe/matière */}
            <button onClick={onShowAddEval} className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shrink-0">
              <Plus size={16} /> Évaluation
            </button>
          </div>

          {activeEval && (
            <SectionCard
              icon={PenLine}
              title={`${subjects.find((s) => s.id === activeEval.cours)?.nom} — ${activeEval.nom} (sur ${activeEval.max} pts)`}
              right={
                <div className="flex items-center gap-1.5">
                  {activeEval.valide ? (
                    <>
                      <Chip tone="sky"><Check size={11} /> Validée</Chip>
                      <button onClick={onModifierEvaluation} title="Modifier" className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500"><Pencil size={13} /></button>
                    </>
                  ) : (
                    <Chip tone="yellow">Brouillon</Chip>
                  )}
                  <button onClick={() => onSupprimerEvaluation(activeEval.id)} title="Supprimer" className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500"><Trash2 size={13} /></button>
                </div>
              }
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-semibold">Élève</th>
                    <th className="pb-2 font-semibold w-28">Points obtenus</th>
                  </tr>
                </thead>
                <tbody>
                  {classe.eleves.map((e) => (
                    <tr key={e} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 text-slate-700">{e}</td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={0}
                          max={activeEval.max}
                          disabled={activeEval.valide}
                          value={activeEval.points[e] ?? ""}
                          onChange={(ev) => onSetPoint(e, ev.target.value)}
                          className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-50 disabled:text-slate-400"
                        />
                        <span className="text-slate-400 text-xs"> / {activeEval.max}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!activeEval.valide && (
                <button onClick={onValiderEvaluation} className="mt-4 w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors">
                  <Check size={16} /> OK, valider cette évaluation
                </button>
              )}
            </SectionCard>
          )}

          <div className="mt-5">
            <SectionCard icon={Award} title={`Cumul par cours — ${PHASE_LABELS[phase]} (évaluations validées)`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-semibold">Élève</th>
                    {subjects.map((s) => <th key={s.id} className="pb-2 font-semibold text-center">{s.nom}<div className="text-[10px] font-normal">pond. {s.ponderation * pondMultiplier}</div></th>)}
                  </tr>
                </thead>
                <tbody>
                  {classe.eleves.map((e) => (
                    <tr key={e} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 text-slate-700">{e}</td>
                      {subjects.map((s) => {
                        const { obtenu, max } = cumulPourCours(evaluations, s.id, e);
                        return <td key={s.id} className="py-2 text-center text-slate-600">{max > 0 ? `${obtenu}/${max}` : "—"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          </div>

          <button onClick={onCloturerPhase} className="mt-6 w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-200 transition-colors">
            <Stamp size={20} /> {PHASE_NEXT_LABEL[phase]}
          </button>
        </>
      )}
    </div>
  );
}
