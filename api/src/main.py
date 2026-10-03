from fastapi import FastAPI

from src.api.v1.router import router as v1_router

app = FastAPI(
    title="Open Project API",
    description="Danh sách API của dự án Open Project",
    version="1.0.0",
    swagger_ui_parameters={"defaultModelsExpandDepth": -1},
)

app.include_router(v1_router, prefix="/api/v1")
