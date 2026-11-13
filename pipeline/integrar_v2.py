"""Integra en la app los resúmenes y algoritmos «v2» (cada elemento con cita literal verificada).

Entrada: revision/v2/salida/<slug>.json (con «ok», «page» y «problemas» de verificar_v2.py --escribir)
         revision/v2/criticos/K*_*.json (veredictos de los críticos ciegos; el último archivo por crítico y elemento manda)
Un elemento es «auto» (verificado automáticamente) si: la cita es literal, sus cifras están en la cita, es de tipo
«literal» y TODOS los críticos lo dan por «fiel». El resto queda para la revisión humana, con sus motivos.

Salida: pipeline/curated/resumenes/<slug>.json, curated/algoritmos.json, curated/figuras_algoritmo.json
        revision/v2/pendientes.json (motivos por elemento, para la herramienta de revisión)
No toca los protocolos ya revisados por una persona.
"""
from __future__ import annotations

import datetime as dt
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
V2 = ROOT / "revision" / "v2"
CUR = HERE / "curated"
GRUPOS = ("puntos_clave", "banderas_rojas", "perlas")
FUENTE = "Resumen generado con IA a partir del texto del protocolo PEDPAL, con cita por paso. Verificar siempre con el protocolo."


def _resolver(d: dict, iid: str):
    """Elemento {x, cita} al que se refiere un id («puntos_clave:2», «algoritmo:0:3») en un archivo de salida."""
    try:
        parts = iid.split(":")
        if parts[0] == "algoritmo":
            return d["algoritmos"][int(parts[1])]["pasos"][int(parts[2])]
        return d[parts[0]][int(parts[1])]
    except (KeyError, IndexError, ValueError):
        return None


def _clave(slug: str, e: dict) -> tuple:
    norm = lambda t: " ".join((t or "").split())
    return (slug, norm(e.get("x")), norm(e.get("cita")))


def veredictos() -> dict:
    """{(slug, x, cita): {critico: (veredicto, motivo, propuesta)}}.
    Cada veredicto se ata al TEXTO que el crítico vio (instantánea salida_it1/, salida_it2/…), no a la posición:
    si un elemento se reescribe, su veredicto anterior deja de valer."""
    out: dict = {}
    cache: dict = {}
    for f in sorted((V2 / "criticos").glob("K*.json")):
        snap = V2 / ("salida_it2" if "it2" in f.name else "salida_it1")
        j = json.loads(f.read_text(encoding="utf-8"))
        for v in j.get("veredictos", []):
            sf = snap / f"{v['slug']}.json"
            if sf not in cache:
                cache[sf] = json.loads(sf.read_text(encoding="utf-8")) if sf.exists() else {}
            e = _resolver(cache[sf], v["id"])
            if e:
                out.setdefault(_clave(v["slug"], e), {})[j["critico"]] = (v.get("veredicto"), v.get("motivo", ""), v.get("propuesta", ""))
    return out


def main() -> int:
    ver = veredictos()
    algs = json.loads((CUR / "algoritmos.json").read_text(encoding="utf-8"))
    figp = CUR / "figuras_algoritmo.json"
    figalg = json.loads(figp.read_text(encoding="utf-8")) if figp.exists() else {}
    pend = {}
    hoy = dt.date.today().isoformat()
    (V2 / "anterior").mkdir(exist_ok=True)
    tot = auto = 0
    for f in sorted((V2 / "salida").glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        slug = d["slug"]
        rp = CUR / "resumenes" / f"{slug}.json"
        if rp.exists():
            old = json.loads(rp.read_text(encoding="utf-8"))
            if old.get("generado", {}).get("revisado"):
                print("ya revisado por una persona, no se toca:", slug)
                continue
            if not (V2 / "anterior" / rp.name).exists():
                shutil.copy2(rp, V2 / "anterior" / rp.name)
        ent = json.loads((V2 / "entrada" / f"{slug}.json").read_text(encoding="utf-8"))
        figinfo = {g["src"]: g for g in ent["figuras"]}

        def item(e: dict, iid: str) -> dict:
            nonlocal tot, auto
            vs = ver.get(_clave(slug, e), {})
            motivos = list(e.get("problemas", []))
            if e.get("tipo") != "literal":
                motivos.append("síntesis de varias partes del protocolo (no la respalda una sola cita)")
            for c, (v, m, p) in sorted(vs.items()):
                if v != "fiel":
                    motivos.append(f"{c} ({v}): {m}" + (f" · Propuesta: {p}" if p else ""))
            if len(vs) < 2 and e.get("tipo") == "literal":
                motivos.append("sin comprobación independiente completa")
            ok = bool(e.get("ok")) and not motivos
            tot += 1
            auto += ok
            if not ok:
                pend[f"{slug}|{iid}"] = motivos
            return {"x": e["x"], "cita": e.get("cita", ""), "page": e.get("page"), "auto": ok}

        res = {"slug": slug, "en_una_frase": d["en_una_frase"]}
        for g in GRUPOS:
            res[g] = [item(e, f"{g}:{i}") for i, e in enumerate(d.get(g, []))]
        res["generado"] = {"modelo": "Claude Fable 5.2", "fecha": hoy, "revisado": False,
                           "metodo": "Resumen generado con IA; cada elemento lleva la cita literal del protocolo que lo respalda, comprobada "
                                     "automáticamente y por dos revisores IA independientes. Pendiente de revisión por PEDPAL."}
        rp.write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
        nuevos = []
        for ai, a in enumerate(d.get("algoritmos", [])):
            if a.get("decision") != "regenerado":
                continue
            nuevos.append({"nombre": a.get("nombre") or a.get("nombre_2025", ""), "objetivo": a.get("objetivo", ""), "poblacion": a.get("poblacion", ""),
                           "pasos": [dict(item(e, f"algoritmo:{ai}:{i}"), paso=str(i + 1)) for i, e in enumerate(a.get("pasos", []))],
                           "fuente": FUENTE})
        if nuevos:
            algs[slug] = nuevos
        else:
            algs.pop(slug, None)
        figs = [{"src": g["src"], "titulo": g.get("titulo", ""), "descripcion": g.get("descripcion", ""), "aviso": g.get("aviso", ""),
                 "page": figinfo.get(g["src"], {}).get("pagina")} for g in d.get("figuras_algoritmo", []) if g.get("src") in figinfo]
        if figs:
            figalg[slug] = figs
        else:
            figalg.pop(slug, None)
    (CUR / "algoritmos.json").write_text(json.dumps(algs, ensure_ascii=False, indent=2), encoding="utf-8")
    figp.write_text(json.dumps(figalg, ensure_ascii=False, indent=2), encoding="utf-8")
    (V2 / "pendientes.json").write_text(json.dumps(pend, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{tot} elementos · {auto} verificados automáticamente · {tot - auto} para revisión humana")
    print(f"algoritmos regenerados: {sum(len(v) for v in algs.values())} · protocolos con figura de algoritmo: {len(figalg)} ({sum(len(v) for v in figalg.values())} figuras)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
