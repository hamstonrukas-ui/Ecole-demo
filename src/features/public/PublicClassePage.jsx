import React, { useState, useEffect } from "react";
import { ArrowLeft, BookMarked, Pin, Backpack, Loader2, Lock } from "lucide-react";
import Chip from "../../components/ui/Chip";
import { fetchViePubliqueClasse } from "../../lib/api/public";

function fmt(d) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export default function PublicClassePage({ classe, onBack }) {
  const [lecons, setLecons] = useState([]);
  const [devoirs, setDevoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchViePubliqueClasse(classe.id)
      .then(({ lecons, devoirs }) => { setLecons(lecons); setDevoirs(devoirs); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [classe.id]);

  // Regroupement des leçons par matière, comme sur la maquette imprimée.
  const parMatiere = {};
  lecons.forEach((l) => {
    const nom = l.matiere?.nom || "Autre";
    (parMatiere[nom] ||= []).push(l);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-700"><ArrowLeft size={20} /></button>
          <div>
            <div className="font-black text-slate-800">{classe.nom}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1"><Lock size={10} /> Espace public — aucune donnée d'élève affichée</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : (
          <>
            {devoirs.length > 0 && (
              <section>
                <h2 className="font-bold text-slate-700 mb-3">À faire / à apporter</h2>
                <div className="space-y-2">
                  {devoirs.map((d, i) => (
                    <div key={i} className={`rounded-2xl border p-4 ${d.type === "a_apporter" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-300"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {d.type === "a_apporter" ? <Backpack size={14} className="text-red-600" /> : <Pin size={14} className="text-yellow-700" />}
                        <span className={`text-xs font-black ${d.type === "a_apporter" ? "text-red-700" : "text-yellow-800"}`}>
                          {d.type === "a_apporter" ? "À APPORTER" : "DEVOIR"} — {d.matiere?.nom || "Général"}
                        </span>
                        <Chip tone="white">{fmt(d.journee.date_jour)}</Chip>
                      </div>
                      <p className="text-sm text-slate-700">{d.contenu}</p>
                      {d.date_limite && <p className="text-xs text-slate-500 mt-1">Pour le {fmt(d.date_limite)}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="flex items-center gap-2 font-bold text-slate-700 mb-3"><BookMarked size={18} className="text-sky-600" /> Ce qui a été étudié</h2>
              {Object.keys(parMatiere).length === 0 ? (
                <p className="text-sm text-slate-400">Aucune leçon publiée pour l'instant.</p>
              ) : (
                <div className="space-y-5">
                  {Object.entries(parMatiere).map(([matiere, items]) => (
                    <div key={matiere}>
                      <div className="font-bold text-sky-700 text-sm mb-2">{matiere}</div>
                      <div className="space-y-1.5">
                        {items.map((l, i) => (
                          <div key={i} className="flex items-baseline gap-2 text-sm">
                            <span className="text-xs text-slate-400 w-20 shrink-0">{fmt(l.journee.date_jour)}</span>
                            <span className="text-slate-700">→ {l.lecon || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
