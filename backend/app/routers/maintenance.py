from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.maintenance import MaintenanceRecord, MaintenanceType
from app.schemas.maintenance import MaintenanceRecordCreate, MaintenanceRecordUpdate, MaintenanceRecordOut

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("/", response_model=List[MaintenanceRecordOut])
def list_maintenance(
    truck_id: Optional[int] = None,
    type: Optional[MaintenanceType] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
):
    q = db.query(MaintenanceRecord).options(
        joinedload(MaintenanceRecord.truck),
        joinedload(MaintenanceRecord.supplier),
    )
    if truck_id:
        q = q.filter(MaintenanceRecord.truck_id == truck_id)
    if type:
        q = q.filter(MaintenanceRecord.type == type)
    if date_from:
        q = q.filter(MaintenanceRecord.date >= date_from)
    if date_to:
        q = q.filter(MaintenanceRecord.date <= date_to)
    return q.order_by(MaintenanceRecord.date.desc()).all()


@router.get("/{record_id}", response_model=MaintenanceRecordOut)
def get_maintenance(record_id: int, db: Session = Depends(get_db)):
    record = db.query(MaintenanceRecord).options(
        joinedload(MaintenanceRecord.truck), joinedload(MaintenanceRecord.supplier)
    ).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return record


@router.post("/", response_model=MaintenanceRecordOut, status_code=201)
def create_maintenance(data: MaintenanceRecordCreate, db: Session = Depends(get_db)):
    record = MaintenanceRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return db.query(MaintenanceRecord).options(
        joinedload(MaintenanceRecord.truck), joinedload(MaintenanceRecord.supplier)
    ).filter(MaintenanceRecord.id == record.id).first()


@router.put("/{record_id}", response_model=MaintenanceRecordOut)
def update_maintenance(record_id: int, data: MaintenanceRecordUpdate, db: Session = Depends(get_db)):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(record, field, value)
    db.commit()
    return db.query(MaintenanceRecord).options(
        joinedload(MaintenanceRecord.truck), joinedload(MaintenanceRecord.supplier)
    ).filter(MaintenanceRecord.id == record_id).first()


@router.delete("/{record_id}", status_code=204)
def delete_maintenance(record_id: int, db: Session = Depends(get_db)):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    db.delete(record)
    db.commit()
