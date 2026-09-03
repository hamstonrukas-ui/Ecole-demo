import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// Session réelle Supabase Auth + rôle associé (table `utilisateur`).
// `debugInfo` est temporaire (diagnostic mobile, sans accès aux devtools) —
// à retirer une fois le problème de rôle non détecté résolu.
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData, error: errSession } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        if (active) {
          setUser(null);
          setDebugInfo({ etape: "pas de session", errSession: errSession?.message || null });
          setLoading(false);
        }
        return;
      }

      const { data: utilisateur, error: errUser } = await supabase
        .from("utilisateur")
        .select("id, nom_complet, caisse_id, role_id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!utilisateur) {
        if (active) {
          setUser({ id: session.user.id, role: null });
          setDebugInfo({
            etape: "aucune ligne utilisateur trouvée",
            uidSession: session.user.id,
            errUser: errUser?.message || null,
          });
          setLoading(false);
        }
        return;
      }

      let roleCode = null;
      let errRoleMsg = null;
      if (utilisateur.role_id) {
        const { data: role, error: errRole } = await supabase
          .from("role")
          .select("code")
          .eq("id", utilisateur.role_id)
          .maybeSingle();
        roleCode = role?.code || null;
        errRoleMsg = errRole?.message || null;
      }

      if (active) {
        setUser({ id: utilisateur.id, nom: utilisateur.nom_complet, caisseId: utilisateur.caisse_id, role: roleCode });
        setDebugInfo({
          etape: "chargement complet",
          uidSession: session.user.id,
          utilisateurTrouve: utilisateur,
          roleIdCherche: utilisateur.role_id,
          roleCodeResolu: roleCode,
          errUser: errUser?.message || null,
          errRole: errRoleMsg,
        });
        setLoading(false);
      }
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, loading, debugInfo };
    }
