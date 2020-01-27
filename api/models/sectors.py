from sqlalchemy.orm import relationship

from sqlalchemy.types import Integer
from sqlalchemy import Column, String

from models import Base


class Sectors(Base):
    __tablename__ = 'sectors'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True)
    sector = Column(String)
    zone = Column(String)
    description = Column(String)
    groups = relationship("Groups", back_populates="group_sector", cascade="all, delete")
    affiliated_admins = relationship("Admin_affiliations", back_populates="admin_sector", cascade="all, delete")