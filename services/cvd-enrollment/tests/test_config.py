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


def test_reads_hackerone_settings_with_given_base_url():
    settings = Config.from_env(
        {
            "API_USERNAME": "u",
            "API_TOKEN": "t",
            "ORG_ID": "o",
            "PROGRAM_ID": "p",
            "H1_BASE_URL": "http://h1.test/v1",
        }
    ).hackerone
    assert (settings.username, settings.token, settings.org_id, settings.program_id) == ("u", "t", "o", "p")
    assert settings.assets_url == "http://h1.test/v1/organizations/o/assets"
    assert settings.asset_tags_url == "http://h1.test/v1/organizations/o/asset_tags"


@pytest.mark.parametrize("environ", [{}, {"H1_BASE_URL": ""}], ids=["unset", "empty"])
def test_hackerone_base_url_defaults_to_production_api(environ):
    assert Config.from_env(environ).hackerone.base_url == "https://api.hackerone.com/v1"


def test_reads_notify_settings():
    settings = Config.from_env(
        {
            "NOTIFICATION_API_KEY": "key",
            "NOTIFICATION_API_URL": "http://notify.test",
            "CVD_ENROLLMENT_NOTIFICATION_TEMPLATE_ID": "tpl",
        }
    ).notify
    assert (settings.api_key, settings.base_url, settings.template_id) == ("key", "http://notify.test", "tpl")
