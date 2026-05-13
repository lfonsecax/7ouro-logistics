from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FuelRecord(Base):
    __tablename__ = "fuel_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    liters = Column(Numeric(10, 3), nullable=False)
    price_per_liter = Column(Numeric(10, 4))
    total = Column(Numeric(10, 2), nullable=False)
    odometer = Column(Numeric(10, 2))
    notes = Column(String(300))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    truck = relationship("Truck", back_populates="fuel_records")
    supplier = relationship("Supplier", back_populates="fuel_records")
