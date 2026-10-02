from fastapi import FastAPI

app = FastAPI(
    title="Open Project API",
    description="Danh sách API của dự án Open Project",
    version="1.0.0",
    swagger_ui_parameters={"defaultModelsExpandDepth": -1},
)
