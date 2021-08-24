import os
import sys
from flask import render_template, session, url_for, Flask, redirect
from flask_sqlalchemy import SQLAlchemy

sys.path.append(os.getcwd() + '/rh_http')


app = Flask(__name__, static_folder='templates/static')
app.config.from_object('config')

db = SQLAlchemy(app)

from rh_http.views.index import mod as index_module
from rh_http.views.index import post as post_module
from rh_http.views.api import mod as api_module, get_list_of_available_tests


def install_secret_key(app, filename='secret_key'):
    filename = os.path.join(app.instance_path, filename)
    try:
        app.config['SECRET_KEY'] = open(filename, 'rb').read()
    except IOError:
        print('Error: No secret key. Create it with: ')
        full_path = os.path.dirname(filename)
        if not os.path.isdir(full_path):
            print('mkdir -p {filename}'.format(filename=full_path))
        print('head -c 24 /dev/urandom > {filename}'.format(filename=filename))
        sys.exit(1)

if not app.config['DEBUG']:
    install_secret_key(app)

@app.errorhandler(404)
def not_found(error):
    return render_template('html/404.html'), 404

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('index.index'))
    else:
        return redirect(url_for('index.index'))

app.register_blueprint(post_module)
app.register_blueprint(index_module)
app.register_blueprint(api_module)

http_server = app