from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    domains = relationship("Domain", back_populates="owner")


class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    domain_name = Column(String, nullable=False)
    current_status = Column(String, default="unknown")
    last_check = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="domains")
    checks = relationship("Check", back_populates="domain")


class Check(Base):
    __tablename__ = "checks"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))

    status_code = Column(Integer, nullable=True)
    status = Column(String, nullable=False)
    response_time = Column(Float, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)

    domain = relationship("Domain", back_populates="checks")