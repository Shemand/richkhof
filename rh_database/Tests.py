from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from rh_database.Organizations import Organizations
from rh_database.Posts import Categories
from rh_http import db


class Tests(db.Model):
    __tablename__ = 'Tests'

    id = db.Column(db.Integer, primary_key=True, auto_increment=True, unique=True, nullable=False)
    title = db.Column(db.String(512), nullable=False)
    description = db.Column(db.Text)
    isPrepered = db.Column(db.Boolean, nullable=False)
    closed = db.Column(db.Boolean, nullable=False, default=True)
    availability = db.Column(db.Boolean, nullable=False, default=False)
    tradable = db.Column(db.Boolean, nullable=False, default=False)
    expired_time = db.Column(db.Integer)
    created = db.Column(db.DateTime, nullable=False, default=datetime.now)
    opened = db.Column(db.Boolean, nullable=False, default=0)
    isDeleted = db.Column(db.Boolean, nullable=False, default=0)

    Organization_id = db.Column(db.Integer, ForeignKey(Organizations.id))
    Categories_id = db.Column(db.Integer, ForeignKey(Categories.id))

    organization = relationship('Organizations', backref='tests')
    category = relationship('Categories', backref='tests')

    def __repr__(self):
        return "<Tests (title: %r)>" % (self.title)


class Appointed_tests(db.Model):
    __tablename__ = 'Appointed_tests'

    id = db.Column(db.Integer, primary_key=True, auto_increment=True, unique=True, nullable=False)
    root_test_id = db.Column(db.Integer, ForeignKey('Tests.id'), nullable=False)
    new_test_id = db.Column(db.Integer, ForeignKey('Tests.id'), nullable=False)
    Organizations_id = db.Column(db.Integer, ForeignKey('Organizations.id'), nullable=False)


    root_test = relationship('Tests', foreign_keys=[root_test_id])
    new_test = relationship('Tests', foreign_keys=[new_test_id])
    organization = relationship('Organizations')
    def __repr__(self):
        return '<Appointed_tests (id: %r)>' % (self.id)

class Questions(db.Model):
    __tablename__ = 'Questions'

    id = db.Column(db.Integer, primary_key=True, auto_increment=True, unique=True, nullable=False)
    number = db.Column(db.Integer, nullable=False)
    media_url = db.Column(db.Text)
    text = db.Column(db.Text, nullable=False)
    Tests_id = db.Column(db.Integer, ForeignKey(Tests.id), nullable=False)

    test = relationship('Tests', backref='questions')

    def __repr__(self):
        return "<Questions (text: %r)>" % (self.text)


class Answers(db.Model):
    __tablename__ = 'Answers'

    id = db.Column(db.Integer, primary_key=True, unique=True, nullable=False)
    number = db.Column(db.Integer, nullable=False)
    text = db.Column(db.String(256), nullable=False)
    isRight = db.Column(db.Boolean, nullable=False, default=False)
    Questions_id = db.Column(db.Integer, ForeignKey('Questions.id'), nullable=False)

    question = relationship('Questions', backref='answers')

    def __repr__(self):
        return "<Answers (text: %r, isRight: %r)>" % (self.text, self.isRight)

class Appointed_users(db.Model):
    __tablename__ = 'Appointed_users'

    id = db.Column(db.Integer, primary_key=True, unique=True, nullable=False)
    Tests_id = db.Column(db.Integer, ForeignKey('Tests.id'), nullable=False)
    Users_id = db.Column(db.Integer, ForeignKey('Users.id'), nullable=False)
    availability = db.Column(db.Boolean, nullable=False, default=True)
    completed = db.Column(db.Boolean, nullable=False, default=False)
    score = db.Column(db.Integer)
    attempts = db.Column(db.Integer, nullable=False, default=0)

    test = relationship('Tests', backref='appointed_users')
    user = relationship('Users', backref='appointed_tests')

    def __repr__(self):
        return "<Appointed_users (id: %r)>" % (self.id)

class Test_Solutions(db.Model):
    __tablename__ = 'Test_Solutions'

    id = db.Column(db.Integer, primary_key=True, unique=True, nullable=False)
    Tests_id = db.Column(db.Integer, ForeignKey('Tests.id'), nullable=False)
    Users_id = db.Column(db.Integer, ForeignKey('Users.id'), nullable=False)
    average_score = db.Column(db.Float)
    rights_answers = db.Column(db.Integer)
    created = db.Column(db.DateTime, nullable=False, default=datetime.now)

    user = relationship('Users', backref='solved_tests')
    test = relationship('Tests', backref='solved_by_users')

    def __repr__(self):
        return "<Test_Solutions (id: %r)>" % (self.id)

class Users_Answers(db.Model):
    __tablename__ = 'Users_Answers'

    id = db.Column(db.Integer, primary_key=True, auto_increment=True, unique=True, nullable=False)
    Test_Solutions_id = db.Column(db.Integer, ForeignKey('Test_Solutions.id'), nullable=False)
    Questions_id = db.Column(db.Integer, ForeignKey('Questions.id'), nullable=False)
    Answers_id = db.Column(db.Integer, ForeignKey('Answers.id'))

    solved_test = relationship('Test_Solutions', backref='user_answers')

    def __repr__(self):
        return "<Users_Answers (id: %r, Test_Solutions_id: %r)>" % (self.id, self.Test_Solution_id)