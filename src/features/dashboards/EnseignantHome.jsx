import React from "react";
import { Users } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";

// En production : classes issues de classe_enseignant_principal +
// classe_matiere_enseignant pour utilisateur.id = auth.uid() —
// jamais toutes les classes de l'école.
export default function EnseignantHome({ role, onLogout, mesClasses, onOpenClasse }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} title="Mes classes" subtitle="Accueil enseignant" />
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {mesClasses.map((c, i) => (
            <button key={c.id} onClick={() => onOpenClasse(c.id)} className="text-left bg-white rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all overflow-hidden">
              <div className={`h-2 ${["bg-sky-500", "bg-yellow-400", "bg-red-500"][i % 3]}`} />
              <div className="p-5">
                <div className="font-black text-slate-800 text-lg">{c.nom}</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3"><Users size={13} /> {c.eleves.length} élèves</div>
                <div className="mt-2"><Chip tone="sky">Enseignant principal</Chip></div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
