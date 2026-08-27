import React from "react";
import { Check } from "lucide-react";
import Chip from "./Chip";

export default function SectionCard({ icon: Icon, title, children, done, right }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shrink-0">
            <Icon size={16} />
          </div>
          <h3 className="font-bold text-slate-800 text-[15px]">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {right}
          {done && <Chip tone="sky"><Check size={12} /> Fait</Chip>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
