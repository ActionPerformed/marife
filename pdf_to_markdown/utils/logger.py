"""
Logger utility for PDF to Markdown Converter.
Provides colored console output with different log levels.
"""

import logging
import sys
from pathlib import Path

from colorama import init

init(autoreset=True)


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for console output."""

    COLORS = {
        "DEBUG": "\033[36m",    # Cyan
        "INFO": "\033[32m",     # Green
        "WARNING": "\033[33m", # Yellow
        "ERROR": "\033[31m",    # Red
        "CRITICAL": "\033[35m", # Magenta
    }
    RESET = "\033[0m"
    # Use ASCII symbols for cross-platform compatibility
    LEVEL_SYMBOLS = {
        "INFO": "[OK]",
        "WARNING": "[WARN]",
        "ERROR": "[ERR]",
        "DEBUG": "[DBG]",
        "CRITICAL": "[CRIT]",
    }

    def format(self, record):
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = (
                f"{self.COLORS[levelname]}{self.LEVEL_SYMBOLS.get(levelname, levelname)}{self.RESET}"
            )
        return super().format(record)


def setup_logger(verbose: bool = False, log_file: Path | None = None) -> logging.Logger:
    """
    Configure and return a logger instance.

    Args:
        verbose: If True, set log level to DEBUG. Otherwise INFO.
        log_file: Optional path to write log file.

    Returns:
        Configured logger instance.
    """
    logger = logging.getLogger("pdf2md")

    # Determine log level
    level = logging.DEBUG if verbose else logging.INFO
    logger.setLevel(level)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)

    console_format = ColoredFormatter(
        fmt="%(levelname)s: %(message)s",
    )
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)

    # Force UTF-8 encoding for console
    try:
        console_handler.stream.reconfigure(encoding="utf-8")
    except Exception:
        pass  # Older Python versions may not support this

    # File handler (optional)
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_format = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)

    return logger
