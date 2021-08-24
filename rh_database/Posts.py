from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from rh_http import db


class Categories(db.Model):
    __tablename__ = 'Categories'

    id = db.Column(db.Integer, primary_key=True, nullable=False, unique=True)
    name =  db.Column(db.String(128))
    created_by_organization_id = db.Column(db.Integer, ForeignKey('Organizations.id'), nullable=False)
    created = db.Column(db.DateTime, nullable=False, default=datetime.now)
    isDeleted = db.Column(db.Boolean, nullable=False, default=False)
    section = db.Column(db.Integer, nullable=False)

    Organizations_id = db.Column(db.Integer, ForeignKey('Organizations.id'))

    organization = relationship('Organizations', foreign_keys=[Organizations_id])
    created_by_organization = relationship('Organizations', foreign_keys=[created_by_organization_id])

    def __repr__(self):
        return "<Categories (name: %r)>" % (self.name)

class Posts(db.Model):
    __tablename__ = 'Posts'

    id = db.Column(db.Integer, primary_key=True, auto_increment=True, unique=True, nullable=False)
    title = db.Column(db.String(512), nullable=False)
    text = db.Column(db.Text, nullable=False)
    closed = db.Column(db.Boolean, nullable=False, default=True)
    tradable = db.Column(db.Boolean, nullable=False, default=False)
    created = db.Column(db.DateTime, nullable=False, default=datetime.now)
    isDeleted = db.Column(db.Boolean, nullable=False, default=False)

    Categories_id = db.Column(db.Integer, ForeignKey(Categories.id), nullable=False)
    Organizations_id = db.Column(db.Integer, ForeignKey('Organizations.id'), nullable=False)

    category = relationship('Categories', backref='posts')
    organization = relationship('Organizations', backref='posts')

    def __repr__(self):
        return "<Posts (title: %r)>" % (self.title)

class Appointed_posts(db.Model):
    __tablename__ = 'Appointed_posts'

    id = db.Column(db.Integer, primary_key=True, auto_increment=True, unique=True, nullable=False)
    root_post_id = db.Column(db.Integer, ForeignKey('Posts.id'), nullable=False)
    created_by_post_id = db.Column(db.Integer, ForeignKey('Posts.id'), nullable=False)
    Categories_id = db.Column(db.Integer, ForeignKey('Categories.id'), nullable=False)
    Organizations_id = db.Column(db.Integer, ForeignKey('Organizations.id'), nullable=False)

    root_post = relationship('Posts', foreign_keys=[root_post_id])
    created_by_post = relationship('Posts', foreign_keys=[created_by_post_id])
    category = relationship('Categories', backref='appointed_posts')
    organization = relationship('Organizations')

    def __repr__(self):
        return '<Appointed_posts (id: %r)>' % (self.id)

