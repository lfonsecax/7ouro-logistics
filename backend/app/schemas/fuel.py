from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime, date
from typing import Optional
from app.schemas.truck import TruckOut
from app.schemas.supplier import SupplierOut


class FuelRecordBase(BaseModel):
    date: date
    truck_id: int
    supplier_id: Optional[int] = None
    liters: Decimal
    price_per_liter: Optional[Decimal] = None
    total: Decimal
    odometer: Optional[Decimal] = None
    notes: Optional[str] = None


class FuelRecordCreate(FuelRecordBase):
    pass


class FuelRecordUpdate(BaseModel):
    date: Optional[date] = None
    truck_id: Optional[int] = None
    supplier_id: Optional[int] = None
    liters: Optional[Decimal] = None
    price_per_liter: Optional[Decimal] = None
    total: Optional[Decimal] = None
    odometer: Optional[Decimal] = None
    notes: Optional[str] = None


class FuelRecordOut(FuelRecordBase):
    id: int
    created_at: datetime
    truck: Optional[TruckOut] = None
    supplier: Optional[SupplierOut] = None

    model_config = {"from_attributes": True}
