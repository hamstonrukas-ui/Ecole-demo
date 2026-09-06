import { supabase } from "../supabaseClient";

// ---------------------- CAISSE / PAIEMENTS ----------------------

// Situation financière d'un élève (utilise la vue déjà définie dans le schéma).
export async function fetchSituationEleve(eleveId) {
  const { data, error } = await supabase
    .from("situation_financiere_eleve")
    .select("*, type_frais:type_frais_id(nom)")
    .eq("eleve_id", eleveId);
  if (error) throw error;
  return data;
}

// Crée un paiement + sa ventilation en une seule opération atomique (RPC),
// pour ne jamais laisser un paiement sans ventilation cohérente. La
// fonction `creer_paiement_avec_ventilation` est un exemple à créer côté
// base (SQL function) si vous préférez l'atomicité totale ; à défaut,
// l'insert + insert ci-dessous couvre le cas standard.
export async function createPaiement({ eleveId, tresorerieId, caissierId, modePaiement, ventilation }) {
  const montantTotal = ventilation.reduce((s, v) => s + v.montant, 0);
  const numeroRecu = "REC-" + new Date().getFullYear() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  const { data: paiement, error: err1 } = await supabase
    .from("paiement")
    .insert({
      numero_recu: numeroRecu,
      eleve_id: eleveId,
      tresorerie_id: tresorerieId,
      caissier_id: caissierId,
      mode_paiement: modePaiement,
      montant_total: montantTotal,
      statut: "en_attente",
    })
    .select()
    .single();
  if (err1) throw err1;

  const rows = ventilation.map((v) => ({
    paiement_id: paiement.id,
    type_frais_id: v.typeFraisId,
    fonds_id: v.fondsId,
    montant: v.montant,
  }));
  const { error: err2 } = await supabase.from("paiement_ventilation").insert(rows);
  if (err2) throw err2;

  return paiement;
}

// File d'attente du Contrôleur — jamais ses propres recettes (double
// vérification : RLS + filtre applicatif).
export async function fetchRecettesEnAttente(controleurId) {
  const { data, error } = await supabase
    .from("paiement")
    .select("id, numero_recu, montant_total, mode_paiement, caissier_id, eleve:eleve_id(nom, prenom)")
    .eq("statut", "en_attente")
    .neq("caissier_id", controleurId);
  if (error) throw error;
  return data;
}

export async function validerPaiement(paiementId, validateurId) {
  const { error } = await supabase
    .from("paiement")
    .update({ statut: "validee", valide_par: validateurId, date_validation: new Date().toISOString() })
    .eq("id", paiementId);
  if (error) throw error;
}

export async function rejeterPaiement(paiementId, validateurId, motif) {
  const { error } = await supabase
    .from("paiement")
    .update({ statut: "rejetee", valide_par: validateurId, date_validation: new Date().toISOString(), motif_rejet: motif })
    .eq("id", paiementId);
  if (error) throw error;
}

