"""Verificación determinista de los resúmenes y algoritmos «v2» (cada elemento con cita literal).

Para cada elemento {x, cita, tipo} de revision/v2/salida/<slug>.json comprueba, sin IA:
  1. la cita es literal y está dentro de UN bloque del protocolo;
  2. toda cifra de «x» aparece en la cita;
  3. calcula la página del PDF publicado donde está la cita.
Un elemento queda «verificado» si pasa 1 y 2 y su tipo es «literal». Los de tipo «sintesis» o que fallen
se dejan para la revisión humana.

Uso: .venv/bin/python pipeline/verificar_v2.py <slug> [...]     (informe por pantalla; código 1 si hay errores)
     .venv/bin/python pipeline/verificar_v2.py --todos --escribir (añade «ok», «page» y «problemas» a cada elemento)
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
V2 = ROOT / "revision" / "v2"
GRUPOS = ("puntos_clave", "banderas_rojas", "perlas")


def fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()


def squash(s: str) -> str:
    return re.sub(r"[\s­\-‐‑–—·|*•▪✔●○]+", "", fold(s))


def nums(s: str) -> set[str]:
    out = set()
    for m in re.finditer(r"\d+(?:[.,]\d+)?", s or ""):
        out.add(re.sub(r"\.0+$", "", m.group(0).replace(",", ".")))
    for frac, val in (("¼", "1/4"), ("½", "1/2"), ("¾", "3/4")):
        if frac in (s or ""):
            out.add(val)
    return out


def bloques(slug: str) -> list[tuple[int, str]]:
    out = []
    for line in (V2 / "entrada" / f"{slug}.protocolo.txt").read_text(encoding="utf-8").splitlines():
        m = re.match(r"\[p(\d+)\] (.*)", line)
        if m and not m.group(2).startswith("(FIGURA:"):
            out.append((int(m.group(1)), squash(m.group(2))))
    return out


def comprobar(e: dict, bl: list[tuple[int, str]]) -> tuple[list[str], int | None]:
    probs = []
    cita, x = e.get("cita", ""), e.get("x", "")
    sc = squash(cita)
    page = None
    if not x.strip():
        probs.append("elemento vacío")
    if len(cita) > 400:
        probs.append(f"cita de {len(cita)} caracteres (máximo 400)")
    if len(sc) < 12:
        probs.append("sin cita")
    else:
        hit = next((p for p, b in bl if sc in b), None)
        if hit is None:
            probs.append("la cita no es literal o no cabe en un solo bloque del protocolo")
        page = hit
    faltan = sorted(nums(x) - nums(cita))
    if faltan:
        probs.append("cifras de «x» que no están en la cita: " + ", ".join(faltan))
    if e.get("tipo") not in ("literal", "sintesis"):
        probs.append("falta «tipo» (literal o sintesis)")
    return probs, page


def verificar(slug: str, escribir: bool = False) -> int:
    f = V2 / "salida" / f"{slug}.json"
    d = json.loads(f.read_text(encoding="utf-8"))
    bl = bloques(slug)
    ent = json.loads((V2 / "entrada" / f"{slug}.json").read_text(encoding="utf-8"))
    srcs = {g["src"] for g in ent["figuras"]}
    n = err = 0
    informe = []
    if not d.get("en_una_frase") or re.search(r"\d", d.get("en_una_frase", "")):
        err += 1
        informe.append("en_una_frase: falta o contiene cifras")
    listas = [(g, d.get(g, [])) for g in GRUPOS]
    for ai, a in enumerate(d.get("algoritmos", [])):
        if a.get("decision") not in ("figura", "regenerado", "retirado"):
            err += 1
            informe.append(f"algoritmo {ai}: decisión no válida")
        if a.get("decision") == "regenerado":
            if len(a.get("pasos", [])) < 2:
                err += 1
                informe.append(f"algoritmo {ai}: regenerado sin pasos")
            listas.append((f"algoritmo {ai}", a.get("pasos", [])))
    for g in d.get("figuras_algoritmo", []):
        if g.get("src") not in srcs:
            err += 1
            informe.append(f"figuras_algoritmo: «{g.get('src')}» no es una figura del protocolo")
    if any(a.get("decision") == "figura" for a in d.get("algoritmos", [])) and not d.get("figuras_algoritmo"):
        err += 1
        informe.append("hay algoritmos con decisión «figura» pero figuras_algoritmo está vacío")
    if len(ent.get("algoritmos_2025", [])) != len(d.get("algoritmos", [])):
        err += 1
        informe.append(f"algoritmos: se esperaban {len(ent.get('algoritmos_2025', []))} decisiones (una por algoritmo de 2025)")
    for nombre, lista in listas:
        for i, e in enumerate(lista):
            n += 1
            probs, page = comprobar(e, bl)
            if probs:
                err += 1
                informe.append(f"{nombre}[{i}]: " + "; ".join(probs) + f"\n      x: {e.get('x', '')[:110]}")
            if escribir:
                e["page"] = page
                e["problemas"] = probs
                e["ok"] = not probs and e.get("tipo") == "literal"
    if escribir:
        f.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{slug}: {n} elementos, {err} con errores")
    for linea in informe:
        print("  ✗", linea)
    return err


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if "--todos" in sys.argv:
        args = sorted(p.stem for p in (V2 / "salida").glob("*.json"))
    if not args:
        print(__doc__)
        return 2
    tot = sum(verificar(s, "--escribir" in sys.argv) for s in args)
    return 1 if tot else 0


if __name__ == "__main__":
    raise SystemExit(main())
