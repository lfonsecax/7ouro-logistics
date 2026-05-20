from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.fuel import FuelRecord
from app.schemas.fuel import FuelRecordCreate, FuelRecordUpdate, FuelRecordOut

router = APIRouter(prefix="/fuel", tags=["fuel"])


@router.get("", response_model=List[FuelRecordOut])
def list_fuel(
    truck_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
):
    q = db.query(FuelRecord).options(
        joinedload(FuelRecord.truck),
        joinedload(FuelRecord.supplier),
    )
    if truck_id:
        q = q.filter(FuelRecord.truck_id == truck_id)
    if date_from:
        q = q.filter(FuelRecord.date >= date_from)
    if date_to:
        q = q.filter(FuelRecord.date <= date_to)
    return q.order_by(FuelRecord.date.desc()).all()


@router.get("/{record_id}", response_model=FuelRecordOut)
def get_fuel(record_id: int, db: Session = Depends(get_db)):
    record = db.query(FuelRecord).options(
        joinedload(FuelRecord.truck), joinedload(FuelRecord.supplier)
    ).filter(FuelRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return record


@router.post("", response_model=FuelRecordOut, status_code=201)
def create_fuel(data: FuelRecordCreate, db: Session = Depends(get_db)):
    record = FuelRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return db.query(FuelRecord).options(
        joinedload(FuelRecord.truck), joinedload(FuelRecord.supplier)
    ).filter(FuelRecord.id == record.id).first()


@router.put("/{record_id}", response_model=FuelRecordOut)
def update_fuel(record_id: int, data: FuelRecordUpdate, db: Session = Depends(get_db)):
    record = db.query(FuelRecord).filter(FuelRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(record, field, value)
    db.commit()
    return db.query(FuelRecord).options(
        joinedload(FuelRecord.truck), joinedload(FuelRecord.supplier)
    ).filter(FuelRecord.id == record_id).first()


@router.delete("/{record_id}", status_code=204)
def delete_fuel(record_id: int, db: Session = Depends(get_db)):
    record = db.query(FuelRecord).filter(FuelRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    db.delete(record)
    db.commit()
