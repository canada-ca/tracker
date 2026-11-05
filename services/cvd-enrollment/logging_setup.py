"""Logging configuration: DEBUG/INFO to stdout, WARNING and above to stderr."""

import logging
import sys


def configure_logging(level: int) -> None:
    """Install stdout/stderr handlers on the root logger at `level`."""
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(logging.DEBUG)
    stdout_handler.addFilter(lambda record: record.levelno <= logging.INFO)
    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setLevel(logging.WARNING)

    logging.basicConfig(
        level=level,
        format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s",
        handlers=[stdout_handler, stderr_handler],
        force=True,
    )
