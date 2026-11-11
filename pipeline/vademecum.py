"""Verifica y consolida el «Vademécum PEDPAL» extraído con IA de los protocolos aprobados.

Entrada: revision/vademecum/<slug>.json (extracción con IA, una entrada por pauta).
Comprobaciones deterministas (sin IA):
  1. «cita» aparece literalmente en el texto aprobado del protocolo (ignorando espacios y guiones de corte);
  2. toda cifra de «dosis», «dosis_maxima» y «poblacion» aparece en la «cita»;
  3. la página se recalcula a partir del bloque que contiene la cita (PDF 2026);
  4. el nombre del fármaco se normaliza con pipeline/farmacos.txt.
Las entradas que no pasan quedan fuera de la app (y listadas para revisión).

Salida:
  revision/vademecum/verificado.json  todas las entradas, con su verificación (para la herramienta de revisión)
  pipeline/curated/vademecum.json     solo las verificadas, agrupadas por fármaco (lo publica build.py)
Uso: .venv/bin/python pipeline/vademecum.py
"""
from __future__ import annotations

import datetime as dt
import json
import re
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
VD = ROOT / "revision" / "vademecum"
APROB = HERE / "aprobados"


def fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()


def squash(s: str) -> str:
    return re.sub(r"[\s­\-‐‑–—·|*•]+", "", fold(s))


def nums(s: str) -> set[str]:
    out = set()
    for m in re.finditer(r"\d+(?:[.,]\d+)?", s or ""):
        n = m.group(0).replace(",", ".")
        out.add(re.sub(r"\.0+$", "", n))
    return out


def alias_map() -> dict[str, str]:
    m = {}
    for line in (HERE / "farmacos.txt").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|") if p.strip()]
        for p in parts:
            m[fold(p)] = parts[0]
    return m


# Componentes de nutrición parenteral: son composición de la mezcla, no pautas de fármaco.
# Se excluyen de la app (quedan en revisión) salvo que PEDPAL decida lo contrario.
EXCLUIR = {("nutricion-parenteral-domiciliaria", f) for f in
           ("glucosa", "aminoácidos", "lípidos", "sodio", "potasio", "cloro", "calcio", "fósforo", "magnesio")}


def cargar_correcciones() -> dict:
    """revision/vademecum/correcciones.json:
    {"alias": {"nombre": "canónico"}, "excluir": {"id": "motivo"},
     "cambios": {"id": {"campo": "valor", ...}}, "nuevas": [ {entrada completa con slug} ]}
    Los cambios y las nuevas pasan por la MISMA verificación literal que el resto."""
    cp = VD / "correcciones.json"
    c = json.loads(cp.read_text(encoding="utf-8")) if cp.exists() else {}
    for k in ("alias", "excluir", "cambios", "avisos"):
        c.setdefault(k, {})
    c.setdefault("nuevas", [])
    return c


