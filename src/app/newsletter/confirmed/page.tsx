import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/data/site";

export const metadata = { title: "You're on the Jetlag Report list", robots: { index: false, follow: true } };

export default function NewsletterConfirmed() {
  return (
    <section className="container-uj flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="label-mono text-jet-ink">Boarding pass confirmed</p>
      <h1 className="mt-4 max-w-3xl text-[clamp(2.4rem,1.5rem+4vw,4.5rem)] font-semibold leading-[1.02]">
        You&apos;re on the Jetlag Report list.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
        Thanks for confirming. Expect one useful email at a time: rule changes, money tips and the guides worth reading before you fly.
        You can unsubscribe from any email in one click.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/">Back to arrivals</ButtonLink>
      </div>
      <p className="mt-10 text-sm text-muted">
        Questions about the newsletter? Email{" "}
        <a href={`mailto:${site.email.newsletter}`} className="underline">{site.email.newsletter}</a>. Read how we handle your data in our{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </section>
  );
}
