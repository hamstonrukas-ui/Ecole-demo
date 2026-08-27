import { supabase } from "../supabaseClient";

// Toutes ces requêtes s'appuient sur des policies RLS qui filtrent déjà
// côté base (statut = 'publie' / journée clôturée) — pas besoin de session,
// utilisables avec la clé anonyme.

export async function fetchCommuniquesPublics() {
  const { data, error } = await supabase
    .from("communique")
    .select("id, titre, contenu, date_publication")
    .eq("statut", "publie")
    .order("date_publication", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchClassesPubliques() {
  const { data, error } = await supabase.from("classe").select("id, nom, niveau").order("nom");
  if (error) throw error;
  return data;
}

// Leçons enseignées + devoirs/affaires à apporter, uniquement pour les
// journées clôturées — jamais de nom d'élève, de note ou de présence ici.
export async function fetchViePubliqueClasse(classeId) {
  const [{ data: journal, error: e1 }, { data: devoirs, error: e2 }] = await Promise.all([
    supabase
      .from("journal_enseignement")
      .select("lecon, matiere:matiere_id(nom), journee:journee_id!inner(date_jour, classe_id, statut)")
      .eq("journee.classe_id", classeId)
      .eq("journee.statut", "cloturee")
      .order("journee(date_jour)", { ascending: false }),
    supabase
      .from("devoir")
      .select("type, contenu, date_limite, matiere:matiere_id(nom), journee:journee_id!inner(date_jour, classe_id, statut)")
      .eq("journee.classe_id", classeId)
      .eq("journee.statut", "cloturee")
      .order("journee(date_jour)", { ascending: false }),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { lecons: journal, devoirs };
}
