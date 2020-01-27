from sqlalchemy.types import Integer
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from models import Base


class Admins(Base):
    __tablename__ = 'admins'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True)
    username = Column(String)
    display_name = Column(String)
    user_email = Column(String)
    preferred_lang = Column(String)
    admin_affiliation = relationship("Admin_affiliations", back_populates="admin", cascade="all, delete")


class Admin_affiliations(Base):
    __tablename__ = 'admin_affiliations'

    id = Column(Integer, ForeignKey('admins.id'), primary_key=True)
    sector_id = Column(Integer, ForeignKey('sectors.id'))
    permission = Column(String)
    admin = relationship("Admins", back_populates="admin_affiliation", cascade="all, delete")
    admin_sector = relationship("Sectors", back_populates="affiliated_admins", cascade="all, delete")

