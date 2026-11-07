# Protocolos PEDPAL

App móvil (PWA) para consultar de forma rápida los protocolos clínicos de la **Sociedad Española de Cuidados Paliativos Pediátricos (PEDPAL)** en formato tarjeta, con buscador de texto completo, índice de fármacos y funcionamiento sin conexión. Se sincroniza sola con <https://pedpal.es/protocolos/>.

**Web:** <https://anavarromingo-cmyk.github.io/pedpal-protocols-library/> (GitHub Pages desde la carpeta `docs/`).

## Qué hace

1. **Protocolos**: catálogo de los 33 protocolos por área clínica, con etiquetas «Nuevo» / «Actualizado» cuando cambian en pedpal.es. Cada protocolo se abre como una baraja de **tarjetas** deslizables (ficha, resumen rápido, fármacos clave, banderas rojas, algoritmos, y cada sección del PDF con sus tablas y figuras), o en **modo lectura** vertical. Enlace al PDF original siempre visible.
2. **Pregunta**: búsqueda en lenguaje natural dentro del texto completo de todos los protocolos (índice BM25 con sinónimos clínicos, 100 % en el dispositivo, sin servidor). Muestra los pasajes más relevantes con la página y un enlace a la sección. Opcionalmente, quien tenga una clave propia de la API de Anthropic puede pedir una respuesta redactada **solo** a partir de esos pasajes, con citas.
3. **Fármacos**: índice automático de ~155 fármacos mencionados en los protocolos, con los pasajes donde aparecen (dosis resaltadas).
4. **Guardados**: favoritos y recientes (solo en el dispositivo).
5. **Info**: estado de los datos, comprobación de actualizaciones, instalación y créditos.

## Arquitectura

```
docs/                      ← la app (estático, sin build). Es lo que publica GitHub Pages.
  index.html · app.js · app.css · search.js · pedpal.css · sw.js (generado) · manifest · iconos
  data/protocolos.json     ← catálogo + metadatos + novedades
  data/docs/<slug>.json    ← cada protocolo estructurado (secciones, listas, tablas, figuras, resumen, algoritmos)
  data/index.json          ← 2 000 pasajes para el buscador
  data/farmacos.json       ← fármaco → protocolos → pasajes
  data/sinonimos.json      ← sinónimos clínicos (editable a mano)
  data/fig/<slug>/*.jpg    ← figuras y páginas de algoritmo
pipeline/                  ← Python: pedpal.es → PDFs → JSON
  build.py                 ← orquestador (descarga con caché, extracción, índices, informe)
  catalog.py               ← página /protocolos/ + API REST de WordPress (fechas, PDFs no enlazados)
  extract.py               ← PDF → secciones/listas/tablas/figuras (PyMuPDF)
  build_index.py           ← pasajes + índice de fármacos
  overrides.json           ← áreas, títulos, inclusiones/exclusiones manuales
  farmacos.txt             ← lista de fármacos y alias
  curated/algoritmos.json  ← 21 algoritmos resumidos (elaboración propia, app PedPalProtocolos 2025)
  curated/resumenes/*.json ← resumen rápido por protocolo (borrador IA, pendiente de revisión)
  REPORT.md                ← informe de la última actualización
.github/workflows/update-protocolos.yml ← cada lunes: ejecuta el pipeline y hace commit si hay cambios
archive/                   ← las dos apps anteriores (referencia)
```

### Cómo se actualiza sola

Cada lunes (o a mano con «Run workflow» en GitHub Actions) el pipeline:

1. Lee los enlaces PDF de <https://pedpal.es/protocolos/> y la mediateca de WordPress (`/wp-json/wp/v2/media`) para conocer fecha de subida/modificación.
2. Descarga solo los PDF nuevos o cambiados (tamaño, fecha o hash distintos).
3. Extrae texto, listas, tablas y figuras; reconstruye índices.
4. Si algo cambió, hace commit en `docs/data/` → GitHub Pages republica → el service worker de la app detecta la nueva versión y avisa al usuario.
5. Deja en `pipeline/REPORT.md` (y en el resumen del workflow) los protocolos nuevos, actualizados, retirados y los **PDF subidos a pedpal.es que no están enlazados** en la página de protocolos (posibles olvidos).

Para incluir un PDF que esté en pedpal.es pero no enlazado, o corregir un título/área: editar `pipeline/overrides.json`.

### Ejecutar el pipeline en local

```bash
python3 -m venv .venv && .venv/bin/pip install -r pipeline/requirements.txt
.venv/bin/python pipeline/build.py          # descarga + extrae + indexa → docs/data/
python3 -m http.server 8748 --directory docs # y abrir http://localhost:8748
```

### Resúmenes rápidos (IA)

`pipeline/curated/resumenes/<slug>.json` contiene, por protocolo, una frase, 4-6 puntos clave, fármacos clave con dosis copiadas literalmente (y página), banderas rojas y perlas. Se generaron con Claude a partir del texto extraído, de forma extractiva, y la app los marca como **borrador pendiente de revisión por PEDPAL**. Para validar uno: revisarlo y poner `"revisado": true`. Un protocolo nuevo sin resumen se muestra igualmente (solo con las secciones del PDF).

## Instalación como aplicación (PWA)

- **Android (Chrome)**: abrir la URL → menú ⋮ → «Instalar app».
- **iOS (Safari)**: abrir la URL → Compartir → «Añadir a la pantalla de inicio».

Tras la primera carga, el service worker guarda la app y todos los protocolos: funciona sin red.

## Fuentes y aviso

Protocolos © PEDPAL y sus autores, publicados en <https://pedpal.es/protocolos/>. La app es una herramienta de apoyo para profesionales: no sustituye el juicio clínico ni la lectura del protocolo original, y las dosis deben comprobarse siempre en el PDF y en la ficha técnica.

## Licencia

© 2026 Álvaro Navarro · [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.es). Texto completo en [LICENSE](LICENSE). La licencia cubre el código y los textos propios de la app; no se extiende a los protocolos de PEDPAL ni al resto de material de terceros.
