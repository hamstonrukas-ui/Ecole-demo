import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Users } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";
import { fetchTousLesEleves, createEleve, fetchAnneeActive } from "../../lib/api/classes";
import { fetchClasses } from "../../lib/api/classes";

export default function ElevesList({ role, onLogout, onBack }) {
  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [anneeActive, setAnneeActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [matricule, setMatricule] = useState("");
  const [nom, setNom] = useState("");
  const [postnom, setPostnom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [sexe, setSexe] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [classeId, setClasseId] = useState("");
  const [responsableNom, setResponsableNom] = useState("");
  const [responsableTelephone, setResponsableTelephone] = useState("");

  function reload() {
    setLoading(true);
    Promise.all([fetchTousLesEleves(), fetchClasses(), fetchAnneeActive()])
      .then(([e, c, a]) => { setEleves(e); setClasses(c); setAnneeActive(a); if (c[0]) setClasseId(c[0].id); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function submit() {
    if (!matricule.trim() || !nom.trim() || !classeId) return;
    if (!anneeActive) { setError("Aucune année scolaire active."); return; }
    setSaving(true);
    try {
      await createEleve({
        matricule: matricule.trim(), nom: nom.trim(), postnom: postnom.trim(), prenom: prenom.trim(),
        sexe, dateNaissance, classeId, anneeScolaireId: anneeActive.id,
        responsableNom: responsableNom.trim(), responsableTelephone: responsableTelephone.trim(),
      });
      setMatricule(""); setNom(""); setPostnom(""); setPrenom(""); setSexe(""); setDateNaissance("");
      setResponsableNom(""); setResponsableTelephone("");
      setShowCreate(false);
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} onBack={onBack} title="Élèves" subtitle="Administration scolaire" />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-700">Élèves ({eleves.length})</h2>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-red-200">
            <Plus size={16} /> Inscrire un élève
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        {!loading && !anneeActive && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-xl px-4 py-3 mb-4">Aucune année scolaire active.</div>
        )}
        {!loading && classes.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-xl px-4 py-3 mb-4">Crée d'abord au moins une classe avant d'inscrire un élève.</div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {eleves.length === 0 && <div className="p-5 text-sm text-slate-400 flex items-center gap-2"><Users size={16} /> Aucun élève inscrit pour l'instant.</div>}
            {eleves.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{e.prenom} {e.nom} {e.postnom}</div>
                  <div className="text-xs text-slate-400">{e.matricule} — {e.classe?.nom || "Sans classe"}</div>
                </div>
                <Chip tone={e.statut === "actif" ? "sky" : "white"}>{e.statut}</Chip>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-lg">Inscrire un élève</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <label className="block text-xs font-bold text-slate-500 mb-1.5">Matricule</label>
            <input value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="ex: MAT-2026-0001" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-3" />

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom</label>
                <input value={nom} onChange={(e) => setNom(e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Postnom</label>
                <input value={postnom} onChange={(e) => setPostnom(e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Prénom</label>
                <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-2.5 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Sexe</label>
                <select value={sexe} onChange={(e) => setSexe(e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-2.5 text-sm">
                  <option value="">—</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Date de naissance</label>
                <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-2.5 text-sm" />
              </div>
            </div>

            <label className="block text-xs font-bold text-slate-500 mb-1.5">Classe</label>
            <select value={classeId} onChange={(e) => setClasseId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-3">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>

            <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom du responsable</label>
            <input value={responsableNom} onChange={(e) => setResponsableNom(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-3" />

            <label className="block text-xs font-bold text-slate-500 mb-1.5">Téléphone du responsable</label>
            <input value={responsableTelephone} onChange={(e) => setResponsableTelephone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-5" />

            <button disabled={saving} onClick={submit} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {saving ? "Inscription…" : "Inscrire l'élève"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
         }
        
