from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models  # noqa: F401 — garante que todos os models são registrados
from app.routers import trucks, employees, clients, suppliers, routes, fuel, maintenance, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(title="7Ouro Logistics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trucks.router)
app.include_router(employees.router)
app.include_router(clients.router)
app.include_router(suppliers.router)
app.include_router(routes.router)
app.include_router(fuel.router)
app.include_router(maintenance.router)
app.include_router(dashboard.router)


@app.get("/health")
def health():
    return {"status": "ok"}
