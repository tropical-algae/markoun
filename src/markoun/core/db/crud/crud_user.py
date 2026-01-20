import uuid

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.utils.security import get_password_hash, verify_password
from markoun.core.db.models import UserAccount


async def select_all_user(db: AsyncSession) -> list[UserAccount]:
    users = await db.exec(select(UserAccount))
    return list(users.all())


async def select_user_by_full_name(
    db: AsyncSession, full_name: str | None
) -> UserAccount | None:
    if full_name:
        user_result = await db.exec(
            select(UserAccount).where(
                UserAccount.full_name == full_name, UserAccount.is_active
            )
        )
        return user_result.first()
    return None


async def select_user_by_email(db: AsyncSession, email: str | None) -> UserAccount | None:
    if email:
        user_result = await db.exec(
            select(UserAccount).where(UserAccount.email == email, UserAccount.is_active)
        )
        return user_result.first()
    return None


async def insert_user(db: AsyncSession, user: UserAccount):
    user.password = get_password_hash(user.password)

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# async def update_user(db: AsyncSession, user_id: str, update_attr: dict) -> User | None:
#     user = await db.get(User, ident=user_id)
#     if user:
#         user.email = update_attr.get("email", user.email)
#         user.password = (
#             get_password_hash(update_attr["password"])
#             if update_attr.get("passwd")
#             else user.password
#         )
#         user.full_name = update_attr.get("full_name", user.full_name)

#         db.add(user)
#         await db.commit()
#         await db.refresh(user)
#         return user
#     return None
