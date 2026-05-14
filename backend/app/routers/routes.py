from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.route import Route, RouteHelper, RouteStop, OtherExpense
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
            joinedload(Route.other_expenses),
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
            joinedload(Route.other_expenses),
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

    for exp in data.other_expenses:
        db.add(OtherExpense(route_id=route.id, description=exp.description, amount=exp.amount, category=exp.category))

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

    if data.other_expenses is not None:
        db.query(OtherExpense).filter(OtherExpense.route_id == route_id).delete()
        for exp in data.other_expenses:
            db.add(OtherExpense(route_id=route_id, description=exp.description, amount=exp.amount, category=exp.category))

    if data.helper_ids is not None:
        db.query(RouteHelper).filter(RouteHelper.route_id == route_id).delete()
        for emp_id in data.helper_ids:
            db.add(RouteHelper(route_id=route_id, employee_id=emp_id))

    if data.stops is not None:
        db.query(RouteStop).filter(RouteStop.route_id == route_id).delete()
        for exp in data.other_expenses:
        db.add(OtherExpense(route_id=route.id, description=exp.description, amount=exp.amount, category=exp.category))

    for stop in data.stops:
            db.add(RouteStop(route_id=route_id, **stop.model_dump()))

    db.commit()
    return _load_route(db, route_id)



@router.get("/{route_id}/invoice")
def generate_invoice(route_id: int, db: Session = Depends(get_db)):
    route = _load_route(db, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Rota nao encontrada")
    from fastapi.responses import Response
    plate = route.truck.plate if route.truck else "N/D"
    driver = route.driver.name if route.driver else "N/D"
    cname = route.stops[0].client.name if route.stops and route.stops[0].client else "Cliente"
    rev = float(route.total_revenue or 0)
    iva = round(rev * 0.21, 2)
    total = round(rev + iva, 2)
    sh = ""
    for s in route.stops:
        sn = s.client.name if s.client else "Cliente"
        sv = float(s.value or 0)
        sh += f"<tr><td>{sn}</td><td style='text-align:right'>{sv:.2f} EUR</td></tr>"
    styles = """
body { font-family: Arial; padding: 40px; max-width: 700px; margin: auto; color: #333; }
h1 { color: #1a3c6e; border-bottom: 3px solid #1a3c6e; padding-bottom: 8px; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th { background: #1a3c6e; color: white; padding: 10px; text-align: left; }
td { padding: 8px; border-bottom: 1px solid #ddd; }
.gtotal { font-size: 20px; font-weight: bold; color: #1a3c6e; }
.foot { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
"""
    html = f"""<html><head><meta charset="utf-8"><title>Fatura</title><style>{styles}</style></head><body>
<h1>FATURA</h1>
<p><strong>7Ouro Logistics</strong><br>Manises, Valencia</p>
<p><strong>Cliente:</strong> {cname}<br>
<strong>Fatura:</strong> FAT-{str(route.id).zfill(4)} | <strong>Data:</strong> {route.date}</p>
<p><strong>Caminhao:</strong> {plate} | <strong>Motorista:</strong> {driver}</p>
<table><tr><th>Descricao</th><th>Valor</th></tr>{sh}</table>
<p style="text-align:right;margin-top:25px">
Subtotal: {rev:.2f} EUR<br>
IVA 21%: {iva:.2f} EUR<br>
<span class="gtotal">Total: {total:.2f} EUR</span></p>
<div class="foot">7Ouro Logistics</div>
</body></html>"""
    return Response(content=html, media_type="text/html")


@router.delete("/{route_id}", status_code=204)
def delete_route(route_id: int, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Rota não encontrada")
    db.delete(route)
    db.commit()
