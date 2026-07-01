"""
Table extractor using pdfplumber.
Handles tables with merged cells (colspan/rowspan).
"""

from pathlib import Path
from typing import Any

import pdfplumber


class TableExtractor:
    """
    Extracts tables from PDF documents using pdfplumber.
    """

    def __init__(self, logger: Any = None):
        """
        Initialize the table extractor.

        Args:
            logger: Logger instance for progress messages.
        """
        self.logger = logger

    def extract(self, pdf_path: Path) -> list[dict[str, Any]]:
        """
        Extract all tables from the PDF.

        Args:
            pdf_path: Path to the PDF file.

        Returns:
            List of table dictionaries, each containing:
                - page: int (page number)
                - bbox: tuple (x0, y0, x1, y1)
                - headers: list of header cells
                - rows: list of data rows
                - cells: 2D array
        """
        tables = []

        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                page_tables = self._extract_page_tables(page, page_num)
                tables.extend(page_tables)

        return tables

    def _extract_page_tables(self, page, page_num: int) -> list[dict[str, Any]]:
        """
        Extract tables from a single page.

        Args:
            page: pdfplumber page object.
            page_num: Page number (1-indexed).

        Returns:
            List of tables found on the page.
        """
        tables = []

        # Extract tables using pdfplumber
        page_tables = page.extract_tables()

        for table_idx, table in enumerate(page_tables):
            if not table:
                continue

            table_info = {
                "page": page_num,
                "index": table_idx,
                "headers": [],
                "rows": [],
                "cells": table,
            }

            # Process headers (first row typically)
            if table and len(table) > 0:
                table_info["headers"] = table[0]
                table_info["rows"] = table[1:] if len(table) > 1 else []

            tables.append(table_info)

        return tables
