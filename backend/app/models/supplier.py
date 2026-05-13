from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class SupplierType(str, enum.Enum):
    workshop = "workshop"
    gas_station = "gas_station"
    other = "other"


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    type = Column(SAEnum(SupplierType), default=SupplierType.other, nullable=False)
    address = Column(String(300))
    city = Column(String(100))
    phone = Column(String(20))
    email = Column(String(150))
    notes = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    fuel_records = relationship("FuelRecord", back_populates="supplier")
    maintenance_records = relationship("MaintenanceRecord", back_populates="supplier")
