import React, { useState, useEffect } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { searchEleves } from "../../../lib/api/classes";
import { fetchSituationParEleve } from "../../../lib/api/finance";
import { createPaiement } from "../../../lib/api/finance";

const MODES = [
  { value: "especes", label: "Espèces" },
  { value: "banque", label: "Banque" },
  { value: "mobile_money", label: "Mobile money" },
];

export default function NouveauPaiementModal({ tresorerieId, caissierId, onClose, onSuccess }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [eleve, setEleve] = useState(null);
  const [situation, setSituation] = useState([]);
  const [ventilation, setVentilation] = useState({}); // { type_frais_id: montant }
  const [mode, setMode] = useState("especes");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 2) searchEleves(query).then(setResults).catch(() => setResults([]));
      else setResults([]);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function selectEleve(e) {
    setEleve(e);
    setResults([]);
    setQuery("");
    try {
      const sit = await fetchSituationParEleve(e.id);
      setSituation(sit.filter((s) => Number(s.reste_a_payer) > 0));
      setVentilation({});
    } catch (err) {
      setError(err.message);
    }
  }

  const total = Object.values(ventilation).reduce((s, v) => s + (Number(v) || 0), 0);

  async function submit() {
    if (!eleve || total <= 0) return;
    setSaving(true);
    try {
      const rows = situation
        .filter((s) => Number(ventilation[s.type_frais_id]) > 0)
        .map((s) => ({ typeFraisId: s.type_frais_id, fondsId: s.type_frais.fonds_id_defaut, montant: Number(ventilation[s.type_frais_id]) }));
      await createPaiement({ eleveId: eleve.id, tresorerieId, caissierId, modePaiement: mode, ventilation: rows });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 text-lg">Nouveau paiement</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        {!eleve ? (
          <>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Rechercher un élève (nom ou matricule)</label>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ex: Jean K. ou MAT-2026-0184" className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            {results.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
                {results.map((r) => (
                  <button key={r.id} onClick={() => selectEleve(r)} className="w-full text-left px-3.5 py-2.5 hover:bg-sky-50 border-b border-slate-100 last:border-0">
                    <div className="text-sm font-bold text-slate-700">{r.prenom} {r.nom}</div>
                    <div className="text-xs text-slate-400">{r.matricule} — {r.classe?.nom}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 mb-4">
              <div>
                <div className="font-bold text-slate-800 text-sm">{eleve.prenom} {eleve.nom}</div>
                <div className="text-xs text-slate-500">{eleve.matricule}</div>
              </div>
              <button onClick={() => setEleve(null)} className="text-xs font-bold text-sky-600 hover:underline">Changer</button>
            </div>

            {situation.length === 0 ? (
              <div className="text-sm text-slate-400 mb-4">Aucun solde restant dû pour cet élève.</div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                {situation.map((s) => (
                  <div key={s.type_frais_id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-sm text-slate-700">{s.type_frais.nom}</div>
                      <div className="text-xs text-slate-400">Reste dû : {Number(s.reste_a_payer).toLocaleString("fr-FR")} FC</div>
                    </div>
                    <input
                      type="number" min={0} max={Number(s.reste_a_payer)}
                      value={ventilation[s.type_frais_id] || ""}
                      onChange={(e) => setVentilation((v) => ({ ...v, [s.type_frais_id]: e.target.value }))}
                      placeholder="0"
                      className="w-24 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                ))}
              </div>
            )}

            <label className="block text-xs font-bold text-slate-500 mb-1.5">Mode de paiement</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4">
              {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mb-4">
              <span className="font-bold text-slate-700">Total à encaisser</span>
              <span className="text-xl font-black text-slate-800">{total.toLocaleString("fr-FR")} FC</span>
            </div>

            <button disabled={saving || total <= 0} onClick={submit} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {saving ? "Enregistrement…" : "Enregistrer et générer le reçu"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
