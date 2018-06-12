import os
import random

class Config():
    DEBUG = False
    TESTING = False
    MONGO_URI = 'mongodb://localhost:27017/track'


class ProductionConfig(Config):
    MONGO_URI = os.environ.get('TRACKER_MONGO_URI', None)


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    MONGO_URI = 'mongodb://localhost:27017/track_{rand}'.format(rand=random.randint(0, 1000))
