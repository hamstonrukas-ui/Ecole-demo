import { supabase } from "../supabaseClient";

// Récupère (ou crée) la journée du jour pour une classe — équivalent du
// `days[day]` en mémoire du prototype, mais persisté.
export async function getOrCreateJournee(classeId, dateJour) {
  const { data: existing, error: err1 } = await supabase
    .from("journee_scolaire")
    .select("*")
    .eq("classe_id", classeId)
    .eq("date_jour", dateJour)
    .maybeSingle();
  if (err1) throw err1;
  if (existing) return existing;

  const { data: created, error: err2 } = await supabase
    .from("journee_scolaire")
    .insert({ classe_id: classeId, date_jour: dateJour, statut: "ouverte" })
    .select()
    .single();
  if (err2) throw err2;
  return created;
}

export async function fetchPresences(journeeId) {
  const { data, error } = await supabase
    .from("presence")
    .select("eleve_id, present")
    .eq("journee_id", journeeId);
  if (error) throw error;
  return data;
}

// Upsert : un enseignant peut cocher/décocher plusieurs fois avant clôture.
export async function setPresence(journeeId, eleveId, present) {
  const { error } = await supabase
    .from("presence")
    .upsert({ journee_id: journeeId, eleve_id: eleveId, present }, { onConflict: "journee_id,eleve_id" });
  if (error) throw error;
}

export async function saveHoraireSlot(journeeId, creneauId, matiereId, lecon) {
  const { error } = await supabase
    .from("journal_enseignement")
    .upsert({ journee_id: journeeId, creneau_id: creneauId, matiere_id: matiereId, lecon }, { onConflict: "journee_id,creneau_id" });
  if (error) throw error;
}

export async function fetchJournalDuJour(journeeId) {
  const { data, error } = await supabase
    .from("journal_enseignement")
    .select("creneau_id, matiere_id, lecon, matiere:matiere_id(nom)")
    .eq("journee_id", journeeId);
  if (error) throw error;
  return data;
}

// Clôture : verrouille la journée (RLS empêche ensuite toute écriture
// via la policy `journee_enseignant`, qui ne couvre que les journées ouvertes
// si on l'affine — ici on bloque déjà côté appel applicatif).
export async function cloturerJournee(journeeId, rapport, clotureParId) {
  const { error } = await supabase
    .from("journee_scolaire")
    .update({ statut: "cloturee", rapport, cloture_par: clotureParId, date_cloture: new Date().toISOString() })
    .eq("journee_id", journeeId);
  if (error) throw error;
}

// Historique des journées clôturées d'une classe (pour la modale Historique).
export async function fetchHistoriqueJournees(classeId) {
  const { data, error } = await supabase
    .from("journee_scolaire")
    .select("id, date_jour, statut")
    .eq("classe_id", classeId)
    .eq("statut", "cloturee")
    .order("date_jour", { ascending: false });
  if (error) throw error;
  return data;
}

// Espace public : leçons enseignées, journées clôturées uniquement,
// aucune jointure vers élève/présence (RLS `journal_lecture_publique` le
// garantit déjà côté base, mais on ne sélectionne ici que ce qu'il faut).
export async function fetchLeconsPubliques(classeId) {
  const { data, error } = await supabase
    .from("journal_enseignement")
    .select("lecon, matiere:matiere_id(nom), journee:journee_id(date_jour, classe_id)")
    .eq("journee.classe_id", classeId)
    .eq("journee.statut", "cloturee")
    .order("journee(date_jour)", { ascending: false });
  if (error) throw error;
  return data;
}

// Devoir / affaire à apporter, créé par l'enseignant pour la journée en cours.
export async function createDevoir({ journeeId, matiereId, type, contenu, dateLimite, creeParId }) {
  const { data, error } = await supabase
    .from("devoir")
    .insert({ journee_id: journeeId, matiere_id: matiereId, type, contenu, date_limite: dateLimite, cree_par: creeParId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchDevoirsDuJour(journeeId) {
  const { data, error } = await supabase
    .from("devoir")
    .select("id, type, contenu, date_limite, matiere:matiere_id(nom)")
    .eq("journee_id", journeeId)
    .order("created_at");
  if (error) throw error;
  return data;
}
