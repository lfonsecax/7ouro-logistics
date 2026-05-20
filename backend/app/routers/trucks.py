from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.truck import Truck
from app.schemas.truck import TruckCreate, TruckUpdate, TruckOut

router = APIRouter(prefix="/trucks", tags=["trucks"])


@router.get("", response_model=List[TruckOut])
def list_trucks(db: Session = Depends(get_db)):
    return db.query(Truck).order_by(Truck.plate).all()


@router.get("/{truck_id}", response_model=TruckOut)
def get_truck(truck_id: int, db: Session = Depends(get_db)):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Caminhão não encontrado")
    return truck


@router.post("", response_model=TruckOut, status_code=201)
def create_truck(data: TruckCreate, db: Session = Depends(get_db)):
    existing = db.query(Truck).filter(Truck.plate == data.plate).first()
    if existing:
        raise HTTPException(status_code=400, detail="Placa já cadastrada")
    truck = Truck(**data.model_dump())
    db.add(truck)
    db.commit()
    db.refresh(truck)
    return truck


@router.put("/{truck_id}", response_model=TruckOut)
def update_truck(truck_id: int, data: TruckUpdate, db: Session = Depends(get_db)):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Caminhão não encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(truck, field, value)
    db.commit()
    db.refresh(truck)
    return truck


@router.delete("/{truck_id}", status_code=204)
def delete_truck(truck_id: int, db: Session = Depends(get_db)):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Caminhão não encontrado")
    db.delete(truck)
    db.commit()
