import bcrypt

from sqlalchemy.types import Integer, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from sqlalchemy import Column, String

from db import Base
from functions.orm_to_dict import orm_to_dict
from functions.slugify import slugify_value
from models.Organizations import Organizations
from models.User_affiliations import User_affiliations


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
        "User_affiliations", back_populates="user", passive_deletes=True,
    )
    email_validated = Column(Boolean, default=False)

    @hybrid_method
    def find_by_user_name(self, user_name):
        return self.query.filter(self.user_name == user_name).first()

    @hybrid_property
    def roles(self):
        affiliations = orm_to_dict(self.user_affiliation)
        roles = []
        if len(affiliations):
            roles = []
            for affiliation in affiliations:
                roles.append(
                    {
                        "user_id": affiliation["user_id"],
                        "org_id": affiliation["organization_id"],
                        "permission": affiliation["permission"],
                    }
                )
        return roles

    @hybrid_property
    def password(self):
        return self.user_password

    @password.setter
    def password(self, password):
        if len(password) < 12:
            raise ValueError("Password must be greater than 12 characters")
        else:
            self.user_password = bcrypt.hashpw(
                password.encode("utf8"), bcrypt.gensalt()
            ).decode("utf8")

    @hybrid_method
    def verify_account(self):
        # Set user email_validated field to true0
        self.email_validated = True

        # Create users sandbox org
        acronym = slugify_value(self.user_name).upper()[:50]
        self.user_affiliation.append(
            User_affiliations(
                permission="admin",
                user_organization=Organizations(name=self.user_name, acronym=acronym,),
            )
        )
