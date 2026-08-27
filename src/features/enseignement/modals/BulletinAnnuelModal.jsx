import React from "react";
import { X } from "lucide-react";
import { TRIMESTRE_PHASES, PHASE_LABELS } from "../../../constants/scolaire";

export default function BulletinAnnuelModal({ classe, eleve, bulletin, onClose }) {
  const b = bulletin;
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-0 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="bg-sky-500 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-xs uppercase tracking-wide text-sky-100">Bulletin annuel — {classe.nom}</div>
            <div className="font-black text-lg">{eleve}</div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-5">
          {b.trimestres.map((t) => (
            <div key={t.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5">
                <span className="font-bold text-slate-700 text-sm">{t.label}</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-1.5 font-semibold">Cours</th>
                    {TRIMESTRE_PHASES[t.id].map((k) => <th key={k} className="py-1.5 font-semibold text-center">{PHASE_LABELS[k].replace("Période ", "P").replace("Examen ", "Ex")}</th>)}
                    <th className="py-1.5 pr-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((r) => (
                    <tr key={r.subject.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-1.5 text-slate-700">{r.subject.nom}</td>
                      {r.cells.map((c) => <td key={c.key} className="py-1.5 text-center text-slate-500">{c.note === null ? "—" : c.note}</td>)}
                      <td className="py-1.5 pr-4 text-right font-bold text-slate-800">
                        {t.result ? `${t.result.details.find((d) => d.id === r.subject.id).note}/${t.result.details.find((d) => d.id === r.subject.id).max}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-sky-50/50">
                    <td className="px-4 py-1.5 font-bold text-slate-600">Pourcentage</td>
                    {t.statsByPhase.map((s) => (
                      <td key={s.key} className="py-1.5 text-center font-bold text-slate-600">{s.stats ? `${s.stats.pourcentage}%` : "—"}</td>
                    ))}
                    <td className="py-1.5 pr-4 text-right font-black text-sky-700">{t.result ? `${t.result.pourcentage}%` : "—"}</td>
                  </tr>
                  <tr className="bg-sky-50/50">
                    <td className="px-4 py-1.5 pb-2.5 font-bold text-slate-600">Place</td>
                    {t.statsByPhase.map((s) => (
                      <td key={s.key} className="py-1.5 pb-2.5 text-center font-bold text-slate-600">{s.stats ? `${s.stats.place}ᵉ` : "—"}</td>
                    ))}
                    <td className="py-1.5 pb-2.5 pr-4 text-right font-black text-sky-700">{t.result ? `${t.result.place}ᵉ` : "—"}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}

          <div className="border-2 border-yellow-300 rounded-xl overflow-hidden">
            <div className="bg-yellow-100 px-4 py-2.5">
              <span className="font-black text-yellow-900 text-sm">🎓 Total général de l'année</span>
            </div>
            {b.annee ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-1.5 font-semibold">Trimestre 1</th>
                    <th className="py-1.5 font-semibold text-center">Trimestre 2</th>
                    <th className="py-1.5 font-semibold text-center">Trimestre 3</th>
                    <th className="py-1.5 pr-4 font-semibold text-right">Total /an</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {b.trimestres.map((t) => (
                      <td key={t.id} className="px-4 py-2 text-center text-slate-700 font-medium">{t.result.total}/{t.result.totalMax}</td>
                    ))}
                    <td className="py-2 pr-4 text-right font-black text-slate-800">{b.annee.total}/{b.annee.totalMax}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-yellow-200 bg-yellow-50">
                    <td className="px-4 py-1.5 font-bold text-yellow-800" colSpan={3}>Pourcentage annuel</td>
                    <td className="py-1.5 pr-4 text-right font-black text-yellow-800">{b.annee.pourcentage}%</td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="px-4 py-1.5 pb-2.5 font-bold text-yellow-800" colSpan={3}>Place générale</td>
                    <td className="py-1.5 pb-2.5 pr-4 text-right font-black text-yellow-800">{b.annee.place ? `${b.annee.place}ᵉ` : "—"}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="text-slate-500 text-xs px-4 py-4 text-center">
                Le total général de l'année (mélange des 3 trimestres) s'affichera une fois les 3 trimestres calculés.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
