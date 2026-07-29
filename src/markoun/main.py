import uvicorn
from fastapi import FastAPI

from markoun.app.api.routers import router as api_router
from markoun.app.static import mount_web_app
from markoun.app.utils.errors import add_exception_handler
from markoun.app.utils.events import add_middleware, lifespan
from markoun.common.config import settings
from markoun.common.logging import intercept_std_logging


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        debug=settings.DEBUG,
        version=settings.VERSION,
        lifespan=lifespan,
    )
    application.include_router(api_router, prefix=settings.API_PREFIX)
    add_middleware(app=application)
    add_exception_handler(app=application)
    mount_web_app(
        application,
        settings.WEB_ROOT,
        api_prefix=settings.API_PREFIX,
    )
    return application


app = create_app()


def run() -> None:
    config = uvicorn.Config(
        "markoun.main:app",
        host=settings.HOST,
        port=settings.PORT,
        workers=settings.WORKERS,
        access_log=True,
        # reload=True,
    )
    server = uvicorn.Server(config)
    intercept_std_logging()
    server.run()


if __name__ == "__main__":
    run()
