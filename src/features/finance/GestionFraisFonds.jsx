import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Wallet, Tag } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import SectionCard from "../../components/ui/SectionCard";
import { fetchFondsListe, fetchTypesFrais, createFonds, createTypeFrais } from "../../lib/api/finance";

// Réservé au Directeur : "Le directeur crée et gère les types de frais/fonds
// utilisés par l'école" (cahier des charges). Un fonds porte le solde réel ;
// un type de frais est ce que paie l'élève et se rattache à un fonds par défaut.
export default function GestionFraisFonds({ role, onLogout, onBack }) {
  const [fonds, setFonds] = useState([]);
  const [typesFrais, setTypesFrais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showFonds, setShowFonds] = useState(false);
  const [showTypeFrais, setShowTypeFrais] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fondsCode, setFondsCode] = useState("");
  const [fondsNom, setFondsNom] = useState("");
  const [fondsDesc, setFondsDesc] = useState("");

  const [tfCode, setTfCode] = useState("");
  const [tfNom, setTfNom] = useState("");
  const [tfFondsId, setTfFondsId] = useState("");

  function reload() {
    setLoading(true);
    Promise.all([fetchFondsListe(), fetchTypesFrais()])
      .then(([f, t]) => { setFonds(f); setTypesFrais(t); if (f[0]) setTfFondsId(f[0].id); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function submitFonds() {
    if (!fondsCode.trim() || !fondsNom.trim()) return;
    setSaving(true);
    try {
      await createFonds({ code: fondsCode.trim(), nom: fondsNom.trim(), description: fondsDesc.trim() });
      setFondsCode(""); setFondsNom(""); setFondsDesc(""); setShowFonds(false);
      reload();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function submitTypeFrais() {
    if (!tfCode.trim() || !tfNom.trim() || !tfFondsId) return;
    setSaving(true);
    try {
      await createTypeFrais({ code: tfCode.trim(), nom: tfNom.trim(), fondsIdDefaut: tfFondsId });
      setTfCode(""); setTfNom(""); setShowTypeFrais(false);
      reload();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} onBack={onBack} title="Frais & fonds" subtitle="Configuration — Directeur" />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : (
          <>
            <SectionCard
              icon={Wallet}
              title={`Fonds (${fonds.length})`}
              right={<button onClick={() => setShowFonds(true)} className="flex items-center gap-1 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg"><Plus size={12} /> Nouveau fonds</button>}
            >
              <div className="space-y-2">
                {fonds.length === 0 && <p className="text-sm text-slate-400">Aucun fonds créé — par exemple : Minerval, Construction, Bulletin, Cantine.</p>}
                {fonds.map((f) => (
                  <div key={f.id} className="text-sm border-b border-slate-50 last:border-0 py-2 text-slate-700">{f.nom}</div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={Tag}
              title={`Types de frais (${typesFrais.length})`}
              right={<button onClick={() => setShowTypeFrais(true)} disabled={fonds.length === 0} className="flex items-center gap-1 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-40"><Plus size={12} /> Nouveau type</button>}
            >
              {fonds.length === 0 ? (
                <p className="text-sm text-slate-400">Crée d'abord au moins un fonds — chaque type de frais doit lui être rattaché.</p>
              ) : (
                <div className="space-y-2">
                  {typesFrais.length === 0 && <p className="text-sm text-slate-400">Aucun type de frais créé pour l'instant.</p>}
                  {typesFrais.map((t) => (
                    <div key={t.id} className="text-sm border-b border-slate-50 last:border-0 py-2 text-slate-700">{t.nom}</div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>

      {showFonds && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-lg">Nouveau fonds</h3>
              <button onClick={() => setShowFonds(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Code</label>
            <input value={fondsCode} onChange={(e) => setFondsCode(e.target.value)} placeholder="ex: CONSTRUCTION" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom</label>
            <input value={fondsNom} onChange={(e) => setFondsNom(e.target.value)} placeholder="ex: Construction" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Description (optionnel)</label>
            <input value={fondsDesc} onChange={(e) => setFondsDesc(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-5" />
            <button disabled={saving} onClick={submitFonds} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-60">
              {saving ? "Création…" : "Créer le fonds"}
            </button>
          </div>
        </div>
      )}

      {showTypeFrais && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-lg">Nouveau type de frais</h3>
              <button onClick={() => setShowTypeFrais(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Code</label>
            <input value={tfCode} onChange={(e) => setTfCode(e.target.value)} placeholder="ex: MINERVAL" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom</label>
            <input value={tfNom} onChange={(e) => setTfNom(e.target.value)} placeholder="ex: Minerval" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4" />
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Fonds de rattachement</label>
            <select value={tfFondsId} onChange={(e) => setTfFondsId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-5">
              {fonds.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            <button disabled={saving} onClick={submitTypeFrais} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-60">
              {saving ? "Création…" : "Créer le type de frais"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
    }
              
