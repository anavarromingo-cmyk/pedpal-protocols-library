"""Crea una carpeta autocontenida para revisar resúmenes, algoritmos y vademécum sin servidor:
abrir «Revisión app PEDPAL.html» con doble clic (Chrome, Edge, Safari o Firefox).

Uso: .venv/bin/python pipeline/carpeta_revision.py [DESTINO]
     (por defecto, la carpeta «Revisión app PEDPAL» dentro del proyecto de renovación)
"""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DEF = Path.home() / "Desktop/IA Playground/Protocolos Pedal renovación/Revisión app PEDPAL"

LEEME = """# Revisión de resúmenes, algoritmos y vademécum · app Protocolos PEDPAL

## Cómo revisar
1. Abra **«Revisión app PEDPAL.html»** con doble clic. Se abre en el navegador sin conexión ni instalación.
2. Escriba su nombre en «Revisor/a».
3. Elija un protocolo a la izquierda. «Solo con avisos» muestra primero lo que conviene mirar.
4. Para cada elemento, compárelo con:
   - los fragmentos del protocolo, con su página;
   - los avisos automáticos;
   - los hallazgos de los tres revisores IA independientes (C1 fidelidad, C2 seguridad clínica, C3 utilidad);
   - en los algoritmos, las figuras del propio protocolo.
5. Marque **Correcto**, **Corregir** o **Quitar**.
   - Si es «Corregir», escriba el texto corregido. Para una dosis, cópielo del protocolo.
   - «usar propuesta» copia la propuesta del revisor IA.
6. Lo que marca se guarda solo en este navegador y en este ordenador. Puede cerrar y seguir otro día.
7. Al terminar, o cuando quiera entregar una parte, pulse **«Exportar validación»** y envíe el archivo .json a Álvaro.
   - Cada exportación incluye todo lo revisado hasta ese momento.
   - «Importar revisión» permite continuar en otro ordenador con una exportación previa.

Una validación solo se aplica a la app si el texto del elemento no ha cambiado desde que se revisó, así nunca se aplica a un elemento equivocado.

## Contenido
- `Revisión app PEDPAL.html`: herramienta de revisión. Las figuras están en la carpeta `fig/`, que debe quedarse al lado del archivo.
- `Posibles erratas en los protocolos.md`: puntos dudosos de los propios protocolos, para los equipos autores.

## Para recordar
- Los protocolos están en su versión original (2024), pendientes de revisión clínica. Esta revisión valida los **resúmenes, algoritmos y vademécum de la app**, no el protocolo.
- Si un resumen es fiel a un protocolo que está desactualizado, márquelo «Correcto» y anote la duda en el comentario.
"""


def main() -> int:
    dest = Path(sys.argv[1]) if len(sys.argv) > 1 else DEF
    subprocess.run([sys.executable, str(HERE / "revision_html.py")], check=True)
    html = (ROOT / "revision" / "revision.html").read_text(encoding="utf-8")
    if dest.exists():
        shutil.rmtree(dest / "fig", ignore_errors=True)
    (dest / "fig").mkdir(parents=True, exist_ok=True)
    n = 0
    for src in sorted(set(re.findall(r"\.\./docs/(data/fig/[^\"\\\\]+?\.jpg)", html))):
        f = ROOT / "docs" / src
        if f.exists():
            out = dest / "fig" / Path(src).relative_to("data/fig")
            out.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, out)
            n += 1
    html = html.replace("../docs/data/fig/", "fig/")
    (dest / "Revisión app PEDPAL.html").write_text(html, encoding="utf-8")
    shutil.copy2(ROOT / "revision" / "erratas_protocolos.md", dest / "Posibles erratas en los protocolos.md")
    (dest / "LEEME.md").write_text(LEEME, encoding="utf-8")
    print(f"{dest} · {n} figuras")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
