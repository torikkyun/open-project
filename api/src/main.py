from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.v1.router import router as v1_router
from src.infra.settings import settings

app = FastAPI(
    title="Open Project API",
    description="Danh sách API của dự án Open Project",
    version="1.0.0",
    swagger_ui_parameters={
        "defaultModelsExpandDepth": -1,
        "withCredentials": True,
    },
)


@app.middleware("http")
async def verify_origin(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        origin = request.headers.get("origin")
        same_origin = (
            origin == f"{request.url.scheme}://{request.url.netloc}"
            if origin is not None
            else False
        )
        if (
            origin is not None
            and origin not in settings.cors_origins
            and not same_origin
        ):
            return JSONResponse({"detail": "Origin không hợp lệ"}, status_code=403)
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(v1_router, prefix="/api/v1")
