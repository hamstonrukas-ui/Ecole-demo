import React, { useState, useEffect } from "react";
import { Boxes, PlusCircle, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Loader2 } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";
import SectionCard from "../../components/ui/SectionCard";
import { fetchSoldeStock, fetchDernieresMouvements } from "../../lib/api/stock";
import NouvelArticleModal from "../stock/modals/NouvelArticleModal";
import EntreeStockModal from "../stock/modals/EntreeStockModal";
import SortieStockModal from "../stock/modals/SortieStockModal";

export default function MagasinierHome({ role, onLogout, onBack, userId }) {
  const [stock, setStock] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showArticle, setShowArticle] = useState(false);
  const [showEntree, setShowEntree] = useState(false);
  const [showSortie, setShowSortie] = useState(false);

  function reload() {
    setLoading(true);
    Promise.all([fetchSoldeStock(), fetchDernieresMouvements()])
      .then(([s, m]) => { setStock(s); setMouvements(m); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  const enAlerte = stock.filter((a) => Number(a.quantite_disponible) <= Number(a.seuil_alerte));

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} onBack={onBack} title="Stock & Patrimoine" subtitle="Accueil magasinier" />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        <div className="grid sm:grid-cols-3 gap-3">
          <button onClick={() => setShowEntree(true)} className="flex items-center justify-between bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-3 rounded-xl text-sm">
            Entrée de stock <ArrowDownCircle size={16} />
          </button>
          <button onClick={() => setShowSortie(true)} className="flex items-center justify-between bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-3 rounded-xl text-sm">
            Sortie de stock <ArrowUpCircle size={16} />
          </button>
          <button onClick={() => setShowArticle(true)} className="flex items-center justify-between bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-3 rounded-xl text-sm">
            Nouvel article <PlusCircle size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : (
          <>
            {enAlerte.length > 0 && (
              <SectionCard icon={AlertTriangle} title={`Stock faible (${enAlerte.length})`}>
                <div className="space-y-2">
                  {enAlerte.map((a) => (
                    <div key={a.article_id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                      <span className="text-slate-700">{a.nom}</span>
                      <Chip tone="red">{a.quantite_disponible} {a.unite_mesure} restant{a.quantite_disponible > 1 ? "s" : ""}</Chip>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            <SectionCard icon={Boxes} title="Stock actuel">
              <div className="space-y-2">
                {stock.length === 0 && <div className="text-sm text-slate-400">Aucun article créé pour l'instant.</div>}
                {stock.map((a) => (
                  <div key={a.article_id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                    <div>
                      <div className="font-bold text-slate-700">{a.nom}</div>
                      <div className="text-xs text-slate-400">{a.categorie}</div>
                    </div>
                    <span className="font-bold text-slate-800">{a.quantite_disponible} {a.unite_mesure}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard icon={Boxes} title="Derniers mouvements">
              <div className="space-y-2">
                {mouvements.length === 0 && <div className="text-sm text-slate-400">Aucun mouvement enregistré.</div>}
                {mouvements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                    <div>
                      <div className="font-bold text-slate-700">{m.article?.nom}</div>
                      <div className="text-xs text-slate-400">
                        {m.sens === "entree" ? `Reçu de ${m.fournisseur || "—"}` : `Sorti vers ${m.beneficiaire || m.motif_sortie}`}
                        {" · "}{new Date(m.date_mouvement).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    <Chip tone={m.sens === "entree" ? "sky" : "yellow"}>
                      {m.sens === "entree" ? "+" : "-"}{m.quantite} {m.article?.unite_mesure}
                    </Chip>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}
      </div>

      {showArticle && <NouvelArticleModal onClose={() => setShowArticle(false)} onSuccess={reload} />}
      {showEntree && <EntreeStockModal utilisateurId={userId} onClose={() => setShowEntree(false)} onSuccess={reload} />}
      {showSortie && <SortieStockModal utilisateurId={userId} onClose={() => setShowSortie(false)} onSuccess={reload} />}
    </div>
  );
}
