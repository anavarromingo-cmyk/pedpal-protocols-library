"""Lista de POSIBLES ERRATAS en los protocolos aprobados, detectadas al extraer el vademécum y revisar los resúmenes.

No se corrigen en la app (se muestran con aviso): son para que PEDPAL y los equipos autores las revisen.
Salida: revision/erratas_protocolos.md
"""
from __future__ import annotations

import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
REV = HERE.parent / "revision"


def main() -> int:
    ver = {e["id"]: e for e in json.loads((REV / "vademecum" / "verificado.json").read_text(encoding="utf-8"))["entradas"]}
    corr = json.loads((REV / "vademecum" / "correcciones.json").read_text(encoding="utf-8"))
    por = {}
    for eid, txt in corr.get("avisos", {}).items():
        if "errata" not in txt.lower():
            continue
        e = ver.get(eid, {})
        slug = eid.split(":")[0]
        tipo = "inconsistencia entre protocolos" if re.search(r"protocolo de |otro protocolo|frente a .* en (el protocolo|sedaci|irritab|urgenc)", txt, re.I) else "posible errata"
        por.setdefault(slug, []).append({"farmaco": e.get("farmaco", ""), "pagina": e.get("pagina"), "nota": f"[{tipo}] " + txt,
                                         "cita": (e.get("cita") or "")[:300], "origen": "vademécum"})
    for f in sorted((REV / "criticos").glob("c[123]_lote[123].json")):
        for h in json.loads(f.read_text(encoding="utf-8")).get("hallazgos", []):
            t = (h.get("problema") or "")
            if re.search(r"errata (del|en el) (propio )?(protocolo|original)|errata del texto", t, re.I):
                por.setdefault(h["slug"], []).append({"farmaco": "", "pagina": h.get("pagina"), "nota": t,
                                                      "cita": (h.get("cita_protocolo") or "")[:300], "origen": "revisión de resúmenes"})
    tit = {}
    for p in (HERE / "aprobados").glob("*.json"):
        tit[p.stem] = json.loads(p.read_text(encoding="utf-8"))["titulo_pdf"]
    n = sum(len(v) for v in por.values())
    L = ["# Posibles erratas en los protocolos PEDPAL aprobados (2026)", "",
         f"Detectadas automáticamente y por revisores IA independientes al preparar el Vademécum y los resúmenes de la app ({n} puntos en {len(por)} protocolos).",
         "**No se han corregido**: en la app se muestran tal cual, con un aviso. Conviene que cada equipo autor las confirme o corrija en el protocolo;",
         "tras una corrección, se vuelve a maquetar el protocolo y la app se actualiza sola.", "",
         "Se ha comprobado visualmente en el PDF original de 2024 una muestra de 9 de ellas (paroxetina «510mg», gabapentina «5-300mg/12h»,",
         "dexametasona «4 m», butilbromuro «30 mgal día», trihexifenidilo «hasta70», «Valcicloviroral 1G», flumazenilo «5-10 mg/Kg», haloperidol",
         "«10-20 mcg/dosis», escopolamina «intradérmica»): todas están ya en el original; la maquetación 2026 las reproduce fielmente.",
         "Las marcadas como «inconsistencia entre protocolos» no son necesariamente errores: son pautas distintas para el mismo fármaco en dos protocolos.", ""]
    for slug in sorted(por, key=lambda s: tit.get(s, s)):
        L += [f"## {tit.get(slug, slug)}", ""]
        for e in por[slug]:
            L.append(f"- **{e['farmaco'] + ' · ' if e['farmaco'] else ''}pág. {e['pagina'] or '¿?'}** — {e['nota']}")
            if e["cita"]:
                L.append(f"  > «{e['cita']}»")
        L.append("")
    (REV / "erratas_protocolos.md").write_text("\n".join(L), encoding="utf-8")
    print(f"revision/erratas_protocolos.md · {n} posibles erratas en {len(por)} protocolos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
