from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime, date
from typing import Optional, List
from app.schemas.employee import EmployeeOut
from app.schemas.client import ClientOut
from app.schemas.truck import TruckOut


class RouteStopBase(BaseModel):
    client_id: Optional[int] = None
    stop_order: int = 1
    value: Optional[Decimal] = Decimal("0")
    notes: Optional[str] = None


class RouteStopCreate(RouteStopBase):
    pass


class RouteStopOut(RouteStopBase):
    id: int
    client: Optional[ClientOut] = None

    model_config = {"from_attributes": True}


class OtherExpenseCreate(BaseModel):
    description: str
    amount: Decimal
    category: str = "outros"


class OtherExpenseOut(BaseModel):
    id: int
    route_id: int
    description: str
    amount: Decimal
    category: str

    model_config = {"from_attributes": True}


class RouteHelperOut(BaseModel):
    id: int
    employee_id: int
    employee: Optional[EmployeeOut] = None

    model_config = {"from_attributes": True}


class RouteBase(BaseModel):
    date: date
    truck_id: int
    driver_id: int
    total_km: Optional[Decimal] = Decimal("0")
    total_revenue: Optional[Decimal] = Decimal("0")
    notes: Optional[str] = None


class RouteCreate(RouteBase):
    helper_ids: List[int] = []
    stops: List[RouteStopCreate] = []


class RouteUpdate(BaseModel):
    other_expenses: list[OtherExpenseCreate] | None = None
    date: Optional[date] = None
    truck_id: Optional[int] = None
    driver_id: Optional[int] = None
    total_km: Optional[Decimal] = None
    total_revenue: Optional[Decimal] = None
    notes: Optional[str] = None
    helper_ids: Optional[List[int]] = None
    stops: Optional[List[RouteStopCreate]] = None


class RouteOut(RouteBase):
    id: int
    created_at: datetime
    truck: Optional[TruckOut] = None
    driver: Optional[EmployeeOut] = None
    helpers: List[RouteHelperOut] = []
    stops: List[RouteStopOut] = []
    other_expenses: List[OtherExpenseOut] = []

    model_config = {"from_attributes": True}
