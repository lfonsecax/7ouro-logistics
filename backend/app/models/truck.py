from sqlalchemy import Column, Integer, String, Numeric, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class TruckStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    in_maintenance = "in_maintenance"


class Truck(Base):
    __tablename__ = "trucks"

    id = Column(Integer, primary_key=True, index=True)
    plate = Column(String(10), unique=True, nullable=False, index=True)
    model = Column(String(100), nullable=False)
    brand = Column(String(100))
    year = Column(Integer)
    capacity_kg = Column(Numeric(10, 2))
    odometer = Column(Numeric(10, 2), default=0)
    status = Column(SAEnum(TruckStatus), default=TruckStatus.active, nullable=False)
    notes = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    routes = relationship("Route", back_populates="truck")
    fuel_records = relationship("FuelRecord", back_populates="truck")
    maintenance_records = relationship("MaintenanceRecord", back_populates="truck")
