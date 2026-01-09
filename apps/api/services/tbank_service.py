import hashlib
import httpx
import logging
from typing import Dict, Any, Optional
from ..settings import settings

logger = logging.getLogger(__name__)

class TBankService:
    """
    Сервис для взаимодействия с эквайрингом Т-Банка (Тинькофф).
    """
    
    def __init__(self):
        self.terminal_key = settings.tbank_terminal_key
        self.secret_key = settings.tbank_secret_key
        self.api_url = settings.tbank_api_url

    def _generate_token(self, data: Dict[str, Any]) -> str:
        """
        Генерирует токен безопасности для запросов Т-Банка.
        """
        # 1. Копируем данные и удаляем лишние поля
        base_data = {k: v for k, v in data.items() if k not in ['Token', 'Shops', 'Receipt', 'Data']}
        
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
        success_url: str = "https://app.zachet.tech/billing?status=success",
        fail_url: str = "https://app.zachet.tech/billing?status=fail"
    ) -> Optional[Dict[str, Any]]:
        """
        Инициализирует платеж в Т-Банке.
        """
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
        received_token = data.get("Token")
        if not received_token:
            return False
        
        calculated_token = self._generate_token(data)
        return received_token == calculated_token

tbank_service = TBankService()

