from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime, date
from typing import Optional
from app.models.maintenance import MaintenanceType
from app.schemas.truck import TruckOut
from app.schemas.supplier import SupplierOut


class MaintenanceRecordBase(BaseModel):
    date: date
    truck_id: int
    supplier_id: Optional[int] = None
    type: MaintenanceType
    description: str
    cost: Optional[Decimal] = Decimal("0")
    odometer: Optional[Decimal] = None
    notes: Optional[str] = None


class MaintenanceRecordCreate(MaintenanceRecordBase):
    pass


class MaintenanceRecordUpdate(BaseModel):
    date: Optional[date] = None
    truck_id: Optional[int] = None
    supplier_id: Optional[int] = None
    type: Optional[MaintenanceType] = None
    description: Optional[str] = None
    cost: Optional[Decimal] = None
    odometer: Optional[Decimal] = None
    notes: Optional[str] = None


class MaintenanceRecordOut(MaintenanceRecordBase):
    id: int
    created_at: datetime
    truck: Optional[TruckOut] = None
    supplier: Optional[SupplierOut] = None

    model_config = {"from_attributes": True}
