import os
import sys
import random
import logging

from azure.keyvault import KeyVaultClient
from msrestazure.azure_active_directory import MSIAuthentication

LOGGER = logging.getLogger(__name__)

A_DAY = 60 * 60 * 24

class Config:
    DEBUG = False
    TESTING = False
    MONGO_URI = os.environ.get("TRACKER_MONGO_URI", "mongodb://localhost:27017/track")
    CACHE_TYPE = "null"

    @staticmethod
    def init_app(app):
        pass



class ProductionConfig(Config):

    CACHE_TYPE = "filesystem"
    CACHE_DIR = os.environ.get("TRACKER_CACHE_DIR", "./.cache")
    CACHE_DEFAULT_TIMEOUT = int(os.environ.get("TRACKER_CACHE_TIMEOUT", A_DAY))

    if os.environ.get('TRACKER_ENV', None) == "production":
        if os.environ.get("TRACKER_KEYVAULT_URI", None) is None or os.environ.get("SECRET_NAME_RO", None) is None:
            # Error and crash hard: Production should be configured as expected.
            LOGGER.error("KeyVault uri or secret name missing from local environment.")
            sys.exit(4)

        kv_uri = os.environ.get("TRACKER_KEYVAULT_URI")
        kv_secret = os.environ.get("SECRET_NAME_RO")
        kv_creds = MSIAuthentication(resource='https://vault.azure.net')
        kv_client = KeyVaultClient(kv_creds)
        MONGO_URI = kv_client.get_secret(kv_uri, kv_secret, "").value

    @staticmethod
    def init_app(app):

        Config.init_app(app)

        import logging
        from logging.handlers import SysLogHandler

        handler = SysLogHandler(address=os.environ.get("TRACKER_SYSLOG", "/dev/log"))
        handler.setLevel(logging.ERROR)
        app.logger.addHandler(handler)

class DevelopmentConfig(Config):

    DEBUG = True
    CACHE_TYPE = "simple"


class TestingConfig(Config):

    TESTING = True
    MONGO_URI = "mongodb://localhost:27017/track_{rand}".format(
        rand=random.randint(0, 1000)
    )


config = {
    "testing": TestingConfig,
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
