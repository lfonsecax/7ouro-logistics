from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.route import Route, RouteHelper, RouteStop
from app.schemas.route import RouteCreate, RouteUpdate, RouteOut

router = APIRouter(prefix="/routes", tags=["routes"])


def _load_route(db: Session, route_id: int) -> Route:
    return (
        db.query(Route)
        .options(
            joinedload(Route.truck),
            joinedload(Route.driver),
            joinedload(Route.helpers).joinedload(RouteHelper.employee),
            joinedload(Route.stops).joinedload(RouteStop.client),
        )
        .filter(Route.id == route_id)
        .first()
    )


@router.get("/", response_model=List[RouteOut])
def list_routes(
    truck_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Route).options(
        joinedload(Route.truck),
        joinedload(Route.driver),
        joinedload(Route.helpers).joinedload(RouteHelper.employee),
        joinedload(Route.stops).joinedload(RouteStop.client),
    )
    if truck_id:
        q = q.filter(Route.truck_id == truck_id)
    if driver_id:
        q = q.filter(Route.driver_id == driver_id)
    if date_from:
        q = q.filter(Route.date >= date_from)
    if date_to:
        q = q.filter(Route.date <= date_to)
    return q.order_by(Route.date.desc()).all()


@router.get("/{route_id}", response_model=RouteOut)
def get_route(route_id: int, db: Session = Depends(get_db)):
    route = _load_route(db, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Rota não encontrada")
    return route


@router.post("/", response_model=RouteOut, status_code=201)
def create_route(data: RouteCreate, db: Session = Depends(get_db)):
    route_data = data.model_dump(exclude={"helper_ids", "stops"})
    route = Route(**route_data)
    db.add(route)
    db.flush()

    for emp_id in data.helper_ids:
        db.add(RouteHelper(route_id=route.id, employee_id=emp_id))

    for stop in data.stops:
        db.add(RouteStop(route_id=route.id, **stop.model_dump()))

    db.commit()
    return _load_route(db, route.id)


@router.put("/{route_id}", response_model=RouteOut)
def update_route(route_id: int, data: RouteUpdate, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Rota não encontrada")

    update_data = data.model_dump(exclude_none=True, exclude={"helper_ids", "stops"})
    for field, value in update_data.items():
        setattr(route, field, value)

    if data.helper_ids is not None:
        db.query(RouteHelper).filter(RouteHelper.route_id == route_id).delete()
        for emp_id in data.helper_ids:
            db.add(RouteHelper(route_id=route_id, employee_id=emp_id))

    if data.stops is not None:
        db.query(RouteStop).filter(RouteStop.route_id == route_id).delete()
        for stop in data.stops:
            db.add(RouteStop(route_id=route_id, **stop.model_dump()))

    db.commit()
    return _load_route(db, route_id)


@router.delete("/{route_id}", status_code=204)
def delete_route(route_id: int, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Rota não encontrada")
    db.delete(route)
    db.commit()
