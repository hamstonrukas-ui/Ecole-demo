import React from "react";
import { GraduationCap, ShieldCheck, CalendarClock, Users, Wallet, ClipboardCheck, FileText, BookOpen, UserCog, Boxes } from "lucide-react";

// À remplacer par Supabase Auth (connexion réelle) + lecture du rôle
// depuis la table `utilisateur`/`role`. Cet écran ne reste, en production,
// que comme point d'entrée "Connexion personnel" de l'espace public —
// jamais comme sélecteur libre de rôle (voir features/admin/UserManagement.jsx,
// seul endroit où un rôle est réellement attribué).
const ROLES = [
  { key: "directeur", label: "Directeur", desc: "Accès total, supervise tout l'établissement", icon: ShieldCheck, bg: "bg-red-500", text: "text-white" },
  { key: "secretaire", label: "Secrétaire", desc: "Élèves, classes, matières, communiqués", icon: Users, bg: "bg-yellow-400", text: "text-slate-900" },
  { key: "enseignant", label: "Enseignant", desc: "Ses classes, présences, notes, bulletins", icon: CalendarClock, bg: "bg-sky-500", text: "text-white" },
  { key: "caissier", label: "Caissier", desc: "Encaissement des frais scolaires", icon: Wallet, bg: "bg-sky-500", text: "text-white" },
  { key: "controleur", label: "Contrôleur", desc: "Validation des recettes et clôtures", icon: ClipboardCheck, bg: "bg-yellow-400", text: "text-slate-900" },
  { key: "resp_financier", label: "Resp. financier", desc: "Dépenses, fonds, transferts", icon: FileText, bg: "bg-sky-500", text: "text-white" },
  { key: "comptable", label: "Comptable", desc: "Écritures, journaux, balance", icon: BookOpen, bg: "bg-slate-700", text: "text-white" },
  { key: "magasinier", label: "Magasinier", desc: "Stock et patrimoine matériel de l'école", icon: Boxes, bg: "bg-yellow-400", text: "text-slate-900" },
  { key: "admin_tech", label: "Admin technique", desc: "Utilisateurs et attribution des rôles", icon: UserCog, bg: "bg-red-500", text: "text-white" },
];

export default function RoleSelect({ onSelectRole }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-sky-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-200">
            <GraduationCap size={30} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">École Connectée</h1>
          <p className="text-slate-500 text-sm mt-1">Démo — choisissez un rôle pour voir son tableau de bord</p>
        </div>
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {ROLES.map(({ key, label, desc, icon: Icon, bg, text }) => (
            <button
              key={key}
              onClick={() => onSelectRole(key)}
              className="w-full flex items-center gap-3 bg-white border-2 border-slate-200 hover:border-sky-400 hover:bg-sky-50 rounded-2xl p-4 text-left transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl ${bg} ${text} flex items-center justify-center shrink-0`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="font-bold text-slate-800">{label}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
