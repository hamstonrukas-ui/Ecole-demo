import React, { useState } from "react";
import RoleSelect from "./features/auth/RoleSelect";
import LoginForm from "./features/auth/LoginForm";
import PublicHome from "./features/public/PublicHome";
import PublicClassePage from "./features/public/PublicClassePage";
import DirecteurHome from "./features/home/DirecteurHome";
import EnseignantHome from "./features/dashboards/EnseignantHome";
import SecretaireHome from "./features/dashboards/SecretaireHome";
import ElevesList from "./features/secretariat/ElevesList";
import CaissierHome from "./features/dashboards/CaissierHome";
import ControleurHome from "./features/dashboards/ControleurHome";
import RespFinancierHome from "./features/dashboards/RespFinancierHome";
import ComptableHome from "./features/dashboards/ComptableHome";
import MagasinierHome from "./features/dashboards/MagasinierHome";
import UserManagement from "./features/admin/UserManagement";
import ClassesList from "./features/enseignement/ClassesList";
import ElevesList from "./features/secretariat/ElevesList";
import ClasseWorkspace from "./features/enseignement/ClasseWorkspace";
import { useCurrentUser } from "./lib/useCurrentUser";
import { fetchMesClasses, fetchClasses } from "./lib/api/classes";
import { supabase } from "./lib/supabaseClient";

// ============================================================================
// RACINE DE L'APPLICATION
//
// En production : `useCurrentUser()` lit la session Supabase Auth + le rôle
// réel assigné (table utilisateur/role). RoleSelect ne sert plus qu'à un
// utilisateur SANS rôle encore assigné (redirige alors vers un message
// "en attente d'attribution par l'Admin Technique") ou, en développement
// local sans session, à explorer chaque tableau de bord.
// ============================================================================

const HOME_SCREEN_BY_ROLE = {
  DIRECTEUR: "home", SECRETAIRE: "secretariat", ENSEIGNANT: "mes_classes",
  CAISSIER: "caisse", CONTROLEUR: "controle", RESP_FINANCIER: "finances",
  COMPTABLE: "comptabilite", ADMIN_TECH: "utilisateurs", MAGASINIER: "stock",
};
// Les écrans démo (RoleSelect) utilisent des clés minuscules historiques —
// on les fait correspondre aux codes réels de la table `role`.
const DEMO_ROLE_TO_CODE = {
  directeur: "DIRECTEUR", secretaire: "SECRETAIRE", enseignant: "ENSEIGNANT",
  caissier: "CAISSIER", controleur: "CONTROLEUR", resp_financier: "RESP_FINANCIER",
  comptable: "COMPTABLE", admin_tech: "ADMIN_TECH", magasinier: "MAGASINIER",
};

