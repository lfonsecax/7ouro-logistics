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
    route_data = data.model_dump(exclude={"helper_ids", "stops", "other_expenses"})
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
        if data.other_expenses:
            for exp in data.other_expenses:
                db.add(OtherExpense(route_id=route.id, description=exp.description, amount=exp.amount, category=exp.category))

    if data.stops:
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


def _fmt_date(d: date) -> str:
    return f"{d.day:02d}-{d.month:02d}-{d.year}"


def _next_invoice_number(db: Session) -> int:
    from sqlalchemy import text as sa_text
    result = db.execute(
        sa_text("UPDATE invoice_sequence SET last_number = last_number + 1 WHERE id = 1 RETURNING last_number")
    )
    return result.scalar()


@router.get("/invoice/by-client")
def invoice_by_client(
    client_id: int,
    date_from: date,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
):
    from fastapi.responses import Response
    from app.models.client import Client as ClientModel
    from app.models.company import CompanyProfile
    import datetime

    client = db.query(ClientModel).filter(ClientModel.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")

    # Date range
    end = date_to or date_from

    routes = (
        db.query(Route)
        .options(
            joinedload(Route.truck),
            joinedload(Route.driver),
            joinedload(Route.helpers).joinedload(RouteHelper.employee),
            joinedload(Route.stops).joinedload(RouteStop.client),
            joinedload(Route.other_expenses),
        )
        .filter(Route.date >= date_from, Route.date <= end)
        .order_by(Route.date)
        .all()
    )
    # Filtrar rotas que têm uma parada com este cliente
    client_routes = [r for r in routes if any(s.client_id == client_id for s in (r.stops or []))]
    if not client_routes:
        raise HTTPException(status_code=404, detail="Nenhuma rota encontrada para este cliente no período")

    total_revenue = sum(float(r.total_revenue or 0) for r in client_routes)
    total_km = sum(float(r.total_km or 0) for r in client_routes)

    # Buscar dados da empresa
    company = db.query(CompanyProfile).filter(CompanyProfile.id == 1).first()

    # Número sequencial
    inv_num = _next_invoice_number(db)
    db.commit()

    rows = ""
    for i, r in enumerate(client_routes, 1):
        plate = r.truck.plate if r.truck else f"#{r.truck_id}"
        driver = r.driver.name if r.driver else "N/D"
        rev = float(r.total_revenue or 0)
        km = float(r.total_km or 0)
        conceito = r.conceito or f"Transporte - {plate}"
        iva_row = round(rev * 0.21, 2)
        total_row = round(rev + iva_row, 2)
        rows += f"""<tr>
  <td style='text-align:center'>{_fmt_date(r.date)}</td>
  <td>{conceito}</td>
  <td style='text-align:right'>{rev:.2f}</td>
  <td style='text-align:right'>{iva_row:.2f}</td>
  <td style='text-align:right'>{total_row:.2f}</td>
</tr>"""

    styles = """body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: auto; color: #333; }
.header-empresa { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
.header-empresa .left h1 { color: #1a3c6e; margin: 0 0 4px 0; }
.header-empresa .left p { margin: 0; font-size: 12px; color: #555; }
.header-empresa .right { text-align: right; font-size: 12px; color: #555; }
h2 { color: #1a3c6e; border-bottom: 3px solid #1a3c6e; padding-bottom: 8px; margin-top: 0; }
table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
th { background: #1a3c6e; color: white; padding: 10px 8px; text-align: left; font-size: 12px; }
td { padding: 8px; border-bottom: 1px solid #ddd; }
tr:nth-child(even) { background: #f9f9f9; }
.resumo { margin-top: 25px; text-align: right; font-size: 14px; line-height: 1.8; }
.gtotal { font-size: 22px; font-weight: bold; color: #1a3c6e; }
.foot { margin-top: 50px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }
.btn-print { display: block; width: 200px; margin: 20px auto; padding: 12px 0; background: #1a3c6e; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; text-align: center; }
.btn-print:hover { background: #14305a; }
@media print { .btn-print { display: none; } body { padding: 20px; } }"""

    cname = company.name if company else "7Ouro Logistics"
    caddr = company.address or ""
    ccity = company.city or ""
    czip = company.zip_code or ""
    cvat = company.vat_id or ""
    cphone = company.phone or ""
    cemail = company.email or ""

    iva_total = round(total_revenue * 0.21, 2)
    grand_total = round(total_revenue + iva_total, 2)

    html = f"""<html><head><meta charset="utf-8"><title>Fatura #{inv_num:04d} - {client.name}</title><style>{styles}</style></head><body>
<button class="btn-print" onclick="window.print()">📄 Download PDF / Imprimir</button>
<div class="header-empresa">
  <div class="left">
    <h1>{cname}</h1>
    <p>{caddr}{', ' + ccity if ccity else ''}{' - ' + czip if czip else ''}</p>
    <p>{'NIF: ' + cvat if cvat else ''}{' | Tel: ' + cphone if cphone else ''}{' | ' + cemail if cemail else ''}</p>
  </div>
  <div class="right">
    <p><strong>FATURA</strong></p>
    <p>Nº {inv_num:04d}</p>
    <p>{_fmt_date(date_from)} a {_fmt_date(end)}</p>
  </div>
</div>

<h2>Cliente: {client.name}{' | CIF: ' + client.cif if client.cif else ''}</h2>

<table>
  <tr><th>Dia</th><th>Conceito</th><th>Preço</th><th>IVA 21%</th><th>Total</th></tr>
  {rows}
</table>

<div class="resumo">
  <p>Subtotal: <strong>{total_revenue:.2f} EUR</strong></p>
  <p>IVA 21%: {iva_total:.2f} EUR</p>
  <p class="gtotal">Total: {grand_total:.2f} EUR</p>
  <p style='color:#666;font-size:13px'>Total KM: {total_km:.1f} km | Rotas: {len(client_routes)}</p>
</div>

<div class="foot">{cname} — Gerado em {datetime.date.today().isoformat()}</div>
<script>(function(){{ setTimeout(function(){{ document.querySelector('.btn-print')?.scrollIntoView({{ behavior:'smooth', block:'center' }}); }}, 100); }})();</script>
</body></html>"""
    return Response(content=html, media_type="text/html")


@router.delete("/{route_id}", status_code=204)
def delete_route(route_id: int, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Rota não encontrada")
    db.delete(route)
    db.commit()
