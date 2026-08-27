import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// Session réelle Supabase Auth + rôle associé (table `utilisateur`).
// Deux requêtes séparées (utilisateur, puis role) plutôt qu'une jointure
// imbriquée — plus robuste : évite toute dépendance au cache de relations
// PostgREST, qui peut échouer silencieusement si la FK n'est pas détectée.
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (active) { setUser(null); setLoading(false); } return; }

      const { data: utilisateur, error: errUser } = await supabase
        .from("utilisateur")
        .select("id, nom_complet, caisse_id, role_id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (errUser) {
        console.error("useCurrentUser — erreur lecture utilisateur:", errUser);
      }

      if (!utilisateur) {
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
        if (errRole) console.error("useCurrentUser — erreur lecture role:", errRole);
        roleCode = role?.code || null;
      }

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
      
