"""Índice de pasajes (para búsqueda BM25 en el navegador) + índice de fármacos."""
from __future__ import annotations

import re
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHUNK_TARGET = 650
CHUNK_MAX = 900
SENT_RE = re.compile(r"(?<=[\.\!\?;:])\s+(?=[A-ZÁÉÍÓÚÑ¿¡\(\d•])")


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.lower()


def block_text(b: dict) -> str:
    if b["t"] == "p":
        return b["x"]
    if b["t"] == "ul":
        return " ".join("• " + i["x"] for i in b["items"])
    if b["t"] == "table":
        return " ".join(" | ".join(c for c in r if c) for r in b["rows"])
    return ""


def split_chunks(text: str) -> list[str]:
    text = text.strip()
    if len(text) <= CHUNK_MAX:
        return [text] if text else []
    sents = SENT_RE.split(text)
    out, buf = [], ""
    for s in sents:
        if buf and len(buf) + 1 + len(s) > CHUNK_TARGET:
            out.append(buf)
            buf = s
        else:
            buf = (buf + " " + s).strip()
        while len(buf) > CHUNK_MAX:  # frase gigantesca: corte duro por palabras
            cut = buf.rfind(" ", 0, CHUNK_MAX)
            cut = cut if cut > 200 else CHUNK_MAX
            out.append(buf[:cut])
            buf = buf[cut:].strip()
    if buf:
        out.append(buf)
    return out


def build_chunks(docs: list[dict]) -> dict:
    """docs: lista de dict con slug, titulo, area, secciones. → {docs:[...], chunks:[[d,s,page,text],…]}"""
    doc_meta = []
    chunks = []
    for di, d in enumerate(docs):
        doc_meta.append({"slug": d["slug"], "t": d["titulo"], "a": d["area"], "s": [s["h"] for s in d["secciones"]]})
        for si, s in enumerate(d["secciones"]):
            acc, acc_page = "", s["page"]
            for b in s["blocks"]:
                bt = block_text(b)
                if not bt:
                    continue
                if acc and len(acc) + len(bt) > CHUNK_TARGET:
                    for c in split_chunks(acc):
                        chunks.append([di, si, acc_page, c])
                    acc, acc_page = bt, b.get("page", s["page"])
                else:
                    if not acc:
                        acc_page = b.get("page", s["page"])
                    acc = (acc + " " + bt).strip()
            for c in split_chunks(acc):
                chunks.append([di, si, acc_page, c])
    return {"docs": doc_meta, "chunks": chunks}


def load_drug_list() -> list[tuple[str, list[str]]]:
    out = []
    for line in (HERE / "farmacos.txt").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|") if p.strip()]
        out.append((parts[0], parts))
    return out


def build_drug_index(index: dict) -> dict:
    """{canonico: {aliases:[…], n:int, docs:{slug:[chunkIdx,…]}}} — solo fármacos con ≥1 mención."""
    drugs = load_drug_list()
    patterns = []
    for canon, aliases in drugs:
        alts = sorted({norm(a) for a in aliases}, key=len, reverse=True)
        rx = re.compile(r"(?<![a-z0-9])(?:" + "|".join(re.escape(a) for a in alts) + r")(?:s|es)?(?![a-z])")
        patterns.append((canon, aliases, rx))
    result: dict[str, dict] = {}
    slugs = [d["slug"] for d in index["docs"]]
    for ci, (di, si, page, text) in enumerate(index["chunks"]):
        nt = norm(text)
        for canon, aliases, rx in patterns:
            if rx.search(nt):
                e = result.setdefault(canon, {"aliases": aliases[1:], "n": 0, "docs": {}})
                e["n"] += 1
                e["docs"].setdefault(slugs[di], []).append(ci)
    return dict(sorted(result.items(), key=lambda kv: norm(kv[0])))
