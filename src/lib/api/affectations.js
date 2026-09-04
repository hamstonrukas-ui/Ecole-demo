import { supabase } from "./../supabaseClient";

export async function fetchEnseignants() {
  const { data: role, error: errRole } = await supabase.from("role").select("id").eq("code", "ENSEIGNANT").maybeSingle();
  if (errRole) throw errRole;
  if (!role) return [];
  const { data, error } = await supabase.from("utilisateur").select("id, nom_complet").eq("role_id", role.id).eq("statut", "actif");
  if (error) throw error;
  return data;
}

export async function fetchMatieres(anneeScolaireId) {
  const { data, error } = await supabase.from("matiere").select("id, nom").eq("annee_scolaire_id", anneeScolaireId).order("nom");
  if (error) throw error;
  return data;
}

export async function createMatiere({ code, nom, anneeScolaireId }) {
  const { data, error } = await supabase.from("matiere").insert({ code, nom, annee_scolaire_id: anneeScolaireId }).select().single();
  if (error) throw error;
  return data;
}

export async function fetchEnseignantPrincipal(classeId) {
  const { data, error } = await supabase
    .from("classe_enseignant_principal")
    .select("enseignant_id, enseignant:enseignant_id(nom_complet)")
    .eq("classe_id", classeId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function assignerEnseignantPrincipal(classeId, enseignantId) {
  const { error } = await supabase
    .from("classe_enseignant_principal")
    .upsert({ classe_id: classeId, enseignant_id: enseignantId }, { onConflict: "classe_id" });
  if (error) throw error;
}

export async function fetchAffectationsMatieres(classeId) {
  const { data, error } = await supabase
    .from("classe_matiere_enseignant")
    .select("id, matiere:matiere_id(id, nom), enseignant:enseignant_id(id, nom_complet)")
    .eq("classe_id", classeId);
  if (error) throw error;
  return data;
}

export async function assignerEnseignantMatiere(classeId, matiereId, enseignantId) {
  const { error } = await supabase
    .from("classe_matiere_enseignant")
    .upsert({ classe_id: classeId, matiere_id: matiereId, enseignant_id: enseignantId }, { onConflict: "classe_id,matiere_id" });
  if (error) throw error;
}

export async function retirerAffectationMatiere(id) {
  const { error } = await supabase.from("classe_matiere_enseignant").delete().eq("id", id);
  if (error) throw error;
}