export async function fetchDernieresOperations(tresorerieId, limit = 10) {
  const { data, error } = await supabase
    .from("paiement")
    .select("numero_recu, montant_total, statut, eleve:eleve_id(nom, prenom)")
    .eq("tresorerie_id", tresorerieId)
    .order("date_creation", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ---------------------- CLÔTURE DE CAISSE ----------------------

export async function fetchClotureDuJour(tresorerieId, date) {
  const { data, error } = await supabase
    .from("cloture_caisse")
    .select("*")
    .eq("tresorerie_id", tresorerieId)
    .eq("date_cloture", date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function preparerCloture({ tresorerieId, dateCloture, soldeTheorique, soldePhysique, motifEcart, preparateurId }) {
  const { data, error } = await supabase
    .from("cloture_caisse")
    .insert({
      tresorerie_id: tresorerieId,
      date_cloture: dateCloture,
      solde_theorique: soldeTheorique,
      solde_physique: soldePhysique,
      motif_ecart: motifEcart,
      prepare_par: preparateurId,
      statut: "preparee",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCloturesEnAttente() {
  const { data, error } = await supabase
    .from("cloture_caisse")
    .select("*, tresorerie:tresorerie_id(nom)")
    .eq("statut", "preparee");
  if (error) throw error;
  return data;
}

export async function validerCloture(clotureId, validateurId) {
  const { error } = await supabase
    .from("cloture_caisse")
    .update({ statut: "validee", valide_par: validateurId, date_validation: new Date().toISOString() })
    .eq("id", clotureId);
  if (error) throw error;
}

// ---------------------- FONDS / DÉPENSES / TRANSFERTS ----------------------

export async function fetchSoldeFonds() {
  const { data, error } = await supabase.from("solde_fonds").select("*").order("nom");
  if (error) throw error;
  return data;
}

export async function fetchMesDepenses(demandeurId) {
  const { data, error } = await supabase
    .from("depense")
    .select("*, fonds:fonds_id(nom), categorie:categorie_depense_id(nom)")
    .eq("demandeur_id", demandeurId)
    .order("date_demande", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDepense({ fondsId, categorieDepenseId, montant, motif, fournisseur, demandeurId }) {
  const reference = "DEP-" + new Date().getFullYear() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const { data, error } = await supabase
    .from("depense")
    .insert({ reference, fonds_id: fondsId, categorie_depense_id: categorieDepenseId, montant, motif, fournisseur, demandeur_id: demandeurId, statut: "en_attente_approbation", date_demande: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function approuverDepense(depenseId, approbateurId) {
  const { error } = await supabase
    .from("depense")
    .update({ statut: "approuvee", approbateur_id: approbateurId, date_approbation: new Date().toISOString() })
    .eq("id", depenseId);
  if (error) throw error;
}

export async function createTransfertFonds({ fondsSourceId, fondsDestinationId, montant, motif, demandeurId }) {
  const { data, error } = await supabase
    .from("transfert_fonds")
    .insert({ fonds_source_id: fondsSourceId, fonds_destination_id: fondsDestinationId, montant, motif, demandeur_id: demandeurId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------- COMPTABILITÉ ----------------------

export async function fetchEcrituresBrouillon() {
  const { data, error } = await supabase.from("ecriture_comptable").select("*").eq("statut", "brouillon");
  if (error) throw error;
  return data;
}

export async function fetchComptesNonValides() {
  const { data, error } = await supabase.from("compte_comptable").select("numero, libelle").eq("valide", false);
  if (error) throw error;
  return data;
}

export async function fetchBalanceApercu(limit = 5) {
  const { data, error } = await supabase.from("balance_comptable").select("*").order("numero").limit(limit);
  if (error) throw error;
  return data;
}

// ---------------------- LISTES POUR LES FORMULAIRES ----------------------

export async function fetchTypesFrais() {
  const { data, error } = await supabase
    .from("type_frais")
    .select("id, nom, fonds_id_defaut")
    .eq("statut", "actif")
    .order("nom");
  if (error) throw error;
  return data;
}

export async function fetchFondsListe() {
  const { data, error } = await supabase.from("fonds").select("id, nom").eq("statut", "actif").order("nom");
  if (error) throw error;
  return data;
}

export async function fetchCategoriesDepense() {
  const { data, error } = await supabase.from("categorie_depense").select("id, nom").order("nom");
  if (error) throw error;
  return data;
}

export async function fetchTresoreries() {
  const { data, error } = await supabase.from("tresorerie").select("id, nom, type").eq("statut", "actif").order("nom");
  if (error) throw error;
  return data;
}

// Situation d'un élève tous frais confondus, pour préremplir le formulaire
// de paiement (dû/payé/reste par type de frais).
export async function fetchSituationParEleve(eleveId) {
  const { data, error } = await supabase
    .from("situation_financiere_eleve")
    .select("type_frais_id, montant_du, montant_paye, reste_a_payer, type_frais:type_frais_id(nom, fonds_id_defaut)")
    .eq("eleve_id", eleveId);
  if (error) throw error;
  return data;
}

// Solde théorique d'une caisse = paiements validés - dépenses payées sur
// cette trésorerie. (Le schéma prévoit `mouvement_caisse` pour une
// traçabilité plus fine ; en attendant les triggers qui l'alimentent
// automatiquement, ce calcul direct reste correct pour la clôture.)
export async function fetchSoldeTheorique(tresorerieId) {
  const [{ data: paiements, error: e1 }, { data: depenses, error: e2 }] = await Promise.all([
    supabase.from("paiement").select("montant_total").eq("tresorerie_id", tresorerieId).eq("statut", "validee"),
    supabase.from("depense").select("montant").eq("tresorerie_id", tresorerieId).eq("statut", "payee"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const entrees = paiements.reduce((s, p) => s + Number(p.montant_total), 0);
  const sorties = depenses.reduce((s, d) => s + Number(d.montant), 0);
  return entrees - sorties;
}

export async function createFonds({ code, nom, description }) {
  const { data, error } = await supabase
    .from("fonds")
    .insert({ code, nom, description: description || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createTypeFrais({ code, nom, description, fondsIdDefaut }) {
  const { data, error } = await supabase
    .from("type_frais")
    .insert({ code, nom, description: description || null, fonds_id_defaut: fondsIdDefaut })
    .select()
    .single();
  if (error) throw error;
  return data;
        }
    
