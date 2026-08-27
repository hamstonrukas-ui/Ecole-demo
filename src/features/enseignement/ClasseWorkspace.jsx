import React, { useState, useEffect, useMemo, useCallback } from "react";
import TopBar from "../../components/layout/TopBar";
import JourneeTab from "./tabs/JourneeTab";
import NotesTab from "./tabs/NotesTab";
import AddEvaluationModal from "./modals/AddEvaluationModal";
import AddSubjectModal from "./modals/AddSubjectModal";
import HistoriqueModal from "./modals/HistoriqueModal";
import ClassementModal from "./modals/ClassementModal";
import BulletinsListModal from "./modals/BulletinsListModal";
import BulletinAnnuelModal from "./modals/BulletinAnnuelModal";
import { PHASE_ORDER, PHASE_LABELS, TRIMESTRE_LABELS, isExamPhase } from "../../constants/scolaire";
import { computeBulletinRows, computeTrimestreResult, buildEleveBulletin } from "../../utils/bulletins";
import { fetchElevesByClasse, fetchMatieresAvecPonderation } from "../../lib/api/classes";
import {
  getOrCreateJournee, fetchPresences, setPresence, saveHoraireSlot,
  fetchJournalDuJour, cloturerJournee as apiCloturerJournee, fetchHistoriqueJournees,
} from "../../lib/api/journees";
import {
  fetchEvaluations, createEvaluation, validerEvaluation as apiValiderEvaluation,
  supprimerEvaluation as apiSupprimerEvaluation, fetchNotes, setNote,
  saveBulletinPeriode, saveBulletinTrimestre,
} from "../../lib/api/evaluations";
import { supabase } from "../../lib/supabaseClient";