export default function App() {
  const { user, loading: loadingUser, debugInfo } = useCurrentUser();
  const [demoRole, setDemoRole] = useState(null); // filet de secours démo — jamais exposé en production
  const [devDemo, setDevDemo] = useState(false);   // n'active RoleSelect qu'en dev local (import.meta.env.DEV)
  const [wantsLogin, setWantsLogin] = useState(false); // "Connexion personnel" cliqué depuis l'espace public
  const [publicClasse, setPublicClasse] = useState(null);
  const [screen, setScreen] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);

  const roleCode = user?.role || (demoRole ? DEMO_ROLE_TO_CODE[demoRole] : null);
  const userId = user?.id || "demo-user"; // en session réelle : auth.uid()

  React.useEffect(() => {
    if (roleCode && !screen) setScreen(HOME_SCREEN_BY_ROLE[roleCode] || "home");
  }, [roleCode, screen]);

  React.useEffect(() => {
    if (screen === "enseignement") {
      fetchClasses().then(setClasses).catch(() => {});
    }
    if (screen === "mes_classes") {
      fetchMesClasses(userId).then(setClasses).catch(() => setClasses([]));
    }
  }, [screen, userId]);

  function openClasse(id) { setActiveClassId(id); setScreen("classe"); }
  function backToHome() { setScreen(HOME_SCREEN_BY_ROLE[roleCode] || "home"); }
  async function logout() {
    await supabase.auth.signOut();
    setDemoRole(null);
    setWantsLogin(false);
    setScreen(null);
  }

  if (loadingUser) return null;

  // Session réelle mais sans rôle encore assigné par l'Admin Technique.
  if (user && !roleCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-slate-500">
        <div className="max-w-md w-full">
          <p className="mb-2 font-bold text-slate-700">Compte créé, en attente d'un rôle.</p>
          <p className="text-sm mb-6">Un Administrateur Technique doit vous attribuer un rôle avant de pouvoir continuer.</p>

          {/* Diagnostic temporaire, visible sans devtools — à retirer une fois le problème résolu */}
          <div className="text-left bg-slate-100 border border-slate-200 rounded-xl p-4 text-[11px] font-mono text-slate-600 whitespace-pre-wrap break-all">
            {JSON.stringify(debugInfo, null, 2)}
          </div>
        </div>
      </div>
    );
  }

  // Point d'entrée par défaut de l'application : l'espace public, sans
  // connexion. "Connexion personnel" (ou une session déjà active) bascule
  // vers l'espace personnel ci-dessous.
  if (!user && !demoRole && !wantsLogin) {
    if (publicClasse) {
      return <PublicClassePage classe={publicClasse} onBack={() => setPublicClasse(null)} />;
    }
    return <PublicHome onOpenClasse={setPublicClasse} onConnexionPersonnel={() => setWantsLogin(true)} />;
  }

  if (!user && !demoRole) {
    // RoleSelect n'est jamais atteignable en production : import.meta.env.DEV
    // vaut false dans le build déployé, cette branche est donc éliminée du
    // bundle final. En dev local, un lien discret dans LoginForm l'active.
    if (import.meta.env.DEV && devDemo) {
      return <RoleSelect onSelectRole={(r) => setDemoRole(r)} />;
    }
    return (
      <LoginForm
        onBack={() => setWantsLogin(false)}
        devMode={import.meta.env.DEV}
        onOpenDemo={() => setDevDemo(true)}
      />
    );
  }

  const activeClass = classes.find((c) => c.id === activeClassId);

  switch (screen) {
    case "home":
      return (
        <DirecteurHome
          role={roleCode?.toLowerCase()} onLogout={logout} todayLabel={new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          classesCount={classes.length}
          onOpenEnseignement={() => setScreen("enseignement")}
          onOpenFinance={() => setScreen("finance")}
          onOpenStock={() => setScreen("stock")}
        />
      );
    case "secretariat":
      return <SecretaireHome role={roleCode?.toLowerCase()} onLogout={logout} onGererClasses={() => setScreen("enseignement")} onGererEleves={() => setScreen("eleves")} />;
    case "eleves":
      return <ElevesList role={roleCode?.toLowerCase()} onLogout={logout} onBack={backToHome} />;
    case "mes_classes":
      return <EnseignantHome role={roleCode?.toLowerCase()} onLogout={logout} mesClasses={classes} onOpenClasse={openClasse} />;
    case "caisse":
      return <CaissierHome role={roleCode?.toLowerCase()} onLogout={logout} tresorerieId={user?.caisseId} userId={userId} />;
    case "controle":
      return <ControleurHome role={roleCode?.toLowerCase()} onLogout={logout} userId={userId} />;
    case "finances":
      return <RespFinancierHome role={roleCode?.toLowerCase()} onLogout={logout} userId={userId} />;
    case "comptabilite":
      return <ComptableHome role={roleCode?.toLowerCase()} onLogout={logout} />;
    case "stock":
      return <MagasinierHome role={roleCode?.toLowerCase()} onLogout={logout} onBack={roleCode === "DIRECTEUR" ? backToHome : undefined} userId={userId} />;
    case "utilisateurs":
      return <UserManagement role={roleCode?.toLowerCase()} onLogout={logout} />;
    case "enseignement":
      return <ClassesList role={roleCode?.toLowerCase()} onLogout={logout} onBack={backToHome} onOpenClasse={openClasse} />;
    case "eleves":
      return <ElevesList role={roleCode?.toLowerCase()} onLogout={logout} onBack={backToHome} />;
    case "classe":
      if (!activeClass) return null;
      return (
        <ClasseWorkspace
          classe={activeClass} role={roleCode?.toLowerCase()} userId={userId}
          onBack={() => setScreen(roleCode === "ENSEIGNANT" ? "mes_classes" : "enseignement")}
          onLogout={logout}
        />
      );
    case "finance":
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center text-slate-500">
          Module Finance déjà conçu séparément (schéma SQL + maquettes caisse/tableau de bord) —
          à monter ici comme son propre ensemble de features/finance/*.
        </div>
      );
    default:
      return null;
  }
}
  
