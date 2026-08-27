// Données de démonstration uniquement.
// En production : `classes` vient de la table `classe` filtrée par les
// affectations de l'enseignant connecté (jamais une classe codée en dur),
// et `eleves` vient de la table `eleve` — la même fiche que le module finance.

export const INITIAL_CLASSES = [
  { id: "c1", nom: "6ème A", enseignant: "M. Kabeya", eleves: ["Aline M.", "Junior K.", "Grace N.", "Patrick L.", "Bella T.", "Eric W."] },
  { id: "c2", nom: "5ème B", enseignant: "Mme Furaha", eleves: ["David S.", "Nadia B.", "Chris O.", "Divine M."] },
  { id: "c3", nom: "4ème A", enseignant: "M. Bahati", eleves: ["Josué K.", "Rachel P.", "Moïse T.", "Esther L.", "Samuel R."] },
];

// Matières et pondérations : créées en Période 1, verrouillées après
// validation du directeur (table `pondération_matiere`, statut verrouillé).
export const INITIAL_SUBJECTS = [
  { id: "maths", nom: "Mathématiques", ponderation: 60 },
  { id: "francais", nom: "Français", ponderation: 50 },
  { id: "sciences", nom: "Sciences", ponderation: 40 },
  { id: "anglais", nom: "Anglais", ponderation: 30 },
  { id: "civique", nom: "Éducation civique", ponderation: 20 },
];

export const SCHOOL_YEAR_START = new Date(2025, 8, 2); // 2 septembre 2025
