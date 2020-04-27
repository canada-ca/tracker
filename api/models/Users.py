from sqlalchemy.types import Integer, Boolean, Float
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy import event
from app import bcrypt
from sqlalchemy.orm import relationship, validates
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from db import Base


class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_name = Column(String)
    display_name = Column(String)
    user_password = Column(String)
    preferred_lang = Column(String)
    failed_login_attempts = Column(Integer, default=0)
    failed_login_attempt_time = Column(Float, default=0, nullable=True)
    tfa_validated = Column(Boolean, default=False)
    user_affiliation = relationship(
        "User_affiliations", back_populates="user", cascade="all, delete"
    )

    @hybrid_method
    def find_by_user_name(self, user_name):
        return self.query.filter(self.user_name == user_name).first()

    @hybrid_property
    def password(self):
        return self.user_password

    @password.setter
    def password(self, password):
        if len(password) < 12:
            raise ValueError("Password must be greater than 12 characters")
        else:
            self.user_password = bcrypt.generate_password_hash(password).decode("UTF-8")
