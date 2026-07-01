"""
Basic tests for PDF to Markdown converter.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.structure_detector import StructureDetector
from utils.markdown_builder import MarkdownBuilder
from utils.sanitizers import sanitize_text


def test_sanitizers():
    """Test text sanitization functions."""
    print("Testing sanitizers...")

    # Test join broken lines (hyphen removed as it's a line-break marker)
    text = "This is a broken-\nline that should be joined"
    result = sanitize_text(text)
    assert "brokenline" in result, "Broken line should be joined"
    print("  [OK] Join broken lines")

    # Test limit empty lines
    text = "Line 1\n\n\n\n\nLine 2"
    result = sanitize_text(text)
    assert result.count("\n\n") <= 2, "Too many empty lines"
    print("  [OK] Limit empty lines")

    print("All sanitizer tests passed!")


def test_structure_detector():
    """Test structure detection."""
    print("\nTesting structure detector...")

    detector = StructureDetector()

    # Test heading detection
    result = detector._detect_heading("# Introduction")
    assert result is not None
    assert result["type"] == "heading"
    assert result["level"] == 1
    print("  [OK] Markdown heading detection")

    # Test numbered heading
    result = detector._detect_heading("1.2.3 Subsection")
    assert result is not None
    assert result["level"] == 3
    print("  [OK] Numbered heading detection")

    # Test list detection
    result = detector._classify_line("- Item 1", False, "")
    assert result["type"] == "list_item"
    print("  [OK] List item detection")

    # Test quote detection
    result = detector._classify_line("> This is a quote", False, "")
    assert result["type"] == "quote"
    print("  [OK] Quote detection")

    print("All structure detector tests passed!")


def test_markdown_builder():
    """Test Markdown building."""
    print("\nTesting markdown builder...")

    builder = MarkdownBuilder()

    # Test heading building
    result = builder._build_heading(2, "My Heading")
    assert result == "## My Heading", f"Got: {result}"
    print("  [OK] Heading building")

    # Test numbered heading
    result = builder._build_heading(2, "My Heading", "1.2")
    assert result == "## 1.2 My Heading", f"Got: {result}"
    print("  [OK] Numbered heading building")

    # Test table building
    table = {
        "cells": [
            ["Header 1", "Header 2"],
            ["Cell 1", "Cell 2"],
        ]
    }
    result = builder._build_table(table)
    assert "| Header 1 |" in result
    assert "| --- | --- |" in result
    assert "| Cell 1 |" in result
    print("  [OK] Table building")

    print("All markdown builder tests passed!")


if __name__ == "__main__":
    print("=" * 50)
    print("Running PDF to Markdown Converter Tests")
    print("=" * 50)

    test_sanitizers()
    test_structure_detector()
    test_markdown_builder()

    print("\n" + "=" * 50)
    print("All tests passed!")
    print("=" * 50)
