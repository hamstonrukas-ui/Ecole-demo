// Logique de notation — extraite telle quelle du prototype, transformée en
// fonctions pures (paramètres explicites au lieu de closures sur le state
// du composant) pour être testable et réutilisable indépendamment de l'UI.
import { TRIMESTRE_PHASES, TRIMESTRE_LABELS, PHASE_LABELS, isExamPhase } from "../constants/scolaire";

// Cumul des points obtenus/max pour un cours donné, sur les évaluations validées.
export function cumulPourCours(evaluations, coursId, eleve) {
  const evs = evaluations.filter((e) => e.cours === coursId && e.valide);
  let obtenu = 0, max = 0;
  evs.forEach((e) => {
    obtenu += Number(e.points[eleve]) || 0;
    max += Number(e.max) || 0;
  });
  return { obtenu, max };
}

// Calcule, pour chaque élève, le total pondéré et le classement d'une
// période (ou d'un examen) donnée.
export function computeBulletinRows(evaluations, subjects, eleves, mult) {
  const rows = eleves.map((eleve) => {
    let total = 0, totalMax = 0;
    const details = subjects.map((s) => {
      const evs = evaluations.filter((e) => e.cours === s.id && e.valide);
      let obtenu = 0, max = 0;
      evs.forEach((e) => { obtenu += Number(e.points[eleve]) || 0; max += Number(e.max) || 0; });
      const pond = s.ponderation * mult;
      const note = max > 0 ? Math.round((obtenu / max) * pond * 10) / 10 : 0;
      total += note;
      totalMax += pond;
      return { ...s, obtenu, max, note, pond };
    });
    const pourcentage = totalMax > 0 ? Math.round((total / totalMax) * 1000) / 10 : 0;
    return { eleve, details, total: Math.round(total * 10) / 10, totalMax, pourcentage };
  });
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  sorted.forEach((r, i) => (r.place = i + 1));
  return rows.map((r) => sorted.find((s) => s.eleve === r.eleve));
}

// Fige le résultat d'un trimestre à partir des 3 périodes/examen qui le composent.
export function computeTrimestreResult(newHistory, subjects, eleves, trimId) {
  const phasesOfTrim = TRIMESTRE_PHASES[trimId];
  const rows = eleves.map((eleve) => {
    let total = 0, totalMax = 0;
    const details = subjects.map((s) => {
      const perPhase = phasesOfTrim.map((pk) => {
        const d = newHistory[pk].find((b) => b.eleve === eleve).details.find((x) => x.id === s.id);
        return { key: pk, label: PHASE_LABELS[pk], note: d.note, pond: d.pond };
      });
      const noteSum = perPhase.reduce((a, c) => a + c.note, 0);
      const maxSum = perPhase.reduce((a, c) => a + c.pond, 0);
      total += noteSum;
      totalMax += maxSum;
      return { ...s, perPhase, note: Math.round(noteSum * 10) / 10, max: maxSum };
    });
    const pourcentage = totalMax > 0 ? Math.round((total / totalMax) * 1000) / 10 : 0;
    return { eleve, details, total: Math.round(total * 10) / 10, totalMax, pourcentage };
  });
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  sorted.forEach((r, i) => (r.place = i + 1));
  return rows.map((r) => sorted.find((s) => s.eleve === r.eleve));
}

export function getPhaseStats(periodHistory, pk, eleve) {
  const ph = periodHistory[pk];
  if (!ph) return null;
  const row = ph.find((b) => b.eleve === eleve);
  return { pourcentage: row.pourcentage, place: row.place };
}

// Bulletin annuel "noyau" (sans classement annuel, pour éviter la récursion
// avec computeAnneeRanking qui a besoin de reconstruire ce noyau pour tous les élèves).
export function buildEleveBulletinCore({ eleve, subjects, periodHistory, trimestreResults }) {
  const trimestres = ["t1", "t2", "t3"].map((t) => {
    const phases = TRIMESTRE_PHASES[t];
    const rows = subjects.map((s) => ({
      subject: s,
      cells: phases.map((pk) => {
        const ph = periodHistory[pk];
        if (!ph) return { key: pk, label: PHASE_LABELS[pk], note: null };
        const d = ph.find((b) => b.eleve === eleve).details.find((x) => x.id === s.id);
        return { key: pk, label: PHASE_LABELS[pk], note: d.note, pond: d.pond };
      }),
    }));
    const result = trimestreResults[t] ? trimestreResults[t].find((b) => b.eleve === eleve) : null;
    const statsByPhase = phases.map((pk) => ({ key: pk, stats: getPhaseStats(periodHistory, pk, eleve) }));
    return { id: t, label: TRIMESTRE_LABELS[t], rows, result, statsByPhase };
  });
  const allDone = trimestres.every((t) => t.result);
  let annee = null;
  if (allDone) {
    const total = trimestres.reduce((a, t) => a + t.result.total, 0);
    const totalMax = trimestres.reduce((a, t) => a + t.result.totalMax, 0);
    annee = { total: Math.round(total * 10) / 10, totalMax, pourcentage: totalMax > 0 ? Math.round((total / totalMax) * 1000) / 10 : 0 };
  }
  return { trimestres, annee };
}

export function computeAnneeRanking({ eleves, subjects, periodHistory, trimestreResults }) {
  const totals = eleves.map((e) => {
    const bb = buildEleveBulletinCore({ eleve: e, subjects, periodHistory, trimestreResults });
    return { eleve: e, total: bb.annee ? bb.annee.total : null };
  });
  const withData = totals.filter((t) => t.total !== null).sort((a, b) => b.total - a.total);
  withData.forEach((r, i) => (r.place = i + 1));
  return withData;
}

export function buildEleveBulletin({ eleve, subjects, eleves, periodHistory, trimestreResults }) {
  const core = buildEleveBulletinCore({ eleve, subjects, periodHistory, trimestreResults });
  if (core.annee) {
    const ranking = computeAnneeRanking({ eleves, subjects, periodHistory, trimestreResults });
    core.annee.place = ranking.find((r) => r.eleve === eleve)?.place || null;
  }
  return core;
}

export { isExamPhase };
