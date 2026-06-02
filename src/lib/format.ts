const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDay(iso?: string | null): { day: string; month: string; year: string } {
  const d = iso ? new Date(iso) : new Date(NaN);
  if (isNaN(d.getTime())) return { day: "--", month: "", year: "" };
  return { day: String(d.getDate()), month: MONTHS[d.getMonth()].toUpperCase(), year: String(d.getFullYear()) };
}

/** "Mar 2019" style label used on timelines (experience / education). */
export function formatMonthYear(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function relativeYears(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const years = new Date().getFullYear() - d.getFullYear();
  if (years <= 0) return "this year";
  if (years === 1) return "a year ago";
  return `${years} years ago`;
}

export function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function initials(first?: string | null, last?: string | null): string {
  const a = (first || "").trim()[0] || "";
  const b = (last || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
}

export function titleCase(s?: string | null): string {
  if (!s) return "";
  return s
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function splitTags(tags?: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
