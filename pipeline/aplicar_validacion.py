"""Aplica a los contenidos curados una validación exportada desde revision/revision.html.

Uso: .venv/bin/python pipeline/aplicar_validacion.py validacion-nombre-fecha.json [--dry-run]

Reglas:
  - «Correcto»: el elemento queda validado.
  - «Quitar»: el elemento se elimina (resumen, algoritmo) o se excluye (vademécum).
  - «Corregir» con texto: en frases, puntos, banderas, perlas y pasos de algoritmo se sustituye el texto.
    En fármacos clave, títulos de algoritmo y vademécum NO se aplica a ciegas: se lista en el informe
    para incorporarlo a mano (son campos estructurados con dosis).
  - Un resumen o algoritmo pasa a «Revisado por PEDPAL» cuando TODOS sus elementos tienen decisión
    y no queda ninguna corrección pendiente de aplicar a mano.
Escribe revision/informe_validacion.md con lo aplicado y lo pendiente.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
CUR = HERE / "curated"
INSTRUCCION = __import__("re").compile(r"^\s*(añadir|anadir|quitar|eliminar|cambiar|incluir|poner|sustituir|revisar|corregir|completar|matizar|ampliar|reducir|mover)\b", __import__("re").I)


def es_instruccion(t: str) -> bool:
    """«Añadir la excepción…» es una indicación para el editor, no el texto final: no se aplica a ciegas."""
    return bool(INSTRUCCION.match(t or "")) or len((t or "").strip()) < 25


def huella(t: str) -> str:
    """Igual que en revision_plantilla.html (FNV-1a 32 bits sobre puntos de código)."""
    h = 0x811C9DC5
    for ch in t or "":
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return format(h, "x")


CAMPO = {"frase": "en_una_frase", "punto": "puntos_clave", "bandera": "banderas_rojas", "perla": "perlas", "farmaco": "farmacos_clave"}


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    dry = "--dry-run" in sys.argv
    marca = Path(sys.argv[1]).with_suffix(".aplicada")
    if marca.exists() and not dry:
        print("Esta validación ya se aplicó (", marca, "). No se aplica dos veces.")
        return 1
    val = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    assert val.get("formato") == "pedpal-revision-1", "no es una exportación de la herramienta de revisión"
    rev, fecha = val["revisor"], val["exportado"][:10]
    datos = json.loads((ROOT / "revision" / "datos.json").read_text(encoding="utf-8"))
    algs = json.loads((CUR / "algoritmos.json").read_text(encoding="utf-8"))
    figp = CUR / "figuras_algoritmo.json"
    figalg = json.loads(figp.read_text(encoding="utf-8")) if figp.exists() else {}
    vadp = CUR / "vademecum.json"
    vad = json.loads(vadp.read_text(encoding="utf-8")) if vadp.exists() else None
    inf = [f"# Validación de {rev} ({fecha})", ""]
    manual = []
    descartadas = []
    for p in datos["protocolos"]:
        slug = p["slug"]
        dec = {k.split("|", 1)[1]: v for k, v in val["items"].items() if k.split("|", 1)[0] == slug and v.get("estado")}
        # seguridad: si el texto del elemento cambió desde que se revisó, la decisión NO se aplica
        textos = {it["id"]: it["texto"] for it in p["items"]}
        for iid in list(dec):
            if iid.startswith("vad:"):
                continue
            if iid not in textos or dec[iid].get("huella") != huella(textos[iid]):
                descartadas.append(f"- {slug} · {iid}: el elemento cambió desde la revisión (o no existe); revisar de nuevo")
                del dec[iid]
        if not dec:
            continue
        rp = CUR / "resumenes" / f"{slug}.json"
        r = json.loads(rp.read_text(encoding="utf-8")) if rp.exists() else None
        borrar = {}  # campo -> índices a quitar (al final, de mayor a menor)
        pend_res = False
        for it in p["items"]:
            t, iid = it["tipo"], it["id"]
            d = dec.get(iid)
            if t in CAMPO and r is not None:
                if not d:
                    pend_res = True
                    continue
                idx = int(iid.split(":")[1])
                if d["estado"] == "del":
                    borrar.setdefault(CAMPO[t], []).append(idx)
                elif d["estado"] == "fix" and d.get("correccion", "").strip():
                    if t == "farmaco" or es_instruccion(d["correccion"]):
                        manual.append(f"- {slug} · {iid}: {d['correccion'].strip()}")
                        pend_res = True
                    elif t == "frase":
                        r["en_una_frase"] = d["correccion"].strip()
                    elif isinstance(r[CAMPO[t]][idx], dict):
                        r[CAMPO[t]][idx].update(x=d["correccion"].strip(), editado_por=rev)
                    else:
                        r[CAMPO[t]][idx] = d["correccion"].strip()
                elif d["estado"] == "fix":
                    manual.append(f"- {slug} · {iid}: marcado «Corregir» sin texto")
                    pend_res = True
        if r is not None:
            for campo, idxs in borrar.items():
                for i in sorted(set(idxs), reverse=True):
                    r[campo].pop(i)
            g = r.setdefault("generado", {})
            if not pend_res:
                g.update(revisado=True, revisado_por=rev, revisado_fecha=fecha)
            if not dry:
                rp.write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")
            inf.append(f"- {slug}: resumen {'REVISADO' if not pend_res else 'con elementos pendientes'}")
        # figuras de algoritmo del protocolo
        fgs = figalg.get(slug, [])
        quitar_f = []
        for fi, fg in enumerate(fgs):
            d = dec.get(f"alg_fig:{fi}")
            if not d:
                continue
            if d["estado"] == "ok":
                fg.update(revisado=True, revisado_por=rev, revisado_fecha=fecha)
            elif d["estado"] == "del":
                quitar_f.append(fi)
            else:
                manual.append(f"- {slug} · alg_fig:{fi}: {d.get('correccion', '').strip() or '(sin texto)'}")
        for fi in sorted(quitar_f, reverse=True):
            fgs.pop(fi)
        # algoritmos
        for ai, a in enumerate(algs.get(slug, [])):
            pend = False
            quitar = []
            tdec = dec.get(f"alg_titulo:{ai}")
            if not tdec:
                pend = True
            elif tdec["estado"] == "del":
                a["_quitar"] = True
            elif tdec["estado"] == "fix":
                manual.append(f"- {slug} · alg_titulo:{ai}: {tdec.get('correccion', '').strip() or '(sin texto)'}")
                pend = True
            for pi, paso in enumerate(a["pasos"]):
                d = dec.get(f"alg_paso:{ai}.{pi}")
                if not d:
                    pend = True
                elif d["estado"] == "del":
                    quitar.append(pi)
                elif d["estado"] == "fix" and d.get("correccion", "").strip() and es_instruccion(d["correccion"]):
                    manual.append(f"- {slug} · alg_paso:{ai}.{pi}: {d['correccion'].strip()}")
                    pend = True
                elif d["estado"] == "fix" and d.get("correccion", "").strip():
                    paso["x"] = d["correccion"].strip()
                elif d["estado"] == "fix":
                    manual.append(f"- {slug} · alg_paso:{ai}.{pi}: marcado «Corregir» sin texto")
                    pend = True
            for pi in sorted(quitar, reverse=True):
                a["pasos"].pop(pi)
            if not pend:
                a.update(revisado=True, revisado_por=rev, revisado_fecha=fecha)
            inf.append(f"- {slug}: algoritmo «{a['nombre']}» {'REVISADO' if not pend else 'pendiente'}")
        if slug in algs:
            algs[slug] = [a for a in algs[slug] if not a.get("_quitar")]
        # vademécum
        if vad:
            for k, d in dec.items():
                if not k.startswith("vad:"):
                    continue
                if d["estado"] == "fix":
                    manual.append(f"- {slug} · {k} (vademécum): {d.get('correccion', '').strip() or '(sin texto)'}")
    if vad:
        ver = json.loads((ROOT / "revision" / "vademecum" / "verificado.json").read_text(encoding="utf-8"))["entradas"]
        por_slug = {}
        for e in ver:
            por_slug.setdefault(e["slug"], []).append(e)
        quitar_ids, ok_ids = set(), set()
        for key, d in val["items"].items():
            slug, iid = key.split("|", 1)
            if iid.startswith("vad:") and d.get("estado"):
                lst = por_slug.get(slug, [])
                k = int(iid[4:])
                e = lst[k] if k < len(lst) else None
                texto = " · ".join(x for x in ([e.get("farmaco"), e.get("indicacion"), e.get("poblacion"), e.get("dosis"), e.get("via")] if e else []) if x)
                if not e or d.get("huella") != huella(texto):
                    descartadas.append(f"- {slug} · {iid} (vademécum): la pauta cambió desde la revisión; revisar de nuevo")
                    continue
                (quitar_ids if d["estado"] == "del" else ok_ids if d["estado"] == "ok" else set()).add(e["id"])
        for f, es in vad["farmacos"].items():
            vad["farmacos"][f] = [dict(e, revisado=(e["id"] in ok_ids) or e.get("revisado", False)) for e in es if e["id"] not in quitar_ids]
        vad["farmacos"] = {k: v for k, v in vad["farmacos"].items() if v}
        if not dry:
            vadp.write_text(json.dumps(vad, ensure_ascii=False, indent=1), encoding="utf-8")
    if not dry:
        (CUR / "algoritmos.json").write_text(json.dumps(algs, ensure_ascii=False, indent=2), encoding="utf-8")
        figp.write_text(json.dumps({k: v for k, v in figalg.items() if v}, ensure_ascii=False, indent=2), encoding="utf-8")
    inf += ["", "## Correcciones para aplicar a mano (campos con dosis)", *(manual or ["- ninguna"])]
    inf += ["", "## Decisiones NO aplicadas (el texto cambió desde la revisión)", *(descartadas or ["- ninguna"])]
    out = ROOT / "revision" / "informe_validacion.md"
    if not dry:
        out.write_text("\n".join(inf), encoding="utf-8")
        marca.write_text(fecha, encoding="utf-8")
    print("\n".join(inf))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
