import logging

import pytest

from config import Config, ConfigError


def test_defaults_to_info_level():
    assert Config.from_env({}).log_level == logging.INFO


@pytest.mark.parametrize("name", ["DEBUG", "WARNING", "ERROR"])
def test_parses_known_level_names(name):
    assert Config.from_env({"LOGGER_LEVEL": name}).log_level == logging.getLevelName(name)


def test_rejects_invalid_level():
    with pytest.raises(ConfigError, match="Invalid logger level: LOUD"):
        Config.from_env({"LOGGER_LEVEL": "LOUD"})


def test_reads_db_and_notification_settings():
    config = Config.from_env(
        {
            "DB_URL": "http://db",
            "DB_NAME": "n",
            "DB_USER": "u",
            "DB_PASS": "p",
            "SERVICE_ACCOUNT_EMAIL": "a@b.ca",
        }
    )
    assert (config.db_url, config.db_name, config.db_user, config.db_pass) == (
        "http://db",
        "n",
        "u",
        "p",
    )
    assert config.service_account_email == "a@b.ca"


def test_config_is_frozen():
    with pytest.raises(AttributeError):
        Config.from_env({}).log_level = 1
