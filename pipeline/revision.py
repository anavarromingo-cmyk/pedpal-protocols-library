"""Prepara la revisión humana de los resúmenes rápidos y algoritmos frente al texto APROBADO 2026.

No cambia ningún contenido clínico. Para cada frase del resumen o paso del algoritmo:
  - busca en el protocolo aprobado los fragmentos que mejor la sustentan (con su página en el PDF nuevo);
  - comprueba que TODAS sus cifras aparecen en el protocolo, y que cada dosis de «fármacos clave»
    aparece literalmente;
  - marca lo que no se encuentra para que el revisor lo mire primero.
Lo único que actualiza en los ficheros curados es la PÁGINA de cada fármaco clave (la del PDF 2026;
la antigua queda en «page_2024»), porque la página antigua ya no lleva al sitio correcto.

Salida: revision/datos.json (lo consume revision/plantilla.html → revision/revision.html)
Uso: .venv/bin/python pipeline/revision.py [--actualizar-paginas]
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
APROB = HERE / "aprobados"
CUR = HERE / "curated"
OUTD = ROOT / "revision"

PEND: dict = {}
FIGALG: dict = {}
STOP = set("""de la el los las y o u en a con por para que se del al un una unos unas es son ser como mas más
sin sobre entre tras desde hasta su sus lo le les no si ya muy cada otro otra otros otras este esta estos estas ese esa
puede pueden debe deben hay ha han dosis""".split())


def fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()


def toks(s: str) -> list[str]:
    return [w for w in re.findall(r"[a-z0-9µ]+", fold(s)) if len(w) > 2 and w not in STOP]


def nums(s: str) -> list[str]:
    out = []
    for m in re.finditer(r"(?<![\w.,])\d+(?:[.,]\d+)?", s):
        n = m.group(0).replace(",", ".")
        n = re.sub(r"\.0+$", "", n)
        out.append(n)
    return out


def squash(s: str) -> str:
    s = fold(s).replace(",", ".")
    s = s.replace("microgramos", "mcg").replace("microg", "mcg").replace("µg", "mcg").replace("ug/", "mcg/")
    return re.sub(r"[\s\u00ad\-–—·|*]+", "", s)


SENT = re.compile(r"(?<=[.!?;:])\s+(?=[A-ZÁÉÍÓÚÑ¿¡(\d•-])|\s+(?=•\s)|\s\|\s")


def sentences(doc: dict) -> list[dict]:
    out = []
    for si, s in enumerate(doc["secciones"]):
        for b in s["blocks"]:
            for t in SENT.split(b.get("x", "")):
                t = t.strip(" •|")
                if len(t) >= 12:
                    out.append({"t": t, "page": b.get("page", s["page"]), "sec": s["h"], "si": si, "k": set(toks(t))})
    return out


def support(item: str, sents: list[dict], k: int = 2) -> list[dict]:
    it = set(toks(item))
    if not it:
        return []
    scored = []
    for i, s in enumerate(sents):
        inter = it & s["k"]
        if not inter:
            continue
        score = len(inter) / len(it) + 0.15 * len(inter) / (len(s["k"]) or 1)
        scored.append((score, i))
    scored.sort(reverse=True)
    best = []
    for sc, i in scored[:k]:
        s = sents[i]
        best.append({"t": s["t"], "page": s["page"], "sec": s["sec"], "score": round(sc, 2)})
    return best


def check(item: str, doc_nums: set[str], sq: str, literal: str | None = None) -> dict:
    faltan = sorted({n for n in nums(item) if n not in doc_nums}, key=lambda x: float(x) if re.match(r"^\d+(\.\d+)?$", x) else 0)
    r = {"cifras_no_encontradas": faltan}
    if literal is not None:
        # la dosis se comprueba por tramos (frases/cláusulas): cada tramo con cifra debe estar literal en el protocolo
        tramos = [t.strip() for t in re.split(r"(?<=[.;])\s+|\.\s*$", literal) if t and re.search(r"\d", t)]
        no = [t for t in tramos if squash(t).rstrip(".") not in sq]
        r["dosis_literal"] = not no
        r["tramos_no_literales"] = no
    return r


_PDFP = {}


def pdf_pages(slug: str) -> list[str]:
    """Texto (normalizado) de cada página del PDF aprobado (= el publicado en pedpal.es, misma sha256)."""
    if slug not in _PDFP:
        import fitz
        pdf = HERE / "cache" / "pdf" / f"{slug}.pdf"
        _PDFP[slug] = [squash(pg.get_text()) for pg in fitz.open(pdf)] if pdf.exists() else []
    return _PDFP[slug]


def page_of(slug: str, text: str) -> int | None:
    """Página del PDF 2026 donde aparece el texto (por cláusulas con cifras; ventanas si no aparece entero)."""
    pages = pdf_pages(slug)
    claus = [c for c in re.split(r"(?<=[.;])\s+", text or "") if re.search(r"\d", c)] or [text or ""]
    for c in claus:
        k = squash(c).rstrip(".")
        for win in (k, k[:60], k[:30], k[-30:]):
            if len(win) < 12:
                continue
            hits = [i for i, t in enumerate(pages) if win in t]
            if hits:
                return hits[0] + 1
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--actualizar-paginas", action="store_true")
    a = ap.parse_args()
    algs = json.loads((CUR / "algoritmos.json").read_text(encoding="utf-8"))
    global PEND
    pp = ROOT / "revision" / "v2" / "pendientes.json"
    PEND = json.loads(pp.read_text(encoding="utf-8")) if pp.exists() else {}
    global FIGALG
    fp = CUR / "figuras_algoritmo.json"
    FIGALG = json.loads(fp.read_text(encoding="utf-8")) if fp.exists() else {}
    out = []
    for jp in sorted(APROB.glob("*.json")):
        doc = json.loads(jp.read_text(encoding="utf-8"))
        slug = doc["slug"]
        sents = sentences(doc)
        full = " ".join(b.get("x", "") for s in doc["secciones"] for b in s["blocks"])
        doc_nums = set(nums(full))
        sq = squash(full)
        heads = {fold(s["h"]).strip() for s in doc["secciones"]}
        entry = {"slug": slug, "titulo": doc["titulo_pdf"], "paginas": doc["paginas"], "items": []}

        def add(tipo, idx, texto, literal=None, extra=None, v2id=None, auto=None):
            if isinstance(texto, dict):  # elemento con cita literal verificada
                o = texto
                e = {"id": f"{tipo}:{idx}", "tipo": tipo, "texto": o["x"], "apoyo": [{"t": o.get("cita", ""), "page": o.get("page"), "sec": ""}],
                     "cifras_no_encontradas": [], "auto": bool(o.get("auto")), "motivos": PEND.get(f"{slug}|{v2id}", [])}
                if extra:
                    e.update(extra)
                entry["items"].append(e)
                return e
            e = {"id": f"{tipo}:{idx}", "tipo": tipo, "texto": texto, "apoyo": support(texto, sents)}
            if auto is not None:
                e["auto"] = auto
            e.update(check(texto, doc_nums, sq, literal))
            if extra:
                e.update(extra)
            entry["items"].append(e)
            return e

        rp = CUR / "resumenes" / f"{slug}.json"
        if rp.exists():
            r = json.loads(rp.read_text(encoding="utf-8"))
            entry["resumen_generado"] = r.get("generado", {})
            hecho = bool(r.get("generado", {}).get("revisado"))
            entry["revisado"] = hecho
            v2 = any(isinstance(x, dict) for x in r.get("puntos_clave", []))
            add("frase", 0, r.get("en_una_frase", ""), auto=True if (v2 or hecho) else None)
            for i, x in enumerate(r.get("puntos_clave", [])):
                add("punto", i, x, v2id=f"puntos_clave:{i}", auto=True if hecho else None)
            changed = False
            for i, d in enumerate(r.get("farmacos_clave", [])):
                txt = " · ".join(v for v in (d.get("farmaco"), d.get("indicacion"), d.get("dosis"), d.get("via"), d.get("nota")) if v)
                e = add("farmaco", i, txt, literal=d.get("dosis") or "", extra={"farmaco": d.get("farmaco", ""), "dosis": d.get("dosis", "")})
                # página nueva: la del fragmento que contiene la dosis (o el mejor apoyo)
                newp = page_of(slug, d.get("dosis", "")) if d.get("dosis") else None
                e["pagina_2026"] = newp
                e["pagina_2024"] = d.get("page_2024", d.get("page"))
                if a.actualizar_paginas:
                    if "page_2024" not in d:
                        d["page_2024"] = d.get("page")
                    if d.get("page") != newp:
                        d["page"] = newp; changed = True  # None = página no localizable: la app no enlaza página
            for i, x in enumerate(r.get("banderas_rojas", [])):
                add("bandera", i, x, v2id=f"banderas_rojas:{i}", auto=True if hecho else None)
            for i, x in enumerate(r.get("perlas", [])):
                add("perla", i, x, v2id=f"perlas:{i}", auto=True if hecho else None)
            entry["secciones_recomendadas"] = [{"h": h, "existe": fold(h).strip() in heads} for h in r.get("secciones_recomendadas", [])]
            if changed:
                rp.write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")
        else:
            entry["sin_resumen"] = True
        for fi, fg in enumerate(FIGALG.get(slug, [])):
            e = {"id": f"alg_fig:{fi}", "tipo": "alg_fig", "apoyo": [], "cifras_no_encontradas": [],
                 "texto": " — ".join(x for x in (fg.get("titulo"), fg.get("descripcion"), ("AVISO: " + fg["aviso"]) if fg.get("aviso") else "") if x),
                 "fig": "../docs/" + fg["src"], "auto": bool(fg.get("revisado")) or not fg.get("aviso"),
                 "motivos": ["La figura del protocolo no coincide con su texto: compruebe que el aviso lo describe bien"] if fg.get("aviso") and not fg.get("revisado") else []}
            entry["items"].append(e)
        for ai, alg in enumerate(algs.get(slug, [])):
            ahecho = bool(alg.get("revisado"))
            av2 = any("cita" in p for p in alg["pasos"])
            add("alg_titulo", f"{ai}", " — ".join(x for x in (alg.get("nombre"), alg.get("objetivo"), alg.get("poblacion")) if x),
                auto=True if (ahecho or (av2 and all(p.get("auto") for p in alg["pasos"]))) else (False if av2 else None))
            for pi, p in enumerate(alg["pasos"]):
                if "cita" in p:
                    add("alg_paso", f"{ai}.{pi}", p, extra={"alg": ai, "alg_nombre": alg.get("nombre", "")}, v2id=f"algoritmo:{ai}:{pi}")
                else:
                    add("alg_paso", f"{ai}.{pi}", (f"{p['paso']}: " if p.get("paso") and not p["paso"].isdigit() else "") + p["x"],
                        extra={"alg": ai, "alg_nombre": alg.get("nombre", "")}, auto=True if ahecho else None)
        out.append(entry)
    # resúmenes de protocolos que ya no están en la app
    huerfanos = sorted(p.stem for p in (CUR / "resumenes").glob("*.json") if not (APROB / f"{p.stem}.json").exists())
    OUTD.mkdir(exist_ok=True)
    (OUTD / "datos.json").write_text(json.dumps({"protocolos": out, "resumenes_sin_protocolo": huerfanos}, ensure_ascii=False), encoding="utf-8")
    n = sum(len(e["items"]) for e in out)
    nf = sum(1 for e in out for i in e["items"] if i["cifras_no_encontradas"] or i.get("dosis_literal") is False)
    print(f"{len(out)} protocolos · {n} elementos · {nf} con cifras/dosis no encontradas · sin protocolo: {huerfanos}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
