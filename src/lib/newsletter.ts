import "server-only";

/**
 * Newsletter provider adapter. Add a provider by implementing `subscribe`.
 * Configure with NEWSLETTER_PROVIDER + provider env vars (see .env.example).
 */
export type SubscribeInput = { email: string; source: string; consentedAt: string };
export type SubscribeResult = { ok: true; message?: string } | { ok: false; error: string; status: number };

interface Provider {
  subscribe(input: SubscribeInput): Promise<SubscribeResult>;
}

const noneProvider: Provider = {
  async subscribe(input) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[newsletter:none] would subscribe", input.email, "from", input.source);
      return { ok: true };
    }
    return { ok: false, status: 503, error: "Newsletter sign-ups open soon. Please check back." };
  },
};

const webhookProvider: Provider = {
  async subscribe(input) {
    const url = process.env.NEWSLETTER_WEBHOOK_URL;
    if (!url) return { ok: false, status: 500, error: "Newsletter is not configured." };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.NEWSLETTER_WEBHOOK_SECRET ? { authorization: `Bearer ${process.env.NEWSLETTER_WEBHOOK_SECRET}` } : {}),
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? { ok: true } : { ok: false, status: 502, error: "Could not reach the mailing list. Please try again." };
  },
};


/**
 * Brevo (https://www.brevo.com). Env:
 *   BREVO_API_KEY          required, from Brevo > SMTP & API > API keys
 *   BREVO_LIST_ID          required, numeric ID of the "Jetlag List" contact list
 *   BREVO_DOI_TEMPLATE_ID  optional, numeric ID of a double opt-in confirmation template.
 *                          When set, new subscribers get a confirmation email first (recommended).
 *   BREVO_DOI_REDIRECT_URL optional, where the confirmation link lands (defaults to /newsletter/confirmed)
 */
const brevoProvider: Provider = {
  async subscribe(input) {
    const key = process.env.BREVO_API_KEY;
    const listId = Number(process.env.BREVO_LIST_ID);
    if (!key || !Number.isFinite(listId) || listId <= 0) {
      console.error("[newsletter:brevo] BREVO_API_KEY or BREVO_LIST_ID missing");
      return { ok: false, status: 500, error: "Newsletter is not configured." };
    }
    const templateId = Number(process.env.BREVO_DOI_TEMPLATE_ID);
    const useDoi = Number.isFinite(templateId) && templateId > 0;
    const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://unclejetlag.com").replace(/\/$/, "");
    const url = useDoi ? "https://api.brevo.com/v3/contacts/doubleOptinConfirmation" : "https://api.brevo.com/v3/contacts";
    const body = useDoi
      ? {
          email: input.email,
          includeListIds: [listId],
          templateId,
          redirectionUrl: process.env.BREVO_DOI_REDIRECT_URL || `${site}/newsletter/confirmed`,
        }
      : { email: input.email, listIds: [listId], updateEnabled: true };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        return {
          ok: true,
          message: useDoi
            ? "Almost there. Check your inbox and tap the confirmation link to get the Jetlag Report."
            : "You're on the Jetlag Report list. Welcome aboard.",
        };
      }
      const detail = await res.text().catch(() => "");
      // An already-subscribed address is not an error for the reader.
      if (res.status === 400 && /duplicate/i.test(detail)) {
        return { ok: true, message: "You're already on the Jetlag Report list. Thanks for sticking around." };
      }
      console.error("[newsletter:brevo]", res.status, detail.slice(0, 300));
      return { ok: false, status: 502, error: "Could not reach the mailing list. Please try again." };
    } catch (err) {
      console.error("[newsletter:brevo] request failed", err);
      return { ok: false, status: 502, error: "Could not reach the mailing list. Please try again." };
    }
  },
};

const providers: Record<string, Provider> = { none: noneProvider, webhook: webhookProvider, brevo: brevoProvider };

export function getNewsletterProvider(): Provider {
  return providers[process.env.NEWSLETTER_PROVIDER ?? "none"] ?? noneProvider;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
