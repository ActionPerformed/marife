# PDF to Markdown Converter

Convierte archivos PDF a Markdown preservando la estructura jerárquica, tablas complejas y elementos de formato.

---

## Introducción

Esta aplicación surge de la necesidad de procesar documentos PDF para su uso con inteligencia artificial, particularmente con herramientas como NotebookLM.

**¿Por qué convertir PDF a Markdown?**

- **Reducción de tamaño**: Un documento Markdown ocupa significativamente menos espacio que su equivalente en PDF
- **Facilidad de procesamiento por IAs**: Las IAs procesan texto plano de forma más eficiente y precisa que PDFs
- **Preservación de estructura**: Se mantiene la jerarquía de títulos, tablas y listas
- **Portabilidad**: El formato Markdown es universal y editable en cualquier editor de texto

---

## Características

- ✅ Extracción de texto con estructura jerárquica (H1-H4)
- ✅ Numeración de secciones preservada (1., 1.1., 1.1.1., etc.)
- ✅ Tablas complejas con celdas fusionadas
- ✅ Listas numeradas y con viñetas
- ✅ Bloques de cita (>)
- ✅ Bloques de código
- ✅ Notas al pie suprimidas (con aviso en el documento)
- ✅ Saltos de línea en celdas de tabla corregidos
- ✅ CLI intuitiva con modo batch
- ✅ Logging con colores para seguimiento del proceso

---

## Limitaciones

Esta aplicación fue diseñada para un caso de uso específico y tiene las siguientes limitaciones:

- **PDFs de una columna**: No procesa correctamente documentos con múltiples columnas
- **Encabezados y pies de página**: No elimina automáticamente textos repetidos de encabezado/pie (como "BOLETÍN OFICIAL DEL ESTADO - Pág. X")
- **Preservación de formato de texto**: No detecta ni preserva negritas, cursivas ni código inline basándose en análisis de fuentes
- **Imágenes**: Se ignoran, no se extraen
- **OCR**: No disponible - el PDF debe contener texto seleccionable

---

## Estructura del Proyecto

```
pdf_to_markdown/
├── main.py                  # Punto de entrada CLI
├── batch_process.py         # Script para procesamiento en lote
├── requirements.txt         # Dependencias de Python
├── README.md               # Este archivo
├── SPEC.md                 # Especificación técnica del proyecto
│
├── core/                   # Módulos principales
│   ├── pdf_processor.py    # Orquestador del proceso de conversión
│   ├── text_extractor.py    # Extracción de texto con pdfplumber
│   ├── table_extractor.py   # Extracción de tablas
│   └── structure_detector.py # Detección de títulos y estructura
│
├── utils/                  # Utilidades
│   ├── markdown_builder.py  # Construcción del Markdown final
│   ├── sanitizers.py       # Limpieza de texto extraído
│   ├── logger.py           # Sistema de logging con colores
│   └── validators.py        # Validación del Markdown generado
│
└── tests/
    └── test_basic.py       # Tests básicos del conversor
```

---

## Requisitos

### Dependencias de Python

```
pdfplumber>=0.10.0
click>=8.1.0
markdown>=3.5.0
python-dotenv>=1.0.0
colorama>=0.4.6
tqdm>=4.65.0
```

### Dependencias del sistema

La biblioteca `pdfplumber` requiere **poppler-utils** para funcionar:

| Sistema | Comando de instalación |
|---------|----------------------|
| **Ubuntu/Debian** | `sudo apt-get update && sudo apt-get install -y poppler-utils` |
| **macOS** | `brew install poppler` |
| **Windows** | Descargar desde [github.com/oschwartz10612/poppler-windows/releases](https://github.com/oschwartz10612/poppler-windows/releases/) |

---

## Instalación

### 1. Clonar o descargar el proyecto

```bash
git clone <repositorio>
cd pdf_to_markdown
```

### 2. Crear un entorno virtual (recomendado)

```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Instalar poppler (según tu sistema operativo)

Ver la sección de [dependencias del sistema](#requisitos) más arriba.

---

## Uso

### Conversión básica

```bash
python main.py documento.pdf
```

El archivo Markdown se generará con el mismo nombre en el directorio actual.

### Especificar archivo de salida

```bash
python main.py documento.pdf --output resultado.md
```

###Modo verbose (mostrar progreso)

```bash
python main.py documento.pdf --verbose
```

### Procesamiento en lote

Procesar todos los PDFs de un directorio:

```bash
python batch_process.py
```

Por defecto procesa los archivos en `examples/input/` y genera el reporte en `examples/output/output.md`.

---

## Procesamiento por Lote

El script `batch_process.py` procesa recursively todos los archivos PDF de un directorio y genera un reporte en Markdown con los resultados.

### Ejemplo de reporte generado

```markdown
# Reporte de Conversión PDF -> Markdown

**Fecha:** 2026-06-29 20:40:04

**Total procesados:** 31
**Exitosos:** 31
**Fallidos:** 0

---

## Archivos Procesados Exitosamente

| Archivo | Páginas | Tablas |
|---------|---------|--------|
| Test.pdf | 65 | 2 |
| ...
```

---

## Rendimiento

- **Tiempo de procesamiento**: < 30 segundos para PDFs de 50 páginas
- **Memoria**: < 512 MB RAM para documentos grandes
- **Escalabilidad**: Puede procesar 20-25 PDFs en lote

---

## Limitaciones Conocidas

- Tablas extremadamente complejas pueden requerir ajuste manual
- El texto superpuesto a imágenes puede no extraerse correctamente
- PDFs con fuentes muy personalizadas pueden perder algo de formato
- Celdas de tabla con contenido muy extenso pueden no renderizarse perfectamente en Markdown

---

## Troubleshooting

### Error: "pdfplumber no encuentra archivos"

Asegúrate de tener poppler-utils instalado en tu sistema. Ver la sección de [dependencias del sistema](#requisitos).

### Error: "Permission denied" al escribir

Asegúrate de tener permisos de escritura en el directorio de salida.

### PDF muy grande tarda mucho

El procesamiento de documentos grandes (>100 páginas) puede tardar varios minutos. Es normal.

---

## Licencia

Este proyecto está licenciado bajo los términos de la **GNU General Public License v3.0 (GPL-3.0)**.

Consulta el archivo [LICENSE](LICENSE) para más información.

---

## Autor

**ActionPerformed**
