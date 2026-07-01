#!/usr/bin/env python3
"""
Batch processor for PDF to Markdown conversion.
Processes all PDFs in input directory and generates a report.
"""

import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from core.pdf_processor import PDFProcessor
from utils.logger import setup_logger


def process_all_pdfs(input_dir: Path, output_dir: Path, report_path: Path) -> None:
    """
    Process all PDFs in input directory recursively.

    Args:
        input_dir: Input directory containing PDFs
        output_dir: Output directory for MD files
        report_path: Path to write the report
    """
    logger = setup_logger(verbose=True)

    # Find all PDFs
    pdf_files = list(input_dir.rglob("*.pdf"))
    total = len(pdf_files)

    logger.info(f"Encontrados {total} archivos PDF")

    results = {
        "success": [],
        "failed": [],
    }

    for i, pdf_path in enumerate(pdf_files, 1):
        # Calculate relative path to maintain folder structure
        rel_path = pdf_path.relative_to(input_dir)
        output_path = output_dir / rel_path.with_suffix(".md")

        logger.info(f"[{i}/{total}] Procesando: {rel_path}")

        try:
            processor = PDFProcessor(logger=logger)
            result = processor.process(pdf_path, output_path)

            if result["success"]:
                results["success"].append({
                    "path": str(rel_path),
                    "pages": result.get("pages", 0),
                    "tables": result.get("tables", 0),
                })
                logger.info(f"[OK] {rel_path} -> {output_path.name}")
            else:
                results["failed"].append({
                    "path": str(rel_path),
                    "error": result.get("error", "Unknown error"),
                })
                logger.error(f"[FAIL] {rel_path}: {result.get('error')}")

        except Exception as e:
            results["failed"].append({
                "path": str(rel_path),
                "error": str(e),
            })
            logger.error(f"[ERROR] {rel_path}: {e}")

    # Generate report
    generate_report(results, report_path)

    # Summary
    logger.info("")
    logger.info("=" * 60)
    logger.info(f"PROCESAMIENTO COMPLETADO")
    logger.info(f"Éxitos: {len(results['success'])}/{total}")
    logger.info(f"Fallidos: {len(results['failed'])}/{total}")
    logger.info(f"Reporte: {report_path}")
    logger.info("=" * 60)


def generate_report(results: dict, report_path: Path) -> None:
    """
    Generate markdown report of processing results.

    Args:
        results: Dictionary with success and failed lists
        report_path: Path to write the report
    """
    lines = [
        "# Reporte de Conversión PDF -> Markdown",
        "",
        f"**Fecha:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        f"**Total procesados:** {len(results['success']) + len(results['failed'])}",
        f"**Exitosos:** {len(results['success'])}",
        f"**Fallidos:** {len(results['failed'])}",
        "",
        "---",
        "",
    ]

    if results["success"]:
        lines.append("## Archivos Procesados Exitosamente")
        lines.append("")
        lines.append("| Archivo | Páginas | Tablas |")
        lines.append("|---------|---------|--------|")
        for item in sorted(results["success"], key=lambda x: x["path"]):
            lines.append(f"| {item['path']} | {item['pages']} | {item['tables']} |")
        lines.append("")

    if results["failed"]:
        lines.append("## Archivos con Errores")
        lines.append("")
        lines.append("| Archivo | Error |")
        lines.append("|---------|-------|")
        for item in sorted(results["failed"], key=lambda x: x["path"]):
            error = item["error"][:80] + "..." if len(item["error"]) > 80 else item["error"]
            lines.append(f"| {item['path']} | {error} |")
        lines.append("")

    report_path.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    base_dir = Path(__file__).parent
    input_dir = base_dir / "examples" / "input"
    output_dir = base_dir / "examples" / "output"
    report_path = output_dir / "output.md"

    process_all_pdfs(input_dir, output_dir, report_path)
