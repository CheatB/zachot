# Git Workflow для проекта Zachot

## Автоматический деплой с Git

При каждом деплое фронтенда все изменения автоматически сохраняются в Git.

### Использование

Просто запустите скрипт деплоя:

```bash
/root/zachot/deploy_frontend.sh
```

Скрипт автоматически:
1. ✅ Добавит все изменения в git (`git add -A`)
2. ✅ Создаст коммит с timestamp
3. ✅ Запушит изменения в remote репозиторий
4. ✅ Соберёт фронтенд с уникальной версией
5. ✅ Развернёт на production
6. ✅ Перезагрузит Nginx

### Структура коммитов

Автоматические коммиты имеют формат:
```
deploy: Frontend deployment 2026-01-14 07:35:42
```

### Ручной коммит (если нужно)

Если вы хотите сделать коммит вручную с кастомным сообщением:

```bash
cd /root/zachot
git add -A
git commit -m "feat: Your custom message"
git push origin main
```

### Что игнорируется

Файлы в `.gitignore`:
- `dist/` - собранный фронтенд
- `node_modules/` - зависимости
- `.vite/` - кэш Vite
- `*.log` - логи
- `__pycache__/` - Python кэш
- `.env` - переменные окружения

### История изменений

Последние коммиты:
```bash
git log --oneline -10
```

### Откат изменений (если что-то пошло не так)

```bash
# Посмотреть последние коммиты
git log --oneline -5

# Откатиться на предыдущий коммит
git reset --hard HEAD~1

# Или на конкретный коммит
git reset --hard <commit-hash>

# Запушить изменения (осторожно!)
git push origin main --force
```

⚠️ **Внимание:** Force push может перезаписать историю. Используйте осторожно!

### Проверка статуса

```bash
cd /root/zachot
git status
```

### Ветки

Основная ветка: `main`

Для создания feature-ветки:
```bash
git checkout -b feature/your-feature-name
# Работаете...
git push origin feature/your-feature-name
```

### Remote репозиторий

```bash
# Проверить remote
git remote -v

# Должно быть:
# origin  git@github.com:CheatB/zachot.git (fetch)
# origin  git@github.com:CheatB/zachot.git (push)
```

## Troubleshooting

### Конфликты при push

Если возникает конфликт:
```bash
git pull origin main --rebase
# Разрешите конфликты
git add .
git rebase --continue
git push origin main
```

### Забыли закоммитить перед деплоем

Не проблема! Скрипт `deploy_frontend.sh` автоматически закоммитит все изменения.

### Нужно отменить последний коммит (но сохранить изменения)

```bash
git reset --soft HEAD~1
# Изменения остаются в staging area
```

### Нужно полностью удалить последний коммит

```bash
git reset --hard HEAD~1
git push origin main --force
```

## Best Practices

1. ✅ Используйте `deploy_frontend.sh` для деплоя - он всё сделает сам
2. ✅ Делайте осмысленные коммиты вручную для важных изменений
3. ✅ Проверяйте `git status` перед ручным коммитом
4. ✅ Пишите понятные commit messages
5. ❌ Не коммитьте `dist/` и `node_modules/` (уже в .gitignore)
6. ❌ Не используйте `--force` без необходимости

## Формат commit messages

Используйте conventional commits:

- `feat:` - новая функциональность
- `fix:` - исправление бага
- `docs:` - изменения в документации
- `style:` - форматирование кода
- `refactor:` - рефакторинг
- `test:` - добавление тестов
- `chore:` - обновление зависимостей, конфигов
- `deploy:` - автоматический деплой (используется скриптом)

Примеры:
```
feat: Add user authentication
fix: Resolve memory leak in worker
docs: Update deployment guide
deploy: Frontend deployment 2026-01-14 07:35:42
```

