import React from "react";
import { Wallet, ClipboardCheck, FileText, BookOpen, Tag } from "lucide-react";
import TopBar from "../../components/layout/TopBar";

// Portail Finance pour le Directeur — supervision en lecture des écrans
// déjà construits pour chaque rôle financier (Caisse, Contrôle, Dépenses,
// Comptabilité), sans dupliquer ce travail dans un nouvel écran.
export default function FinanceHub({ role, onLogout, onBack, onOpenCaisse, onOpenControle, onOpenFinances, onOpenComptabilite, onOpenFraisFonds }) {
  const cards = [
    { key: "caisse", label: "Caisse", desc: "Paiements, solde, dernières opérations", icon: Wallet, bg: "bg-sky-500", onClick: onOpenCaisse },
    { key: "controle", label: "Contrôle de caisse", desc: "Recettes à valider, clôtures", icon: ClipboardCheck, bg: "bg-yellow-400", onClick: onOpenControle },
    { key: "finances", label: "Dépenses & fonds", desc: "Solde des fonds, demandes de dépense", icon: FileText, bg: "bg-red-500", onClick: onOpenFinances },
    { key: "comptabilite", label: "Comptabilité", desc: "Écritures, journaux, balance", icon: BookOpen, bg: "bg-slate-700", onClick: onOpenComptabilite },
    { key: "fraisfonds", label: "Frais & fonds", desc: "Créer les fonds et types de frais de l'école", icon: Tag, bg: "bg-sky-500", onClick: onOpenFraisFonds },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} onBack={onBack} title="Finance et trésorerie" subtitle="Vue d'ensemble — Directeur" />
      <div className="max-w-4xl mx-auto p-6 grid sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <button key={c.key} onClick={c.onClick} className="text-left bg-white rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all p-5">
            <div className={`w-11 h-11 rounded-xl ${c.bg} text-white flex items-center justify-center mb-3`}>
              <c.icon size={20} />
            </div>
            <div className="font-black text-slate-800">{c.label}</div>
            <div className="text-xs text-slate-500 mt-1">{c.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
