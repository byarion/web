#!/usr/bin/env python3
"""Robot de Ondexi: descarga titulares (RSS) y precios de mercado y los guarda en data/*.json.
Solo guarda titular + enlace + fuente + fecha (nunca el texto completo de los artículos)."""
import json, re, sys, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

DATA = Path(__file__).parent / "data"
UA = {"User-Agent": "Mozilla/5.0 (compatible; OndexiBot/1.0)"}

# Comprueba que cada enlace funciona; si una fuente falla, el robot la salta.
# El cuarto valor (True) activa un filtro de palabras: para fuentes generales que
# mezclan deportes, cultura, etc., solo se guardan los titulares que hablan de economía.
FEEDS = [
    ("es", "El País", "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada", False),
    ("es", "Expansión", "https://e00-expansion.uecdn.es/rss/portada.xml", False),
    ("es", "Naiz", "https://www.naiz.eus/es/rss/news.rss", True),
    ("en", "BBC Business", "https://feeds.bbci.co.uk/news/business/rss.xml", False),
    ("en", "CNBC Economy", "https://www.cnbc.com/id/20910258/device/rss/rss.html", False),
]

ECON = re.compile(r"econom|empresa|banc|bolsa|ibex|inflaci|salari|sueldo|precio|deuda|impuesto|"
                  r"fiscal|empleo|paro\b|vivienda|alquiler|industria|pensi|inversi|mercado|"
                  r"comercio|turismo|financ|presupuesto|euro\b|euros\b|d[oó]lar|petr[oó]leo|"
                  r"energ|\bpib\b|d[eé]ficit|hipoteca|convenio|huelga|trabajador|aranc", re.I)

FRENCH = re.compile(r"\b(chez|des|une|dans|pour|avec|sont|mais|aux|cette|leur)\b", re.I)
MEDIA = "{http://search.yahoo.com/mrss/}"
CONTENT = "{http://purl.org/rss/1.0/modules/content/}encoded"
BAD_IMG = ("imrworldwide", "doubleclick", "pixel", "tracking", "1x1")

PER_FEED = 8


def get(url, timeout=20):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def parse_date(s):
    try:
        d = parsedate_to_datetime(s)
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return d
    except Exception:
        return datetime.now(timezone.utc)


def good_img(u):
    u = (u or "").strip()
    return u if u.startswith("http") and not any(b in u.lower() for b in BAD_IMG) else ""


def find_image(it):
    """Busca la imagen de portada de un titular: primero las etiquetas estándar del RSS,
    y si no hay, la primera <img> que venga dentro del texto."""
    for tag in (MEDIA + "content", MEDIA + "thumbnail"):
        for el in it.iter(tag):
            u = good_img(el.get("url"))
            if u:
                return u
    for el in it.iter("enclosure"):
        if (el.get("type") or "").startswith("image"):
            u = good_img(el.get("url"))
            if u:
                return u
    html = (it.findtext("description") or "") + (it.findtext(CONTENT) or "")
    for m in re.finditer(r"<img[^>]+src=[\"']([^\"']+)", html):
        u = good_img(m.group(1))
        if u:
            return u
    return ""


def fetch_news():
    items = []
    for lang, source, url, filtered in FEEDS:
        try:
            root = ET.fromstring(get(url))
            for it in root.iter("item"):
                title = (it.findtext("title") or "").strip()
                link = (it.findtext("link") or "").strip()
                if not title or not link.startswith("http"):
                    continue
                title = re.sub(r"\s+", " ", title)
                     if filtered and (not ECON.search(title) or FRENCH.search(title)):
                        continue
                items.append({
                    "lang": lang, "source": source, "title": title, "link": link,
                    "image": find_image(it),
                    "date": parse_date(it.findtext("pubDate") or "").isoformat(),
                })
                if sum(1 for i in items if i["source"] == source) >= PER_FEED:
                    break
        except Exception as e:
            print(f"[aviso] fuente {source} falló: {e}", file=sys.stderr)
    items.sort(key=lambda i: i["date"], reverse=True)
    return items


def yahoo(symbol, name):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=5d"
    meta = json.loads(get(url))["chart"]["result"][0]["meta"]
    price, prev = meta["regularMarketPrice"], meta.get("chartPreviousClose")
    change = (price - prev) / prev * 100 if prev else None
    return {"name": name, "price": price, "change": change}


def fetch_markets():
    out = []
    for symbol, name in [("^IBEX", "Ibex 35"), ("^GSPC", "S&P 500"), ("EURUSD=X", "EUR/USD")]:
        try:
            out.append(yahoo(symbol, name))
        except Exception as e:
            print(f"[aviso] {name} falló: {e}", file=sys.stderr)
    try:
        j = json.loads(get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur&include_24hr_change=true"))
        out.append({"name": "Bitcoin (EUR)", "price": j["bitcoin"]["eur"], "change": j["bitcoin"].get("eur_24h_change")})
    except Exception as e:
        print(f"[aviso] Bitcoin falló: {e}", file=sys.stderr)
    return out


def save(name, items):
    path = DATA / name
    # Si todo falló, conserva los datos anteriores en vez de dejar la web vacía.
    if not items and path.exists():
        print(f"[aviso] sin datos nuevos para {name}, se mantiene el anterior", file=sys.stderr)
        return
    path.write_text(json.dumps({"updated": datetime.now(timezone.utc).isoformat(), "items": items},
                               ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    DATA.mkdir(exist_ok=True)
    save("news.json", fetch_news())
    save("markets.json", fetch_markets())
    print("Listo")
