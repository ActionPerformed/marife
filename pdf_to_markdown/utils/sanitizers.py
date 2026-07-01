"""
Text sanitizers for cleaning up extracted content.
"""

import re
import unicodedata


def sanitize_text(text: str) -> str:
    """
    Sanitize text for Markdown output.

    Operations:
    - Remove unnecessary line breaks within paragraphs
    - Normalize Unicode characters
    - Reduce multiple spaces to one
    - Limit consecutive empty lines to 2
    - Fix common PDF extraction artifacts

    Args:
        text: Raw text from PDF extraction.

    Returns:
        Sanitized text.
    """
    # Normalize Unicode
    text = normalize_unicode(text)

    # Fix common PDF extraction issues
    text = fix_pdf_artifacts(text)

    # Remove unnecessary line breaks within paragraphs
    text = join_broken_lines(text)

    # Normalize spaces
    text = normalize_spaces(text)

    # Limit empty lines
    text = limit_empty_lines(text)

    return text


def normalize_unicode(text: str) -> str:
    """
    Normalize Unicode characters.

    Replaces fancy quotes with standard ones,
    fixes accented characters, etc.

    Args:
        text: Input text.

    Returns:
        Normalized text.
    """
    # Normalize to NFC form
    text = unicodedata.normalize("NFC", text)

    # Replace fancy quotes with standard
    replacements = {
        "“": '"',  # "
        "”": '"',  # "
        "‘": "'",  # '
        "’": "'",  # '
        "–": "-",  # –
        "—": "--", # —
        " ": " ",  # Non-breaking space
        "­": "",   # Soft hyphen
        "﻿": "",   # BOM
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    return text


def fix_pdf_artifacts(text: str) -> str:
    """
    Fix common artifacts from PDF text extraction.

    Args:
        text: Input text.

    Returns:
        Fixed text.
    """
    # Fix hyphenation at end of lines (word-)
    text = re.sub(r"-\n(\w)", r"\1", text)

    # Fix isolated single characters on lines (extraction artifact)
    # Only if they're clearly artifacts (short words at line ends)
    lines = text.split("\n")
    fixed_lines = []

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Skip short lines that look like artifacts
        if len(stripped) == 1 and stripped.isalpha() and not any(
            c in stripped for c in "ai"
        ):
            # Check if previous line doesn't end with punctuation
            if i > 0:
                prev_stripped = lines[i - 1].strip()
                if prev_stripped and prev_stripped[-1] not in ".!?:;":
                    fixed_lines.append("")
                    continue

        fixed_lines.append(line)

    text = "\n".join(fixed_lines)

    return text


def join_broken_lines(text: str) -> str:
    """
    Join lines that are broken within paragraphs.

    Heuristic: if a line doesn't end with punctuation and the next
    line starts with lowercase, join them.

    Args:
        text: Input text.

    Returns:
        Text with joined lines.
    """
    lines = text.split("\n")
    joined_lines = []
    buffer = ""

    for line in lines:
        stripped = line.strip()

        # Empty line - paragraph break
        if not stripped:
            if buffer:
                joined_lines.append(buffer)
                buffer = ""
            joined_lines.append("")
            continue

        # Check if this line should be joined with buffer
        if buffer:
            # Line ends with hyphen or soft hyphen
            if buffer.rstrip().endswith(("-", "­")):
                buffer = buffer.rstrip()[:-1] + stripped
                continue

            # Line doesn't start with capital and previous doesn't end with punctuation
            if (
                stripped
                and stripped[0].islower()
                and buffer
                and buffer[-1] not in ".!?:;"
            ):
                buffer = buffer + " " + stripped
                continue

            # Otherwise, save buffer and start new
            joined_lines.append(buffer)
            buffer = stripped
        else:
            buffer = stripped

    # Don't forget last buffer
    if buffer:
        joined_lines.append(buffer)

    return "\n".join(joined_lines)


def normalize_spaces(text: str) -> str:
    """
    Normalize multiple spaces to single space.

    Args:
        text: Input text.

    Returns:
        Normalized text.
    """
    # Multiple spaces to single space
    text = re.sub(r"[ \t]+", " ", text)

    # Multiple spaces before/after newlines
    text = re.sub(r" *\n *", "\n", text)

    return text


def limit_empty_lines(text: str) -> str:
    """
    Limit consecutive empty lines to maximum of 2.

    Args:
        text: Input text.

    Returns:
        Text with limited empty lines.
    """
    # Replace 3+ newlines with 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()
