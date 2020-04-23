from graphene import Time
from sqlalchemy.types import Integer, Boolean, DateTime, Float
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from db import Base

class Organizations(Base):
    __tablename__ = 'organizations'

    id = Column(Integer, primary_key=True)
    acronym = Column(String)
    org_tags = Column(JSONB)
    domains = relationship("Domains", back_populates="organization", cascade="all, delete")
    users = relationship("User_affiliations", back_populates="user_organization", cascade="all, delete")


