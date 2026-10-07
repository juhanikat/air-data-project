from functools import wraps
from time import time
from flask import session

SESSION_EXPIRY = 10 * 60


def requires_authentication(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = session.get("user")
        if user is None:
            return "Unauthorized", 401
        if user.get("last_used", 0) + SESSION_EXPIRY < time():
            session.pop("user", None)
            return "Unauthorized (session expired)", 401

        return f(*args, **kwargs)

    return decorated_function


def refresh_session(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user" in session:
            user = session["user"]
            user["last_used"] = time()
            session["user"] = user

        return f(*args, **kwargs)

    return decorated_function