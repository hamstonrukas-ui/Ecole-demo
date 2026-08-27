import React, { useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

// Vraie connexion Supabase Auth — remplace RoleSelect en production.
export default function LoginForm({ onBack, devMode, onOpenDemo }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError("Email ou mot de passe incorrect.");
    setLoading(false);
    // Si succès : useCurrentUser() détecte la nouvelle session automatiquement,
    // App.jsx redirige vers l'accueil du rôle assigné — rien d'autre à faire ici.
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-6">
      <form onSubmit={submit} className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-sky-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-200">
            <GraduationCap size={30} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Connexion personnel</h1>
          <p className="text-slate-500 text-sm mt-1">Réservé au personnel de l'établissement</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@ecole.cd" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400" />

        <label className="block text-xs font-bold text-slate-500 mb-1.5">Mot de passe</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-sky-400" />

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null} Se connecter
        </button>

        <button type="button" onClick={onBack} className="w-full text-xs font-bold text-slate-400 hover:text-sky-600 mt-4">
          ← Retour à l'espace public
        </button>

        {devMode && (
          <button type="button" onClick={onOpenDemo} className="w-full text-[11px] text-slate-300 hover:text-slate-400 mt-6 border-t border-slate-100 pt-4">
            Mode démo (développement local uniquement)
          </button>
        )}
      </form>
    </div>
  );
}