// Orchestrateur : détient l'état de la classe côté UI mais lit/écrit tout
// dans Supabase — `classe.eleves` (tableau de noms) a disparu, remplacé par
// `eleves` (lignes réelles de la table `eleve`, avec leur id).
export default function ClasseWorkspace({ classe, role, onBack, onLogout, userId }) {
  const [tab, setTab] = useState("journee");
  const [eleves, setEleves] = useState([]);
  const [loadingEleves, setLoadingEleves] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchElevesByClasse(classe.id)
      .then((data) => { if (active) setEleves(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoadingEleves(false); });
    return () => { active = false; };
  }, [classe.id]);

  const nomComplet = (e) => `${e.prenom || ""} ${e.nom}`.trim();

  // ---- Journée du jour ----
  const [dayOffset, setDayOffset] = useState(0); // 0 = aujourd'hui, négatif = jours passés
  const dateJour = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().slice(0, 10);
  }, [dayOffset]);
  const [journee, setJournee] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [horaire, setHoraire] = useState({});
  const [rapport, setRapport] = useState("");
  const [showHistorique, setShowHistorique] = useState(false);
  const [historique, setHistorique] = useState([]);

  useEffect(() => {
    if (eleves.length === 0) return;
    let active = true;
    (async () => {
      try {
        const j = await getOrCreateJournee(classe.id, dateJour);
        if (!active) return;
        setJournee(j);
        const [pres, jour] = await Promise.all([fetchPresences(j.id), fetchJournalDuJour(j.id)]);
        if (!active) return;
        const att = Object.fromEntries(eleves.map((e) => [e.id, true]));
        pres.forEach((p) => { att[p.eleve_id] = p.present; });
        setAttendance(att);
        const hor = {};
        jour.forEach((row) => { hor[row.creneau_id] = row.lecon || row.matiere?.nom || ""; });
        setHoraire(hor);
        setRapport(j.rapport || "");
      } catch (e) {
        setError(e.message);
      }
    })();
    return () => { active = false; };
  }, [classe.id, dateJour, eleves]);

  const isCloture = journee?.statut === "cloturee";

  async function toggleEleve(eleveId) {
    if (isCloture || !journee) return;
    const next = !attendance[eleveId];
    setAttendance((a) => ({ ...a, [eleveId]: next }));
    try { await setPresence(journee.id, eleveId, next); } catch (e) { setError(e.message); }
  }
  async function setHoraireSlot(slotId, value) {
    if (isCloture || !journee) return;
    setHoraire((h) => ({ ...h, [slotId]: value }));
    try { await saveHoraireSlot(journee.id, slotId, null, value); } catch (e) { setError(e.message); }
  }
  async function cloturerJourneeHandler() {
    if (!journee) return;
    try {
      await apiCloturerJournee(journee.id, rapport, userId);
      setJournee((j) => ({ ...j, statut: "cloturee", rapport }));
    } catch (e) { setError(e.message); }
  }
  async function openHistorique() {
    try {
      const h = await fetchHistoriqueJournees(classe.id);
      setHistorique(h);
      setShowHistorique(true);
    } catch (e) { setError(e.message); }
  }
  function goToDay(offset) {
    if (offset > 0) return; // jamais de navigation vers le futur
    setDayOffset(offset);
  }
  function selectHistoriqueDay(dateStr) {
    const today = new Date().toISOString().slice(0, 10);
    const diffMs = new Date(dateStr) - new Date(today);
    setDayOffset(Math.round(diffMs / 86400000));
    setShowHistorique(false);
  }

  // ---- Évaluations & phase (le calcul de bulletin reste local — utils/bulletins.js —
  // et n'est écrit dans Supabase qu'à la clôture d'une phase) ----
  const [phase, setPhase] = useState("p1");
  const [subjects, setSubjects] = useState([]);
  useEffect(() => {
    fetchMatieresAvecPonderation(classe.annee_scolaire_id).then(setSubjects).catch((e) => setError(e.message));
  }, [classe.annee_scolaire_id]);
  const [evaluations, setEvaluations] = useState([]);
  const [activeEvalId, setActiveEvalId] = useState(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddEval, setShowAddEval] = useState(false);
  const [periodHistory, setPeriodHistory] = useState({});
  const [trimestreResults, setTrimestreResults] = useState({});
  const [viewingPeriode, setViewingPeriode] = useState(null);
  const [viewingTrimestre, setViewingTrimestre] = useState(null);
  const [showBulletins, setShowBulletins] = useState(false);
  const [selectedEleveBulletin, setSelectedEleveBulletin] = useState(null);

  const reloadEvaluations = useCallback(async () => {
    try {
      const evs = await fetchEvaluations(classe.id, phase);
      const withNotes = await Promise.all(
        evs.map(async (ev) => {
          const notes = await fetchNotes(ev.id);
          const points = Object.fromEntries(eleves.map((e) => [nomComplet(e), notes.find((n) => n.eleve_id === e.id)?.points_obtenus ?? ""]));
          return { id: ev.id, cours: ev.matiere?.nom, max: Number(ev.points_max), valide: ev.statut === "validee", points };
        })
      );
      setEvaluations(withNotes);
      if (withNotes.length && !activeEvalId) setActiveEvalId(withNotes[0].id);
    } catch (e) { setError(e.message); }
  }, [classe.id, phase, eleves]);

  useEffect(() => { if (eleves.length) reloadEvaluations(); }, [reloadEvaluations, eleves.length]);

  const activeEval = evaluations.find((e) => e.id === activeEvalId);
  const pondMultiplier = isExamPhase(phase) ? 2 : 1;
  const elevesNoms = eleves.map(nomComplet);

  async function addEvaluation({ cours, nom, max }) {
    try {
      const created = await createEvaluation({ classeId: classe.id, matiereId: cours, periodeId: phase, nom, pointsMax: max, creeParId: userId });
      setActiveEvalId(created.id);
      setShowAddEval(false);
      reloadEvaluations();
    } catch (e) { setError(e.message); }
  }
  async function setPoint(eleveNom, val) {
    const eleve = eleves.find((e) => nomComplet(e) === eleveNom);
    if (!eleve || !activeEval) return;
    setEvaluations((evs) => evs.map((e) => (e.id === activeEvalId ? { ...e, points: { ...e.points, [eleveNom]: val } } : e)));
    try { await setNote(activeEvalId, eleve.id, val === "" ? null : Number(val)); } catch (e2) { setError(e2.message); }
  }
  async function validerEvaluationHandler() {
    try { await apiValiderEvaluation(activeEvalId, true); reloadEvaluations(); } catch (e) { setError(e.message); }
  }
  async function modifierEvaluationHandler() {
    try { await apiValiderEvaluation(activeEvalId, false); reloadEvaluations(); } catch (e) { setError(e.message); }
  }
  async function supprimerEvaluationHandler(id) {
    try { await apiSupprimerEvaluation(id); reloadEvaluations(); } catch (e) { setError(e.message); }
  }

  async function cloturerPhase() {
    const mult = isExamPhase(phase) ? 2 : 1;
    const snapshot = computeBulletinRows(evaluations, subjects, elevesNoms, mult);
    const newHistory = { ...periodHistory, [phase]: snapshot };
    setPeriodHistory(newHistory);

    try {
      await Promise.all(snapshot.map((row) => {
        const eleve = eleves.find((e) => nomComplet(e) === row.eleve);
        return saveBulletinPeriode({
          eleveId: eleve.id, classeId: classe.id, periodeId: phase,
          total: row.total, totalMax: row.totalMax, pourcentage: row.pourcentage, place: row.place, detail: row.details,
        });
      }));

      if (isExamPhase(phase)) {
        const trimId = { exam1: "t1", exam2: "t2", exam3: "t3" }[phase];
        const rows = computeTrimestreResult(newHistory, subjects, elevesNoms, trimId);
        setTrimestreResults((tr) => ({ ...tr, [trimId]: rows }));
        await Promise.all(rows.map((row) => {
          const eleve = eleves.find((e) => nomComplet(e) === row.eleve);
          return saveBulletinTrimestre({
            eleveId: eleve.id, classeId: classe.id, trimestre: Number(trimId[1]),
            total: row.total, totalMax: row.totalMax, pourcentage: row.pourcentage, place: row.place, detail: row.details,
          });
        }));
      }
    } catch (e) { setError(e.message); }

    setEvaluations([]);
    setActiveEvalId(null);
    const idx = PHASE_ORDER.indexOf(phase);
    setPhase(idx < PHASE_ORDER.length - 1 ? PHASE_ORDER[idx + 1] : "annee_finie");
  }

  if (loadingEleves) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopBar role={role} onLogout={onLogout} onBack={onBack} title={classe.nom} subtitle="Chargement…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} onBack={onBack} title={classe.nom} subtitle={`${eleves.length} élèves`} />

      {error && <div className="max-w-4xl mx-auto px-6 pt-4"><div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div></div>}

      <div className="max-w-4xl mx-auto px-6 pt-5">
        <div className="flex gap-2 bg-slate-100 rounded-xl p-1 w-fit">
          <button onClick={() => setTab("journee")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "journee" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Suivi quotidien</button>
          <button onClick={() => setTab("notes")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "notes" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Notes & bulletin</button>
        </div>
      </div>

      {tab === "journee" && journee && (
        <JourneeTab
          classe={{ ...classe, eleves: elevesNoms }}
          day={dayOffset} currentDate={new Date(dateJour)} current={journee} isCloture={isCloture}
          attendance={Object.fromEntries(eleves.map((e) => [nomComplet(e), attendance[e.id]]))}
          horaire={horaire} rapport={rapport}
          onGoToDay={goToDay}
          onToggleEleve={(nom) => { const e = eleves.find((x) => nomComplet(x) === nom); if (e) toggleEleve(e.id); }}
          onSetHoraireSlot={setHoraireSlot} onSetRapport={setRapport}
          onShowHistorique={openHistorique} onCloturerJournee={cloturerJourneeHandler}
        />
      )}

      {tab === "notes" && (
        <NotesTab
          classe={{ ...classe, eleves: elevesNoms }} subjects={subjects} evaluations={evaluations}
          activeEval={activeEval} activeEvalId={activeEvalId}
          phase={phase} pondMultiplier={pondMultiplier} periodHistory={periodHistory} trimestreResults={trimestreResults}
          onSetActiveEvalId={setActiveEvalId} onSetPoint={setPoint} onValiderEvaluation={validerEvaluationHandler}
          onModifierEvaluation={modifierEvaluationHandler} onSupprimerEvaluation={supprimerEvaluationHandler}
          onShowAddSubject={() => setShowAddSubject(true)} onShowAddEval={() => setShowAddEval(true)}
          onCloturerPhase={cloturerPhase} onViewPeriode={setViewingPeriode} onViewTrimestre={setViewingTrimestre}
          onShowBulletins={() => setShowBulletins(true)}
        />
      )}

      {showAddEval && (
        <AddEvaluationModal subjects={subjects} defaultCours={subjects[0]?.id} onAdd={addEvaluation} onClose={() => setShowAddEval(false)} />
      )}
      {showAddSubject && (
        <AddSubjectModal onAdd={() => setShowAddSubject(false)} onClose={() => setShowAddSubject(false)} />
      )}
      {showHistorique && (
        <HistoriqueModal
          closedDays={historique.map((h) => [h.date_jour, { presents: eleves.length }])}
          onSelectDay={selectHistoriqueDay}
          onClose={() => setShowHistorique(false)}
        />
      )}
      {viewingPeriode && (
        <ClassementModal title={`${PHASE_LABELS[viewingPeriode]} — classement`} rows={periodHistory[viewingPeriode]} onClose={() => setViewingPeriode(null)} />
      )}
      {viewingTrimestre && (
        <ClassementModal title={`${TRIMESTRE_LABELS[viewingTrimestre]} — classement`} rows={trimestreResults[viewingTrimestre]} onClose={() => setViewingTrimestre(null)} />
      )}
      {showBulletins && (
        <BulletinsListModal classe={{ ...classe, eleves: elevesNoms }} onSelectEleve={(e) => { setSelectedEleveBulletin(e); setShowBulletins(false); }} onClose={() => setShowBulletins(false)} />
      )}
      {selectedEleveBulletin && (
        <BulletinAnnuelModal
          classe={{ ...classe, eleves: elevesNoms }}
          eleve={selectedEleveBulletin}
          bulletin={buildEleveBulletin({ eleve: selectedEleveBulletin, subjects, eleves: elevesNoms, periodHistory, trimestreResults })}
          onClose={() => setSelectedEleveBulletin(null)}
        />
      )}
    </div>
  );
}
