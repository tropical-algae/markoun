from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.common.config import settings
from markoun.common.logging import logger
from markoun.core.db.models import *

local_engine = create_async_engine(
    url=settings.SQL_DATABASE_URI,
    pool_pre_ping=settings.SQL_POOL_PRE_PING,
    pool_size=settings.SQL_POOL_SIZE,
    max_overflow=settings.SQL_MAX_OVERFLOW,
    pool_timeout=settings.SQL_POOL_TIMEOUT,
    pool_recycle=settings.SQL_POOL_RECYCLE,
    echo=settings.DEBUG,
)
LocalSession = async_sessionmaker(
    autocommit=False, autoflush=False, bind=local_engine, class_=AsyncSession
)


async def init_db_models():
    logger.info("Check SQL table structure and fix the missing.")
    async with local_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
