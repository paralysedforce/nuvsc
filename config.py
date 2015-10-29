class Config(object):
    DEBUG = False
    DATABASE = 'cache.db'

class DevelopmentConfig(Config):
    DEBUG = True
