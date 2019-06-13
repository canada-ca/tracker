import logging
from logging.handlers import SysLogHandler
import os

# Configure the root logger with handlers
_syslog_handler = SysLogHandler(address=os.environ.get("TRACKER_SYSLOG", "/dev/log"))
_syslog_handler.setLevel(logging.INFO)

_stream_handler = logging.StreamHandler()
_stream_handler.setLevel(logging.INFO)

_stream_formatter = logging.Formatter(
    fmt="%(asctime)s - %(levelname)s - %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
)
_syslog_formatter = logging.Formatter(
    fmt="%(name)s: [%(levelname)s] %(message)s",
)
_syslog_handler.setFormatter(_syslog_formatter)
_stream_handler.setFormatter(_stream_formatter)
logging.getLogger().addHandler(_syslog_handler)
logging.getLogger().addHandler(_stream_handler)


def unwrap_exception_message(exc: BaseException, join: str = " - ") -> str:
    if exc.__context__:
        if exc.args:
            return "{exc}{join}{message}".format(exc=exc, join=join, message=unwrap_exception_message(exc.__context__))
        return "{message}".format(message=unwrap_exception_message(exc.__context__))
    return "{exc}".format(exc=exc)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    return logger
