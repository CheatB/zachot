# Zachot Web

Frontend приложение для системы генераций образовательного продукта «Зачёт».

## Технологии

- **Vite** - Build tool
- **React 18** - UI library
- **TypeScript** - Type safety
- **Framer Motion** - Premium animations
- **clsx** - Conditional classes

## Структура проекта

```
src/
  app/
    App.tsx          # Главный компонент с роутингом
    main.tsx         # Entry point
    auth/            # Auth система (bridge из лэндинга)
      authContext.tsx
      authTypes.ts
      useAuth.ts
    layout/          # App Shell
      AppShell.tsx
      Header.tsx
      Sidebar.tsx
      MobileNav.tsx
    pages/           # Страницы
      HomePage.tsx
      LoginPage.tsx
      LogoutPage.tsx
  design-tokens/     # Design tokens (TypeScript + CSS vars)
  styles/
    globals.css      # Global styles
    tokens.css       # CSS variables
  ui/
    primitives/      # UI components
    layout/          # Layout helpers
  utils/             # Utilities
```

## Установка

```bash
cd apps/web
npm install
```

## Запуск

### Development

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

### Build

```bash
npm run build
npm run preview
```

## Скрипты

- `npm run dev` - Запуск dev сервера
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Линтинг
- `npm run lint:fix` - Автофикс линтинга
- `npm run format` - Форматирование кода
- `npm run format:check` - Проверка форматирования

## Design Tokens

Design tokens находятся в `src/design-tokens/` и экспортируются как TypeScript константы и CSS variables.

**Важно**: Все компоненты используют только токены - никаких magic numbers или прямых цветов.

## UI Components

Все компоненты находятся в `src/ui/`:
- Primitives: Button, Card, Input, Textarea, Badge, Progress, Skeleton, Tooltip, EmptyState
- Layout: Container, Stack, Grid

## Правила разработки

См. [docs/FRONTEND_RULES.md](./docs/FRONTEND_RULES.md)

## Auth Bridge

Приложение принимает auth данные через URL query параметры:
- `?token=JWT_TOKEN&user_id=UUID`

Пример:
```
http://localhost:3000/?token=test123&user_id=00000000-0000-0000-0000-000000000001
```

Токен сохраняется в `sessionStorage` (не `localStorage`). После обработки query params очищаются из URL.

## Роутинг

- `/` - Главная страница (AppShell)
- `/login` - Страница входа (заглушка)
- `/logout` - Выход (очищает auth и редиректит)

## TODO

- [x] Auth bridge from landing
- [x] Реализовать роутинг (react-router)
- [ ] Подключить реальные design tokens из лендинга (если отличаются)
- [ ] Добавить бизнес-логику на страницах
