import { supabase } from "../supabaseClient";

export async function fetchCommuniquesPublics() {
  const { data, error } = await supabase
    .from("communique")
    .select("titre, contenu, date_publication")
    .eq("statut", "publie")
    .order("date_publication", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchMesCommuniques(secretaireId) {
  const { data, error } = await supabase
    .from("communique")
    .select("*")
    .eq("cree_par", secretaireId)
    .order("id", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCommunique({ titre, contenu, creeParId }) {
  const { data, error } = await supabase
    .from("communique")
    .insert({ titre, contenu, cree_par: creeParId, statut: "brouillon" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function publierCommunique(communiqueId, publieParId) {
  const { error } = await supabase
    .from("communique")
    .update({ statut: "publie", publie_par: publieParId, date_publication: new Date().toISOString() })
    .eq("id", communiqueId);
  if (error) throw error;
}
