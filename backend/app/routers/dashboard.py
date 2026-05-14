from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
import calendar
from datetime import date, datetime
from typing import Optional
from decimal import Decimal
from app.database import get_db
from app.models.route import Route, OtherExpense
from app.models.fuel import FuelRecord
from app.models.maintenance import MaintenanceRecord
from app.models.employee import Employee
from app.models.truck import Truck

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis")
def get_kpis(
    year: int = None,
    month: int = None,
    db: Session = Depends(get_db),
):
    today = date.today()
    y = year or today.year
    m = month or today.month

    def period_filter(model, date_col):
        return [extract("year", date_col) == y, extract("month", date_col) == m]

    revenue = db.query(func.coalesce(func.sum(Route.total_revenue), 0)).filter(
        *period_filter(Route, Route.date)
    ).scalar() or Decimal("0")

    total_km = db.query(func.coalesce(func.sum(Route.total_km), 0)).filter(
        *period_filter(Route, Route.date)
    ).scalar() or Decimal("0")

    other_costs = db.query(func.coalesce(func.sum(OtherExpense.amount), 0)).filter(
        OtherExpense.route_id.in_(
            db.query(Route.id).filter(*period_filter(Route, Route.date))
        )
    ).scalar() or Decimal("0")
    fuel_cost = db.query(func.coalesce(func.sum(FuelRecord.total), 0)).filter(
        *period_filter(FuelRecord, FuelRecord.date)
    ).scalar() or Decimal("0")

    fuel_liters = db.query(func.coalesce(func.sum(FuelRecord.liters), 0)).filter(
        *period_filter(FuelRecord, FuelRecord.date)
    ).scalar() or Decimal("0")

    maintenance_cost = db.query(func.coalesce(func.sum(MaintenanceRecord.cost), 0)).filter(
        *period_filter(MaintenanceRecord, MaintenanceRecord.date)
    ).scalar() or Decimal("0")

    total_salary = db.query(func.coalesce(func.sum(Employee.salary), 0)).filter(
        Employee.active == True
    ).scalar() or Decimal("0")

    total_cost = fuel_cost + maintenance_cost + total_salary
    profit = revenue - total_cost

    total_days_in_period = calendar.monthrange(y, m)[1]
    route_days = db.query(func.count(func.distinct(Route.date))).filter(
        *period_filter(Route, Route.date)
    ).scalar() or 0
    days_idle = total_days_in_period - route_days

    rev_per_km = float(revenue) / float(total_km) if total_km and float(total_km) > 0 else 0
    var_cost_per_km = float(fuel_cost) / float(total_km) if total_km and float(total_km) > 0 else 0
    fixed_costs = float(total_salary) + float(maintenance_cost)
    margin_per_km = rev_per_km - var_cost_per_km
    breakeven = fixed_costs / margin_per_km * rev_per_km if margin_per_km > 0 and rev_per_km > 0 else float(total_cost)

    avg_consumption = (
        float(total_km) / float(fuel_liters) if fuel_liters and float(fuel_liters) > 0 else 0
    )
    cost_per_km = float(total_cost) / float(total_km) if total_km and float(total_km) > 0 else 0
    revenue_per_km = float(revenue) / float(total_km) if total_km and float(total_km) > 0 else 0

    trucks = db.query(Truck).all()
    revenue_by_truck = []
    for truck in trucks:
        truck_revenue = db.query(func.coalesce(func.sum(Route.total_revenue), 0)).filter(
            Route.truck_id == truck.id,
            *period_filter(Route, Route.date)
        ).scalar() or 0
        truck_km = db.query(func.coalesce(func.sum(Route.total_km), 0)).filter(
            Route.truck_id == truck.id,
            *period_filter(Route, Route.date)
        ).scalar() or 0
        revenue_by_truck.append({
            "truck_id": truck.id,
            "plate": truck.plate,
            "model": truck.model,
            "revenue": float(truck_revenue),
            "km": float(truck_km),
        })

    return {
        "period": {"year": y, "month": m},
        "revenue": float(revenue),
        "fuel_cost": float(fuel_cost),
        "fuel_liters": float(fuel_liters),
        "maintenance_cost": float(maintenance_cost),
        "salary_cost": float(total_salary),
        "total_cost": float(total_cost),
        "profit": float(profit),
        "total_km": float(total_km),
        "avg_consumption_km_per_liter": round(avg_consumption, 2),
        "cost_per_km": round(cost_per_km, 2),
        "days_idle": days_idle,
        "total_days": total_days_in_period,
        "breakeven": round(breakeven, 2),
        "revenue_per_km": round(revenue_per_km, 2),
        "revenue_by_truck": revenue_by_truck,
    }


@router.get("/evolution")
def get_evolution(months: int = 6, db: Session = Depends(get_db)):
    today = date.today()
    results = []

    for i in range(months - 1, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1

        def pf(date_col):
            return [extract("year", date_col) == y, extract("month", date_col) == m]

        revenue = float(db.query(func.coalesce(func.sum(Route.total_revenue), 0)).filter(*pf(Route.date)).scalar() or 0)
        fuel = float(db.query(func.coalesce(func.sum(FuelRecord.total), 0)).filter(*pf(FuelRecord.date)).scalar() or 0)
        maint = float(db.query(func.coalesce(func.sum(MaintenanceRecord.cost), 0)).filter(*pf(MaintenanceRecord.date)).scalar() or 0)
        km = float(db.query(func.coalesce(func.sum(Route.total_km), 0)).filter(*pf(Route.date)).scalar() or 0)

        results.append({
            "period": f"{y}-{m:02d}",
            "revenue": revenue,
            "fuel_cost": fuel,
            "maintenance_cost": maint,
            "total_km": km,
        })

    return results
