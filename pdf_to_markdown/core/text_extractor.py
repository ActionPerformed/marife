"""
Text extractor using pdfplumber.
Extracts text with formatting information (bold, italic, etc.).
"""

import re
from pathlib import Path
from typing import Any

import pdfplumber


class TextExtractor:
    """
    Extracts text content and formatting from PDF pages.

    Uses pdfplumber for text extraction with font analysis
    to detect bold, italic, and other formatting.
    """

    def __init__(self, logger: Any = None):
        """
        Initialize the text extractor.

        Args:
            logger: Logger instance for progress messages.
        """
        self.logger = logger

    def extract(self, pdf_path: Path) -> list[dict[str, Any]]:
        """
        Extract text from all pages of a PDF.

        Args:
            pdf_path: Path to the PDF file.

        Returns:
            List of page dictionaries, each containing:
                - page_number: int
                - text: str (raw text)
                - chars: list of character info for formatting detection
                - has_footnotes: bool
                - formatted_text: list of formatted text spans
        """
        pages = []

        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                chars = page.chars or []
                raw_text = page.extract_text() or ""
                formatted_text = self._extract_formatted_text(chars)

                page_info = {
                    "page_number": i + 1,
                    "text": raw_text,
                    "chars": chars,
                    "words": page.extract_words() or [],
                    "has_footnotes": self._detect_footnotes(raw_text),
                    "formatted_text": formatted_text,
                }

                pages.append(page_info)

        return pages

    def _extract_formatted_text(self, chars: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """
        Extract text with formatting information from characters.

        Analyzes font names to detect bold, italic, etc.

        Args:
            chars: List of character dictionaries from pdfplumber.

        Returns:
            List of text spans with formatting info.
        """
        if not chars:
            return []

        formatted_spans = []
        current_span = None
        current_text = []

        for char in chars:
            fontname = char.get("fontname", "")
            text = char.get("text", "")

            # Determine formatting
            formatting = self._get_formatting(fontname)

            # Start new span if formatting changed
            if current_span is None or formatting != current_span["formatting"]:
                if current_span and current_text:
                    current_span["text"] = "".join(current_text)
                    formatted_spans.append(current_span)

                current_span = {
                    "text": "",
                    "formatting": formatting,
                    "bbox": char.get("bbox"),
                }
                current_text = [text]
            else:
                current_text.append(text)

        # Don't forget last span
        if current_span and current_text:
            current_span["text"] = "".join(current_text)
            formatted_spans.append(current_span)

        return formatted_spans

    @staticmethod
    def _get_formatting(fontname: str) -> dict[str, bool]:
        """
        Determine formatting from font name.

        Args:
            fontname: The font name string from pdfplumber.

        Returns:
            Dictionary with bold, italic, etc.
        """
        font_upper = fontname.upper()

        return {
            "bold": "BOLD" in font_upper or "HEAVY" in font_upper,
            "italic": "ITALIC" in font_upper or "OBLIQUE" in font_upper,
            "bold_italic": ("BOLD" in font_upper and "ITALIC" in font_upper)
                           or ("HEAVY" in font_upper and "ITALIC" in font_upper),
            "monospace": "MONO" in font_upper or "CODE" in font_upper or "COURIER" in font_upper,
            "small_caps": "SMALLCAPS" in font_upper or "CAPS" in font_upper,
        }

    @staticmethod
    def _detect_footnotes(text: str) -> bool:
        """
        Detect if text contains footnotes.

        Looks for text preceded by footnote markers.

        Args:
            text: Page text to analyze.

        Returns:
            True if footnotes detected.
        """
        footnote_indicators = [
            "*", "†", "‡", "§", "¶",  # Symbolic markers
            "n.", "note", "footnote",
        ]

        lines = text.split("\n")

        # Check last few lines for small text (footnotes typically at bottom)
        for line in lines[-5:]:
            line_lower = line.lower().strip()
            for indicator in footnote_indicators:
                if line_lower.startswith(indicator) or line_lower.startswith(f"{indicator} "):
                    return True

        return False
