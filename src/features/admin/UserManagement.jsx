import React, { useState, useEffect } from "react";
import { UserCog, Plus, X, Loader2 } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import Chip from "../../components/ui/Chip";
import SectionCard from "../../components/ui/SectionCard";
import { fetchUtilisateurs, fetchRoles, assignerRole, inviterUtilisateur } from "../../lib/api/utilisateurs";

// C'est ICI, et seulement ici, qu'un rôle est attribué : l'Admin Technique
// choisit le role_id d'une ligne `utilisateur`. RLS (`utilisateur_gestion_admin`,
// `utilisateur_modification_admin`) garantit que seul ce rôle peut écrire ici.
export default function UserManagement({ role, onLogout }) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([fetchUtilisateurs(), fetchRoles()])
      .then(([u, r]) => { if (active) { setUtilisateurs(u); setRoles(r); } })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function onSetUserRole(userId, roleId) {
    try {
      await assignerRole(userId, roleId || null);
      setUtilisateurs((us) => us.map((u) => (u.id === userId ? { ...u, role: roles.find((r) => r.id === roleId) || null } : u)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function onInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviterUtilisateur(inviteEmail.trim());
      setInviteEmail(""); setShowInvite(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar role={role} onLogout={onLogout} title="Gestion des utilisateurs" subtitle="Accueil administrateur technique" />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-700 text-sm">{utilisateurs.length} comptes</h2>
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl">
            <Plus size={16} /> Inviter un utilisateur
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <SectionCard icon={UserCog} title="Comptes et rôles">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
          ) : (
            <div className="space-y-2">
              {utilisateurs.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2.5">
                  <div className="font-bold text-slate-700">{u.nom_complet}</div>
                  <div className="flex items-center gap-2">
                    {!u.role && <Chip tone="yellow">Sans rôle</Chip>}
                    <select
                      value={u.role?.id || ""}
                      onChange={(e) => onSetUserRole(u.id, e.target.value)}
                      className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600"
                    >
                      <option value="">— Choisir un rôle —</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.code}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-lg">Inviter un utilisateur</h3>
              <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Adresse email</label>
            <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="nom@ecole.cd" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <p className="text-[11px] text-slate-400 mb-4">
              Envoie un lien de connexion Supabase Auth via une Edge Function
              (<code>invite-user</code>) — le rôle se choisit ensuite ici, une fois le compte créé.
            </p>
            <button disabled={inviting} onClick={onInvite} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {inviting ? "Envoi…" : "Envoyer l'invitation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
