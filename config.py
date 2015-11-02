import os

class Config(object):
    DEBUG = False
    DATABSE = os.environ['DATABASE_NAME']
    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']

class DevelopmentConfig(Config):
    DEBUG = True
