from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from rh_http import db


class Organizations(db.Model):
    __tablename__ = 'Organizations'

    id = db.Column(db.Integer, primary_key=True, unique=True, nullable=False)
    name = db.Column(db.String(256), unique=True, nullable=False)
    isArchived = db.Column(db.Boolean, nullable=False, default=False)

    # staff = relationship('Users')

    def __repr__(self):
        return "<Organizations (name: %r)>" % (self.name)