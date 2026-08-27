import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// Session réelle Supabase Auth + rôle associé (table `utilisateur`).
// Version avec logs de diagnostic temporaires — à retirer une fois le
// problème de rôle non détecté résolu.
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData, error: errSession } = await supabase.auth.getSession();
      console.log("[useCurrentUser] session:", sessionData?.session, "erreur session:", errSession);

      const session = sessionData?.session;
      if (!session) {
        console.log("[useCurrentUser] Aucune session active — utilisateur non connecté.");
        if (active) { setUser(null); setLoading(false); }
        return;
      }

      console.log("[useCurrentUser] UID de la session connectée :", session.user.id);

      const { data: utilisateur, error: errUser } = await supabase
        .from("utilisateur")
        .select("id, nom_complet, caisse_id, role_id")
        .eq("id", session.user.id)
        .maybeSingle();

      console.log("[useCurrentUser] Résultat requête utilisateur:", utilisateur, "erreur:", errUser);

      if (!utilisateur) {
        console.warn("[useCurrentUser] Aucune ligne `utilisateur` trouvée pour cet UID. Vérifie que cet UID existe bien dans la table utilisateur.");
        if (active) { setUser({ id: session.user.id, role: null }); setLoading(false); }
        return;
      }

      let roleCode = null;
      if (utilisateur.role_id) {
        const { data: role, error: errRole } = await supabase
          .from("role")
          .select("code")
          .eq("id", utilisateur.role_id)
          .maybeSingle();
        console.log("[useCurrentUser] Résultat requête role:", role, "erreur:", errRole);
        roleCode = role?.code || null;
      } else {
        console.warn("[useCurrentUser] La ligne utilisateur trouvée n'a pas de role_id renseigné.");
      }

      console.log("[useCurrentUser] Rôle final résolu :", roleCode);

      if (active) {
        setUser({ id: utilisateur.id, nom: utilisateur.nom_complet, caisseId: utilisateur.caisse_id, role: roleCode });
        setLoading(false);
      }
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, loading };
    }
