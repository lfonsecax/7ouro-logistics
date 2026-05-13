from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional
from app.models.truck import TruckStatus


class TruckBase(BaseModel):
    plate: str
    model: str
    brand: Optional[str] = None
    year: Optional[int] = None
    capacity_kg: Optional[Decimal] = None
    odometer: Optional[Decimal] = Decimal("0")
    status: TruckStatus = TruckStatus.active
    notes: Optional[str] = None


class TruckCreate(TruckBase):
    pass


class TruckUpdate(BaseModel):
    plate: Optional[str] = None
    model: Optional[str] = None
    brand: Optional[str] = None
    year: Optional[int] = None
    capacity_kg: Optional[Decimal] = None
    odometer: Optional[Decimal] = None
    status: Optional[TruckStatus] = None
    notes: Optional[str] = None


class TruckOut(TruckBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
