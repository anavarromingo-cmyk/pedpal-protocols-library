"""Importa a la app los protocolos APROBADOS de la renovación 2026 (maquetación PEDPAL).

Se ejecuta en local (no en GitHub Actions): lee la versión web aprobada de cada protocolo
(`web_publicacion/<slug>.html`, cuyo texto es idéntico al del PDF aprobado y está verificado por web.py)
y el PDF aprobado congelado, y escribe:

  pipeline/aprobados/<slug>.json      secciones → bloques HTML (tablas, superíndices, figuras tal cual)
                                      + texto plano por bloque (para el buscador) + página del PDF NUEVO
  pipeline/aprobados/fig/<slug>/*.jpg figuras recomprimidas para móvil

build.py usa estos datos SOLO si el PDF descargado de pedpal.es es idéntico (sha256) al aprobado;
si PEDPAL sube otra versión, vuelve a la extracción automática y lo avisa en el informe.

Uso: .venv/bin/python pipeline/importar_aprobados.py [--renovacion RUTA]
"""
from __future__ import annotations

import argparse
from html import escape as html_escape
import hashlib
import json
import re
import shutil
import sys
import unicodedata
from pathlib import Path

import fitz  # PyMuPDF
from bs4 import BeautifulSoup, NavigableString, Tag
from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE / "aprobados"
DEF_RENOV = Path.home() / "Desktop/IA Playground/Protocolos Pedal renovación"
FIG_MAX_W = 1400
JPG_Q = 82

# Texto estampado en cada página del PDF aprobado (no forma parte del contenido)
ESTAMPADO = re.compile(r"Sociedad Española de Cuidados Paliativos Pediátricos.*|© Sociedad Española.*|\b\d+ / \d+\b")


