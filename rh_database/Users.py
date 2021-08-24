from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from rh_database.Organizations import Organizations
from rh_database.Roles import Roles
from rh_http import db


class Users(db.Model):
    __tablename__ = 'Users'

    id = db.Column(db.Integer, primary_key=True, auto_increment=True, unique=True, nullable=False)
    first_name = db.Column(db.String(128), nullable=False)
    second_name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(256), unique=True, nullable=False)
    phone_number = db.Column(db.String(32), unique=True, nullable=False)
    password = db.Column(db.String(512), nullable=False)
    isArchived = db.Column(db.Boolean, nullable=False, default=False)
    prev_Organizations_id = db.Column(db.Integer, ForeignKey(Organizations.id), default=None)
    Organizations_id = db.Column(db.Integer, ForeignKey(Organizations.id), nullable=False)
    Roles_name = db.Column(db.String(128), ForeignKey(Roles.name), nullable=False)

    organization = relationship('Organizations', backref='users', foreign_keys=[Organizations_id])
    prev_organization = relationship('Organizations', backref='prev_users', foreign_keys=[prev_Organizations_id])

    def __repr__(self):
        return "<Users (f_name: %r; s_name: %r)>" % (self.first_name, self.second_name)

