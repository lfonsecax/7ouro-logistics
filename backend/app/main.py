from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.database import engine, Base
import app.models  # noqa: F401 — garante que todos os models são registrados
from app.routers import trucks, employees, clients, suppliers, routes, fuel, maintenance, dashboard

app = FastAPI(title="7Ouro Logistics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"[422] {request.method} {request.url.path} — {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"DB init warning: {e}")

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
