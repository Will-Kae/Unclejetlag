import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { commonsUrl, listPhotos } from "@/lib/photos";

export const metadata: Metadata = buildMetadata({
  title: "Photo Credits",
  description: "Credits and licences for the photographs used on Uncle Jetlag. All are freely licensed images from Wikimedia Commons.",
  path: "/photo-credits",
  ogKicker: "Credits",
});

const licenceUrl = (l: string) => {
  if (l === "CC0") return "https://creativecommons.org/publicdomain/zero/1.0/";
  const m = l.match(/^CC (BY(?:-SA)?) (\d\.\d)$/);
  return m ? `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/` : undefined;
};

export default function PhotoCreditsPage() {
  const photos = listPhotos();
  return (
    <section className="container-uj pb-10 pt-6 sm:pt-8">
      <Breadcrumbs items={[{ name: "Photo credits", href: "/photo-credits" }]} />
      <header className="mt-10 max-w-3xl">
        <p className="label-mono text-jet-ink">Credits</p>
        <h1 className="mt-3 text-[clamp(2.1rem,1.5rem+3vw,3.4rem)] font-semibold leading-[1.04]">Photo credits</h1>
        <p className="mt-4 text-lg text-muted">
          The photographs on Uncle Jetlag are freely licensed images from Wikimedia Commons, used under the licences below. We haven&apos;t
          altered them other than resizing and cropping for display. Thank you to the photographers.
        </p>
      </header>
      <ul className="mt-10 max-w-3xl divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        {photos.map((p) => {
          const lu = licenceUrl(p.licence);
          return (
            <li key={p.key} id={p.key} className="p-5">
              <p className="font-semibold text-ink">{p.alt}</p>
              <p className="mt-1 text-sm text-ink-2">
                <a href={commonsUrl(p.file)} className="underline" rel="noopener">
                  {p.file}
                </a>{" "}
                by {p.author}, licensed under{" "}
                {lu ? (
                  <a href={lu} className="underline" rel="license noopener">
                    {p.licence}
                  </a>
                ) : (
                  p.licence
                )}
                .
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 max-w-3xl text-muted">
        Spotted a problem with a credit? Email <Link href="/contact" className="font-semibold text-sky underline">us</Link> and we&apos;ll fix it.
      </p>
    </section>
  );
}
