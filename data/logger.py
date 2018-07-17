import logging
from logging.handlers import SysLogHandler
import threading
import os

# Configure the root logger with handlers
_syslog_handler = SysLogHandler(address=os.environ.get("TRACKER_SYSLOG", "/dev/log"))
_syslog_handler.setLevel(logging.ERROR)

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

# https://codereview.stackexchange.com/questions/6567/redirecting-subprocesses-output-stdout-and-stderr-to-the-logging-module
# To redirect stderr & stdout from subprocess calls into a logger
class LogPipe(threading.Thread):

    def __init__(self, logger, level):
        """Setup the object with a logger and a loglevel
        and start the thread
        """
        super(LogPipe, self).__init__()
        self.daemon = False
        self.logger = logger
        self.level = level
        self.fd_read, self.fd_write = os.pipe()
        self.pipe_reader = os.fdopen(self.fd_read, encoding='utf-8', errors='ignore')
        self.start()

    def fileno(self):
        """Return the write file descriptor of the pipe
        """
        return self.fd_write

    def run(self):
        """Run the thread, logging everything.
        """
        for line in iter(self.pipe_reader.readline, ''):
            self.logger.log(self.level, line.strip('\n'))

        self.pipe_reader.close()

    def close(self):
        """Close the write end of the pipe.
        """
        os.close(self.fd_write)


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
