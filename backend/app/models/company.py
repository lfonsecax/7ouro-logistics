from sqlalchemy import Column, Integer, String
from app.database import Base


class CompanyProfile(Base):
    __tablename__ = "company_profile"

    id = Column(Integer, primary_key=True, default=1)
    name = Column(String(150), default="7Ouro Logistics")
    address = Column(String(300), default="")
    city = Column(String(100), default="")
    zip_code = Column(String(20), default="")
    vat_id = Column(String(50), default="")
    phone = Column(String(20), default="")
    email = Column(String(150), default="")
    logo_url = Column(String(500), default="")
