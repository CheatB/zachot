import sys
import hashlib
import os
from uuid import uuid4
from datetime import datetime
from dotenv import load_dotenv

# Define project root
project_root = '/home/deploy/zachot'
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Load env before importing settings
load_dotenv(os.path.join(project_root, 'apps/api/.env'))

# Import models directly from packages to avoid path ambiguity
from packages.database.src.models import User as UserDB
from apps.api.database import SessionLocal

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_admin(email, password):
    hashed = hash_password(password)
    
    with SessionLocal() as session:
        user = session.query(UserDB).filter(UserDB.email == email).first()
        
        if user:
            print(f"User {email} exists. Updating to admin and setting password.")
            user.role = "admin"
            user.hashed_password = hashed
            # Ensure it has basic limits
            user.credits_balance = 9999
            user.generations_limit = 9999
        else:
            print(f"Creating new admin user: {email}")
            user = UserDB(
                id=uuid4(),
                email=email,
                role="admin",
                hashed_password=hashed,
                plan_name="ADMIN",
                subscription_status="active",
                monthly_price_rub=0,
                credits_balance=9999,
                credits_used=0,
                generations_used=0,
                generations_limit=9999,
                tokens_used=0,
                tokens_limit=1000000,
                next_billing_date=datetime(2099, 1, 1)
            )
            session.add(user)
        
        session.commit()
        print("Done.")

if __name__ == "__main__":
    os.environ["ENV"] = "prod"
    create_admin("nata@martsinkevich.ru", "13A119b27")
