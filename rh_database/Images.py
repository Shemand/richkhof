from rh_http import db


class Images(db.Model):
    __tablename__ = 'Images'

    id = db.Column(db.Integer, primary_key=True, nullable=False, unique=True)
    url =  db.Column(db.Text, nullable=False)

    def __repr__(self):
        return "<Images (id: %r)>" % (self.id)

class Slider(db.Model):
    __tablename__ = 'Slider'

    id = db.Column(db.Integer, primary_key=True, nullable=False, unique=True)
    index = db.Column(db.Integer, nullable=False)
    url = db.Column(db.Text, nullable=False)
    reference = db.Column(db.Text)

    def __repr__(self):
        return "<Slider (id: %r)>" % (self.id)
