    import { supabase } from "../supabaseClient";

// Classes de l'année scolaire active. En production, filtrer aussi par
// classe_matiere_enseignant/classe_enseignant_principal côté ENSEIGNANT —
// RLS le fait déjà, mais un filtre explicite évite une requête inutile.
export async function fetchClasses() {
  const { data, error } = await supabase
    .from("classe")
    .select("id, nom, niveau, annee_scolaire_id, classe_enseignant_principal(enseignant_id, utilisateur(nom_complet))")
    .order("nom");
  if (error) throw error;
  return data.map((c) => ({
    id: c.id,
    nom: c.nom,
    annee_scolaire_id: c.annee_scolaire_id,
    enseignant: c.classe_enseignant_principal?.[0]?.utilisateur?.nom_complet || "Non affecté",
  }));
}

export async function createClasse({ nom, niveau, annee_scolaire_id }) {
  const { data, error } = await supabase
    .from("classe")
    .insert({ nom, niveau, annee_scolaire_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Classes affectées à l'enseignant connecté (principal ou par matière).
export async function fetchMesClasses(enseignantId) {
  const { data, error } = await supabase
    .from("classe_matiere_enseignant")
    .select("classe:classe_id(id, nom)")
    .eq("enseignant_id", enseignantId);
  if (error) throw error;
  const uniq = new Map();
  data.forEach((row) => uniq.set(row.classe.id, row.classe));
  return Array.from(uniq.values());
}

export async function fetchElevesByClasse(classeId) {
  const { data, error } = await supabase
    .from("eleve")
    .select("id, matricule, nom, postnom, prenom")
    .eq("classe_id", classeId)
    .eq("statut", "actif")
    .order("nom");
  if (error) throw error;
  return data;
}

export async function fetchMatieresAvecPonderation(anneeScolaireId) {
  const { data, error } = await supabase
    .from("pondération_matiere")
    .select("ponderation, matiere:matiere_id(id, nom)")
    .eq("annee_scolaire_id", anneeScolaireId);
  if (error) throw error;
  return data.map((row) => ({ id: row.matiere.id, nom: row.matiere.nom, ponderation: Number(row.ponderation) }));
}

// Recherche d'élève par nom ou matricule — utilisé par le formulaire de
// nouveau paiement en caisse (pas besoin de connaître la classe à l'avance).
export async function searchEleves(query) {
  if (!query || query.trim().length < 2) return [];
  const { data, error } = await supabase
    .from("eleve")
    .select("id, matricule, nom, postnom, prenom, classe:classe_id(nom)")
    .or(`nom.ilike.%${query}%,matricule.ilike.%${query}%,prenom.ilike.%${query}%`)
    .eq("statut", "actif")
    .limit(10);
  if (error) throw error;
  return data;
}

// Année scolaire active — utilisée pour créer une classe sans dépendre
// d'un champ jamais renseigné ailleurs dans l'app.
export async function fetchAnneeActive() {
  const { data, error } = await supabase
    .from("annee_scolaire")
    .select("id, libelle")
    .eq("statut", "active")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createEleve({ matricule, nom, postnom, prenom, sexe, dateNaissance, classeId, anneeScolaireId, responsableNom, responsableTelephone }) {
  const { data, error } = await supabase
    .from("eleve")
    .insert({
      matricule, nom, postnom: postnom || null, prenom: prenom || null,
      sexe: sexe || null, date_naissance: dateNaissance || null,
      classe_id: classeId, annee_scolaire_id: anneeScolaireId,
      responsable_nom: responsableNom || null, responsable_telephone: responsableTelephone || null,
      statut: "actif",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Tous les élèves de l'établissement (vue Secrétariat), avec leur classe.
export async function fetchTousLesEleves() {
  const { data, error } = await supabase
    .from("eleve")
    .select("id, matricule, nom, postnom, prenom, statut, classe:classe_id(nom)")
    .order("nom");
  if (error) throw error;
  return data;
}

export async function createEleve({ matricule, nom, postnom, prenom, sexe, dateNaissance, classeId, anneeScolaireId, responsableNom, responsableTelephone }) {
  const { data, error } = await supabase
    .from("eleve")
    .insert({
      matricule, nom, postnom: postnom || null, prenom: prenom || null,
      sexe: sexe || null, date_naissance: dateNaissance || null,
      classe_id: classeId, annee_scolaire_id: anneeScolaireId,
      responsable_nom: responsableNom || null, responsable_telephone: responsableTelephone || null,
      statut: "actif",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchTousLesEleves() {
  const { data, error } = await supabase
    .from("eleve")
    .select("id, matricule, nom, postnom, prenom, statut, classe:classe_id(nom)")
    .order("nom");
  if (error) throw error;
  return data;
}
