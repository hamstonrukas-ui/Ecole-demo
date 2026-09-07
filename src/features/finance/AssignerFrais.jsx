import React, { useState, useEffect } from "react";
import { Loader2, Users } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import SectionCard from "../../components/ui/SectionCard";
import Chip from "../../components/ui/Chip";
import { fetchClasses, fetchElevesByClasse, fetchAnneeActive } from "../../lib/api/classes";
import { fetchTypesFrais, assignerFraisClasse, fetchFraisDuParClasse } from "../../lib/api/finance";

// L'étape manquante entre "créer un type de frais" et "encaisser un
// paiement en caisse" : dire combien chaque élève doit réellement payer.
// Sans une ligne `frais_du`, un élève n'a rien à payer et la caisse
// affiche "Aucun solde restant dû", même si le type de frais existe.
export default function AssignerFrais({ role, onLogout, onBack }) {
  const [classes, setClasses] = useState([]);
  const [typesFrais, setTypesFrais] = useState([]);
  const [anneeActive, setAnneeActive] = useState(null);
  const [classeId, setClasseId] = useState("");
  const [typeFraisId, setTypeFraisId] = useState("");
  const [montant, setMontant] = useState("");
  const [eleves, setEleves] = useState([]);
  const [dejaAssignes, setDejaAssignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    Promise.all([fetchClasses(), fetchTypesFrais(), fetchAnneeActive()])
      .then(([c, t, a]) => { setClasses(c); setTypesFrais(t); setAnneeActive(a); if (c[0]) setClasseId(c[0].id); if (t[0]) setTypeFraisId(t[0].id); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!classeId || !typeFraisId || !anneeActive) return;
    Promise.all([fetchElevesByClasse(classeId), fetchFraisDuParClasse(classeId, typeFraisId, anneeActive.id)])
      .then(([els, assignes]) => { setEleves(els); setDejaAssignes(assignes); })
      .catch((e) => setError(e.message));
  }, [classeId, typeFraisId, anneeActive]);

  async function appliquer() {
    if (!montant || Number(montant) <= 0 || eleves.length === 0) return;
    setApplying(true);
    setSuccess(null);
    try {
      await assignerFraisClasse({
        eleveIds: eleves.map((e) => e.id),
        typeFraisId, anneeScolaireId: anneeActive.id, montant: Number(montant),
      });
      const assignes = await fetchFraisDuParClasse(classeId, typeFraisId, anneeActive.id);
      setDejaAssignes(assignes);
      setSuccess(`${eleves.length} élève(s) mis à jour avec ${Number(montant).toLocaleString("fr-FR")} FC dû.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} onBack={onBack} title="Attribuer les frais" subtitle="Configuration — Directeur" />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
        {success && <div className="bg-sky-50 border border-sky-200 text-sky-800 text-sm rounded-xl px-4 py-3">{success}</div>}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : classes.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-xl px-4 py-3">Crée d'abord au moins une classe.</div>
        ) : typesFrais.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-xl px-4 py-3">Crée d'abord au moins un type de frais (écran "Frais & fonds").</div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Classe</label>
                <select value={classeId} onChange={(e) => setClasseId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm">
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Type de frais</label>
                <select value={typeFraisId} onChange={(e) => setTypeFraisId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm">
                  {typesFrais.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                </select>
              </div>
            </div>

            <SectionCard icon={Users} title={`Élèves de la classe (${eleves.length})`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-600">{dejaAssignes.length} / {eleves.length} ont déjà ce frais attribué</span>
                {dejaAssignes.length > 0 && <Chip tone="sky">{Number(dejaAssignes[0]?.montant_du || 0).toLocaleString("fr-FR")} FC actuellement</Chip>}
              </div>

              <label className="block text-xs font-bold text-slate-500 mb-1.5">Montant dû par élève (FC)</label>
              <div className="flex gap-2">
                <input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="ex: 150000" className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm" />
                <button disabled={applying || !montant} onClick={appliquer} className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60">
                  {applying ? "…" : "Appliquer à toute la classe"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">S'applique à tous les élèves de cette classe pour l'année active. Un élève déjà à jour verra son montant remplacé, pas dupliqué.</p>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
