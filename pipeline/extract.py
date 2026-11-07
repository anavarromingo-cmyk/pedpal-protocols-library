"""Extracción estructurada de un protocolo PDF (PyMuPDF) → secciones / párrafos / listas / tablas / figuras.

Heurísticas calibradas con los 33 protocolos PEDPAL (Word → PDF, cuerpo Cambria 11 pt,
títulos 14 pt negrita, título de portada 22 pt). Todo determinista (sin fechas) para que
el diff de git solo cambie cuando cambia el PDF.
"""
from __future__ import annotations

import re
import unicodedata
from collections import Counter
from pathlib import Path

import pymupdf

BULLET_CHARS = "•·▪■●○◦➢➤►✓✔‣◾□-–—*"
BULLET_RE = re.compile(r"^\s*(?:[" + re.escape(BULLET_CHARS) + r"]|(?:\d{1,2}|[a-zA-Z])[\.\)]|\(\d{1,2}\))\s+")
BULLET_ONLY_RE = re.compile(r"^\s*(?:[" + re.escape(BULLET_CHARS) + r"]|o|||)\s*$")
BULLET_GLYPH_RE = re.compile(r"^\s*(?:[" + re.escape(BULLET_CHARS) + r"]|o|\uf0b7|\uf0a7|\uf0d8|\d{1,2}[\.\)]|[a-z][\.\)])\s*$")
ALG_RE = re.compile(r"\b(algoritmo|flujograma|diagrama de flujo|esquema (de )?(manejo|tratamiento|actuaci[óo]n))\b", re.I)
CAPTION_RE = re.compile(r"^(tabla|figura|fig\.|gr[áa]fico|imagen)\s*\(?\d", re.I)
NUM_HEAD_RE = re.compile(r"^(\d{1,2})(\.\d{1,2})*[\.\)]?\s+(\S.*)$")
PAGE_NUM_RE = re.compile(r"^\s*(p[áa]g(?:ina)?\.?\s*)?\d{1,3}(\s*(de|/)\s*\d{1,3})?\s*$", re.I)
AUTHOR_RE = re.compile(r"^\s*autor(?:es|as|a)?\s*:", re.I)
CENTER_RE = re.compile(r"hospital|unidad|ugc|equipo|servicio|complejo|paliativ|neonatolog|pediatr", re.I)
DATE_RE = re.compile(r"\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)?\s*(de\s+)?(20\d\d)\b", re.I)
MAX_FIGS = 14


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s).strip().lower()


def clean_text(s: str) -> str:
    s = s.replace("", "•").replace("", "•").replace("", "•").replace("­", "")
    s = re.sub(r"[ \t ]+", " ", s)
    return s.strip()


class Line:
    __slots__ = ("page", "x0", "y0", "y1", "size", "bold", "text", "fonts", "consumed")

    def __init__(self, page, x0, y0, y1, size, bold, text, fonts):
        self.page, self.x0, self.y0, self.y1 = page, x0, y0, y1
        self.size, self.bold, self.text, self.fonts = size, bold, text, fonts
        self.consumed = False

    @property
    def h(self):
        return max(1.0, self.y1 - self.y0)


