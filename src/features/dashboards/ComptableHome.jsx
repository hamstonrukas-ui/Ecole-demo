import React, { useState, useEffect } from "react";
import { BookOpen, ListChecks, AlertCircle, ShieldAlert, Loader2 } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";
import SectionCard from "../../components/ui/SectionCard";
import { fetchEcrituresBrouillon, fetchComptesNonValides, fetchBalanceApercu } from "../../lib/api/finance";

export default function ComptableHome({ role, onLogout, onOuvrirJournal, onGererPlanComptable }) {
  const [ecritures, setEcritures] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchEcrituresBrouillon(), fetchComptesNonValides(), fetchBalanceApercu()])
      .then(([e, c, b]) => { if (active) { setEcritures(e); setComptes(c); setBalance(b); } })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} title="Comptabilité" subtitle="Accueil comptable" />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <SectionCard icon={ListChecks} title="Écritures en brouillon">
                <div className="text-2xl font-black text-slate-800">{ecritures.length}</div>
                <button onClick={onOuvrirJournal} className="mt-2 text-xs font-bold text-sky-600 hover:underline">Ouvrir le journal →</button>
              </SectionCard>
              <SectionCard icon={ShieldAlert} title="Comptes SYSCOHADA à confirmer">
                <div className="text-2xl font-black text-slate-800">{comptes.length}</div>
                <button onClick={onGererPlanComptable} className="mt-2 text-xs font-bold text-sky-600 hover:underline">Gérer le plan comptable →</button>
              </SectionCard>
            </div>

            <SectionCard icon={AlertCircle} title="Comptes bloquant la génération d'écritures">
              <div className="space-y-2">
                {comptes.length === 0 && <div className="text-sm text-slate-400">Tous les comptes utilisés sont validés.</div>}
                {comptes.map((c) => (
                  <div key={c.numero} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                    <span className="text-slate-700">{c.numero} — {c.libelle}</span>
                    <Chip tone="red">Non validé</Chip>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard icon={BookOpen} title="Aperçu de la balance">
              <div className="space-y-2">
                {balance.length === 0 && <div className="text-sm text-slate-400">Aucune écriture validée pour l'instant.</div>}
                {balance.map((c) => (
                  <div key={c.compte_id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                    <span className="text-slate-700">{c.numero} — {c.libelle}</span>
                    <span className="font-bold text-slate-800">{Number(c.solde).toLocaleString("fr-FR")} FC</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
