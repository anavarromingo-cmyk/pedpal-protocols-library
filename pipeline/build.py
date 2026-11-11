"""Orquestador: catálogo → descarga → extracción → índices → docs/data/.

Uso:  python pipeline/build.py [--offline] [--only slug]
  --offline  no consulta pedpal.es; reutiliza docs/data/protocolos.json y pipeline/cache/pdf/
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import shutil
import sys
from pathlib import Path

import requests

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
APP = ROOT / "docs"
DATA = APP / "data"
DOCS_DIR = DATA / "docs"
FIG_DIR = DATA / "fig"
CACHE = HERE / "cache" / "pdf"
CURATED = HERE / "curated"
APROBADOS = HERE / "aprobados"
# Protocolos cuyo PDF cambió en nov-2026 SOLO por la remaquetación (mismo contenido de 2024): no son «Actualizados».
# Al publicar una revisión clínica real de un protocolo, quitarlo de esta lista.
REMAQUETADOS = set(json.loads((HERE / "overrides.json").read_text(encoding="utf-8")).get("remaquetados_2026", []))
sys.path.insert(0, str(HERE))
from catalog import build_catalog, UA  # noqa: E402
from extract import extract  # noqa: E402
from build_index import build_chunks, build_drug_index  # noqa: E402


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def dump(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def download(session: requests.Session, url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with session.get(url, headers=UA, timeout=120, stream=True) as r:
        r.raise_for_status()
        tmp = dest.with_suffix(".part")
        with open(tmp, "wb") as f:
            for chunk in r.iter_content(1 << 16):
                f.write(chunk)
        tmp.replace(dest)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true")
    ap.add_argument("--only", help="slug único (depuración)")
    args = ap.parse_args()
    today = dt.date.today().isoformat()

    prev_path = DATA / "protocolos.json"
    prev = {p["slug"]: p for p in json.loads(prev_path.read_text(encoding="utf-8"))["protocolos"]} if prev_path.exists() else {}
    prev_version = json.loads((DATA / "version.json").read_text(encoding="utf-8")) if (DATA / "version.json").exists() else {}
    prev_seen = set(json.loads(prev_path.read_text(encoding="utf-8")).get("media_vistos", [])) if prev_path.exists() else set()

    session = requests.Session()
    if args.offline:
        if not prev:
            print("--offline requiere docs/data/protocolos.json previo", file=sys.stderr)
            return 2
        excl = set(json.loads((HERE / "overrides.json").read_text(encoding="utf-8")).get("exclude", []))
        catalog = [dict(p) for p in prev.values() if not p.get("retirado") and p["slug"] not in excl]
        report = {"offline": True, "no_enlazados": []}
    else:
        catalog, report = build_catalog(session)
    if args.only:
        catalog = [c for c in catalog if c["slug"] == args.only]

    # ---- Descarga (con caché local) ----
    CACHE.mkdir(parents=True, exist_ok=True)
    warnings = []
    for c in catalog:
        pdf = CACHE / f"{c['slug']}.pdf"
        need = not pdf.exists() or pdf.stat().st_size < 1000
        if not need and not args.offline:
            # ¿ha cambiado en el servidor? comparamos tamaño por HEAD (barato) y fecha de modificación WP
            try:
                h = session.head(c["url"], headers=UA, timeout=30, allow_redirects=True)
                size = int(h.headers.get("Content-Length", "0") or 0)
                if size and size != pdf.stat().st_size:
                    need = True
                if prev.get(c["slug"], {}).get("fecha_modificacion") != c.get("fecha_modificacion"):
                    need = True
            except Exception as e:  # noqa: BLE001
                warnings.append(f"HEAD falló {c['slug']}: {e}")
        if need and not args.offline:
            print(f"↓ {c['slug']}")
            try:
                download(session, c["url"], pdf)
            except Exception as e:  # noqa: BLE001
                warnings.append(f"Descarga falló {c['slug']}: {e}")
        if not pdf.exists():
            warnings.append(f"Sin PDF local para {c['slug']} — se omite")
    catalog = [c for c in catalog if (CACHE / f"{c['slug']}.pdf").exists()]

    # ---- Extracción ----
    curated_alg = json.loads((CURATED / "algoritmos.json").read_text(encoding="utf-8")) if (CURATED / "algoritmos.json").exists() else {}
    curated_sum_dir = CURATED / "resumenes"
    if not args.only:
        shutil.rmtree(FIG_DIR, ignore_errors=True)
    docs_full = []
    for c in catalog:
        pdf = CACHE / f"{c['slug']}.pdf"
        c["sha256"] = sha256(pdf)
        c["bytes"] = pdf.stat().st_size
        ap = APROBADOS / f"{c['slug']}.json"
        aprob = json.loads(ap.read_text(encoding="utf-8")) if ap.exists() else None
        if aprob and aprob["sha256_pdf"] == c["sha256"]:
            # versión maquetada y aprobada (renovación 2026): texto idéntico al PDF publicado
            d = aprob
            src_fig = APROBADOS / "fig" / c["slug"]
            if src_fig.exists():
                shutil.rmtree(FIG_DIR / c["slug"], ignore_errors=True)
                shutil.copytree(src_fig, FIG_DIR / c["slug"])
        else:
            if aprob:
                warnings.append(f"{c['slug']}: el PDF de pedpal.es ya no coincide con la versión aprobada 2026 → extracción automática (revisar y volver a importar)")
            d = extract(pdf, c["slug"], FIG_DIR, "data/fig")
            d["fuente"] = "extraccion-automatica"
        if not d["secciones"]:
            warnings.append(f"{c['slug']}: 0 secciones extraídas")
        if not d["autores"]:
            warnings.append(f"{c['slug']}: sin línea de autores")
        d.update({"titulo": c["titulo"], "area": c["area"], "url": c["url"], "fecha_subida": c["fecha_subida"]})
        if c["slug"] in curated_alg:
            d["algoritmos"] = curated_alg[c["slug"]]
        sp = curated_sum_dir / f"{c['slug']}.json"
        if sp.exists():
            d["resumen"] = json.loads(sp.read_text(encoding="utf-8"))
        docs_full.append(d)
        # metadatos al catálogo
        c.update({k: d[k] for k in ("titulo_pdf", "autores", "centro", "fecha_doc", "paginas", "chars", "nfig", "ntab")})
        c["nsec"] = len(d["secciones"])
        c["fuente"] = d.get("fuente", "extraccion-automatica")
        c["resumen"] = bool(sp.exists())
        c["algoritmos"] = len(curated_alg.get(c["slug"], []))
        c["secciones_idx"] = [s["h"] for s in d["secciones"] if s["level"] <= 1 and s["h"]][:14]
        # novedades
        p = prev.get(c["slug"])
        if not p:
            # primera construcción: la fecha de "nuevo" es la de subida a pedpal.es, no la de hoy
            c["nuevo_desde"] = today if prev else (c.get("fecha_subida") or today)
        else:
            c["nuevo_desde"] = p.get("nuevo_desde")
            relayout = c.get("fuente") == "aprobado-2026" and p.get("fuente") != "aprobado-2026"
            if p.get("sha256") and p["sha256"] != c["sha256"] and not relayout and c["slug"] not in REMAQUETADOS:
                c["actualizado"] = today
            else:
                c["actualizado"] = p.get("actualizado")
        dump(DOCS_DIR / f"{c['slug']}.json", d)

    # JSON de protocolos que ya no están en el catálogo: fuera de la app
    if not args.only:
        for f in DOCS_DIR.glob("*.json"):
            if f.stem not in {c["slug"] for c in catalog}:
                f.unlink()
    # retirados: estaban y ya no están en la web
    retirados = [dict(p, retirado=p.get("retirado") or today) for s, p in prev.items() if s not in {c["slug"] for c in catalog}] if not args.only else []

    # ---- Índices ----
    index = build_chunks(docs_full)
    drugs = build_drug_index(index)
    dump(DATA / "index.json", index)
    dump(DATA / "farmacos.json", drugs)
    # Vademécum PEDPAL (extraído con IA y verificado literalmente): solo entradas de protocolos presentes
    vp = CURATED / "vademecum.json"
    if vp.exists():
        vad = json.loads(vp.read_text(encoding="utf-8"))
        slugs = {c["slug"] for c in catalog}
        vad["farmacos"] = {k: [e for e in v if e["slug"] in slugs] for k, v in vad["farmacos"].items()}
        vad["farmacos"] = {k: v for k, v in vad["farmacos"].items() if v}
        dump(DATA / "vademecum.json", vad)
    for d in docs_full:  # fármacos por protocolo (para la ficha)
        pass
    per_doc_drugs = {}
    for name, e in drugs.items():
        for slug, cids in e["docs"].items():
            per_doc_drugs.setdefault(slug, []).append([name, len(cids)])
    for c in catalog:
        c["farmacos"] = [n for n, _ in sorted(per_doc_drugs.get(c["slug"], []), key=lambda x: -x[1])][:12]

    # ---- Catálogo + versión ----
    content_hash = hashlib.sha256(json.dumps([(c["slug"], c["sha256"], c["titulo"], c["area"]) for c in catalog] +
                                             [("alg", json.dumps(curated_alg, sort_keys=True)),
                                              ("cur", hashlib.sha256(b"".join(f.read_bytes() for f in sorted(CURATED.rglob("*.json")))).hexdigest())], sort_keys=True).encode()).hexdigest()[:12]
    if content_hash != prev_version.get("hash"):
        version = {"hash": content_hash, "build": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                   "n": len(catalog), "fecha": today}
    else:
        version = prev_version
    seen_now = sorted(prev_seen | {u["url"] for u in report.get("no_enlazados", [])} | {c["url"] for c in catalog})
    dump(DATA / "protocolos.json", {"version": version, "protocolos": catalog + retirados,
                                    "areas": json.loads((HERE / "overrides.json").read_text(encoding="utf-8"))["area_meta"],
                                    "media_vistos": seen_now})
    dump(DATA / "version.json", version)

    # ---- Service worker: lista de precarga + nombre de caché ----
    sw_t = (APP / "sw.template.js").read_text(encoding="utf-8") if (APP / "sw.template.js").exists() else None
    if sw_t:
        assets = ["./data/protocolos.json", "./data/index.json", "./data/farmacos.json", "./data/version.json"] + \
                 (["./data/vademecum.json"] if (DATA / "vademecum.json").exists() else []) + \
                 [f"./data/docs/{c['slug']}.json" for c in catalog]
        app_hash = hashlib.sha256(b"".join((APP / f).read_bytes() for f in ("index.html", "app.js", "search.js", "app.css", "doc.css", "pedpal.css", "sw.template.js") if (APP / f).exists())).hexdigest()[:8]
        (APP / "sw.js").write_text(sw_t.replace("{{CACHE_NAME}}", f"pedpal-protocolos-{version['hash']}-{app_hash}")
                                   .replace("{{DATA_ASSETS}}", ",\n  ".join(json.dumps(a) for a in assets)), encoding="utf-8")

    # ---- Informe ----
    nuevos = [c["slug"] for c in catalog if c.get("nuevo_desde") == today and prev]
    actualizados = [c["slug"] for c in catalog if c.get("actualizado") == today]
    fig_bytes = sum(p.stat().st_size for p in FIG_DIR.rglob("*.jpg")) if FIG_DIR.exists() else 0
    lines = [f"# Informe de actualización — {today}", "",
             f"- Protocolos en catálogo: **{len(catalog)}** (web: {report.get('n_web','?')}, PDFs en mediateca: {report.get('n_media_pdf','?')})",
             f"- Pasajes indexados: {len(index['chunks'])} · fármacos detectados: {len(drugs)} · figuras: {sum(c['nfig'] for c in catalog)} ({fig_bytes/1e6:.1f} MB)",
             f"- Hash de contenido: `{version['hash']}` (build {version['build']})", ""]
    if nuevos:
        lines += ["## Nuevos", *[f"- {s}" for s in nuevos], ""]
    if actualizados:
        lines += ["## Actualizados (PDF cambió)", *[f"- {s}" for s in actualizados], ""]
    if retirados:
        lines += ["## Retirados de la web", *[f"- {p['slug']}" for p in retirados], ""]
    nuevos_pdf = [u for u in report.get("no_enlazados", []) if u["url"] not in prev_seen]
    if nuevos_pdf:
        lines += ["## PDFs nuevos en la mediateca de pedpal.es NO enlazados en /protocolos/ (¿protocolo pendiente de enlazar?)",
                  *[f"- {u['fecha']} · [{u['titulo']}]({u['url']})" for u in nuevos_pdf[:40]], "",
                  "Para incluir uno en la app sin esperar a enlazarlo en la web: añadirlo a `pipeline/overrides.json` → `include`.", ""]
    if warnings:
        lines += ["## Avisos de extracción", *[f"- {w}" for w in warnings], ""]
    (HERE / "REPORT.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
