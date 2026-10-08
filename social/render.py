"""Render Uncle Jetlag series posts (1080x1350 PNG, 2x) from a JSON file.

Usage: python3 social/render.py posts.json out_dir
posts.json: [{"series": "border-brief|wallet-wednesday|friday-departures|jetlag-report",
              "kicker": "...", "head": "Plain text, *italic accent*", "rows": ["...", "...", "..."],
              "src": "Checked against ... · Oct 2026", "file": "2026-10-12-border-brief"}]
Needs: pip install playwright && playwright install chromium (or a preinstalled Chromium).
"""
import asyncio, html, json, pathlib, re, sys
from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).resolve().parent / "templates"
SERIES = {
    "border-brief": ("#ff7a4d", "Monday · Border Brief"),
    "wallet-wednesday": ("#3fbf8f", "Wallet Wednesday"),
    "friday-departures": ("#6fa8ff", "Friday · Departures"),
    "jetlag-report": ("#f2c14e", "Sunday · The Jetlag Report"),
}

def head_html(s):
    s = html.escape(s)
    return re.sub(r"\*(.+?)\*", r"<em>\1</em>", s)

async def main(src, out):
    posts = json.loads(pathlib.Path(src).read_text())
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    tpl = (HERE / "series.html").read_text()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for post in posts:
            acc, pill = SERIES[post["series"]]
            rows = "".join(f'<div class="row"><b>{i+1}</b><span>{html.escape(r)}</span></div>' for i, r in enumerate(post["rows"]))
            page_html = (tpl.replace("PILL", pill).replace("KICKER", html.escape(post["kicker"]))
                         .replace("HEAD", head_html(post["head"])).replace("ROWS", rows)
                         .replace("SRC", html.escape(post["src"])).replace("--acc:#ff7a4d", f"--acc:{acc}"))
            tmp = HERE / f"_{post['file']}.html"; tmp.write_text(page_html)
            pg = await b.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=2)
            await pg.goto(tmp.as_uri()); await pg.wait_for_timeout(600)
            await pg.screenshot(path=str(out / f"{post['file']}.png")); await pg.close(); tmp.unlink()
            print("rendered", out / f"{post['file']}.png")
        await b.close()

if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))
