import asyncio
import logging
import sys
from os import getenv
from datetime import datetime
from uuid import uuid4

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
    logging.info(f"Received start command from {message.from_user.id}: {message.text}")
    args = message.text.split()
    
    if len(args) > 1:
        token_str = args[1]
        logging.info(f"Processing auth token: {token_str}")
        try:
            with SessionLocal() as session:
                # 1. Находим токен в базе
                auth_token = session.query(AuthToken).filter(AuthToken.token == token_str).first()
                
                if auth_token:
                    logging.info(f"Found token in DB. is_used: {auth_token.is_used}")
                    if auth_token.is_used == 1:
                        await message.answer(f"⚠️ Этот токен уже был использован.")
                        return
                    
                    # 2. Ищем пользователя по Telegram ID или по привязанному user_id
                    tg_id_str = str(message.from_user.id)
                    user = None
                    
                    if auth_token.user_id:
                        logging.info(f"Token has user_id: {auth_token.user_id}")
                        user = session.query(User).filter(User.id == auth_token.user_id).first()
                    else:
                        logging.info(f"Token has no user_id, looking up by tg_id: {tg_id_str}")
                        user = session.query(User).filter(User.telegram_id == tg_id_str).first()
                    
                    # 3. Если пользователя нет — создаем его
                    if not user:
                        user = User(
                            id=uuid4(),
                            email=f"tg_{message.from_user.id}@zachet.tech",
                            telegram_id=tg_id_str,
                            telegram_username=message.from_user.username
                        )
                        session.add(user)
                        logging.info(f"Created new user: {user.id}")
                    else:
                        # Обновляем данные если нужно
                        user.telegram_id = tg_id_str
                        user.telegram_username = message.from_user.username
                        logging.info(f"Using existing user: {user.id}")
                    
                    # Привязываем пользователя к токену для фронтенда
                    auth_token.user_id = user.id
                    auth_token.is_used = 1
                    session.commit()
                    logging.info(f"Auth successful for user {user.id}")
                    
                    await message.answer(
                        f"✅ {html.bold('Успешная авторизация!')}\n\n"
                        f"Вы вошли в сервис {html.link('Зачёт', 'https://zachet.tech')}. Можете вернуться в браузер."
                    )
                    return
                else:
                    logging.warning(f"Token {token_str} NOT FOUND in database.")
                    await message.answer(f"❌ Ошибка: токен не найден.\nПожалуйста, обновите страницу входа на сайте и попробуйте еще раз.")
                    return
        except Exception as e:
            logging.error(f"Error during auth processing: {e}", exc_info=True)
            await message.answer("❌ Произошла техническая ошибка при авторизации. Мы уже работаем над этим.")
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
    tg_id_str = str(message.from_user.id)
    with SessionLocal() as session:
        user = session.query(User).filter(User.telegram_id == tg_id_str).first()
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
    logging.info(f"Bot starting... ID: {TOKEN.split(':')[0]}")
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, stream=sys.stdout)
    asyncio.run(main())
