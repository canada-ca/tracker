import os
import random

class Config():
    DEBUG = False
    TESTING = False
    MONGO_URI = 'mongodb://localhost:27017/tracker'


class ProductionConfig(Config):
    MONGO_URI = os.environ.get('TRACKER_MONGO_URI', None)


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    MONGO_URI = f'mongodb://localhost:27017/tracker_{random.randint(0, 1000)}'
