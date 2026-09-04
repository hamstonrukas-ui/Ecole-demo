import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Megaphone } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";
import { fetchMesCommuniques, createCommunique, publierCommunique } from "../../lib/api/communiques";

export default function CommuniquesList({ role, onLogout, onBack, userId }) {
  const [communiques, setCommuniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [saving, setSaving] = useState(false);

  function reload() {
    setLoading(true);
    fetchMesCommuniques(userId).then(setCommuniques).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(reload, [userId]);

  async function submit() {
    if (!titre.trim() || !contenu.trim()) return;
    setSaving(true);
    try {
      await createCommunique({ titre: titre.trim(), contenu: contenu.trim(), creeParId: userId });
      setTitre(""); setContenu(""); setShowCreate(false);
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function publier(id) {
    try {
      await publierCommunique(id, userId);
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} onBack={onBack} title="Communiqués" subtitle="Administration scolaire" />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-700">Mes communiqués</h2>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-red-200">
            <Plus size={16} /> Nouveau communiqué
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : (
          <div className="space-y-3">
            {communiques.length === 0 && <div className="text-sm text-slate-400 flex items-center gap-2"><Megaphone size={16} /> Aucun communiqué pour l'instant.</div>}
            {communiques.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800">{c.titre}</span>
                  <Chip tone={c.statut === "publie" ? "sky" : c.statut === "archive" ? "white" : "yellow"}>
                    {c.statut === "publie" ? "Publié" : c.statut === "archive" ? "Archivé" : "Brouillon"}
                  </Chip>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap mb-2">{c.contenu}</p>
                {c.statut === "brouillon" && (
                  <button onClick={() => publier(c.id)} className="text-xs font-bold text-sky-600 hover:underline">Publier →</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-lg">Nouveau communiqué</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Titre</label>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="ex: Reprise des cours" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Contenu</label>
            <textarea value={contenu} onChange={(e) => setContenu(e.target.value)} className="w-full h-28 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-5 resize-none" />
            <button disabled={saving} onClick={submit} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {saving ? "Enregistrement…" : "Enregistrer en brouillon"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
        }
                              
