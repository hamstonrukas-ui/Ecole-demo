import React, { useState, useEffect } from "react";
import { X, Loader2, UserCog, Trash2 } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import { fetchClasses, fetchAnneeActive } from "../../lib/api/classes";
import {
  fetchEnseignants, fetchMatieres, fetchEnseignantPrincipal, assignerEnseignantPrincipal,
  fetchAffectationsMatieres, assignerEnseignantMatiere, retirerAffectationMatiere,
} from "../../lib/api/affectations";

export default function AffectationsEnseignants({ role, onLogout, onBack }) {
  const [classes, setClasses] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [anneeActive, setAnneeActive] = useState(null);
  const [classeId, setClasseId] = useState("");
  const [principal, setPrincipal] = useState(null);
  const [affectationsMatieres, setAffectationsMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newMatiereId, setNewMatiereId] = useState("");
  const [newEnseignantId, setNewEnseignantId] = useState("");

  useEffect(() => {
    Promise.all([fetchClasses(), fetchEnseignants(), fetchAnneeActive()])
      .then(([c, e, a]) => { setClasses(c); setEnseignants(e); setAnneeActive(a); if (c[0]) setClasseId(c[0].id); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!classeId || !anneeActive) return;
    Promise.all([fetchEnseignantPrincipal(classeId), fetchAffectationsMatieres(classeId), fetchMatieres(anneeActive.id)])
      .then(([p, aff, mat]) => { setPrincipal(p); setAffectationsMatieres(aff); setMatieres(mat); if (mat[0]) setNewMatiereId(mat[0].id); if (enseignants[0]) setNewEnseignantId(enseignants[0].id); })
      .catch((err) => setError(err.message));
  }, [classeId, anneeActive]);

  async function changerPrincipal(enseignantId) {
    try {
      await assignerEnseignantPrincipal(classeId, enseignantId);
      const p = await fetchEnseignantPrincipal(classeId);
      setPrincipal(p);
    } catch (e) { setError(e.message); }
  }

  async function ajouterAffectationMatiere() {
    if (!newMatiereId || !newEnseignantId) return;
    try {
      await assignerEnseignantMatiere(classeId, newMatiereId, newEnseignantId);
      const aff = await fetchAffectationsMatieres(classeId);
      setAffectationsMatieres(aff);
    } catch (e) { setError(e.message); }
  }

  async function retirer(id) {
    try {
      await retirerAffectationMatiere(id);
      setAffectationsMatieres((a) => a.filter((x) => x.id !== id));
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} onBack={onBack} title="Affectations enseignants" subtitle="Administration scolaire" />
      <div className="max-w-4xl mx-auto p-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : classes.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-xl px-4 py-3">Crée d'abord au moins une classe.</div>
        ) : enseignants.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-xl px-4 py-3">Aucun compte Enseignant n'existe encore — demande à l'Admin Technique d'en créer un.</div>
        ) : (
          <>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Classe</label>
            <select value={classeId} onChange={(e) => setClasseId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-6">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
              <div className="flex items-center gap-2 mb-3"><UserCog size={16} className="text-sky-600" /><span className="font-bold text-slate-700 text-sm">Enseignant principal</span></div>
              <select value={principal?.enseignant_id || ""} onChange={(e) => changerPrincipal(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm">
                <option value="">— Aucun —</option>
                {enseignants.map((e) => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="font-bold text-slate-700 text-sm mb-3">Enseignant par matière</div>

              {matieres.length === 0 ? (
                <p className="text-sm text-slate-400 mb-3">Aucune matière créée pour cette année scolaire (les matières se créent en Période 1, depuis l'espace enseignant).</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {affectationsMatieres.length === 0 && <p className="text-sm text-slate-400">Aucune affectation pour l'instant.</p>}
                  {affectationsMatieres.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                      <span className="text-slate-700">{a.matiere?.nom} → {a.enseignant?.nom_complet}</span>
                      <button onClick={() => retirer(a.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}

              {matieres.length > 0 && (
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Matière</label>
                    <select value={newMatiereId} onChange={(e) => setNewMatiereId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-sm">
                      {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Enseignant</label>
                    <select value={newEnseignantId} onChange={(e) => setNewEnseignantId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-sm">
                      {enseignants.map((e) => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}
                    </select>
                  </div>
                  <button onClick={ajouterAffectationMatiere} className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold px-4 py-2 rounded-xl">Affecter</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
  
