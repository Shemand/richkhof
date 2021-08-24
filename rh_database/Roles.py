from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from rh_http import db

privileges_of_role = db.Table('privileges_of_role',
    db.Column('id', db.Integer, primary_key=True, unique=True, auto_increment=True, nullable=False),
    db.Column('Roles_name', db.String(128), ForeignKey('Roles.name'), nullable=False),
    db.Column('Privileges_id', db.Integer, ForeignKey('Privileges.id'), nullable=False)
)

class Roles(db.Model):
    __tablename__ = 'Roles'

    name = db.Column(db.String(128), primary_key=True, unique=True, nullable=False)

    users = relationship('Users', backref='role')

    def __repr__(self):
        return "<Roles (name: %r)>" % (self.name)

class Privileges(db.Model):
    __tablename__ = 'Privileges'

    id = db.Column(db.Integer, primary_key=True, auto_increment=True, unique=True, nullable=False)
    name = db.Column(db.String(64), nullable=False)

    roles = relationship('Roles', secondary='privileges_of_role', backref='privileges')

    def __repr__(self):
        return "<Privileges (name: %r, role_name: %r)>" % (self.name, self.Roles_name)