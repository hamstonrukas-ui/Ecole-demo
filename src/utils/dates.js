import { SCHOOL_YEAR_START } from "../constants/mockData";

export function dateForDay(n) {
  const d = new Date(SCHOOL_YEAR_START);
  d.setDate(d.getDate() + (n - 1));
  return d;
}

export function fmtDate(d) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function fmtDateShort(d) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
