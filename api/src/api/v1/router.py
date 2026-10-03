from fastapi import APIRouter

from src.modules.auth.router import router as auth_router
from src.modules.projects.router import router as projects_router
from src.modules.tasks.router import router as tasks_router
from src.modules.users.router import router as users_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(users_router)
router.include_router(projects_router)
router.include_router(tasks_router)
