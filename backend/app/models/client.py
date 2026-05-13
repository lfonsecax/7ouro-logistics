from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(300))
    city = Column(String(100))
    phone = Column(String(20))
    email = Column(String(150))
    notes = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    route_stops = relationship("RouteStop", back_populates="client")
