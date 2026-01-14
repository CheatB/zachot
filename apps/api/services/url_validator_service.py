"""
URL Validator Service
Сервис для проверки доступности и валидности URL источников.
"""

import aiohttp
import asyncio
import logging
import re
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class URLValidatorService:
    """Сервис для проверки доступности и валидности URL источников."""
    
    TIMEOUT = 10  # секунд на запрос
    MAX_CONCURRENT = 5  # максимум одновременных запросов
    
    # Доверенные домены (известные научные платформы)
    TRUSTED_DOMAINS = {
        'cyberleninka.ru',
        'elibrary.ru',
        'scholar.google.com',
        'scholar.google.ru',
        'arxiv.org',
        'researchgate.net',
        'jstor.org',
        'springer.com',
        'sciencedirect.com',
        'wiley.com',
        'nature.com',
        'science.org',
        'ieee.org',
        'acm.org',
        'pubmed.ncbi.nlm.nih.gov',
        'doi.org'
    }
    
    async def validate_url(self, url: str) -> Dict[str, Any]:
        """
        Проверяет доступность URL и извлекает метаданные.
        
        Args:
            url: URL для проверки
            
        Returns:
            {
                'is_valid': bool,  # Доступен ли URL
                'status_code': int,  # HTTP статус код
                'title': str,  # Заголовок страницы
                'error': str,  # Описание ошибки
                'is_trusted_domain': bool,  # Доверенный ли домен
                'redirect_url': str  # Финальный URL после редиректов
            }
        """
        if not url or not url.startswith(('http://', 'https://')):
            return {
                'is_valid': False,
                'status_code': None,
                'title': None,
                'error': 'Invalid URL format',
                'is_trusted_domain': False,
                'redirect_url': None
            }
        
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower().replace('www.', '')
            is_trusted = domain in self.TRUSTED_DOMAINS
            
            # Проверяем, что это не поисковая страница
            if self._is_search_page(url):
                return {
                    'is_valid': False,
                    'status_code': None,
                    'title': None,
                    'error': 'Search page URL (not a direct link)',
                    'is_trusted_domain': is_trusted,
                    'redirect_url': None
                }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    timeout=aiohttp.ClientTimeout(total=self.TIMEOUT),
                    allow_redirects=True,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                ) as response:
                    status_code = response.status
                    final_url = str(response.url)
                    
                    if status_code == 200:
                        # Пытаемся извлечь заголовок страницы
                        try:
                            content = await response.text()
                            title = self._extract_title(content)
                        except:
                            title = None
                        
                        return {
                            'is_valid': True,
                            'status_code': status_code,
                            'title': title,
                            'error': None,
                            'is_trusted_domain': is_trusted,
                            'redirect_url': final_url if final_url != url else None
                        }
                    elif status_code in [301, 302, 303, 307, 308]:
                        # Редирект (обработан автоматически)
                        return {
                            'is_valid': False,
                            'status_code': status_code,
                            'title': None,
                            'error': f'Redirect to {final_url}',
                            'is_trusted_domain': is_trusted,
                            'redirect_url': final_url
                        }
                    elif status_code == 404:
                        return {
                            'is_valid': False,
                            'status_code': status_code,
                            'title': None,
                            'error': 'Page not found (404)',
                            'is_trusted_domain': is_trusted,
                            'redirect_url': None
                        }
                    elif status_code == 403:
                        # Forbidden - может быть защита от ботов, считаем валидным если доверенный домен
                        return {
                            'is_valid': is_trusted,
                            'status_code': status_code,
                            'title': None,
                            'error': 'Access forbidden (403)' if not is_trusted else None,
                            'is_trusted_domain': is_trusted,
                            'redirect_url': None
                        }
                    else:
                        return {
                            'is_valid': False,
                            'status_code': status_code,
                            'title': None,
                            'error': f'HTTP {status_code}',
                            'is_trusted_domain': is_trusted,
                            'redirect_url': None
                        }
                        
        except asyncio.TimeoutError:
            logger.warning(f"Timeout validating URL: {url}")
            return {
                'is_valid': False,
                'status_code': None,
                'title': None,
                'error': 'Request timeout',
                'is_trusted_domain': False,
                'redirect_url': None
            }
        except aiohttp.ClientError as e:
            logger.warning(f"Client error validating URL {url}: {e}")
            return {
                'is_valid': False,
                'status_code': None,
                'title': None,
                'error': f'Connection error: {type(e).__name__}',
                'is_trusted_domain': False,
                'redirect_url': None
            }
        except Exception as e:
            logger.error(f"Unexpected error validating URL {url}: {e}", exc_info=True)
            return {
                'is_valid': False,
                'status_code': None,
                'title': None,
                'error': f'Validation error: {str(e)[:100]}',
                'is_trusted_domain': False,
                'redirect_url': None
            }
    
    def _is_search_page(self, url: str) -> bool:
        """Проверяет, является ли URL поисковой страницей."""
        search_patterns = [
            '/search?',
            '/search.php',
            '/query?',
            'google.com/search',
            'scholar.google.com/scholar?q=',
            'cyberleninka.ru/search?q=',
            'elibrary.ru/query'
        ]
        url_lower = url.lower()
        return any(pattern in url_lower for pattern in search_patterns)
    
    def _extract_title(self, html: str) -> Optional[str]:
        """Извлекает заголовок из HTML."""
        try:
            # Ищем <title>
            match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
            if match:
                title = match.group(1).strip()
                # Очищаем от лишних пробелов и переносов
                title = re.sub(r'\s+', ' ', title)
                return title[:300]  # Ограничиваем длину
            
            # Если нет title, ищем h1
            match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
            if match:
                title = re.sub(r'<[^>]+>', '', match.group(1))  # Убираем HTML теги
                title = re.sub(r'\s+', ' ', title).strip()
                return title[:300]
        except Exception as e:
            logger.debug(f"Error extracting title: {e}")
        
        return None
    
    async def validate_sources(self, sources: List[Dict]) -> List[Dict]:
        """
        Валидирует список источников параллельно.
        Добавляет поле 'validation' к каждому источнику.
        
        Args:
            sources: Список источников с полем 'url'
            
        Returns:
            Список источников с добавленным полем 'validation'
        """
        if not sources:
            return []
        
        logger.info(f"Starting validation of {len(sources)} sources...")
        
        # Создаём задачи для валидации
        tasks = []
        for source in sources:
            url = source.get('url', '')
            if url:
                tasks.append(self.validate_url(url))
            else:
                # Если нет URL, создаём пустой результат
                tasks.append(asyncio.sleep(0, result={
                    'is_valid': False,
                    'status_code': None,
                    'title': None,
                    'error': 'No URL provided',
                    'is_trusted_domain': False,
                    'redirect_url': None
                }))
        
        # Выполняем валидацию параллельно с ограничением
        results = []
        for i in range(0, len(tasks), self.MAX_CONCURRENT):
            batch = tasks[i:i + self.MAX_CONCURRENT]
            batch_results = await asyncio.gather(*batch, return_exceptions=True)
            results.extend(batch_results)
        
        # Добавляем результаты валидации к источникам
        validated_sources = []
        valid_count = 0
        
        for source, validation in zip(sources, results):
            source_copy = source.copy()
            
            if isinstance(validation, Exception):
                source_copy['validation'] = {
                    'is_valid': False,
                    'status_code': None,
                    'title': None,
                    'error': f'Exception: {str(validation)[:100]}',
                    'is_trusted_domain': False,
                    'redirect_url': None
                }
            else:
                source_copy['validation'] = validation
                if validation.get('is_valid'):
                    valid_count += 1
            
            validated_sources.append(source_copy)
        
        logger.info(f"Validation complete: {valid_count}/{len(sources)} sources are valid")
        
        return validated_sources
    
    def filter_valid_sources(
        self, 
        sources: List[Dict], 
        min_valid: int = 5,
        prefer_trusted: bool = True
    ) -> List[Dict]:
        """
        Фильтрует и сортирует источники по валидности.
        
        Args:
            sources: Список источников с полем 'validation'
            min_valid: Минимальное количество источников для возврата
            prefer_trusted: Предпочитать источники с доверенных доменов
            
        Returns:
            Отфильтрованный и отсортированный список источников
        """
        if not sources:
            return []
        
        # Разделяем на валидные и невалидные
        valid_sources = []
        invalid_sources = []
        
        for source in sources:
            validation = source.get('validation', {})
            if validation.get('is_valid', False):
                valid_sources.append(source)
            else:
                invalid_sources.append(source)
        
        # Сортируем валидные: сначала доверенные домены
        if prefer_trusted:
            valid_sources.sort(
                key=lambda s: (
                    not s.get('validation', {}).get('is_trusted_domain', False),
                    s.get('title', '')
                )
            )
        
        # Если валидных достаточно, возвращаем только их
        if len(valid_sources) >= min_valid:
            logger.info(f"Returning {len(valid_sources)} valid sources")
            return valid_sources
        
        # Если валидных мало, добавляем невалидные с доверенных доменов
        trusted_invalid = [
            s for s in invalid_sources 
            if s.get('validation', {}).get('is_trusted_domain', False)
        ]
        
        combined = valid_sources + trusted_invalid
        
        if len(combined) >= min_valid:
            logger.warning(f"Only {len(valid_sources)} valid sources, adding {len(trusted_invalid)} from trusted domains")
            return combined[:min_valid + 3]  # Возвращаем чуть больше минимума
        
        # Если и этого мало, возвращаем все
        logger.warning(f"Only {len(valid_sources)} valid sources found, returning all {len(sources)}")
        return valid_sources + invalid_sources


# Singleton instance
url_validator_service = URLValidatorService()

