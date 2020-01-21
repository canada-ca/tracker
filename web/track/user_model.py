##
# This file is a temporary user model file that will be refactored into the models.py file once final schema decisions
# for this project have been made.  This file is currently being used only to make sure that auth is working correctly.

from sqlalchemy import Table, Column, Integer, ForeignKey
from sqlalchemy.types import Integer, Boolean, DateTime
from sqlalchemy import create_engine
from sqlalchemy import Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB
import psycopg2

base = declarative_base()


class Connection:

    def __init__(self, _user, _password, _host, _port, _db):
        try:
            self.engine = create_engine(f"postgresql+psycopg2://{_user}:{_password}@{_host}/{_db}", echo=True)

            base.metadata.create_all(bind=self.engine)
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
            print("Connected to PostgreSQL")

            self.users = Users()

        except Exception as error:
            print(f"Error while connecting to PostgreSQL: {error}")

    def close(self):
        try:
            self.session.close()
            print("PostgreSQL connection is closed")

        except Exception as error:
            print(f"Error while closing PostgreSQL connection: {error}")

    def insert(self, _data):
        try:
            self.session.add(_data)

        except Exception as error:
            print(f"Error while inserting data: {error}")

    def insert_all(self, _data):
        try:
            self.session.add_all(_data)

        except Exception as error:
            print(f"Error while bulk inserting data: {error}")

    def commit(self):
        self.session.commit()

    def query(self, _query):
        return self.session.query(_query).all()

    def query_user_by_id(self, _id):
        return self.session.query(Users).get(_id)

    def query_user_by_email(self, _email):
        return self.session.query(Users).filter(Users.user_email == _email).first()


    def update_user_password(self, _email, _password):
        return self.session.query(Users).filter(Users.user_email == _email) \
            .update({Users.user_password: _password})

    def increment_failed_login_attempts(self, _email):
        return self.session.query(Users).filter(Users.user_email == _email)\
            .update({Users.failed_login_attempts: Users.failed_login_attempts + 1})

    def reset_failed_login_attempts(self, _email):
        return self.session.query(Users).filter(Users.user_email == _email)\
            .update({Users.failed_login_attempts: 0})

    def is_user_account_locked(self, _email):
        user = self.session.query(Users).filter(Users.user_email == _email).first()
        if user.failed_login_attempts > 5:
            return True
        else:
            return False


    def delete(self, _data):
        self.session.delete(_data)


class Users(base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String)
    display_name = Column(String)
    user_email = Column(String)
    user_password = Column(String)
    preferred_lang = Column(String)
    failed_login_attempts = Column(Integer)
    # user_affiliation = relationship("User_affiliations", back_populates="user", cascade="all, delete")

    @staticmethod
    def is_active(self):
        """True, as all users are active."""
        return True

    def get_id(self):
        """Return the ID to satisfy Flask-Login's requirements."""
        return self.id

    @staticmethod
    def is_authenticated(self):
        """Return True if the user is authenticated."""
        return True  # TODO: add column in DB for authenticated

    @staticmethod
    def is_anonymous(self):
        """False, as anonymous users aren't supported."""
        return False
