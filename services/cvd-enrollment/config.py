"""Runtime configuration for the CVD enrollment service."""

import logging
import os
from collections.abc import Mapping
from dataclasses import dataclass


class ConfigError(Exception):
    """Raised when the environment holds an invalid configuration value."""


@dataclass(frozen=True)
class Config:
    """Immutable service settings parsed from environment variables."""

    log_level: int
    db_url: str | None
    db_name: str | None
    db_user: str | None
    db_pass: str | None
    service_account_email: str | None

    @classmethod
    def from_env(cls, environ: Mapping[str, str] | None = None) -> "Config":
        """Build a Config from `environ` (defaults to `os.environ`).

        Raises ConfigError when LOGGER_LEVEL is not a known logging level name.
        """
        env = os.environ if environ is None else environ
        return cls(
            log_level=_parse_log_level(env.get("LOGGER_LEVEL", "INFO")),
            db_url=env.get("DB_URL"),
            db_name=env.get("DB_NAME"),
            db_user=env.get("DB_USER"),
            db_pass=env.get("DB_PASS"),
            service_account_email=env.get("SERVICE_ACCOUNT_EMAIL"),
        )


def _parse_log_level(name: str) -> int:
    level = logging.getLevelNamesMapping().get(name)
    if level is None:
        raise ConfigError(f"Invalid logger level: {name}")
    return level
