import { supabase } from "../supabaseClient";

export async function fetchEvaluations(classeId, periodeId) {
  const { data, error } = await supabase
    .from("evaluation")
    .select("*, matiere:matiere_id(nom)")
    .eq("classe_id", classeId)
    .eq("periode_id", periodeId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function createEvaluation({ classeId, matiereId, periodeId, nom, pointsMax, creeParId }) {
  const { data, error } = await supabase
    .from("evaluation")
    .insert({ classe_id: classeId, matiere_id: matiereId, periode_id: periodeId, nom, points_max: pointsMax, cree_par: creeParId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function validerEvaluation(evaluationId, valide = true) {
  const { error } = await supabase
    .from("evaluation")
    .update({ statut: valide ? "validee" : "brouillon" })
    .eq("id", evaluationId);
  if (error) throw error;
}

export async function supprimerEvaluation(evaluationId) {
  const { error } = await supabase.from("evaluation").delete().eq("id", evaluationId);
  if (error) throw error;
}

export async function fetchNotes(evaluationId) {
  const { data, error } = await supabase.from("note").select("eleve_id, points_obtenus").eq("evaluation_id", evaluationId);
  if (error) throw error;
  return data;
}

export async function setNote(evaluationId, eleveId, points) {
  const { error } = await supabase
    .from("note")
    .upsert({ evaluation_id: evaluationId, eleve_id: eleveId, points_obtenus: points }, { onConflict: "evaluation_id,eleve_id" });
  if (error) throw error;
}

// Snapshot de bulletin de période — écrit une fois `cloturerPhase()` calculé
// côté client (même logique que utils/bulletins.js), pour figer l'historique.
export async function saveBulletinPeriode({ eleveId, classeId, periodeId, total, totalMax, pourcentage, place, detail }) {
  const { error } = await supabase
    .from("bulletin_periode")
    .upsert({ eleve_id: eleveId, classe_id: classeId, periode_id: periodeId, total, total_max: totalMax, pourcentage, place, detail }, { onConflict: "eleve_id,periode_id" });
  if (error) throw error;
}

export async function fetchBulletinsPeriode(classeId, periodeId) {
  const { data, error } = await supabase
    .from("bulletin_periode")
    .select("*")
    .eq("classe_id", classeId)
    .eq("periode_id", periodeId);
  if (error) throw error;
  return data;
}

export async function saveBulletinTrimestre({ eleveId, classeId, trimestre, total, totalMax, pourcentage, place, detail }) {
  const { error } = await supabase
    .from("bulletin_trimestre")
    .upsert({ eleve_id: eleveId, classe_id: classeId, trimestre, total, total_max: totalMax, pourcentage, place, detail }, { onConflict: "eleve_id,trimestre" });
  if (error) throw error;
}

export async function fetchBulletinsTrimestre(classeId, trimestre) {
  const { data, error } = await supabase
    .from("bulletin_trimestre")
    .select("*")
    .eq("classe_id", classeId)
    .eq("trimestre", trimestre);
  if (error) throw error;
  return data;
}
