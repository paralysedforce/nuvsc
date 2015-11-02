import os

class Config(object):
    DEBUG = False
    DATABASE = 'cache.db'
    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']

class DevelopmentConfig(Config):
    DEBUG = True
