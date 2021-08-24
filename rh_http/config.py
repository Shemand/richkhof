import os

from sqlalchemy.engine.url import URL

_basedir = os.path.abspath(os.path.dirname(__file__))

DEBUG = False

ADMINS = frozenset(['email@rosgvard.ru'])
SECRET_KEY = 'somekey'

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'store')

db_url = {
    'database': "vspbmebel_python",
    'drivername': "mysql",
    'username': "root",
    'password': "qwerty",
    'host': "localhost",
    'query': {'charset': 'utf8'}
}

SQLALCHEMY_DATABASE_URI = URL(**db_url)
DATABASE_CONNECT_OPTIONS = {}

# MYSQL_CHARSET = 'utf8_general_ci'

THREADS_PER_PAGE = 4

WTF_CSRF_ENABLED = True
WTF_CSRF_SECRET_KEY = "csrfsecritkey"
