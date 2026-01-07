from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Header
from ..schemas import UsersAdminResponse, UserRoleUpdateRequest, UserAdminResponse
from ..database import SessionLocal, User as UserDB
from .generations import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

def require_admin(user: UserDB = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("/users", response_model=UsersAdminResponse)
async def list_users(admin: UserDB = Depends(require_admin)):
    with SessionLocal() as session:
        users = session.query(UserDB).all()
        return UsersAdminResponse(items=[
            UserAdminResponse(
                id=user.id,
                email=user.email,
                role=user.role,
                created_at=user.next_billing_date, # For MVP we use this as reg date proxy
                generations_used=user.generations_used,
                generations_limit=user.generations_limit,
                tokens_used=user.tokens_used,
                tokens_limit=user.tokens_limit,
                subscription_status=user.subscription_status
            ) for user in users
        ])

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: UUID, 
    request: UserRoleUpdateRequest, 
    admin: UserDB = Depends(require_admin)
):
    with SessionLocal() as session:
        user = session.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.role = request.role
        session.commit()
        return {"status": "success", "role": user.role}

