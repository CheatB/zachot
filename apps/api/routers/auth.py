from fastapi import APIRouter, Depends, HTTPException
from ..database import SessionLocal, AuthTokenDB, User as UserDB
import secrets
import hashlib
from uuid import uuid4
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])

class TelegramAuthLink(BaseModel):
    link: str
    token: str

class EmailAuthRequest(BaseModel):
    email: EmailStr
    password: str
    referral_code: Optional[str] = None  # Реферальный код при регистрации

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/email/login")
async def email_login(auth_req: EmailAuthRequest):
    """
    Авторизация или регистрация по e-mail.
    Поддерживает реферальные коды при регистрации.
    """
    with SessionLocal() as session:
        user = session.query(UserDB).filter(UserDB.email == auth_req.email).first()
        
        hashed = hash_password(auth_req.password)
        
        if not user:
            # Регистрация нового пользователя
            referrer_id = None
            
            # Проверяем реферальный код
            if auth_req.referral_code:
                referrer = session.query(UserDB).filter(UserDB.referral_code == auth_req.referral_code).first()
                if referrer:
                    referrer_id = referrer.id
                    # Начисляем кредит рефереру
                    referrer.credits_balance += 1
                    referrer.referrals_count += 1
            
            # Генерируем уникальный реферальный код для нового пользователя
            new_ref_code = str(uuid4())[:8].upper()
            
            user = UserDB(
                email=auth_req.email,
                hashed_password=hashed,
                referral_code=new_ref_code,
                referred_by=referrer_id
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            return {"status": "success", "user_id": str(user.id), "token": str(user.id), "role": user.role, "message": "Registered"}
        
        # Проверка пароля
        if user.hashed_password != hashed:
            raise HTTPException(status_code=401, detail="Invalid password")
            
        return {"status": "success", "user_id": str(user.id), "token": str(user.id), "role": user.role, "message": "Logged in"}

@router.post("/telegram/link", response_model=TelegramAuthLink)
async def get_telegram_link():
    """
    Генерирует временный токен для авторизации через Telegram.
    """
    token = secrets.token_urlsafe(16)
    
    with SessionLocal() as session:
        auth_token = AuthTokenDB(
            token=token,
            user_id=None # При логине user_id пока неизвестен
        )
        session.add(auth_token)
        session.commit()
        
    bot_username = "zachot_tech_bot" 
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
            if not user:
                return {"status": "pending"}
            return {
                "status": "success", 
                "user_id": str(user.id),
                "role": user.role,
                "telegram_username": user.telegram_username
            }
        
        return {"status": "pending"}
