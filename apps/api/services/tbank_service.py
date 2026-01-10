import hashlib
import httpx
import logging
import os
from typing import Dict, Any, Optional
from uuid import uuid4
from ..settings import settings

logger = logging.getLogger(__name__)

# Режим провайдера: "tbank" или "fake"
# Production: используем реальный T-Bank API (securepay.tinkoff.ru работает!)
PAYMENT_MODE = os.getenv("PAYMENT_MODE", "tbank")

class TBankService:
    """
    Сервис для взаимодействия с эквайрингом Т-Банка (Тинькофф).
    
    Поддерживает fake режим для разработки и тестирования.
    """
    
    def __init__(self):
        self.terminal_key = settings.tbank_terminal_key
        self.secret_key = settings.tbank_secret_key
        self.api_url = settings.tbank_api_url
        logger.info(f"[TBankService] Initialized. Mode: {PAYMENT_MODE}")

    def _generate_token(self, data: Dict[str, Any]) -> str:
        """
        Генерирует токен безопасности для запросов Т-Банка.
        """
        # 1. Копируем данные и удаляем лишние поля
        # ВАЖНО: исключаем вложенные объекты (DATA, Receipt, Shops) - они не участвуют в подписи
        base_data = {k: v for k, v in data.items() if k not in ['Token', 'Shops', 'Receipt', 'DATA', 'Data']}
        
        # 2. Добавляем пароль (SecretKey)
        base_data['Password'] = self.secret_key
        
        # 3. Сортируем ключи по алфавиту
        sorted_keys = sorted(base_data.keys())
        
        # 4. Конкатенируем значения
        values_str = "".join(str(base_data[k]) for k in sorted_keys)
        
        # 5. SHA-256 хеш
        return hashlib.sha256(values_str.encode('utf-8')).hexdigest()

    async def init_payment(
        self, 
        order_id: str, 
        amount_rub: int, 
        description: str,
        customer_email: str,
        success_url: str = "https://app.zachet.tech/",
        fail_url: str = "https://app.zachet.tech/billing?status=fail"
    ) -> Optional[Dict[str, Any]]:
        """
        Инициализирует платеж в Т-Банке.
        
        В fake режиме возвращает mock данные для разработки.
        """
        logger.info(f"[TBankService] init_payment: order_id={order_id}, amount={amount_rub}, mode={PAYMENT_MODE}")
        
        # Fake режим для разработки
        if PAYMENT_MODE == "fake":
            logger.info("[TBankService] Using FAKE payment mode")
            fake_payment_id = f"FAKE-{uuid4().hex[:8]}"
            # Возвращаем URL который сразу редиректит на success
            fake_url = f"{success_url}?payment_id={fake_payment_id}&order_id={order_id}&status=demo"
            return {
                "Success": True,
                "PaymentId": fake_payment_id,
                "PaymentURL": fake_url,
                "OrderId": order_id,
                "Status": "NEW",
                "Mode": "demo"
            }
        
        if not self.terminal_key or not self.secret_key:
            logger.error("TBANK_TERMINAL_KEY or TBANK_SECRET_KEY is not set")
            return None

        payload = {
            "TerminalKey": self.terminal_key,
            "Amount": amount_rub * 100, # в копейках
            "OrderId": order_id,
            "Description": description,
            "SuccessURL": success_url,
            "FailURL": fail_url,
            "DATA": {
                "Email": customer_email
            }
        }

        payload["Token"] = self._generate_token(payload)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(f"{self.api_url}/Init", json=payload)
                response.raise_for_status()
                data = response.json()
                
                if data.get("Success"):
                    logger.info(f"[TBankService] Init success: PaymentId={data.get('PaymentId')}")
                    return data
                else:
                    logger.error(f"T-Bank Init failed: {data.get('Message')} ({data.get('Details')})")
                    return None
        except Exception as e:
            logger.error(f"Error calling T-Bank Init: {str(e)}")
            return None

    def check_token(self, data: Dict[str, Any]) -> bool:
        """
        Проверяет токен в уведомлении от Т-Банка.
        """
        # В fake режиме всегда возвращаем True
        if PAYMENT_MODE == "fake":
            return True
            
        received_token = data.get("Token")
        if not received_token:
            return False
        
        calculated_token = self._generate_token(data)
        return received_token == calculated_token

tbank_service = TBankService()
