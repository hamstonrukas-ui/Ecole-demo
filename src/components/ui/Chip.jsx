import React from "react";

// Palette restreinte à 4 couleurs : bleu ciel, rouge, jaune, blanc.
const TONES = {
  sky: "bg-sky-100 text-sky-800 border-sky-300",     // positif / validé / info
  red: "bg-red-100 text-red-700 border-red-300",      // négatif / rejeté / alerte
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-400", // en attente / avertissement
  white: "bg-white text-slate-600 border-slate-200",  // neutre
};

export default function Chip({ children, tone = "sky" }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${TONES[tone]}`}>
      {children}
    </span>
  );
}
