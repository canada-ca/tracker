import logging

import pytest

from logging_setup import configure_logging


@pytest.fixture
def restore_root_logger():
    root = logging.getLogger()
    handlers, level = root.handlers[:], root.level
    root.handlers.clear()
    yield
    root.handlers[:] = handlers
    root.setLevel(level)


def test_splits_info_to_stdout_and_warning_to_stderr(capsys, restore_root_logger):
    configure_logging(logging.DEBUG)
    log = logging.getLogger("split-test")
    log.info("an-info")
    log.warning("a-warning")
    out, err = capsys.readouterr()
    assert "an-info" in out and "a-warning" not in out
    assert "a-warning" in err and "an-info" not in err