def read_lines(doc: pymupdf.Document) -> tuple[list[Line], list[dict]]:
    lines: list[Line] = []
    tables: list[dict] = []
    for pno, page in enumerate(doc, start=1):
        # Tablas (PyMuPDF ≥1.23)
        try:
            tabs = page.find_tables(strategy="lines_strict")
            for t in tabs.tables:
                rows = []
                for row in t.rows:
                    cells = []
                    for c in row.cells:
                        if c is None:
                            cells.append("")
                            continue
                        txt = page.get_textbox(pymupdf.Rect(c))
                        cells.append(clean_text(re.sub(r"\s*\n\s*", " ", txt)))
                    rows.append(cells)
                rows = [r for r in rows if any(c for c in r)]
                if len(rows) >= 2 and max(len(r) for r in rows) >= 2:
                    tables.append({"page": pno, "bbox": tuple(t.bbox), "rows": rows})
        except Exception:
            pass
        d = page.get_text("dict")
        for b in d["blocks"]:
            if b.get("type") != 0:
                continue
            for ln in b["lines"]:
                spans = [s for s in ln["spans"] if s["text"].strip()]
                if not spans:
                    continue
                text = clean_text("".join(s["text"] for s in ln["spans"]))
                if not text:
                    continue
                w = Counter()
                bold_chars = 0
                fonts = set()
                for s in spans:
                    n = len(s["text"].strip())
                    w[round(s["size"])] += n
                    fonts.add(s["font"])
                    if (s["flags"] & 16) or "bold" in s["font"].lower():
                        bold_chars += n
                size = w.most_common(1)[0][0]
                total = sum(w.values())
                x0, y0, x1, y1 = ln["bbox"]
                if re.match(r"^o\s+\S", text) and any(("courier" in f.lower()) or ("symbol" in f.lower()) or ("wingding" in f.lower()) for f in fonts):
                    text = "• " + text[1:].strip()
                L = Line(pno, x0, y0, y1, size, bold_chars >= 0.6 * total, text, fonts)
                for t in tables:
                    if t["page"] == pno:
                        bx0, by0, bx1, by1 = t["bbox"]
                        cy = (y0 + y1) / 2
                        if by0 - 2 <= cy <= by1 + 2 and bx0 - 2 <= (x0 + x1) / 2 <= bx1 + 2:
                            L.consumed = True
                            break
                lines.append(L)
    lines = merge_bullet_glyphs(lines)
    return lines, tables


def merge_bullet_glyphs(lines: list[Line]) -> list[Line]:
    """Word exporta la viñeta como línea aparte ('•' / 'o' Courier / '1.'); la pegamos a la línea de texto
    que comparte renglón (solape vertical) y está a su derecha."""
    out = []
    by_page: dict[int, list[Line]] = {}
    for L in lines:
        by_page.setdefault(L.page, []).append(L)
    for pno, pls in by_page.items():
        glyphs = [L for L in pls if BULLET_GLYPH_RE.match(L.text)]
        texts = [L for L in pls if not BULLET_GLYPH_RE.match(L.text)]
        for g in glyphs:
            gc = (g.y0 + g.y1) / 2
            cand = [T for T in texts if T.x0 > g.x0 and T.y0 - 2 <= gc <= T.y1 + 2 and T.x0 - g.x0 < 120]
            if cand:
                T = min(cand, key=lambda T: T.x0)
                mark = "•" if not re.match(r"^\s*\d", g.text) else g.text.strip()
                T.text = f"{mark} {T.text}"
                T.x0 = g.x0
            else:
                out.append(g)
        out.extend(texts)
    out.sort(key=lambda L: (L.page, L.y0, L.x0))
    return out


def drop_headers_footers(lines: list[Line], doc: pymupdf.Document) -> list[Line]:
    n_pages = doc.page_count
    heights = {i + 1: p.rect.height for i, p in enumerate(doc)}
    cnt = Counter()
    for L in lines:
        h = heights[L.page]
        if L.y0 < 0.09 * h or L.y1 > 0.92 * h:
            cnt[re.sub(r"\d+", "#", norm(L.text))] += 1
    repeated = {k for k, v in cnt.items() if v >= max(2, round(0.3 * n_pages)) and len(k) > 2}
    out = []
    for L in lines:
        key = re.sub(r"\d+", "#", norm(L.text))
        h = heights[L.page]
        edge = L.y0 < 0.09 * h or L.y1 > 0.92 * h
        if edge and key in repeated:
            continue
        if PAGE_NUM_RE.match(L.text):
            continue
        out.append(L)
    return out


def body_size(lines: list[Line]) -> int:
    c = Counter()
    for L in lines:
        c[L.size] += len(L.text)
    return c.most_common(1)[0][0] if c else 11


def is_heading(L: Line, body: int, prev_ended: bool) -> int:
    """0 = no; 1 = título de sección; 2 = subtítulo."""
    t = L.text
    if L.consumed or BULLET_ONLY_RE.match(t) or CAPTION_RE.match(t):
        return 0
    words = t.split()
    if not words or len(t) > 110:
        return 0
    letters = [c for c in t if c.isalpha()]
    upper_ratio = sum(1 for c in letters if c.isupper()) / max(1, len(letters))
    nh = NUM_HEAD_RE.match(t)
    if nh and L.bold and len(words) <= 14 and not t.endswith((".", ",", ";")):
        rest = nh.group(3)
        rl = [c for c in rest if c.isalpha()]
        if rl and sum(1 for c in rl if c.isupper()) / len(rl) > 0.7:
            return 1
        if prev_ended and rest[:1].isupper():
            return 2
    if BULLET_RE.match(t):
        return 0
    if L.size >= body + 2:
        return 1
    if L.bold and len(words) <= 14 and not t.endswith((",", ";")) and not t.endswith("."):
        if upper_ratio > 0.7:
            return 1
        if prev_ended:
            return 2
    if L.bold and len(words) <= 14 and t.endswith(":") and prev_ended and len(t) < 70:
        return 2
    return 0


