import React from "react";
import { GraduationCap, Wallet, Boxes } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";

// Portail du directeur : chaque carte correspond à un module déjà conçu.
export default function DirecteurHome({ role, onLogout, todayLabel, classesCount, onOpenEnseignement, onOpenFinance, onOpenStock }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} title="Accueil directeur" subtitle={todayLabel} />
      <div className="max-w-4xl mx-auto p-6 grid sm:grid-cols-2 gap-5 mt-4">
        <button
          onClick={onOpenEnseignement}
          className="group text-left bg-white rounded-3xl border border-slate-200 p-7 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
            <GraduationCap size={26} />
          </div>
          <h2 className="text-xl font-black text-slate-800">Enseignement</h2>
          <p className="text-sm text-slate-500 mt-1.5">Classes, élèves, présences, notes, bulletins</p>
          <div className="mt-4"><Chip>{classesCount} classes actives</Chip></div>
        </button>

        <button
          onClick={onOpenFinance}
          className="group text-left bg-white rounded-3xl border border-slate-200 p-7 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-slate-900 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
            <Wallet size={26} />
          </div>
          <h2 className="text-xl font-black text-slate-800">Finance et trésorerie</h2>
          <p className="text-sm text-slate-500 mt-1.5">Caisse, dépenses, fonds, comptabilité</p>
          <div className="mt-4"><Chip tone="sky">Module déjà conçu</Chip></div>
        </button>

        <button
          onClick={onOpenStock}
          className="group text-left bg-white rounded-3xl border border-slate-200 p-7 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-sm sm:col-span-2"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500 text-white flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
            <Boxes size={26} />
          </div>
          <h2 className="text-xl font-black text-slate-800">Stock & Patrimoine</h2>
          <p className="text-sm text-slate-500 mt-1.5">Matériel scolaire et d'entretien, entrées et sorties</p>
          <div className="mt-4"><Chip tone="sky">Module déjà conçu</Chip></div>
        </button>
      </div>
    </div>
  );
}
