// Structure de l'année scolaire (RDC) : 6 périodes + 3 examens + 3 trimestres
// À terme, correspond aux tables `periode_scolaire` et `pondération_matiere`
// du schéma finance/enseignement (voir schéma SQL fourni séparément).

export const HORAIRE_SLOTS = [
  { id: "h1", label: "1ère heure", recreation: false },
  { id: "h2", label: "2e heure", recreation: false },
  { id: "r1", label: "Récréation", recreation: true },
  { id: "h3", label: "3e heure", recreation: false },
  { id: "h4", label: "4e heure", recreation: false },
  { id: "r2", label: "Récréation", recreation: true },
  { id: "h5", label: "5e heure", recreation: false },
  { id: "h6", label: "6e heure", recreation: false },
];

export const PHASE_ORDER = ["p1", "p2", "exam1", "p3", "p4", "exam2", "p5", "p6", "exam3"];

export const PHASE_LABELS = {
  p1: "Période 1", p2: "Période 2", exam1: "Examen 1",
  p3: "Période 3", p4: "Période 4", exam2: "Examen 2",
  p5: "Période 5", p6: "Période 6", exam3: "Examen 3",
};

export const PHASE_NEXT_LABEL = {
  p1: "Période 1 finie — passer à la Période 2",
  p2: "Période 2 finie — passer à l'Examen 1",
  exam1: "Examen 1 fini — calculer le Trimestre 1",
  p3: "Période 3 finie — passer à la Période 4",
  p4: "Période 4 finie — passer à l'Examen 2",
  exam2: "Examen 2 fini — calculer le Trimestre 2",
  p5: "Période 5 finie — passer à la Période 6",
  p6: "Période 6 finie — passer à l'Examen 3",
  exam3: "Examen 3 fini — calculer le Trimestre 3 (fin d'année)",
};

export const TRIMESTRE_PHASES = { t1: ["p1", "p2", "exam1"], t2: ["p3", "p4", "exam2"], t3: ["p5", "p6", "exam3"] };
export const TRIMESTRE_LABELS = { t1: "Trimestre 1", t2: "Trimestre 2", t3: "Trimestre 3" };
export const TRIMESTRE_OF = Object.fromEntries(
  Object.entries(TRIMESTRE_PHASES).flatMap(([t, ks]) => ks.map((k) => [k, t]))
);
export const isExamPhase = (key) => key?.startsWith("exam");