def join_hyphen(a: str, b: str) -> str:
    if a.endswith("-") and b[:1].islower():
        return a[:-1] + b
    return a + " " + b


def extract(pdf_path: Path, slug: str, fig_dir: Path, fig_url_prefix: str) -> dict:
    doc = pymupdf.open(pdf_path)
    raw_lines, tables = read_lines(doc)
    lines = drop_headers_footers(raw_lines, doc)
    body = body_size([L for L in lines if not L.consumed])

    # ---- Portada: título, autores, centro, fecha ----
    p1 = [L for L in lines if L.page == 1]
    big = [L for L in p1 if L.size >= max(body + 6, 16)]
    titulo_pdf = clean_text(" ".join(L.text for L in big)) if big else ""
    autores, centro, fecha_doc = "", [], ""
    meta_lines = set(id(L) for L in big)
    i = 0
    while i < len(p1):
        L = p1[i]
        if AUTHOR_RE.match(L.text):
            buf = re.sub(AUTHOR_RE, "", L.text).strip()
            meta_lines.add(id(L))
            j = i + 1
            if buf.rstrip().endswith("."):
                j = len(p1)
            while j < len(p1) and p1[j].y0 - p1[j - 1].y1 < 1.4 * p1[j - 1].h and len(buf) < 700 \
                    and p1[j].size <= body + 1 and not BULLET_RE.match(p1[j].text) and len(p1[j].text) < 140 \
                    and (buf.rstrip().endswith((",", " y", " e", ";")) or (p1[j].size == p1[i].size and p1[j].bold == p1[i].bold
                                                                           and not p1[j].text.rstrip().endswith(":") and not is_heading(p1[j], body, True))):
                buf = join_hyphen(buf, p1[j].text)
                meta_lines.add(id(p1[j]))
                j += 1
                if buf.rstrip().endswith("."):
                    break
            autores = re.sub(r"(?<=[A-Za-zÁÉÍÓÚáéíóúñÑ\.\)])\d{1,2}(?=[\s,\.;]|$)", "", buf)
            autores = re.sub(r"\s+,", ",", re.sub(r"\s+", " ", autores)).strip(" .")
            break
        i += 1
    anchor_y = None
    if big:
        anchor_y = min(L.y0 for L in big)
    aut_lines = [L for L in p1 if id(L) in meta_lines and L not in big]
    if aut_lines:
        ay = min(L.y0 for L in aut_lines)
        anchor_y = ay if anchor_y is None else max(anchor_y, ay)
    for L in p1:
        if id(L) in meta_lines or anchor_y is None or L.y0 >= anchor_y:
            continue
        t = L.text.strip()
        if CENTER_RE.search(t) and L.size <= body + 1 and len(t) < 110 and not t.endswith((".", ",", ";")) \
                and not t[:1].islower() and not BULLET_RE.match(t):
            centro.append(t)
            meta_lines.add(id(L))
        elif not fecha_doc and L.size <= body + 1 and len(t) < 40 and DATE_RE.search(t) and not t[:1].islower():
            fecha_doc = t
            meta_lines.add(id(L))
    centro = " · ".join(dict.fromkeys(centro))[:200]

    # ---- Figuras ----
    alg_pages: set[int] = set()
    for L in lines:
        if (L.size >= body + 2 or L.bold) and len(L.text) < 90 and ALG_RE.search(L.text):
            alg_pages.add(L.page)
            # si el algoritmo sigue en la página siguiente (poco texto, sin título propio), también
            nxt = L.page + 1
            if nxt <= doc.page_count and len(doc[nxt - 1].get_text()) < 900:
                alg_pages.add(nxt)
    figs = _figures(doc, slug, fig_dir, fig_url_prefix, alg_pages)

    # ---- Secuencia de elementos ordenados ----
    elements = []
    for L in lines:
        if id(L) in meta_lines or L.consumed:
            continue
        elements.append(("line", L.page, L.y0, L))
    for t in tables:
        elements.append(("table", t["page"], t["bbox"][1], t))
    for f in figs:
        elements.append(("fig", f["page"], f["y0"], f))
    elements.sort(key=lambda e: (e[1], e[2]))

    secciones: list[dict] = [{"h": "", "level": 0, "page": 1, "blocks": []}]
    para: list[str] = []
    para_page = 1
    list_items: list[dict] = []
    list_x0 = None
    prev_line: Line | None = None
    prev_ended = True

    def flush_para():
        nonlocal para
        if para:
            txt = clean_text(" ".join(para))
            if txt:
                secciones[-1]["blocks"].append({"t": "p", "x": txt, "page": para_page})
            para = []

    def flush_list():
        nonlocal list_items, list_x0
        if list_items:
            secciones[-1]["blocks"].append({"t": "ul", "items": list_items})
            list_items, list_x0 = [], None

    pending_bullet = False
    for kind, page, y, obj in elements:
        if kind == "table":
            flush_para(); flush_list()
            secciones[-1]["blocks"].append({"t": "table", "rows": obj["rows"], "page": page})
            prev_ended, prev_line, pending_bullet = True, None, False
            continue
        if kind == "fig":
            flush_para(); flush_list()
            secciones[-1]["blocks"].append({"t": "fig", "src": obj["src"], "page": page, "w": obj["w"], "h": obj["h"]})
            prev_ended, prev_line, pending_bullet = True, None, False
            continue
        L: Line = obj
        t = L.text
        if BULLET_ONLY_RE.match(t):
            flush_para()
            pending_bullet = True
            if list_x0 is None:
                list_x0 = L.x0
            prev_line = L
            continue
        gap = (L.y0 - prev_line.y1) if (prev_line and prev_line.page == L.page) else 99
        new_page = prev_line is None or prev_line.page != L.page
        hl = is_heading(L, body, prev_ended)
        if hl:
            flush_para(); flush_list()
            # une títulos partidos en dos líneas del mismo tamaño
            last = secciones[-1]
            up = sum(1 for c in t if c.isupper()) > 0.7 * max(1, sum(1 for c in t if c.isalpha()))
            if last["h"] and not last["blocks"] and prev_line is not None and prev_line.page == L.page \
                    and gap < 1.2 * L.h and last["level"] == hl and last.get("_size") == L.size and last.get("_up") == up:
                last["h"] = clean_text(last["h"] + " " + t)
            else:
                secciones.append({"h": t.rstrip(":"), "level": hl, "page": page, "blocks": [], "_size": L.size, "_up": up})
            prev_ended, prev_line, pending_bullet = True, L, False
            continue
        m = BULLET_RE.match(t)
        if m or pending_bullet:
            flush_para()
            item_text = t[m.end():] if m else t
            if list_x0 is None:
                list_x0 = L.x0
            level = 2 if L.x0 > list_x0 + 14 else 1
            list_items.append({"x": item_text.strip(), "l": level})
            pending_bullet = False
            prev_ended = item_text.rstrip().endswith((".", ";", ":"))
            prev_line = L
            continue
        # continuación de lista (línea sin viñeta, sangrada o con gap pequeño)
        if list_items and not new_page and gap < 1.5 * L.h and (L.x0 >= list_x0 - 2) and not para:
            list_items[-1]["x"] = join_hyphen(list_items[-1]["x"], t)
            prev_ended = t.rstrip().endswith((".", ";", ":"))
            prev_line = L
            continue
        # párrafo
        if list_items:
            flush_list()
        if para and (gap > 1.9 * L.h) and not new_page:
            flush_para()
        if para and new_page and prev_ended:
            flush_para()
        if not para:
            para_page = page
        para = [join_hyphen(para.pop(), t)] if para else [t]
        prev_ended = t.rstrip().endswith((".", ";", ":", "!", "?"))
        prev_line = L
    flush_para(); flush_list()

    for s in secciones:
        s.pop("_size", None); s.pop("_up", None)
    secciones = [s for s in secciones if s["blocks"] or s["h"]]
    # El preámbulo sin título antes de la primera sección se llama "Introducción" si tiene texto
    if secciones and secciones[0]["h"] == "" and secciones[0]["blocks"]:
        secciones[0]["h"] = "Inicio"
    chars = sum(len(b.get("x", "")) for s in secciones for b in s["blocks"] if b["t"] == "p")
    chars += sum(len(i["x"]) for s in secciones for b in s["blocks"] if b["t"] == "ul" for i in b["items"])
    return {
        "slug": slug,
        "titulo_pdf": titulo_pdf,
        "autores": autores,
        "centro": centro,
        "fecha_doc": fecha_doc,
        "paginas": doc.page_count,
        "chars": chars,
        "nfig": len(figs),
        "ntab": len(tables),
        "secciones": secciones,
    }


