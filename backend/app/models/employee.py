from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, Date, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class EmployeeType(str, enum.Enum):
    driver = "driver"
    helper = "helper"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    type = Column(SAEnum(EmployeeType), nullable=False)
    phone = Column(String(20))
    cnh = Column(String(20))
    cnh_expiry = Column(Date)
    salary = Column(Numeric(10, 2), default=0)
    daily_rate = Column(Numeric(10, 2), default=0)  # diária para ajudantes
    active = Column(Boolean, default=True)
    notes = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    driven_routes = relationship("Route", back_populates="driver", foreign_keys="Route.driver_id")
    route_helpers = relationship("RouteHelper", back_populates="employee")
