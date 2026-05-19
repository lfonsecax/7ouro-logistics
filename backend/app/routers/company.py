from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.company import CompanyProfile
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/company", tags=["company"])


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    vat_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None


class CompanyOut(BaseModel):
    id: int
    name: str
    address: str
    city: str
    zip_code: str
    vat_id: str
    phone: str
    email: str
    logo_url: str

    model_config = {"from_attributes": True}


def _get_or_create(db: Session) -> CompanyProfile:
    profile = db.query(CompanyProfile).filter(CompanyProfile.id == 1).first()
    if not profile:
        profile = CompanyProfile(id=1)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/profile", response_model=CompanyOut)
def get_profile(db: Session = Depends(get_db)):
    return _get_or_create(db)


@router.put("/profile", response_model=CompanyOut)
def update_profile(data: CompanyUpdate, db: Session = Depends(get_db)):
    profile = _get_or_create(db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
