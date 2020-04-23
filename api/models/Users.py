from sqlalchemy.types import Integer, Boolean, Float
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy import event
from flask_bcrypt import Bcrypt
from flask import current_app as app
from sqlalchemy.orm import relationship, validates
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from db import Base

bcrypt = Bcrypt(
    app
)  # Create the bcrypt object that handles password hashing and verifying.


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

    @event.listens_for(Users.user_password, "set", propagate=True)
    def validate_password(target, value, oldvalue, initiator):
        pw = bcrypt.generate_password_hash(password=oldvalue).decode("UTF-8")
        return pw

    @validates("user_password")
    def validate_password(self, key, user_password):
        print("user_password")
        return True
