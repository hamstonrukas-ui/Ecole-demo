import React, { useState, useEffect } from "react";
import { GraduationCap, Megaphone, Loader2, ArrowRight } from "lucide-react";
import { fetchCommuniquesPublics, fetchClassesPubliques } from "../../lib/api/public";

// Accueil public — accessible sans connexion. Aucune donnée élève, note,
// présence ou information financière n'y transite (RLS le garantit déjà,
// mais les requêtes elles-mêmes ne sélectionnent que du contenu public).
export default function PublicHome({ nomEcole = "École Connectée", onOpenClasse, onConnexionPersonnel }) {
  const [communiques, setCommuniques] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchCommuniquesPublics(), fetchClassesPubliques()])
      .then(([c, cl]) => { setCommuniques(c); setClasses(cl); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-sky-500 text-white">
        <div className="max-w-3xl mx-auto px-6 py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={26} />
          </div>
          <h1 className="text-2xl font-black">{nomEcole}</h1>
          <p className="text-sky-100 text-sm mt-1.5">Bienvenue sur notre espace public</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : (
          <>
            <section>
              <h2 className="flex items-center gap-2 font-bold text-slate-700 mb-3"><Megaphone size={18} className="text-sky-600" /> Communiqués officiels</h2>
              {communiques.length === 0 ? (
                <p className="text-sm text-slate-400">Aucun communiqué publié pour l'instant.</p>
              ) : (
                <div className="space-y-3">
                  {communiques.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                      <div className="text-xs text-slate-400 mb-1">{new Date(c.date_publication).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div>
                      <div className="font-bold text-slate-800">{c.titre}</div>
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{c.contenu}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-bold text-slate-700 mb-3">Classes</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {classes.map((c) => (
                  <button key={c.id} onClick={() => onOpenClasse(c)} className="flex items-center justify-between bg-white border border-slate-200 hover:border-sky-400 hover:shadow-md rounded-2xl px-4 py-3.5 text-left transition-all">
                    <div>
                      <div className="font-bold text-slate-800">{c.nom}</div>
                      <div className="text-xs text-slate-400">Voir les leçons et devoirs</div>
                    </div>
                    <ArrowRight size={16} className="text-sky-500" />
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        <button onClick={onConnexionPersonnel} className="text-xs font-bold text-slate-400 hover:text-sky-600 mx-auto block pt-4">
          Connexion personnel →
        </button>
      </div>
    </div>
  );
}
