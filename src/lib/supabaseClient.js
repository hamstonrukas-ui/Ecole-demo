import { createClient } from "@supabase/supabase-js";

// Lit les variables d'environnement injectées au build (Vercel/Netlify)
// ou depuis .env.local en développement. Ne jamais coder l'URL/clé en dur.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Variables Supabase manquantes — vérifie .env.local (dev) ou les variables d'environnement du projet (Vercel/Netlify)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
