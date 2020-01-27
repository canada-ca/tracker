from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from sqlalchemy.types import Integer
from sqlalchemy import Column, String

from models import Base


class Organizations(Base):
    __tablename__ = 'organizations'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True)
    organization = Column(String)
    description = Column(String)
    group_id = Column(Integer, ForeignKey('groups.id'))
    group = relationship("Groups", back_populates="organizations", cascade="all, delete")
    domains = relationship("Domains", back_populates="organization", cascade="all, delete")
    users = relationship("User_affiliations", back_populates="user_organization", cascade="all, delete")