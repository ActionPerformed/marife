#!/usr/bin/env python3
"""
PDF to Markdown Converter
Converts PDF files to Markdown format while preserving structure and formatting.
"""

import sys
from pathlib import Path

import click

from core.pdf_processor import PDFProcessor
from utils.logger import setup_logger


@click.command()
@click.argument("pdf_path", type=click.Path(exists=True), required=False)
@click.option(
    "--output",
    "-o",
    type=click.Path(),
    help="Output Markdown file path. Defaults to input name with .md extension.",
)
@click.option(
    "--verbose",
    "-v",
    is_flag=True,
    default=False,
    help="Show detailed progress information.",
)
@click.option(
    "--batch",
    "-b",
    "batch_pattern",
    type=str,
    default=None,
    help="Glob pattern for batch processing multiple PDFs.",
)
@click.option(
    "--output-dir",
    "-d",
    type=click.Path(),
    default="./output",
    help="Output directory for batch processing.",
)
def main(pdf_path, output, verbose, batch_pattern, output_dir):
    """
    PDF to Markdown Converter

    Convert PDF files to Markdown format preserving:
    - Hierarchical structure (H1-H4)
    - Tables with merged cells
    - Text formatting (bold, italic, code)
    - Lists and quotes
    """
    logger = setup_logger(verbose=verbose)

    # Handle batch mode
    if batch_pattern:
        _process_batch(batch_pattern, output_dir, logger)
        return

    # Single file mode
    if not pdf_path:
        click.echo("Error: PDF path is required. Use --help for usage information.")
        sys.exit(1)

    _process_single(pdf_path, output, logger)


def _process_single(pdf_path: str, output: str | None, logger) -> None:
    """Process a single PDF file."""
    pdf_path = Path(pdf_path)

    if output is None:
        output = pdf_path.with_suffix(".md")

    try:
        processor = PDFProcessor(logger=logger)
        result = processor.process(pdf_path, output)

        if result["success"]:
            logger.info(f"✓ Conversión completada: {output}")
        else:
            logger.error(f"✗ Error: {result['error']}")
            sys.exit(1)

    except Exception as e:
        logger.error(f"✗ Error inesperado: {e}")
        sys.exit(1)


def _process_batch(pattern: str, output_dir: str, logger) -> None:
    """Process multiple PDF files matching a glob pattern."""
    from tqdm import tqdm

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    pdf_files = list(Path(".").glob(pattern))

    if not pdf_files:
        logger.warning(f"No se encontraron archivos para el patrón: {pattern}")
        return

    logger.info(f"Procesando {len(pdf_files)} archivos...")

    for pdf_file in tqdm(pdf_files, desc="Convirtiendo PDFs"):
        output_file = output_path / pdf_file.with_suffix(".md").name

        try:
            processor = PDFProcessor(logger=logger)
            result = processor.process(pdf_file, output_file)

            if result["success"]:
                logger.info(f"✓ {pdf_file.name} → {output_file.name}")
            else:
                logger.error(f"✗ {pdf_file.name}: {result['error']}")

        except Exception as e:
            logger.error(f"✗ {pdf_file.name}: Error inesperado: {e}")

    logger.info(f"Procesamiento por lote completado. Resultados en: {output_dir}")


if __name__ == "__main__":
    main()
