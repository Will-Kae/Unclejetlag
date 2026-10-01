import "server-only";
import fs from "node:fs";
import path from "node:path";
import data from "@/data/photos.json";

export type Photo = { key: string; file: string; author: string; licence: string; alt: string };

const all = (data as { photos: Record<string, Omit<Photo, "key">> }).photos;

export const commonsUrl = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;

/** Only photos that were actually downloaded at build time (public/images/<key>.jpg). */
export function getPhoto(key: string): Photo | undefined {
  const p = all[key];
  if (!p) return undefined;
  if (!fs.existsSync(path.join(process.cwd(), "public", "images", `${key}.jpg`))) return undefined;
  return { key, ...p };
}

export function listPhotos(): Photo[] {
  return Object.keys(all).map(getPhoto).filter((p): p is Photo => !!p);
}

/** Frontmatter-style featured image for a photo key. */
export function featuredFor(key: string) {
  const p = getPhoto(key);
  return p ? { src: `/images/${key}.jpg`, alt: p.alt, credit: `Photo: ${p.author}, ${p.licence}, via Wikimedia Commons` } : undefined;
}
