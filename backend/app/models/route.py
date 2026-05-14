from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    total_km = Column(Numeric(10, 2), default=0)
    total_revenue = Column(Numeric(10, 2), default=0)
    notes = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    truck = relationship("Truck", back_populates="routes")
    driver = relationship("Employee", back_populates="driven_routes", foreign_keys=[driver_id])
    helpers = relationship("RouteHelper", back_populates="route", cascade="all, delete-orphan")
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan", order_by="RouteStop.stop_order")
    other_expenses = relationship("OtherExpense", back_populates="route", cascade="all, delete-orphan")


class RouteHelper(Base):
    __tablename__ = "route_helpers"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)

    route = relationship("Route", back_populates="helpers")
    employee = relationship("Employee", back_populates="route_helpers")


class OtherExpense(Base):
    __tablename__ = "other_expenses"
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(200), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False, default=0)
    category = Column(String(30), default="outros")
    route = relationship("Route", back_populates="other_expenses")

class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    stop_order = Column(Integer, default=1)
    value = Column(Numeric(10, 2), default=0)
    notes = Column(String(300))

    route = relationship("Route", back_populates="stops")
    client = relationship("Client", back_populates="route_stops")
