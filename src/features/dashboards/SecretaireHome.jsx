import React from "react";
import { Users, School, Megaphone, UserCog, PlusCircle } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";
import SectionCard from "../../components/ui/SectionCard";

// En production : comptages sur eleve/classe/communique filtrés par
// annee_scolaire active.
const MOCK = {
  totalEleves: 214,
  totalClasses: 9,
  communiquesBrouillon: 1,
  affectationsIncompletes: 2, // classes sans enseignant principal ou matière sans enseignant affecté
};

export default function SecretaireHome({ role, onLogout, onGererEleves, onGererClasses, onGererCommuniques, onGererAffectations }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} title="Administration scolaire" subtitle="Accueil secrétariat" />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <SectionCard icon={Users} title="Élèves">
            <div className="text-2xl font-black text-slate-800">{MOCK.totalEleves}</div>
            <button onClick={onGererEleves} className="mt-2 flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline"><PlusCircle size={12} /> Inscrire un élève</button>
          </SectionCard>
          <SectionCard icon={School} title="Classes">
            <div className="text-2xl font-black text-slate-800">{MOCK.totalClasses}</div>
            <button onClick={onGererClasses} className="mt-2 text-xs font-bold text-sky-600 hover:underline">Gérer les classes →</button>
          </SectionCard>
        </div>

        <SectionCard icon={Megaphone} title="Communiqués">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{MOCK.communiquesBrouillon} brouillon en attente de publication</span>
            <button onClick={onGererCommuniques} className="text-xs font-bold text-sky-600 hover:underline">Gérer →</button>
          </div>
        </SectionCard>

        <SectionCard icon={UserCog} title="Affectations enseignants">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {MOCK.affectationsIncompletes > 0 ? (
                <Chip tone="yellow">{MOCK.affectationsIncompletes} affectations incomplètes</Chip>
              ) : (
                <Chip tone="sky">Toutes les classes/matières sont affectées</Chip>
              )}
            </span>
            <button onClick={onGererAffectations} className="text-xs font-bold text-sky-600 hover:underline">Gérer →</button>
          </div>
        </SectionCard>

        <p className="text-xs text-slate-400 text-center">Rappel : le secrétariat ne saisit jamais de notes — cette fonction reste exclusive aux enseignants.</p>
      </div>
    </div>
  );
}