def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def squash(s: str) -> str:
    """Normalización solo para LOCALIZAR texto en el PDF (no se guarda): sin espacios, guiones ni acentos."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[\s\-­‐‑–—·•▪◦●○■□➢✓✔]+", "", s).lower()


def plain(el: Tag) -> str:
    """Texto plano de un bloque para el índice: listas con viñeta, celdas separadas por « | »."""
    if el.name in ("ul", "ol"):
        return " ".join("• " + li.get_text(" ", strip=True) for li in el.find_all("li"))
    tables = el.find_all("table") if el.name != "table" else [el]
    if tables:
        parts = []
        for t in tables:
            cap = t.find("caption")
            if cap:
                parts.append(cap.get_text(" ", strip=True))
            for tr in t.find_all("tr"):
                cells = [c.get_text(" ", strip=True) for c in tr.find_all(["td", "th"])]
                cells = [c for c in cells if c]
                if cells:
                    parts.append(" | ".join(cells))
        rest = el.find_all("p", class_="leyenda")
        parts += [p.get_text(" ", strip=True) for p in rest if not p.find_parent("table")]
        return " ".join(parts)
    return el.get_text(" ", strip=True)


def clean_text(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return re.sub(r"\s+([,.;:)])", r"\1", s)


def page_texts(pdf: Path) -> list[str]:
    out = []
    for pg in fitz.open(pdf):
        t = ESTAMPADO.sub("", pg.get_text())
        out.append(squash(t))
    return out


class PageFinder:
    """Localiza cada bloque en el PDF aprobado avanzando de forma monótona."""

    def __init__(self, pages: list[str]):
        self.pages = pages
        self.cur = 0

    def find(self, text: str) -> int:
        k = squash(text)
        if not k:
            return self.cur + 1
        for probe in (k[:60], k[:30], k[:15], k[-30:]):
            if len(probe) < 6:
                continue
            for i in range(self.cur, len(self.pages)):
                if probe in self.pages[i]:
                    self.cur = i
                    return i + 1
        return self.cur + 1


def heading_text(h: Tag) -> str:
    h = BeautifulSoup(str(h), "html.parser").find(h.name)
    for a in h.find_all("a", class_="ancla"):
        a.decompose()
    return clean_text(h.get_text(" ", strip=True))


def importar(slug: str, renov: Path, figdst: Path) -> dict:
    web = renov / "web_publicacion" / f"{slug}.html"
    cong = renov / "protocolos_pedpal" / "_aprobados_congelados"
    pdf = cong / f"{slug}.pdf"
    soup = BeautifulSoup(web.read_text(encoding="utf-8"), "html.parser")
    main = soup.find("main", class_="doc")
    finder = PageFinder(page_texts(pdf))

    titulo_pdf, autores, centro = "", "", []
    secciones: list[dict] = []
    cur = None
    figs = 0
    tabs = 0
    chars = 0
    for el in main.children:
        if isinstance(el, NavigableString):
            continue
        cls = el.get("class") or []
        if el.name == "details" and "toc" in cls:
            continue
        if el.name == "h1":
            titulo_pdf = heading_text(el)
            continue
        if el.name == "p" and "nota" in cls and not secciones and cur is None:
            centro.append(clean_text(el.get_text(" ", strip=True)))
            continue
        if el.name in ("h2", "h3"):
            t = heading_text(el)
            if re.match(r"^autor(es|a|as)?\b", t, re.I) and not autores:
                autores = re.sub(r"^autor(es|a|as)?\s*:?\s*", "", t, flags=re.I).strip(" :")
                continue
            cur = {"h": t, "level": 1 if el.name == "h2" else 2, "page": finder.find(t), "anchor": el.get("id", ""), "blocks": []}
            secciones.append(cur)
            continue
        if cur is None:  # contenido antes del primer título
            cur = {"h": "", "level": 1, "page": 1, "anchor": "", "blocks": []}
            secciones.append(cur)
        # bloque de contenido
        for a in el.find_all("a", class_="ancla"):
            a.decompose()
        for img in el.find_all("img"):
            src = img.get("src", "")
            name = Path(src).name
            srcf = renov / "web_publicacion" / src
            jpg = Path(name).with_suffix(".jpg").name
            dst = figdst / jpg
            if srcf.exists():
                im = Image.open(srcf)
                if im.mode in ("RGBA", "LA", "P"):
                    im = im.convert("RGBA")
                    bg = Image.new("RGB", im.size, (255, 255, 255))
                    bg.paste(im, mask=im.split()[-1])
                    im = bg
                else:
                    im = im.convert("RGB")
                if im.width > FIG_MAX_W:
                    im = im.resize((FIG_MAX_W, round(im.height * FIG_MAX_W / im.width)), Image.LANCZOS)
                im.save(dst, "JPEG", quality=JPG_Q, optimize=True, progressive=True)
                w, h = im.size
            else:
                raise SystemExit(f"{slug}: falta la figura {srcf}")
            img["src"] = f"data/fig/{slug}/{jpg}"
            img["data-full"] = img["src"]
            img["width"], img["height"] = str(w), str(h)
            img["loading"] = "lazy"
            if not img.get("alt"):
                img["alt"] = "Figura del protocolo"
            figs += 1
        x = clean_text(plain(el))
        if el.find("table") or el.name == "table":
            tabs += 1
        chars += len(x)
        cur["blocks"].append({"t": "html", "h": str(el), "x": x, "page": finder.find(x) if x else finder.cur + 1})

    # texto alternativo de las figuras: la leyenda del propio bloque o la contigua («Figura 2. …», «Algoritmo 1: …»)
    ley = re.compile(r"^(figura|fig\.|algoritmo|imagen|esquema|anexo|tabla)\b", re.I)
    for sec in secciones:
        bl = sec["blocks"]
        for i, b in enumerate(bl):
            if 'alt="Figura del protocolo"' not in b["h"]:
                continue
            cap = ""
            m = re.search(r'<p class="leyenda[^"]*">(.*?)</p>', b["h"], re.S)
            if m:
                cap = clean_text(BeautifulSoup(m.group(1), "html.parser").get_text(" "))
            else:
                for j in (i - 1, i + 1):
                    if 0 <= j < len(bl) and ley.match(bl[j]["x"] or ""):
                        cap = bl[j]["x"]
                        break
            alt = cap[:180] if cap else f"Figura de la página {b['page']} del protocolo (sección {sec['h'][:60]})"
            b["h"] = b["h"].replace('alt="Figura del protocolo"', 'alt="' + html_escape(alt, quote=True) + '"')

    return {
        "slug": slug,
        "fuente": "aprobado-2026",
        "sha256_pdf": sha256(pdf),
        "titulo_pdf": titulo_pdf,
        "autores": autores,
        "centro": " · ".join(centro),
        "fecha_doc": "",
        "paginas": len(finder.pages),
        "chars": chars,
        "nfig": figs,
        "ntab": tabs,
        "secciones": secciones,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--renovacion", type=Path, default=DEF_RENOV)
    ap.add_argument("--only")
    a = ap.parse_args()
    renov = a.renovacion
    estado = json.loads((renov / "_trabajo" / "estado.json").read_text(encoding="utf-8"))
    aprobados = sorted(n for n, e in estado.items() if (e.get("estado") if isinstance(e, dict) else e) == "APROBADO")
    if a.only:
        aprobados = [a.only]
    OUT.mkdir(exist_ok=True)
    resumen = []
    for slug in aprobados:
        figdst = OUT / "fig" / slug
        shutil.rmtree(figdst, ignore_errors=True)
        figdst.mkdir(parents=True)
        d = importar(slug, renov, figdst)
        (OUT / f"{slug}.json").write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        resumen.append((slug, len(d["secciones"]), d["nfig"], d["ntab"], d["paginas"]))
        print(f"✓ {slug}: {len(d['secciones'])} secciones, {d['nfig']} figuras, {d['ntab']} tablas, {d['paginas']} págs.")
    print(f"{len(resumen)} protocolos aprobados importados")
    # páginas: verificación independiente contra el PDF aprobado (corrige los bloques mal localizados)
    import subprocess
    subprocess.run([sys.executable, "-W", "ignore", str(HERE / "comprobar_paginas.py"), "--corregir"], check=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
