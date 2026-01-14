# Технологический стек проекта "Зачёт"

## Frontend

### Основные технологии
- **React 18.3.0** - UI библиотека
- **TypeScript 5.4.0** - типизированный JavaScript
- **Vite 5.2.0** - сборщик и dev-сервер
- **React Router DOM 7.11.0** - маршрутизация

### UI библиотеки и компоненты
- **Framer Motion 11.0.0** - анимации
- **KaTeX 0.16.27** - рендеринг математических формул
- **React Dropzone 14.3.8** - загрузка файлов
- **Zustand 5.0.9** - управление состоянием
- **clsx 2.1.0** - условные CSS классы

### Инструменты разработки
- **ESLint** - линтер кода
- **Prettier** - форматирование кода
- **TypeScript ESLint** - правила для TypeScript

## Backend

### Основной фреймворк
- **FastAPI** - современный Python веб-фреймворк
- **Uvicorn** - ASGI сервер
- **Python 3.x** - язык программирования

### База данных
- **SQLAlchemy** - ORM для работы с БД
- **PostgreSQL** (psycopg2-binary) - основная БД
- **SQLite** - для разработки/тестирования

### Аутентификация и безопасность
- **JWT токены** - для авторизации
- **CORS Middleware** - для кросс-доменных запросов

### Платежи
- **T-Bank API** - интеграция с платежной системой
- **Fake Payment Provider** - для разработки/тестирования

## Telegram Bot

### Технологии
- **Aiogram 3.0.0** - фреймворк для Telegram ботов
- **Python** - язык программирования

## Архитектура пакетов (packages/)

### Core Domain
- **core_domain/** - доменная логика генераций
  - State Machine - управление состояниями
  - Events - система событий
  - Step Lifecycle - жизненный цикл шагов

### AI Services
- **ai_services/** - интеграция с LLM
  - OpenAI Service - работа с OpenAI API
  - Model Router - роутинг между моделями
  - Prompt Manager - управление промптами

### Workers
- **workers/** - фоновые задачи
  - Task Worker - обработка задач
  - Text Refining - улучшение текста
  - Text Structure - структурирование
  - Circuit Breaker - защита от сбоев
  - Retry Logic - повторные попытки

### Billing
- **billing/** - платежная система
  - Credits - система кредитов
  - Payments - обработка платежей
  - T-Bank Provider - интеграция с Т-Банком
  - Fake Provider - тестовый провайдер

### Database
- **database/** - модели данных
  - SQLAlchemy модели
  - Миграции (Alembic)

### Economics
- **economics/** - экономика и аналитика
  - Cost Tracking - отслеживание затрат
  - Usage Analytics - аналитика использования

### LLM Economics
- **llm_economics/** - экономика LLM
  - Cost Model - модель стоимости
  - Pricing - ценообразование
  - Usage Tracking - отслеживание использования

### Jobs
- **jobs/** - система задач
  - Job Management - управление задачами
  - Result Processing - обработка результатов

### Fair Use
- **fair_use/** - политика использования
  - Abuse Detection - обнаружение злоупотреблений
  - Policy Enforcement - применение политик

## Инфраструктура

### Веб-сервер
- **Nginx** - reverse proxy и статический контент
- **Uvicorn** - ASGI сервер для FastAPI

### Деплой
- **Git** - система контроля версий
- **Shell scripts** - скрипты деплоя
- **Systemd** - управление сервисами

### Тестирование
- **Pytest** - тестирование Python кода
- **Pytest Async** - асинхронные тесты

## Стиль и дизайн

### Design Tokens
- Кастомная система дизайн-токенов:
  - Colors - цветовая палитра
  - Typography - типографика
  - Spacing - отступы
  - Motion - анимации
  - Elevation - тени
  - Radius - скругления

### CSS
- CSS Modules - модульные стили
- CSS Variables - переменные для темизации
- Responsive Design - адаптивный дизайн

## Мониторинг и логирование

- **Python Logging** - логирование на бэкенде
- **Console Logging** - логирование на фронтенде

## Особенности архитектуры

1. **Монorepo структура** - все компоненты в одном репозитории
2. **Модульная архитектура** - разделение на пакеты
3. **Type Safety** - строгая типизация на фронтенде
4. **Async/Await** - асинхронная обработка на бэкенде
5. **State Machine** - управление сложными состояниями генераций
6. **Event-Driven** - событийная архитектура для координации компонентов


