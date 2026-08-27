import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// Session réelle Supabase Auth + rôle associé (table `utilisateur`).
// Remplace à terme RoleSelect.jsx : dès qu'un utilisateur est authentifié,
// ce hook donne son id, son rôle et sa caisse assignée (si Caissier).
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (active) { setUser(null); setLoading(false); } return; }

      const { data, error } = await supabase
        .from("utilisateur")
        .select("id, nom_complet, caisse_id, role:role_id(code)")
        .eq("id", session.user.id)
        .maybeSingle();

      if (active) {
        if (error || !data) setUser({ id: session.user.id, role: null });
        else setUser({ id: data.id, nom: data.nom_complet, caisseId: data.caisse_id, role: data.role?.code || null });
        setLoading(false);
      }
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, loading };
}
