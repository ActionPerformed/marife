"""
Structure detector for identifying headings, lists, and other elements.
"""

import re
from typing import Any


class StructureDetector:
    """
    Detects document structure elements like headings, lists, and quotes.

    Analyzes text patterns to classify content into:
    - Headings (H1-H4)
    - Paragraphs
    - List items
    - Block quotes
    - Code blocks
    """

    # Patterns for detecting structure elements
    HEADING_PATTERNS = [
        # Numbered sections: 1., 1.1, 1.1.1, etc.
        re.compile(r"^(#{1,4})\s+(?:\d+\.)?\s*(.+)"),
        # Standalone numbers followed by text (potential heading)
        re.compile(r"^(\d+(?:\.\d+)*)\s+(?![\d•\-\*])(.+)"),
    ]

    # List patterns
    LIST_PATTERN = re.compile(r"^[\s]*([\-\*\•]|\d+\.)\s+(.+)")
    NUMBERED_LIST_PATTERN = re.compile(r"^[\s]*(\d+)\.\s+(.+)")

    # Quote pattern
    QUOTE_PATTERN = re.compile(r"^[\s]*>\s*(.+)")

    # Code block pattern
    CODE_BLOCK_PATTERN = re.compile(r"^```(\w*)$")

    # Footnote reference pattern
    FOOTNOTE_REF_PATTERN = re.compile(r"\[(\d+)\]")

    def __init__(self, logger: Any = None):
        """
        Initialize the structure detector.

        Args:
            logger: Logger instance for progress messages.
        """
        self.logger = logger

    def process(
        self, pages: list[dict[str, Any]], tables: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """
        Process extracted pages and detect structure.

        Args:
            pages: List of page dictionaries from TextExtractor.
            tables: List of table dictionaries from TableExtractor.

        Returns:
            List of processed pages with structure information.
        """
        processed_pages = []

        for page in pages:
            processed_page = self._process_page(page, tables)
            processed_pages.append(processed_page)

        return processed_pages

    def _process_page(
        self, page: dict[str, Any], tables: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """
        Process a single page and detect its structure.

        Args:
            page: Page dictionary with text and chars.
            tables: List of all tables in the document.

        Returns:
            Page with structured content.
        """
        text = page.get("text", "")
        lines = text.split("\n")

        structured_lines = []
        in_code_block = False
        code_block_lang = ""

        # Check if page has a table
        page_tables = [
            t for t in tables if t.get("page") == page.get("page_number")
        ]

        for line in lines:
            processed_line = self._classify_line(
                line, in_code_block, code_block_lang
            )

            if processed_line.get("type") == "code_block_start":
                in_code_block = True
                code_block_lang = processed_line.get("language", "")
            elif processed_line.get("type") == "code_block_end":
                in_code_block = False
                code_block_lang = ""

            # Skip footnote references
            if processed_line.get("is_footnote_ref"):
                continue

            structured_lines.append(processed_line)

        return {
            "page_number": page["page_number"],
            "lines": structured_lines,
            "has_footnotes": page.get("has_footnotes", False),
            "has_tables": len(page_tables) > 0,
            "tables": page_tables,
        }

    def _classify_line(
        self, line: str, in_code_block: bool, code_lang: str
    ) -> dict[str, Any]:
        """
        Classify a single line of text.

        Args:
            line: The text line to classify.
            in_code_block: Whether we're inside a code block.
            code_lang: Language of current code block.

        Returns:
            Dictionary with type and processed content.
        """
        stripped = line.strip()

        # Empty line
        if not stripped:
            return {"type": "empty", "text": "", "original": line}

        # Code block handling
        if not in_code_block:
            code_match = self.CODE_BLOCK_PATTERN.match(stripped)
            if code_match:
                return {
                    "type": "code_block_start",
                    "language": code_match.group(1),
                    "text": "",
                    "original": line,
                }
        else:
            if stripped == "```":
                return {"type": "code_block_end", "text": "", "original": line}
            return {"type": "code", "text": stripped, "language": code_lang, "original": line}

        # Quote
        quote_match = self.QUOTE_PATTERN.match(stripped)
        if quote_match:
            return {
                "type": "quote",
                "text": quote_match.group(1),
                "original": line,
            }

        # Heading detection
        heading = self._detect_heading(stripped)
        if heading:
            return heading

        # List detection
        list_match = self.LIST_PATTERN.match(stripped)
        if list_match:
            return {
                "type": "list_item",
                "marker": list_match.group(1),
                "text": list_match.group(2),
                "original": line,
            }

        # Footnote reference check
        is_footnote_ref = bool(self.FOOTNOTE_REF_PATTERN.search(stripped))

        # Default: paragraph
        return {
            "type": "paragraph",
            "text": stripped,
            "is_footnote_ref": is_footnote_ref,
            "original": line,
        }

    def _detect_heading(self, line: str) -> dict[str, Any] | None:
        """
        Detect if a line is a heading.

        Args:
            line: The line to check.

        Returns:
            Heading dictionary or None.
        """
        # Check for markdown heading (# heading)
        for pattern in self.HEADING_PATTERNS:
            match = pattern.match(line)
            if match:
                # Count # for heading level
                if match.group(1).startswith("#"):
                    hashes = len(match.group(1))
                    return {
                        "type": "heading",
                        "level": hashes,
                        "text": match.group(2).strip() if len(match.groups()) > 1 else match.group(1).strip(),
                        "original": line,
                    }
                else:
                    # Numbered heading (1.2.3 style)
                    number = match.group(1)
                    text = match.group(2)
                    level = self._calculate_heading_level(number)
                    return {
                        "type": "heading",
                        "level": level,
                        "text": text.strip(),
                        "number": number,
                        "original": line,
                    }

        # Check for ALL CAPS lines that might be headings
        if self._is_likely_heading(line):
            return {
                "type": "heading",
                "level": 1,
                "text": line,
                "original": line,
            }

        return None

    def _calculate_heading_level(self, number: str) -> int:
        """
        Calculate heading level based on numbering.

        Args:
            number: Number string like "1", "1.2", "1.2.3".

        Returns:
            Heading level (1-4).
        """
        dots = number.count(".")
        return min(dots + 1, 4)

    def _is_likely_heading(self, line: str) -> bool:
        """
        Heuristic to detect ALL CAPS headings without explicit markers.

        Args:
            line: The line to check.

        Returns:
            True if likely a heading.
        """
        # Must be short to be a heading
        if len(line) > 100 or len(line) < 3:
            return False

        # All uppercase letters (allowing spaces and punctuation)
        if re.match(r"^[A-Z\s\d\.\,\:\;\-]+$", line):
            # Check it's not too long for a heading
            words = line.split()
            if len(words) <= 10:
                return True

        return False
