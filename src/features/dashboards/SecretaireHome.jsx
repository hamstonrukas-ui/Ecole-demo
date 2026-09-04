import React, { useState } from "react";
import { Users, School, Megaphone, UserCog, PlusCircle } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";
import SectionCard from "../../components/ui/SectionCard";
import ElevesList from "../secretariat/ElevesList";
import CommuniquesList from "../secretariat/CommuniquesList";
import AffectationsEnseignants from "../secretariat/AffectationsEnseignants";

const MOCK = {
  totalEleves: 214,
  totalClasses: 9,
  communiquesBrouillon: 1,
  affectationsIncompletes: 2,
};

// Chaque action (Élèves, Communiqués, Affectations) est autonome : elle
// s'ouvre directement depuis ce fichier, sans dépendre du routage central
// de App.jsx — même mécanisme que "Créer classe" dans ClassesList, qui a
// toujours fonctionné de façon fiable.
export default function SecretaireHome({ role, onLogout, onGererClasses, userId }) {
  const [ecran, setEcran] = useState(null); // null | "eleves" | "communiques" | "affectations"

  if (ecran === "eleves") {
    return <ElevesList role={role} onLogout={onLogout} onBack={() => setEcran(null)} />;
  }
  if (ecran === "communiques") {
    return <CommuniquesList role={role} onLogout={onLogout} onBack={() => setEcran(null)} userId={userId} />;
  }
  if (ecran === "affectations") {
    return <AffectationsEnseignants role={role} onLogout={onLogout} onBack={() => setEcran(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} title="Administration scolaire" subtitle="Accueil secrétariat" />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <SectionCard icon={Users} title="Élèves">
            <div className="text-2xl font-black text-slate-800">{MOCK.totalEleves}</div>
            <button onClick={() => setEcran("eleves")} className="mt-2 flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline"><PlusCircle size={12} /> Inscrire un élève</button>
          </SectionCard>
          <SectionCard icon={School} title="Classes">
            <div className="text-2xl font-black text-slate-800">{MOCK.totalClasses}</div>
            <button onClick={onGererClasses} className="mt-2 text-xs font-bold text-sky-600 hover:underline">Gérer les classes →</button>
          </SectionCard>
        </div>

        <SectionCard icon={Megaphone} title="Communiqués">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{MOCK.communiquesBrouillon} brouillon en attente de publication</span>
            <button onClick={() => setEcran("communiques")} className="text-xs font-bold text-sky-600 hover:underline">Gérer →</button>
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
            <button onClick={() => setEcran("affectations")} className="text-xs font-bold text-sky-600 hover:underline">Gérer →</button>
          </div>
        </SectionCard>

        <p className="text-xs text-slate-400 text-center">Rappel : le secrétariat ne saisit jamais de notes — cette fonction reste exclusive aux enseignants.</p>
      </div>
    </div>
  );
                                                                                   }
          
