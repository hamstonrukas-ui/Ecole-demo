import React from "react";
import { ArrowLeft, GraduationCap } from "lucide-react";
import Chip from "../ui/Chip";

// `role` reste un code générique (ex: DIRECTEUR, ENSEIGNANT, SECRETAIRE...) —
// voir /people/role/permission dans le schéma finance/enseignement.
const ROLE_LABELS = {
  directeur: "Directeur",
  secretaire: "Secrétaire",
  enseignant: "Enseignant",
  caissier: "Caissier",
  controleur: "Contrôleur",
  resp_financier: "Responsable financier",
  comptable: "Comptable",
  admin_tech: "Administrateur technique",
  magasinier: "Magasinier",
};
const ROLE_TONES = {
  directeur: "red",
  secretaire: "yellow",
  enseignant: "sky",
  caissier: "sky",
  controleur: "yellow",
  resp_financier: "sky",
  comptable: "white",
  admin_tech: "red",
  magasinier: "yellow",
};

export default function TopBar({ role, onLogout, title, subtitle, onBack }) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && <button onClick={onBack} className="text-slate-400 hover:text-slate-700 shrink-0"><ArrowLeft size={20} /></button>}
          <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0"><GraduationCap size={18} /></div>
          <div>
            <h1 className="font-black text-slate-800 leading-tight">{title}</h1>
            <p className="text-xs text-slate-500 capitalize">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Chip tone={ROLE_TONES[role] || "white"}>{ROLE_LABELS[role] || role}</Chip>
          <button onClick={onLogout} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Changer</button>
        </div>
      </div>
    </div>
  );
}
