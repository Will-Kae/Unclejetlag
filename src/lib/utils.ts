export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function formatDate(iso: string) {
  return dateFmt.format(new Date(`${iso}T00:00:00Z`));
}

export function readingTime(text: string) {
  const words = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

/** Days between an ISO date and a reference date (defaults to build time). */
export function daysSince(iso: string, now = new Date()) {
  return Math.floor((now.getTime() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000);
}

export function absoluteUrl(path: string, base: string) {
  return new URL(path, base).toString();
}
