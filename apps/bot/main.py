import asyncio
import logging
import sys
from os import getenv
from datetime import datetime

from aiogram import Bot, Dispatcher, html
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart, Command
from aiogram.types import Message
from dotenv import load_dotenv

from db import SessionLocal, User, AuthToken

# Load environment variables
load_dotenv()

TOKEN = getenv("BOT_TOKEN")
dp = Dispatcher()

@dp.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    """
    Handler for /start command. Supports auth tokens: /start auth_token_here
    """
    args = message.text.split()
    
    if len(args) > 1:
        token_str = args[1]
        with SessionLocal() as session:
            # 1. Находим токен в базе
            auth_token = session.query(AuthToken).filter(AuthToken.token == token_str, AuthToken.is_used == 0).first()
            
            if auth_token:
                # 2. Находим пользователя
                user = session.query(User).filter(User.id == auth_token.user_id).first()
                if user:
                    # 3. Привязываем Telegram
                    user.telegram_id = str(message.from_user.id)
                    user.telegram_username = message.from_user.username
                    auth_token.is_used = 1
                    session.commit()
                    
                    await message.answer(
                        f"✅ {html.bold('Успешная авторизация!')}\n\n"
                        f"Ваш аккаунт привязан к Telegram. Теперь вы можете использовать все возможности сервиса {html.link('Зачёт', 'https://zachet.tech')}."
                    )
                    return
            
            await message.answer("❌ Ошибка: неверный или просроченный токен авторизации.")
            return

    await message.answer(
        f"Привет, {html.bold(message.from_user.full_name)}!\n\n"
        f"Я бот сервиса {html.link('Зачёт', 'https://zachet.tech')}.\n"
        f"Здесь вы можете авторизоваться и следить за состоянием своих генераций."
    )

@dp.message(Command("me"))
async def command_me_handler(message: Message) -> None:
    """
    Handler for /me command to show user status.
    """
    with SessionLocal() as session:
        user = session.query(User).filter(User.telegram_id == str(message.from_user.id)).first()
        if user:
            remaining = user.generations_limit - user.generations_used
            await message.answer(
                f"👤 {html.bold('Ваш профиль')}\n\n"
                f"Email: {user.email}\n"
                f"Осталось генераций: {html.bold(str(remaining))}\n"
                f"Всего использовано: {user.generations_used}"
            )
        else:
            await message.answer("Вы еще не авторизованы. Пожалуйста, войдите в свой аккаунт на сайте.")

async def main() -> None:
    if not TOKEN:
        logging.error("BOT_TOKEN environment variable is not set.")
        return

    bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    asyncio.run(main())
