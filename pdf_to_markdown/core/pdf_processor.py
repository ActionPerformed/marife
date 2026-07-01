"""
Main PDF processor - orchestrates the conversion pipeline.
"""

from pathlib import Path
from typing import Any

from core.text_extractor import TextExtractor
from core.table_extractor import TableExtractor
from core.structure_detector import StructureDetector
from utils.markdown_builder import MarkdownBuilder
from utils.sanitizers import sanitize_text


class PDFProcessor:
    """
    Orchestrates the PDF to Markdown conversion process.

    Pipeline:
        1. Extract text and tables from PDF
        2. Detect document structure (headings, lists, etc.)
        3. Build Markdown output
    """

    def __init__(self, logger: Any = None):
        """
        Initialize the PDF processor.

        Args:
            logger: Logger instance for progress messages.
        """
        self.logger = logger
        self.text_extractor = TextExtractor(logger)
        self.table_extractor = TableExtractor(logger)
        self.structure_detector = StructureDetector(logger)
        self.markdown_builder = MarkdownBuilder(logger)

    def process(self, pdf_path: Path, output_path: Path) -> dict[str, Any]:
        """
        Process a PDF file and convert it to Markdown.

        Args:
            pdf_path: Path to input PDF file.
            output_path: Path to output Markdown file.

        Returns:
            Dictionary with 'success' status and 'error' if failed.
        """
        try:
            pdf_path = Path(pdf_path)
            if self.logger:
                self.logger.info(f"Procesando: {pdf_path.name}")

            # Step 1: Extract text with formatting info
            pages = self.text_extractor.extract(pdf_path)

            if self.logger:
                self.logger.info(f"Páginas extraídas: {len(pages)}")

            # Step 2: Extract tables
            tables = self.table_extractor.extract(pdf_path)

            if self.logger:
                self.logger.info(f"Tablas encontradas: {len(tables)}")

            # Step 3: Detect structure (headings, lists, etc.)
            structured_pages = self.structure_detector.process(pages, tables)

            # Step 4: Build Markdown
            markdown_content = self.markdown_builder.build(
                structured_pages,
                tables,
                has_footnotes=any(p.get("has_footnotes", False) for p in pages),
            )

            # Step 5: Sanitize output
            markdown_content = sanitize_text(markdown_content)

            # Step 6: Write output
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(markdown_content, encoding="utf-8")

            return {"success": True, "pages": len(pages), "tables": len(tables)}

        except Exception as e:
            return {"success": False, "error": str(e)}
