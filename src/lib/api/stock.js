import { supabase } from "../supabaseClient";

export async function fetchSoldeStock() {
  const { data, error } = await supabase.from("solde_stock").select("*").order("nom");
  if (error) throw error;
  return data;
}

export async function fetchCategoriesArticle() {
  const { data, error } = await supabase.from("categorie_article").select("id, nom").order("nom");
  if (error) throw error;
  return data;
}

export async function createArticle({ code, nom, categorieId, uniteMesure, seuilAlerte }) {
  const { data, error } = await supabase
    .from("article")
    .insert({ code, nom, categorie_id: categorieId, unite_mesure: uniteMesure, seuil_alerte: seuilAlerte || 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchArticles() {
  const { data, error } = await supabase
    .from("article")
    .select("id, code, nom, unite_mesure, seuil_alerte, categorie:categorie_id(nom)")
    .eq("statut", "actif")
    .order("nom");
  if (error) throw error;
  return data;
}

// Entrée de stock (achat/réapprovisionnement), avec lien optionnel vers une
// dépense déjà approuvée — pour ne jamais dissocier l'argent sorti du
// matériel entré.
export async function enregistrerEntree({ articleId, quantite, fournisseur, depenseId, motif, utilisateurId }) {
  const { data, error } = await supabase
    .from("mouvement_stock")
    .insert({ article_id: articleId, sens: "entree", quantite, fournisseur, depense_id: depenseId || null, motif, utilisateur_id: utilisateurId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Sortie de stock (distribution ou consommation). Le trigger SQL
// `verifier_stock_suffisant` bloque toute sortie si le stock est insuffisant.
export async function enregistrerSortie({ articleId, quantite, motifSortie, classeId, beneficiaire, motif, utilisateurId }) {
  const { data, error } = await supabase
    .from("mouvement_stock")
    .insert({ article_id: articleId, sens: "sortie", quantite, motif_sortie: motifSortie, classe_id: classeId || null, beneficiaire, motif, utilisateur_id: utilisateurId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchDernieresMouvements(limit = 15) {
  const { data, error } = await supabase
    .from("mouvement_stock")
    .select("id, sens, quantite, motif_sortie, fournisseur, beneficiaire, date_mouvement, article:article_id(nom, unite_mesure)")
    .order("date_mouvement", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// Dépenses approuvées mais pas encore payées, pour proposer un lien lors
// d'une entrée de stock (achat de matériel déjà validé côté finance).
export async function fetchDepensesApprouveesLiables() {
  const { data, error } = await supabase
    .from("depense")
    .select("id, reference, motif, montant")
    .eq("statut", "approuvee")
    .order("date_approbation", { ascending: false });
  if (error) throw error;
  return data;
}
