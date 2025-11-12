# 🏥 PEDPAL Protocols Library

> Biblioteca digital de protocolos clínicos de cuidados paliativos pediátricos con aplicación web de búsqueda avanzada

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18.2.0-61DAFB.svg)](https://reactjs.org/)

## 📋 Descripción

Proyecto completo para automatizar la descarga, indexación y búsqueda de los 32 protocolos clínicos de **PEDPAL** (Sociedad Española de Cuidados Paliativos Pediátricos). Incluye:

- 🐍 Script Python para scraping y extracción de metadatos
- 📊 Biblioteca JSON estructurada con clasificación clínica
- ⚛️ Aplicación web React con búsqueda avanzada
- 🔍 Sistema de búsqueda difusa con Fuse.js
- 📱 Diseño responsive y accesible

## 🎯 Características

### Backend (Python)
- Descarga automática de todos los PDFs desde pedpal.es
- Extracción de metadatos (número de páginas, texto, autores)
- Análisis NLP básico para palabras clave clínicas y farmacológicas
- Categorización automática por áreas temáticas
- Generación de JSON estructurado

### Frontend (React)
- Búsqueda en tiempo real por título, síntoma, fármaco o palabra clave
- Filtrado por categorías clínicas
- Vista en tarjetas responsive
- Descarga directa y vista previa de PDFs
- Interfaz optimizada para móviles y tablets

## 🚀 Instalación

### Requisitos previos
```bash
# Python 3.8 o superior
python --version

# Node.js 16 o superior
node --version
```

### 1. Clonar repositorio
```bash
git clone https://github.com/anavarromingo-cmyk/pedpal-protocols-library.git
cd pedpal-protocols-library
```

### 2. Instalar dependencias Python
```bash
pip install -r requirements.txt
```

### 3. Descargar protocolos y generar JSON
```bash
python scraper/pedpal_scraper.py
```

Esto descargará:
- ✅ 32 PDFs en `./protocolos/`
- ✅ Biblioteca JSON en `./data/pedpal_library.json`

### 4. Instalar y ejecutar aplicación React
```bash
cd webapp
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.

## 📁 Estructura del proyecto

```
pedpal-protocols-library/
├── scraper/
│   ├── pedpal_scraper.py      # Script principal de descarga
│   ├── pdf_extractor.py       # Extracción de metadatos PDF
│   └── clinical_nlp.py        # Procesamiento NLP clínico
├── data/
│   └── pedpal_library.json    # Biblioteca JSON generada
├── protocolos/                # PDFs descargados
├── webapp/
│   ├── src/
│   │   ├── App.jsx           # Componente principal
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── ProtocolCard.jsx
│   │   │   └── CategoryFilter.jsx
│   │   └── data/
│   │       └── pedpal_library.json
│   ├── package.json
│   └── vite.config.js
├── docs/
│   └── DEPLOYMENT.md         # Guía de deployment
├── requirements.txt
└── README.md
```

## 🔧 Uso

### Actualizar protocolos
```bash
python scraper/pedpal_scraper.py --update
```

### Búsqueda desde CLI
```bash
python scraper/pedpal_scraper.py --search "dolor neuropático"
```

### Deploy en producción
Ver [DEPLOYMENT.md](docs/DEPLOYMENT.md) para instrucciones detalladas.

## 📊 Categorías de protocolos

- **Ética y Comunicación** (2 protocolos)
- **Manejo del Dolor** (3 protocolos)
- **Síntomas Respiratorios** (4 protocolos)
- **Síntomas Digestivos** (6 protocolos)
- **Síntomas Neurológicos** (5 protocolos)
- **Nutrición y Soporte** (4 protocolos)
- **Cuidados al Final de la Vida** (4 protocolos)
- **Síntomas Cutáneos** (2 protocolos)
- **Urgencias** (2 protocolos)

## 🔍 Ejemplos de búsqueda

La aplicación soporta búsquedas avanzadas:

- Por síntoma: `"disnea"`, `"vómitos"`, `"dolor"`
- Por fármaco: `"morfina"`, `"fentanilo"`, `"midazolam"`
- Por procedimiento: `"traqueostomía"`, `"gastrostomía"`
- Por área: `"neonatal"`, `"urgencias"`, `"nutrición"`

## 🛠️ Tecnologías utilizadas

### Backend
- Python 3.8+
- BeautifulSoup4 - Web scraping
- PyPDF2 - Extracción PDF
- Requests - HTTP client

### Frontend  
- React 18
- Vite - Build tool
- Fuse.js - Búsqueda difusa
- TailwindCSS - Estilos

## 📖 API JSON

Estructura de cada protocolo:

```json
{
  "id": "pedpal_001",
  "titulo": "Bases éticas de la toma de decisiones compartidas",
  "categoria": "Ética y Comunicación",
  "url": "https://pedpal.es/wp-content/uploads/2024/12/...",
  "filename": "bases-eticas-de-la-toma-de-decisiones-compartidas.pdf",
  "num_paginas": 12,
  "palabras_clave": ["decisiones compartidas", "ética", "comunicación"],
  "preview_texto": "BASES ÉTICAS DE LA TOMA DE DECISIONES...",
  "fecha_descarga": "2025-11-12"
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## ⚖️ Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 📧 Contacto

Proyecto: [https://github.com/anavarromingo-cmyk/pedpal-protocols-library](https://github.com/anavarromingo-cmyk/pedpal-protocols-library)

PEDPAL: [https://pedpal.es](https://pedpal.es)

## 🙏 Agradecimientos

- [PEDPAL](https://pedpal.es) por proporcionar acceso público a estos protocolos clínicos
- Comunidad de cuidados paliativos pediátricos en España

---

**Nota**: Este proyecto es una herramienta de consulta. Los protocolos son propiedad intelectual de PEDPAL y sus autores.
