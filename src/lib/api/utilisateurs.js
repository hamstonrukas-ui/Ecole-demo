import { supabase } from "../supabaseClient";

// Réservé à l'ADMIN_TECH (RLS `utilisateur_gestion_admin` /
// `utilisateur_modification_admin` le vérifient déjà côté base).
export async function fetchUtilisateurs() {
  const { data, error } = await supabase
    .from("utilisateur")
    .select("id, nom_complet, statut, role:role_id(id, code, nom)")
    .order("nom_complet");
  if (error) throw error;
  return data;
}

export async function assignerRole(utilisateurId, roleId, caisseId = null) {
  const { error } = await supabase
    .from("utilisateur")
    .update({ role_id: roleId, caisse_id: caisseId })
    .eq("id", utilisateurId);
  if (error) throw error;
}

export async function fetchRoles() {
  const { data, error } = await supabase.from("role").select("id, code, nom").order("nom");
  if (error) throw error;
  return data;
}

// Invitation par email — déclenche l'envoi Supabase Auth (magic link).
// Nécessite la clé "service role" côté backend (jamais dans le frontend) :
// à exposer via une Edge Function Supabase, pas un appel direct depuis le client.
export async function inviterUtilisateur(email) {
  const { data, error } = await supabase.functions.invoke("invite-user", { body: { email } });
  if (error) throw error;
  return data;
}
  
