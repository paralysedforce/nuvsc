class Config(object):
    DEBUG = False
    DATABSE = 'cache.db'

class DevelopmentConfig(Config):
    DEBUG = True