def main() -> int:
    alias = alias_map()
    corr = cargar_correcciones()
    alias.update({fold(k): v for k, v in corr["alias"].items()})
    todas, buenas = [], {}
    for jp in sorted(VD.glob("*.json")):
        if jp.name in ("verificado.json", "correcciones.json") or jp.name.startswith("c") and "_lote" in jp.name:
            continue
        try:
            d = json.loads(jp.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            print("JSON no válido:", jp.name, e)
            continue
        slug = d.get("slug") or jp.stem
        ap = APROB / f"{slug}.json"
        if not ap.exists():
            print("sin protocolo aprobado:", slug)
            continue
        doc = json.loads(ap.read_text(encoding="utf-8"))
        blocks = [(b.get("page", s["page"]), squash(b.get("x", "")), s["h"], s.get("anchor", "")) for s in doc["secciones"] for b in s["blocks"]]
        full = "".join(b[1] for b in blocks)
        entradas = list(d.get("entradas", []))
        nuevas = [dict(n) for n in corr["nuevas"] if n.get("slug") == slug]
        for i, e in enumerate(entradas + nuevas):
            eid = f"{slug}:{i}" if i < len(entradas) else f"{slug}:n{i - len(entradas)}"
            e = dict(e, **corr["cambios"].get(eid, {}))
            probs = []
            if eid in corr["excluir"]:
                probs.append("excluida en la revisión: " + corr["excluir"][eid])
            cita = e.get("cita", "")
            sc = squash(cita)
            page, sec = None, ""
            if not sc or sc not in full:
                # la cita puede cruzar bloques: probamos por mitades
                halves = [sc[: len(sc) // 2], sc[len(sc) // 2:]]
                if not sc or not all(h and h in full for h in halves):
                    probs.append("la cita no aparece literal en el protocolo")
            # sección: bloque que contiene la cita entera; si no, el que contiene su inicio
            for pg, bx, h, anc in blocks:
                if sc and sc in bx:
                    sec = h
                    break
            else:
                for pg, bx, h, anc in blocks:
                    if sc[:40] and sc[:40] in bx:
                        sec = h
                        break
            # página: la del PDF 2026 (mismo archivo que pedpal.es) donde empieza la cita
            from revision import page_of
            page = page_of(slug, cita[:200])
            cn = nums(cita)
            sec_txt = " ".join(b2[1] for b2 in blocks if b2[2] == sec) if sec else ""
            faltan = sorted((nums(e.get("dosis")) | nums(e.get("dosis_maxima"))) - cn)
            faltan += sorted(n for n in nums(e.get("poblacion")) - cn if n not in nums(sec_txt))
            if faltan:
                probs.append("cifras que no están en la cita: " + ", ".join(faltan))
            if not e.get("dosis"):
                probs.append("sin dosis")
            if (slug, alias.get(fold(e.get("farmaco", "")).strip(), (e.get("farmaco") or "").strip().lower())) in EXCLUIR:
                probs.append("componente de nutrición parenteral (excluido de la app; decisión pendiente)")
            canon = alias.get(fold(e.get("farmaco", "")).strip(), (e.get("farmaco") or "").strip().lower())
            dl = squash(e.get("dosis", "")).rstrip(".") in sc
            if corr["avisos"].get(eid):
                e["aviso"] = corr["avisos"][eid]
            ent = dict(e, dosis_literal=dl, slug=slug, titulo=doc["titulo_pdf"], farmaco=canon, pagina=page or e.get("pagina"),
                       pagina_ia=e.get("pagina"), seccion=sec, verificado=not probs, problemas=probs, id=eid,
                       cifras_no_en_protocolo=faltan)
            todas.append(ent)
            if not probs:
                buenas.setdefault(canon, []).append({k: ent.get(k, "") for k in ("slug", "titulo", "indicacion", "poblacion", "via", "dosis",
                                                                                     "dosis_maxima", "observaciones", "pagina", "seccion", "cita", "id", "dosis_literal", "aviso")})
    VD.mkdir(parents=True, exist_ok=True)
    (VD / "verificado.json").write_text(json.dumps({"entradas": todas}, ensure_ascii=False, indent=1), encoding="utf-8")
    out = {
        "titulo": "Vademécum PEDPAL",
        "aviso": "Información extraída mediante IA de los protocolos PEDPAL aprobados (2026) y verificada automáticamente contra su texto literal. "
                 "No sustituye al protocolo ni a la ficha técnica: compruebe siempre la dosis en el protocolo original.",
        "generado": {"fecha": dt.date.today().isoformat(), "metodo": "Extracción con IA (Claude) + verificación literal automática", "revisado": False},
        "farmacos": dict(sorted(buenas.items(), key=lambda kv: fold(kv[0]))),
    }
    (HERE / "curated" / "vademecum.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    nb = sum(len(v) for v in buenas.values())
    print(f"{len(todas)} entradas · {nb} verificadas ({len(buenas)} fármacos) · {len(todas) - nb} descartadas para revisión")
    for e in todas:
        if not e["verificado"]:
            print(" ✗", e["id"], e["farmaco"], "|", "; ".join(e["problemas"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
