import bcrypt

from sqlalchemy.types import Integer, Boolean, Float
from slugify import slugify
from functions.orm_to_dict import orm_to_dict
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy import event
from models.Organizations import Organizations
from models.User_affiliations import User_affiliations
from sqlalchemy.orm import relationship, validates
from sqlalchemy.ext.associationproxy import association_proxy
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
        "User_affiliations", back_populates="user", passive_deletes=True,
    )

    def __init__(self, **kwargs):
        super(Users, self).__init__(**kwargs)
        # XXX: This is gross but matches the expections of the
        # Acronym scalar type.
        acronym = slugify(self.user_name).upper()[:10]
        self.user_affiliation.append(
            User_affiliations(
                permission="admin",
                user_organization=Organizations(name=self.user_name, acronym=acronym,),
            )
        )

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
            self.user_password = bcrypt.hashpw(password.encode('utf8'), bcrypt.gensalt()).decode('utf8')
