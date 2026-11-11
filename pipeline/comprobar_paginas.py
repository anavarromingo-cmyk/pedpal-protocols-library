"""Comprueba la página asignada a cada bloque y sección de pipeline/aprobados/*.json contra el PDF aprobado
con una búsqueda independiente (no monótona) y, con --corregir, sustituye la página cuando la búsqueda la
localiza sin ambigüedad. Las páginas se usan en los enlaces «pág. N · PDF» de las tarjetas y del buscador.
Uso: .venv/bin/python pipeline/comprobar_paginas.py [--corregir]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from revision import pdf_pages, squash  # noqa: E402


def candidatas(slug: str, text: str) -> set[int]:
    pages = pdf_pages(slug)
    k = squash(text)
    for win in (k[:80], k[:40], k[:20]):
        if len(win) < 12:
            continue
        hits = {i + 1 for i, t in enumerate(pages) if win in t}
        if hits:
            return hits
    return set()


def main() -> int:
    fix = "--corregir" in sys.argv
    tot = mal = amb = nf = cambiados = 0
    for jp in sorted((HERE / "aprobados").glob("*.json")):
        d = json.loads(jp.read_text(encoding="utf-8"))
        slug = d["slug"]
        m_prot = 0
        for s in d["secciones"]:
            hs = candidatas(slug, s["h"]) if s["h"] else set()
            for b in s["blocks"]:
                if not b.get("x"):
                    continue
                tot += 1
                c = candidatas(slug, b["x"])
                if not c:
                    nf += 1
                    continue
                if b["page"] in c:
                    continue
                if len(c) == 1:
                    mal += 1
                    m_prot += 1
                    if fix:
                        b["page"] = next(iter(c)); cambiados += 1
                else:
                    amb += 1
            # página de la sección: la de su primer bloque con texto
            first = next((b["page"] for b in s["blocks"] if b.get("x")), None)
            if fix and first and s["page"] != first and (not hs or first in hs):
                s["page"] = first; cambiados += 1
        if m_prot:
            print(f"{slug}: {m_prot} bloques con página distinta de la del PDF")
        if fix:
            jp.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{tot} bloques · {mal} con página errónea · {amb} ambiguos (texto repetido) · {nf} no localizados · {cambiados} corregidos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
