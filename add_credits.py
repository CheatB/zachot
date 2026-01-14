#!/usr/bin/env python3
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from apps.api.database import SessionLocal
from packages.database.src.models import User

session = SessionLocal()
try:
    user = session.query(User).filter(User.email == "nata@martsinkevich.ru").first()
    if user:
        old_balance = user.credits_balance
        user.credits_balance += 1000
        session.commit()
        print(f"✅ Добавлено 1000 кредитов. Было: {old_balance}, Стало: {user.credits_balance}")
    else:
        print("❌ Пользователь не найден")
finally:
    session.close()

