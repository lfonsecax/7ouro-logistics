from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime, date
from typing import Optional
from app.models.employee import EmployeeType


class EmployeeBase(BaseModel):
    name: str
    type: EmployeeType
    phone: Optional[str] = None
    cnh: Optional[str] = None
    cnh_expiry: Optional[date] = None
    salary: Optional[Decimal] = Decimal("0")
    active: bool = True
    notes: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[EmployeeType] = None
    phone: Optional[str] = None
    cnh: Optional[str] = None
    cnh_expiry: Optional[date] = None
    salary: Optional[Decimal] = None
    active: Optional[bool] = None
    notes: Optional[str] = None


class EmployeeOut(EmployeeBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
