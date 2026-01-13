import logging
from uuid import UUID
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from .database import SessionLocal, get_db, User as UserDB
from packages.database.src.models import AuthToken

logger = logging.getLogger(__name__)

def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> UserDB:
    """
    Dependency to get the current authenticated user.
    """
    # Default mock for local testing if needed, but in production we want strict check
    user_id = None
    
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            # First check if it's a direct UUID (legacy/simple auth)
            user_id = UUID(token)
            user = db.query(UserDB).filter(UserDB.id == user_id).first()
            if user:
                return user
        except ValueError:
            # Not a UUID, check as AuthToken
            auth_token = db.query(AuthToken).filter(AuthToken.token == token).first()
            if auth_token and auth_token.user_id:
                user = db.query(UserDB).filter(UserDB.id == auth_token.user_id).first()
                if user:
                    return user

    # If no user found, we could auto-create for MVP or raise 401
    # For now, let's keep it somewhat permissive but log it
    logger.warning(f"Unauthorized access attempt with token: {authorization[:20] if authorization else 'None'}")
    raise HTTPException(status_code=401, detail="Unauthorized")

def require_admin(user: UserDB = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


