"""
Validators for checking Markdown output quality.
"""

import re


def validate_markdown(markdown: str) -> dict[str, any]:
    """
    Validate Markdown output for common issues.

    Checks:
    - Balanced heading tags
    - Balanced code blocks
    - Balanced table syntax
    - No orphan closing markers

    Args:
        markdown: Markdown text to validate.

    Returns:
        Dictionary with:
        - valid: bool
        - errors: list of error messages
        - warnings: list of warning messages
    """
    errors = []
    warnings = []

    # Check for balanced code blocks
    code_blocks = re.findall(r"```(\w*)", markdown)
    code_ends = markdown.count("```")

    if code_blocks and code_ends != len(code_blocks) * 2:
        # Rough check: if we have starts, we need same number of ends
        # Account for multiline count
        actual_blocks = len(re.findall(r"```", markdown)) // 2
        if len(code_blocks) != actual_blocks:
            warnings.append("Código puede tener bloques no cerrados")

    # Check for balanced table cells
    table_lines = [l for l in markdown.split("\n") if l.strip().startswith("|")]
    for line in table_lines:
        cells = line.strip().split("|")
        # Skip separator rows (contain only ---)
        if all(c.strip().startswith("-") for c in cells if c.strip()):
            continue

        # Check for empty cells at start/end (artifact)
        if cells[0].strip() == "" and len(cells) > 2:
            warnings.append(f"Posible celda vacía al inicio: {line[:50]}")

    # Check for orphan heading markers
    headings = re.findall(r"^#{1,6}\s", markdown, re.MULTILINE)
    if headings:
        # Each heading should have text after
        lines = markdown.split("\n")
        for i, line in enumerate(lines):
            if re.match(r"^#{1,6}\s*$", line.strip()):
                warnings.append(f"Encabezado sin texto en línea {i + 1}")

    # Check for very long lines (can cause rendering issues)
    for i, line in enumerate(lines):
        if len(line) > 10000:
            warnings.append(f"Línea muy larga en línea {i + 1} ({len(line)} chars)")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }
