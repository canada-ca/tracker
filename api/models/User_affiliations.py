from sqlalchemy.types import Integer
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from db import Base


class User_affiliations(Base):
    __tablename__ = "user_affiliations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            onupdate="CASCADE",
            ondelete="CASCADE",
            # name is required on FK or rollback is broken
            name="user_affiliations_users_id_fkey",
        ),
        primary_key=True,
    )
    organization_id = Column(
        Integer,
        ForeignKey(
            "organizations.id",
            onupdate="CASCADE",
            ondelete="CASCADE",
            # name is required on FK or rollback is broken
            name="user_affiliations_organization_id_fkey",
        ),
    )
    permission = Column(String)
    user = relationship(
        "Users", back_populates="user_affiliation", cascade="all, delete"
    )
    user_organization = relationship(
        "Organizations", back_populates="users", cascade="all, delete",
    )
