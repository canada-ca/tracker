import logging


def unwrap_exception_message(exc: BaseException, join: str = " - ") -> str:
    if exc.__context__:
        if exc.args:
            return "{exc}{join}{message}".format(exc=exc, join=join, message=unwrap_exception_message(exc.__context__))
        return "{message}".format(message=unwrap_exception_message(exc.__context__))
    return "{exc}".format(exc=exc)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.hasHandlers():
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(levelname)s - %(name)s: %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S%z",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger
