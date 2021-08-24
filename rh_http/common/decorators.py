from functools import wraps

from flask import g, session


def requires_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not ('user_id' in session):
            return '{ "status" : "not_auth", "messages" : ["Вы должны быть авторизированны."] }'
        return f(*args, **kwargs)
    return decorated_function

def requires_unauth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' in session:
            return '{ "status" : "is_auth", "messages" : ["Вы должны быть не авторизированны."] }'
        return f(*args, **kwargs)
    return decorated_function

def requires_be_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if g.isAdmin is False:
            return '{ "status" : "bad", "messages" : ["Вы должны быть администратором."] }'
        return f(*args, **kwargs)
    return decorated_function