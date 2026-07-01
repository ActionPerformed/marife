"""
Markdown builder - constructs Markdown output from structured content.
"""

import re
from typing import Any


class MarkdownBuilder:
    """
    Builds Markdown output from structured page data.

    Handles:
    - Headings (H1-H4)
    - Paragraphs
    - Lists (ordered and unordered)
    - Block quotes
    - Code blocks
    - Tables
    - Inline formatting (bold, italic, code)
    """

    FOOTNOTE_NOTICE = "\n\n---\n*Las notas a pie de página de este documento no se han transcrito.*\n"

    def __init__(self, logger: Any = None):
        """
        Initialize the Markdown builder.

        Args:
            logger: Logger instance for progress messages.
        """
        self.logger = logger

    def build(
        self,
        pages: list[dict[str, Any]],
        tables: list[dict[str, Any]],
        has_footnotes: bool = False,
    ) -> str:
        """
        Build complete Markdown document from structured pages.

        Args:
            pages: List of processed page dictionaries.
            tables: List of extracted tables.
            has_footnotes: Whether the document has footnotes.

        Returns:
            Markdown string.
        """
        output_parts = []

        for page in pages:
            page_content = self._build_page(page, tables)
            output_parts.append(page_content)

        # Join all content
        markdown = "\n\n".join(output_parts)

        # Add footnote notice if needed
        if has_footnotes:
            markdown += self.FOOTNOTE_NOTICE

        return markdown

    def _build_page(
        self, page: dict[str, Any], tables: list[dict[str, Any]]
    ) -> str:
        """
        Build Markdown content for a single page.

        Args:
            page: Processed page dictionary.
            tables: All extracted tables.

        Returns:
            Markdown string for the page.
        """
        lines = page.get("lines", [])
        page_tables = page.get("tables", [])

        output_lines = []

        for line in lines:
            line_type = line.get("type")

            if line_type == "empty":
                output_lines.append("")
                continue

            elif line_type == "heading":
                level = line.get("level", 1)
                text = line.get("text", "")
                heading = self._build_heading(level, text, line.get("number"))
                output_lines.append(heading)

            elif line_type == "paragraph":
                text = line.get("text", "")
                output_lines.append(text)

            elif line_type == "list_item":
                marker = line.get("marker", "-")
                text = line.get("text", "")

                # Determine list type
                if marker.isdigit() or marker.endswith("."):
                    output_lines.append(f"{marker} {text}")
                else:
                    output_lines.append(f"- {text}")

            elif line_type == "quote":
                text = line.get("text", "")
                output_lines.append(f"> {text}")

            elif line_type == "code_block_start":
                lang = line.get("language", "")
                output_lines.append(f"```{lang}")

            elif line_type == "code_block_end":
                output_lines.append("```")

            elif line_type == "code":
                text = line.get("text", "")
                output_lines.append(text)

        # Add tables if present
        if page_tables:
            for table in page_tables:
                table_md = self._build_table(table)
                output_lines.append("")
                output_lines.append(table_md)
                output_lines.append("")

        return "\n".join(output_lines)

    def _build_heading(self, level: int, text: str, number: str | None = None) -> str:
        """
        Build a Markdown heading.

        Args:
            level: Heading level (1-4).
            text: Heading text.
            number: Optional section number (1.2.3 style).

        Returns:
            Markdown heading string.
        """
        prefix = "#" * min(level, 6)  # Markdown max is 6

        if number:
            return f"{prefix} {number} {text}"
        return f"{prefix} {text}"

    def _build_table(self, table: dict[str, Any]) -> str:
        """
        Build a Markdown table from table data.

        Handles colspan/rowspan by flattening cells.

        Args:
            table: Table dictionary with headers and rows.

        Returns:
            Markdown table string.
        """
        cells = table.get("cells", [])
        if not cells:
            return ""

        # Pad all rows to same length
        max_cols = max(len(row) for row in cells) if cells else 0

        md_rows = []
        for row in cells:
            # Pad row with empty cells if needed
            padded_row = row + [""] * (max_cols - len(row))
            # Process each cell: replace newlines with spaces, escape pipes
            processed_cells = []
            for cell in padded_row:
                if cell:
                    # Replace newlines and carriage returns with spaces
                    cell_clean = cell.replace("\n", " ").replace("\r", " ")
                    # Collapse multiple spaces into one
                    cell_clean = re.sub(r"\s+", " ", cell_clean).strip()
                    # Escape pipe characters
                    cell_clean = cell_clean.replace("|", "\\|")
                    processed_cells.append(cell_clean)
                else:
                    processed_cells.append("")
            md_rows.append(f"| {' | '.join(processed_cells)} |")

        if not md_rows:
            return ""

        # Header row + separator + data rows
        separator = "| " + " | ".join(["---"] * max_cols) + " |"

        # First row is header
        result = [md_rows[0], separator]
        result.extend(md_rows[1:])

        return "\n".join(result)
