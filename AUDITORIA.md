# Auditoría de las apps anteriores y propuesta de arquitectura

_7 nov 2026 · Álvaro Navarro · elaborado con Claude_

## 1. Qué había

| | `pedpal-protocols-library` (GitHub Pages) | `PedPalProtocolos` (GitHub Pages) |
|---|---|---|
| Qué es | Lista de 32 protocolos con filtro por categoría y búsqueda por título/4 palabras clave | «Dashboard clínico»: 10 síntomas, 27 fármacos (APPM Formulary), 21 algoritmos, flashcards, favoritos |
| Datos | Array `PROTOCOLS` **escrito a mano dentro del HTML**; `data/*.json` con 3 síntomas y 5 fármacos sin usar | Datos embebidos en `app.js` (1 600 líneas); `farmacos.json` **no es JSON válido** (restos `[cite_start]`); `sintomas.json` con otra estructura distinta a la usada |
| Contenido de los PDF | Ninguno: solo enlaza al PDF | Resúmenes manuales de ~10 síntomas |
| Actualización | Manual (editar el HTML) | Manual |
| Móvil | Grid responsive, pero tarjetas de 380 px, sombras pesadas, gradiente violeta; no instalable | Menú hamburguesa; no instalable; estilo propio (teal), no PEDPAL |
| Offline | No | No |
| Licencia | README dice MIT; README describe un proyecto (scraper Python + React + Fuse.js) **que no existe en el repo** | LICENSE es CC0 (dominio público) pero el pie dice CC BY-NC 4.0 → contradicción |
| Riesgos | Un protocolo nuevo en pedpal.es no aparece nunca; «Status epiléptico» mal escrito; categorías sin criterio explícito | Dosis de APPM (RU) mezcladas con protocolos PEDPAL sin trazabilidad; fallo silencioso si el JSON no carga |

Hallazgos adicionales en la web de PEDPAL:

- `cuidados-odontologicos-en-el-paciente-pediatrico-cronico.pdf` (16 págs., con autores, subido el 2-dic-2024) está en la mediateca **pero no enlazado** en /protocolos/. Incluido en la app vía `overrides.json`; conviene enlazarlo en la web.
- La página /protocolos/ no tiene categorías ni fechas; el enlace a «Cuidados al final de la vida en Neonatología» aparece dos veces.
- WordPress expone la API REST pública (`/wp-json/wp/v2/media`): da fecha de subida y modificación de cada PDF, lo que permite detectar cambios sin «scrapear» a ciegas.
- Los 33 PDF tienen capa de texto (Word → PDF, Cambria 11 pt; títulos 14/22 pt): extracción fiable sin OCR. 487 páginas, ~1 M de caracteres.

## 2. Decisiones de arquitectura

| Necesidad | Decisión | Por qué |
|---|---|---|
| «Que se actualice sola» | GitHub Actions semanal → pipeline Python → commit en `docs/data/` → GitHub Pages | Cero servidores, cero coste, histórico en git, informe de cambios en cada ejecución |
| Fuente de verdad | Enlaces de /protocolos/ ∪ mediateca WP + `overrides.json` | La web manda; la API aporta fechas y detecta PDF olvidados; los overrides corrigen sin tocar código |
| Tarjetas en móvil | Extracción estructurada (secciones/listas/tablas/figuras) con PyMuPDF → una tarjeta por sección, carrusel con scroll-snap + modo lectura | Lectura ágil en pantalla pequeña; las páginas de algoritmo se renderizan como imagen porque el flujograma pierde la estructura al extraer texto |
| «Preguntar» sin pagar API | Índice BM25 en el navegador con sinónimos clínicos y resaltado de dosis; respuesta extractiva literal con cita de sección y página | Instantáneo, offline, sin coste, sin enviar datos; es RAG «R» sin la «G» |
| RAG completo opcional | Clave API del propio usuario (guardada en su dispositivo); la app envía pregunta + 12 pasajes y exige citas | Coste cero para PEDPAL; quien quiera generación la paga él; cuando haya presupuesto, basta un proxy mínimo con una clave de la sociedad |
| Resumen rápido | Resúmenes extractivos generados una vez con Claude (página citada, dosis copiadas), marcados «borrador pendiente de revisión» | Ahorra lectura; revisables uno a uno (`revisado: true`); no dependen de ninguna API en producción |
| Legado | 21 algoritmos de PedPalProtocolos enlazados a su protocolo; se descarta el formulario APPM | Reaprovecha trabajo propio; evita mezclar fuentes de dosis |
| Identidad | Skill PEDPAL (cabecera sticky, franja, bottom-nav 5 secciones, Montserrat/Open Sans, solo claro) + PWA | Coherente con KetoPal, Dietoterápicos, Dolor Pediátrico |

## 3. Mejoras propuestas (por orden de valor)

1. **Revisar los 33 resúmenes** (10-15 min cada uno) y marcar `revisado: true`: la etiqueta «Borrador IA» desaparece y pasa a «Revisado por PEDPAL».
2. **Enlazar en pedpal.es el protocolo de cuidados odontológicos** y, al subir protocolos nuevos, enlazarlos siempre en /protocolos/ (el pipeline los detecta solo si están enlazados o incluidos a mano).
3. **Convención de publicación**: en WordPress, subir los PDF de protocolo con un nombre de archivo sin versión (`sialorrea.pdf`) y reemplazar el archivo al actualizar → la app lo detecta como «Actualizado» sin cambiar el enlace. Si se cambia el nombre, aparecerá como «Nuevo» y el anterior como «Retirado».
4. **Búsqueda semántica opcional**: embeddings multilingües precalculados en el pipeline (sentence-transformers, 2 000 pasajes × 384 dims ≈ 0,8 MB) + modelo pequeño en el navegador (transformers.js, ~25 MB, descarga opcional) para preguntas con vocabulario alejado del texto. Mejora «pregunta en lenguaje natural» sin API.
5. **Proxy de IA con clave de PEDPAL** (Cloudflare Worker, gratuito hasta 100 k peticiones/día): si en el futuro la sociedad asume el coste, se sustituye la clave del usuario por un endpoint propio con límite diario; el código del cliente ya está preparado.
6. **Tablas de dosis estructuradas**: las tablas se extraen pero con celdas a veces partidas; un segundo paso con heurísticas por columna («Fármaco | Vía | Dosis») permitiría una vista «calculadora» por peso.
7. **Calculadora por peso** (kg) sobre los fármacos clave con dosis mg/kg, estilo PerfuPedPal.
8. **Notas personales por tarjeta** (localStorage) y **compartir enlace profundo** (`#p/slug/sección`) por WhatsApp.
9. **Analítica anónima de uso** (opcional, sin cookies: contador de aperturas por protocolo con Cloudflare Web Analytics) para saber qué protocolos consultan los socios.
10. **Documentos de interés**: la mediateca tiene guías externas (GPC, libro blanco, carta europea, donación pediátrica, palivizumab…); una sección «Recursos» con el mismo pipeline.

## 4. Limitaciones conocidas

- La extracción es heurística: títulos partidos, viñetas anidadas y celdas de tabla pueden salir imperfectos. El PDF original prevalece y está a un toque.
- Los resúmenes IA son borradores: las dosis se copiaron literalmente y con página, pero deben revisarse antes de darlos por válidos (se detectaron erratas del propio PDF, p. ej. «Flumacenil 5-10 mg/Kg/dosis» en neonatología).
- Las figuras ocupan 6 MB; se descargan bajo demanda (no en la instalación).
- Sin GitHub Actions activado en el repo, nada se actualiza: hay que publicar el repo y dejar el workflow habilitado.
