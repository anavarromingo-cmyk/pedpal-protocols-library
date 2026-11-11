"""Genera revision/revision.html: herramienta de revisión y validación de resúmenes, algoritmos y vademécum.

Junta en una sola página, por protocolo:
  - cada elemento (frase, punto clave, fármaco, bandera, perla, paso de algoritmo, entrada del vademécum);
  - los fragmentos del protocolo aprobado que lo sustentan (con página del PDF 2026);
  - las comprobaciones automáticas (cifras o dosis no encontradas literalmente);
  - los hallazgos de los críticos ciegos (C1 fidelidad, C2 seguridad clínica, C3 utilidad), con su propuesta;
  - las figuras de algoritmo del protocolo, para contrastar los algoritmos resumidos.
El revisor marca cada elemento (correcto / corregir / quitar) y exporta un JSON de validación que luego se aplica
con pipeline/aplicar_validacion.py. El estado se guarda en el navegador mientras se revisa.

Uso: .venv/bin/python pipeline/revision_html.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
REV = ROOT / "revision"


def figuras_algoritmo(slug: str) -> list[dict]:
    """Figuras del protocolo aprobado que parecen algoritmos (por leyenda o sección)."""
    d = json.loads((HERE / "aprobados" / f"{slug}.json").read_text(encoding="utf-8"))
    out = []
    for s in d["secciones"]:
        for b in s["blocks"]:
            if "<img" not in b["h"]:
                continue
            ctx = (s["h"] + " " + b["x"]).lower()
            alg = bool(re.search(r"algoritm|flujo|diagrama|esquema|manejo|abordaje", ctx))
            for src in re.findall(r'src="([^"]+)"', b["h"]):
                out.append({"src": "../docs/" + src, "page": b["page"], "sec": s["h"], "pie": b["x"][:200], "alg": alg})
    return out


def main() -> int:
    datos = json.loads((REV / "datos.json").read_text(encoding="utf-8"))
    crit = {}
    for f in sorted((REV / "criticos").glob("c[123]_lote[123].json")):
        try:
            j = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            print("JSON no válido:", f.name, e)
            continue
        for h in j.get("hallazgos", []):
            h["critico"] = j.get("critico", f.name[:2].upper())
            crit.setdefault(h.get("slug", ""), []).append(h)
    vad = {}
    vdir = REV / "vademecum" / "verificado.json"
    if vdir.exists():
        for e in json.loads(vdir.read_text(encoding="utf-8"))["entradas"]:
            vad.setdefault(e["slug"], []).append(e)
    # hallazgos de los críticos del vademécum: id «slug:i» → «vad:k» (posición en la lista del protocolo)
    for f in sorted((REV / "vademecum" / "criticos").glob("cv[123].json")):
        try:
            j = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            print("JSON no válido:", f.name, e)
            continue
        for h in j.get("hallazgos", []):
            slug = str(h.get("id", "")).split(":")[0]
            pos = [e["id"] for e in vad.get(slug, [])]
            if h.get("id") in pos:
                h = dict(h, id=f"vad:{pos.index(h['id'])}", critico=j.get("critico", "C?") + " vademécum")
                crit.setdefault(slug, []).append(h)
    for p in datos["protocolos"]:
        p["criticos"] = crit.get(p["slug"], [])
        p["figuras_algoritmo"] = figuras_algoritmo(p["slug"]) if any(i["tipo"].startswith("alg") for i in p["items"]) else []
        p["vademecum"] = vad.get(p["slug"], [])
    url = {}
    cat = json.loads((ROOT / "docs" / "data" / "protocolos.json").read_text(encoding="utf-8"))
    for c in cat["protocolos"]:
        url[c["slug"]] = c["url"]
    for p in datos["protocolos"]:
        p["pdf"] = url.get(p["slug"], "")
    tpl = (HERE / "revision_plantilla.html").read_text(encoding="utf-8")
    html = tpl.replace("/*__DATOS__*/null", json.dumps(datos, ensure_ascii=False).replace("</", "<\\/"))
    (REV / "revision.html").write_text(html, encoding="utf-8")
    n = sum(len(p["items"]) for p in datos["protocolos"])
    nc = sum(len(p["criticos"]) for p in datos["protocolos"])
    nv = sum(len(p["vademecum"]) for p in datos["protocolos"])
    print(f"revision/revision.html · {len(datos['protocolos'])} protocolos · {n} elementos · {nc} hallazgos de críticos · {nv} entradas de vademécum")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
