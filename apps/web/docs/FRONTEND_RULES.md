# Frontend Rules

## Token-First Enforcement

### Запрещено

1. **Magic numbers** (кроме 0/1px для borders)
   - ❌ `padding: 16px`
   - ✅ `padding: var(--spacing-16)`

2. **Прямые цвета**
   - ❌ `color: #0066ff`
   - ✅ `color: var(--color-accent-base)`

3. **Фиксированные размеры шрифтов**
   - ❌ `font-size: 18px`
   - ✅ `font-size: var(--font-size-lg)`

4. **Хардкод радиусов**
   - ❌ `border-radius: 8px`
   - ✅ `border-radius: var(--radius-md)`

### Обязательно

1. **Все компоненты:**
   - ✅ Accessible (ARIA, keyboard navigation)
   - ✅ Responsive по умолчанию
   - ✅ Все состояния (hover, focus, disabled, loading)

2. **Motion:**
   - ✅ Только через motion tokens
   - ✅ Сдержанные, premium анимации
   - ✅ Не "кричащие" эффекты

3. **DEBUG UI флаги:**
   - ✅ Только в dev режиме
   - ✅ Удалять перед коммитом

4. **Компоненты:**
   - ✅ Используют CSS variables
   - ✅ Минимум inline стилей
   - ✅ НЕ логируют ничего

## Структура

```
src/
  design-tokens/    # Единый источник истины
  styles/          # Глобальные стили + CSS vars
  ui/              # UI компоненты
  utils/           # Утилиты
```

## Design Tokens

Все токены экспортируются из `src/design-tokens/index.ts` и дублируются в `src/styles/tokens.css` как CSS variables.

## Компоненты

Каждый компонент:
- Использует токены (vars)
- Accessible (aria, keyboard)
- Адаптивный по умолчанию
- Premium micro-interactions (framer-motion)
- НЕ логирует ничего

## Готовность к Dark Mode

Архитектура подготовлена к dark mode, но не включена. При включении:
1. Добавить dark mode переменные в `tokens.css`
2. Использовать `@media (prefers-color-scheme: dark)`
3. Все компоненты автоматически адаптируются через CSS vars

## Auth Bridge Rules

### Безопасность

1. **НЕ логировать токены и user payloads**
   - ❌ `console.log(token, user)`
   - ❌ `console.log('User:', user)`
   - ✅ Использовать только `user.id` для отображения

2. **Хранение токенов**
   - ✅ Только `sessionStorage` (не `localStorage`)
   - ✅ Токены НЕ должны попадать в логи
   - ✅ Токены НЕ должны быть в URL после обработки

3. **Временный auth bridge**
   - ⚠️ Это временное решение для связи с лэндингом
   - ⚠️ В будущем будет заменено на полноценную auth систему
   - ⚠️ НЕ делать реальные API calls в этом слое

### Поведение

1. **При старте приложения:**
   - Проверка URL query params (`?token=...&user_id=...`)
   - Если есть → сохранить в `sessionStorage` + state
   - Очистить query params из URL

2. **Если нет токена:**
   - Состояние `guest` (без редиректа)
   - Показать EmptyState с инструкцией

3. **Выход:**
   - Очистить `sessionStorage`
   - Очистить state
   - Редирект на `/`

