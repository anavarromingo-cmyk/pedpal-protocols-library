"""Catálogo de protocolos PEDPAL.

Fuentes (ambas públicas, sin credenciales):
  1. Página https://pedpal.es/protocolos/  → enlaces <a href="…pdf"> con el título oficial.
  2. WP REST API https://pedpal.es/wp-json/wp/v2/media?media_type=application
     → fecha de subida / modificación de cada PDF y detección de PDFs no enlazados.

Salida: lista de dicts {slug, titulo, url, media_id, fecha_subida, fecha_modificacion, area, orden, origen}
"""
from __future__ import annotations

import html
import json
import re
import unicodedata
from pathlib import Path

import requests

UA = {"User-Agent": "Mozilla/5.0 (compatible; PedpalProtocolosBot/1.0; +https://pedpal.es)"}
PAGE_URL = "https://pedpal.es/protocolos/"
MEDIA_URL = ("https://pedpal.es/wp-json/wp/v2/media?media_type=application&per_page=100"
             "&_fields=id,date,modified,slug,title,source_url,mime_type")
HERE = Path(__file__).resolve().parent
OVERRIDES = json.loads((HERE / "overrides.json").read_text(encoding="utf-8"))


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.lower()


def slug_of(url: str) -> str:
    return re.sub(r"\.pdf$", "", url.rsplit("/", 1)[-1], flags=re.I).lower()


def fetch_page_anchors(session: requests.Session) -> list[dict]:
    r = session.get(PAGE_URL, headers=UA, timeout=60)
    r.raise_for_status()
    out, seen = [], set()
    for m in re.finditer(r'<a[^>]+href="(https://pedpal\.es/wp-content/uploads/[^"]+\.pdf)"[^>]*>(.*?)</a>',
                         r.text, re.S | re.I):
        url = m.group(1)
        title = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(2)))).strip()
        s = slug_of(url)
        if s in seen:
            continue
        seen.add(s)
        out.append({"slug": s, "titulo": title, "url": url, "orden": len(out) + 1, "origen": "web"})
    return out


def fetch_media(session: requests.Session) -> list[dict]:
    items, page = [], 1
    while True:
        r = session.get(f"{MEDIA_URL}&page={page}", headers=UA, timeout=60)
        if r.status_code == 400:  # más allá de la última página
            break
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        items.extend(batch)
        if page >= int(r.headers.get("X-WP-TotalPages", "1")):
            break
        page += 1
    return [m for m in items if m.get("mime_type") == "application/pdf"]


def infer_area(slug: str, titulo: str) -> str:
    if slug in OVERRIDES["areas"]:
        return OVERRIDES["areas"][slug]
    hay = norm(slug + " " + titulo)
    best, best_n = "Otros", 0
    for area, kws in OVERRIDES["area_keywords"].items():
        n = sum(1 for k in kws if norm(k) in hay)
        if n > best_n:
            best, best_n = area, n
    return best


def build_catalog(session: requests.Session | None = None) -> tuple[list[dict], dict]:
    session = session or requests.Session()
    anchors = fetch_page_anchors(session)
    media = fetch_media(session)
    by_url = {m["source_url"]: m for m in media}
    by_slug = {slug_of(m["source_url"]): m for m in media}

    excluded = set(OVERRIDES.get("exclude", []))
    catalog: list[dict] = []
    for a in anchors:
        if a["slug"] in excluded:
            continue
        m = by_url.get(a["url"]) or by_slug.get(a["slug"])
        catalog.append(_entry(a, m))

    known = {c["slug"] for c in catalog}
    for inc in OVERRIDES.get("include", []):
        if inc["slug"] in known or inc["slug"] in excluded:
            continue
        m = by_slug.get(inc["slug"])
        if not m:
            continue
        a = {"slug": inc["slug"], "titulo": inc.get("titulo") or m["title"]["rendered"],
             "url": m["source_url"], "orden": 900 + len(catalog), "origen": "include"}
        e = _entry(a, m)
        e["nota"] = inc.get("nota", "")
        catalog.append(e)
        known.add(inc["slug"])

    # Informe: PDFs de la mediateca que no están en el catálogo (posibles protocolos sin enlazar)
    unlinked = [{"slug": slug_of(m["source_url"]), "titulo": html.unescape(m["title"]["rendered"]),
                 "url": m["source_url"], "fecha": m["date"][:10]}
                for m in media if slug_of(m["source_url"]) not in known]
    unlinked.sort(key=lambda x: x["fecha"], reverse=True)

    catalog.sort(key=lambda c: (c["orden"], c["titulo"]))
    report = {"n_web": len(anchors), "n_media_pdf": len(media), "n_catalogo": len(catalog), "no_enlazados": unlinked}
    return catalog, report


def _entry(a: dict, m: dict | None) -> dict:
    titulo = OVERRIDES.get("titulos", {}).get(a["slug"], a["titulo"])
    return {
        "slug": a["slug"],
        "titulo": titulo,
        "titulo_web": a["titulo"],
        "url": a["url"],
        "media_id": m["id"] if m else None,
        "fecha_subida": m["date"][:10] if m else None,
        "fecha_modificacion": m["modified"][:10] if m else None,
        "area": infer_area(a["slug"], titulo),
        "orden": a["orden"],
        "origen": a["origen"],
    }


if __name__ == "__main__":
    cat, rep = build_catalog()
    print(json.dumps(rep, ensure_ascii=False, indent=1))
    for c in cat:
        print(f"{c['orden']:3} {c['area']:22} {c['slug']}")
