from . import db
from flask_login import UserMixin

role_page = db.Table('role_page',
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True),
    db.Column('page_id', db.Integer, db.ForeignKey('page.id'), primary_key=True)
)

user_page = db.Table('user_page',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('page_id', db.Integer, db.ForeignKey('page.id'), primary_key=True)
)

class Page(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(200), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('page.id'), nullable=True)
    children = db.relationship('Page', backref=db.backref('parent', remote_side=[id]))

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    pages = db.relationship('Page', secondary=role_page, backref='roles')

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    user_bvlab = db.Column(db.String(100), nullable=True)
    pass_bvlab = db.Column(db.String(100), nullable=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))
    role = db.relationship('Role', backref='users')
    pages = db.relationship('Page', secondary=user_page, backref='users')
    idlab = db.Column(db.Integer, nullable=False)
    idteam = db.Column(db.Integer, nullable=False)
    def set_password(self, password):
        self.password = password

    def check_password(self, password):
        return self.password == password
    
class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    value = db.Column(db.String(100), nullable=False)
