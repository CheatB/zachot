from fastapi import APIRouter, Depends, HTTPException, Header
from ..database import SessionLocal, AuthTokenDB, User as UserDB
from .generations import get_current_user
import secrets
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class TelegramAuthLink(BaseModel):
    link: str
    token: str

@router.post("/telegram/link", response_model=TelegramAuthLink)
async def get_telegram_link(user: UserDB = Depends(get_current_user)):
    """
    Генерирует временный токен для привязки Telegram бота.
    """
    token = secrets.token_urlsafe(16)
    
    with SessionLocal() as session:
        auth_token = AuthTokenDB(
            token=token,
            user_id=user.id
        )
        session.add(auth_token)
        session.commit()
        
    bot_username = "ZachetBot" # В будущем заменить на реальный юзернейм бота
    return TelegramAuthLink(
        link=f"https://t.me/{bot_username}?start={token}",
        token=token
    )

@router.get("/telegram/check/{token}")
async def check_telegram_auth(token: str):
    """
    Проверяет, был ли токен использован для авторизации.
    """
    with SessionLocal() as session:
        auth_token = session.query(AuthTokenDB).filter(AuthTokenDB.token == token).first()
        if not auth_token:
            raise HTTPException(status_code=404, detail="Token not found")
        
        if auth_token.is_used == 1:
            # Получаем пользователя для возврата его данных (опционально)
            user = session.query(UserDB).filter(UserDB.id == auth_token.user_id).first()
            return {"status": "success", "user_id": str(user.id)}
        
        return {"status": "pending"}

