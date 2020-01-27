from sqlalchemy.types import Integer
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from models import Base


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String)
    display_name = Column(String)
    user_email = Column(String)
    user_password = Column(String)
    preferred_lang = Column(String)
    user_affiliation = relationship("User_affiliations", back_populates="user", cascade="all, delete")
    failed_login_attempts = Column(Integer)


class User_affiliations(Base):
    __tablename__ = 'user_affiliations'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    permission = Column(String)
    user = relationship("Users", back_populates="user_affiliation", cascade="all, delete")
    user_organization = relationship("Organizations", back_populates="users", cascade="all, delete")

