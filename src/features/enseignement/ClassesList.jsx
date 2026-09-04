import React, { useState, useEffect } from "react";
import { Plus, Users, X, Loader2 } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import { fetchClasses, createClasse, fetchAnneeActive } from "../../lib/api/classes";

export default function ClassesList({ role, onLogout, onBack, onOpenClasse }) {
  const [classes, setClasses] = useState([]);
  const [anneeActive, setAnneeActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newNom, setNewNom] = useState("");
  const [newNiveau, setNewNiveau] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([fetchClasses(), fetchAnneeActive()])
      .then(([c, annee]) => { if (active) { setClasses(c); setAnneeActive(annee); } })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function submit() {
    if (!newNom.trim()) return;
    if (!anneeActive) { setError("Aucune année scolaire active — demande à l'Admin Technique d'en créer une avant de créer des classes."); return; }
    setSaving(true);
    try {
      const created = await createClasse({ nom: newNom.trim(), niveau: newNiveau.trim(), annee_scolaire_id: anneeActive.id });
      setClasses((cs) => [...cs, { id: created.id, nom: created.nom, enseignant: "Non affecté" }]);
      setNewNom(""); setNewNiveau(""); setShowCreate(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} title="Enseignement" subtitle="Toutes les classes de l'établissement" onBack={onBack} />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-700">Classes ({classes.length})</h2>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-red-200 transition-colors">
            <Plus size={16} /> Créer classe
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        {!loading && !anneeActive && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-xl px-4 py-3 mb-4">
            Aucune année scolaire active n'est configurée — la création de classe restera bloquée tant qu'elle n'existe pas.
          </div>
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement des classes…</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {classes.map((c, i) => (
              <button key={c.id} onClick={() => onOpenClasse(c.id)} className="text-left bg-white rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all overflow-hidden">
                <div className={`h-2 ${["bg-sky-500", "bg-yellow-400", "bg-red-500"][i % 3]}`} />
                <div className="p-5">
                  <div className="font-black text-slate-800 text-lg">{c.nom}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{c.enseignant}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-lg">Créer une classe</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            {anneeActive && <p className="text-xs text-slate-400 mb-4">Année scolaire : {anneeActive.libelle}</p>}
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom de la classe</label>
            <input value={newNom} onChange={(e) => setNewNom(e.target.value)} placeholder="ex: 3ème C" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Niveau</label>
            <input value={newNiveau} onChange={(e) => setNewNiveau(e.target.value)} placeholder="ex: Secondaire 1" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <button disabled={saving} onClick={submit} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {saving ? "Création…" : "Créer la classe"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
