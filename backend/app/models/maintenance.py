from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class MaintenanceType(str, enum.Enum):
    preventive = "preventive"
    corrective = "corrective"


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    type = Column(SAEnum(MaintenanceType), nullable=False)
    description = Column(String(300), nullable=False)
    cost = Column(Numeric(10, 2), default=0)
    odometer = Column(Numeric(10, 2))
    notes = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    truck = relationship("Truck", back_populates="maintenance_records")
    supplier = relationship("Supplier", back_populates="maintenance_records")