def _figures(doc: pymupdf.Document, slug: str, fig_dir: Path, url_prefix: str, alg_pages: set[int] | None = None) -> list[dict]:
    """Imágenes incrustadas grandes (no logos repetidos) + páginas de algoritmo renderizadas completas."""
    alg_pages = alg_pages or set()
    out = []
    seen_xref_pages: dict[int, set] = {}
    for pno, page in enumerate(doc, start=1):
        for img in page.get_images(full=True):
            seen_xref_pages.setdefault(img[0], set()).add(pno)
    logo_xrefs = {x for x, pages in seen_xref_pages.items() if len(pages) > 2}
    (fig_dir / slug).mkdir(parents=True, exist_ok=True)
    n = 0
    for pno, page in enumerate(doc, start=1):
        if n >= MAX_FIGS:
            break
        page_h = page.rect.height
        page_text_len = len(page.get_text())
        # 1) páginas de algoritmo/flujograma → render completo (el texto de un flujograma extraído pierde la estructura)
        if pno in alg_pages:
            pix = page.get_pixmap(matrix=pymupdf.Matrix(1.6, 1.6), alpha=False)
            name = f"p{pno:02d}.jpg"
            pix.save(fig_dir / slug / name, jpg_quality=78)
            # al final de la página: así queda dentro de la sección "ALGORITMO" cuyo título abre esa página
            out.append({"page": pno, "y0": 1e6, "src": f"{url_prefix}/{slug}/{name}", "w": pix.width, "h": pix.height, "kind": "page"})
            n += 1
            continue
        # 2) imágenes incrustadas grandes
        for img in page.get_images(full=True):
            xref = img[0]
            if xref in logo_xrefs:
                continue
            try:
                rects = page.get_image_rects(xref)
            except Exception:
                rects = []
            if not rects:
                continue
            r = rects[0]
            if r.width < 140 or r.height < 100 or r.width * r.height < 30000:
                continue
            try:
                pix = pymupdf.Pixmap(doc, xref)
                if pix.n - pix.alpha >= 4:  # CMYK
                    pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                if pix.alpha:
                    pix = pymupdf.Pixmap(pix, 0)
                if pix.width > 1400:
                    f = 1400 / pix.width
                    pix = pymupdf.Pixmap(pix, int(pix.width * f), int(pix.height * f))  # type: ignore[arg-type]
            except Exception:
                continue
            name = f"p{pno:02d}_{xref}.jpg"
            try:
                pix.save(fig_dir / slug / name, jpg_quality=80)
            except Exception:
                continue
            out.append({"page": pno, "y0": float(r.y0), "src": f"{url_prefix}/{slug}/{name}", "w": pix.width, "h": pix.height, "kind": "img"})
            n += 1
            if n >= MAX_FIGS:
                break
    return out


if __name__ == "__main__":
    import json, sys
    p = Path(sys.argv[1])
    d = extract(p, p.stem, Path("/tmp/figs"), "data/fig")
    print(json.dumps({k: v for k, v in d.items() if k != "secciones"}, ensure_ascii=False, indent=1))
    for s in d["secciones"]:
        print(f"\n## [{s['level']}] {s['h']}  (p.{s['page']})")
        for b in s["blocks"]:
            if b["t"] == "p":
                print("  P:", b["x"][:160])
            elif b["t"] == "ul":
                for it in b["items"][:6]:
                    print("   " + ("  " * (it["l"] - 1)) + "• " + it["x"][:120])
                if len(b["items"]) > 6:
                    print(f"   … +{len(b['items'])-6} items")
            elif b["t"] == "table":
                print(f"  TABLE {len(b['rows'])}x{max(len(r) for r in b['rows'])}:", b["rows"][0][:4])
            elif b["t"] == "fig":
                print("  FIG", b["src"], b["w"], b["h"])
