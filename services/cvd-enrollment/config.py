"""Runtime configuration for the CVD enrollment service."""

import logging
import os
from collections.abc import Mapping
from dataclasses import dataclass

from hackerone import DEFAULT_BASE_URL, HackerOneSettings
from notify import NotifySettings


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
    hackerone: HackerOneSettings
    notify: NotifySettings

    @classmethod
    def from_env(cls, environ: Mapping[str, str] | None = None) -> "Config":
        """Build a Config from `environ` (defaults to `os.environ`).

        HackerOne and GC Notify values stay None when unset, like the DB values.
        H1_BASE_URL defaults to the production HackerOne API.
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
            hackerone=HackerOneSettings(
                org_id=env.get("ORG_ID"),
                program_id=env.get("PROGRAM_ID"),
                username=env.get("API_USERNAME"),
                token=env.get("API_TOKEN"),
                base_url=env.get("H1_BASE_URL") or DEFAULT_BASE_URL,
            ),
            notify=NotifySettings(
                api_key=env.get("NOTIFICATION_API_KEY"),
                base_url=env.get("NOTIFICATION_API_URL"),
                template_id=env.get("CVD_ENROLLMENT_NOTIFICATION_TEMPLATE_ID"),
            ),
        )


def _parse_log_level(name: str) -> int:
    level = logging.getLevelNamesMapping().get(name)
    if level is None:
        raise ConfigError(f"Invalid logger level: {name}")
    return level
