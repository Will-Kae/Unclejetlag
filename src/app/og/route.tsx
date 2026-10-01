import { ImageResponse } from "next/og";

/** Dynamic OpenGraph image: /og?title=...&kicker=... (1200×630). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "Travel smarter. Land prepared.").slice(0, 120);
  const kicker = (searchParams.get("kicker") || "Uncle Jetlag").slice(0, 40);
  const avatar = new URL("/brand/avatar-192.png", req.url).toString();
  const size = title.length > 70 ? 58 : title.length > 40 ? 68 : 80;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0E1A24", color: "#FAF7F2", padding: "64px 72px", position: "relative" }}>
        <div style={{ position: "absolute", right: -120, top: -120, width: 520, height: 520, borderRadius: 999, background: "#CF3D17", opacity: 0.9, display: "flex" }} />
        <div style={{ position: "absolute", right: -160, top: 130, width: 900, height: 2, background: "#FAF7F2", opacity: 0.25, display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#FAF7F2", opacity: 0.8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 99, background: "#CF3D17", display: "flex" }} />
          {kicker}
        </div>
        <div style={{ display: "flex", fontSize: size, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5, maxWidth: 960 }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontWeight: 700 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} width={84} height={84} alt="" style={{ borderRadius: 999 }} />
            Uncle Jetlag
          </div>
          <div style={{ display: "flex", opacity: 0.6 }}>unclejetlag.com · Jetlagged, but informed.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" } },
  );
}
