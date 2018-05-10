import os
import random

class Config():
    DEBUG = False
    TESTING = False
    MONGO_URI = 'mongodb://localhost:27017/pulse'


class ProductionConfig(Config):
    MONGO_URI = os.environ.get('PULSE_MONGO_URI', None)


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    MONGO_URI = f'mongodb://localhost:27017/pulse_{random.randint(0, 1000)}'
