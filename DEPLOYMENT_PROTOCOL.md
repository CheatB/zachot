# Протокол развертывания и работы с проектом

## ⚠️ КРИТИЧЕСКИ ВАЖНО

**ЕДИНСТВЕННАЯ РАБОЧАЯ ДИРЕКТОРИЯ:** `/home/deploy/zachot`

**СИМВОЛИЧЕСКАЯ ССЫЛКА:** `/root/zachot` → `/home/deploy/zachot`

## Правила работы

### 1. Где работать
- ✅ **ВСЕГДА** работайте в `/home/deploy/zachot` или `/root/zachot` (они указывают на одно место)
- ❌ **НИКОГДА** не создавайте отдельную папку `/root/zachot` как реальную директорию
- ❌ **НИКОГДА** не копируйте проект в другие места

### 2. Проверка перед началом работы
```bash
# Убедитесь, что /root/zachot - это символическая ссылка
ls -l /root/zachot
# Должно показать: lrwxrwxrwx ... /root/zachot -> /home/deploy/zachot

# Если это НЕ символическая ссылка, НЕМЕДЛЕННО исправьте:
sudo rm -rf /root/zachot
sudo ln -s /home/deploy/zachot /root/zachot
```

### 3. Развертывание изменений

#### Frontend (React + Vite)
```bash
cd /home/deploy/zachot
./deploy_frontend.sh
```

Или вручную:
```bash
cd /home/deploy/zachot
npm run build
rsync -av --delete dist/ /var/www/zachot-web/
sudo chown -R www-data:www-data /var/www/zachot-web
sudo systemctl reload nginx
```

#### Backend (FastAPI)
```bash
cd /home/deploy/zachot
sudo systemctl restart zachot-api
sudo systemctl restart zachot-worker
```

#### Проверка статуса сервисов
```bash
systemctl status zachot-api zachot-worker zachot-bot nginx
```

### 4. Владелец файлов
Все файлы в `/home/deploy/zachot` должны принадлежать пользователю `deploy`:
```bash
sudo chown -R deploy:deploy /home/deploy/zachot
```

### 5. Git workflow
```bash
cd /home/deploy/zachot
git status
git add .
git commit -m "Описание изменений"
git push origin main
```

### 6. Логи для отладки
```bash
# API логи
journalctl -u zachot-api -n 50 --no-pager

# Worker логи
journalctl -u zachot-worker -n 50 --no-pager

# Nginx логи
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## История проблемы

**Дата:** 13 января 2026  
**Проблема:** Десинхронизация двух рабочих директорий (`/root/zachot` и `/home/deploy/zachot`)  
**Причина:** Экстренные исправления применялись напрямую в `/home/deploy/zachot`, а последующие деплои из `/root/zachot` перезаписывали их  
**Решение:** Создана символическая ссылка `/root/zachot` → `/home/deploy/zachot` для обеспечения единого источника истины

## Контрольный список перед деплоем

- [ ] Проверил, что `/root/zachot` - это символическая ссылка
- [ ] Убедился, что работаю в `/home/deploy/zachot`
- [ ] Проверил владельца файлов (`deploy:deploy`)
- [ ] Собрал frontend (`npm run build`)
- [ ] Перезапустил backend сервисы
- [ ] Проверил статус всех сервисов
- [ ] Проверил логи на наличие ошибок
- [ ] Протестировал основной функционал на живом сайте

## Контакты и поддержка

При возникновении проблем с развертыванием:
1. Проверьте логи сервисов
2. Убедитесь в корректности символической ссылки
3. Проверьте права доступа к файлам
4. Убедитесь, что все зависимости установлены (`npm install`, `pip install -r requirements.txt`)


## ⚠️ КРИТИЧЕСКИ ВАЖНО

**ЕДИНСТВЕННАЯ РАБОЧАЯ ДИРЕКТОРИЯ:** `/home/deploy/zachot`

**СИМВОЛИЧЕСКАЯ ССЫЛКА:** `/root/zachot` → `/home/deploy/zachot`

## Правила работы

### 1. Где работать
- ✅ **ВСЕГДА** работайте в `/home/deploy/zachot` или `/root/zachot` (они указывают на одно место)
- ❌ **НИКОГДА** не создавайте отдельную папку `/root/zachot` как реальную директорию
- ❌ **НИКОГДА** не копируйте проект в другие места

### 2. Проверка перед началом работы
```bash
# Убедитесь, что /root/zachot - это символическая ссылка
ls -l /root/zachot
# Должно показать: lrwxrwxrwx ... /root/zachot -> /home/deploy/zachot

# Если это НЕ символическая ссылка, НЕМЕДЛЕННО исправьте:
sudo rm -rf /root/zachot
sudo ln -s /home/deploy/zachot /root/zachot
```

### 3. Развертывание изменений

#### Frontend (React + Vite)
```bash
cd /home/deploy/zachot
./deploy_frontend.sh
```

Или вручную:
```bash
cd /home/deploy/zachot
npm run build
rsync -av --delete dist/ /var/www/zachot-web/
sudo chown -R www-data:www-data /var/www/zachot-web
sudo systemctl reload nginx
```

#### Backend (FastAPI)
```bash
cd /home/deploy/zachot
sudo systemctl restart zachot-api
sudo systemctl restart zachot-worker
```

#### Проверка статуса сервисов
```bash
systemctl status zachot-api zachot-worker zachot-bot nginx
```

### 4. Владелец файлов
Все файлы в `/home/deploy/zachot` должны принадлежать пользователю `deploy`:
```bash
sudo chown -R deploy:deploy /home/deploy/zachot
```

### 5. Git workflow
```bash
cd /home/deploy/zachot
git status
git add .
git commit -m "Описание изменений"
git push origin main
```

### 6. Логи для отладки
```bash
# API логи
journalctl -u zachot-api -n 50 --no-pager

# Worker логи
journalctl -u zachot-worker -n 50 --no-pager

# Nginx логи
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## История проблемы

**Дата:** 13 января 2026  
**Проблема:** Десинхронизация двух рабочих директорий (`/root/zachot` и `/home/deploy/zachot`)  
**Причина:** Экстренные исправления применялись напрямую в `/home/deploy/zachot`, а последующие деплои из `/root/zachot` перезаписывали их  
**Решение:** Создана символическая ссылка `/root/zachot` → `/home/deploy/zachot` для обеспечения единого источника истины

## Контрольный список перед деплоем

- [ ] Проверил, что `/root/zachot` - это символическая ссылка
- [ ] Убедился, что работаю в `/home/deploy/zachot`
- [ ] Проверил владельца файлов (`deploy:deploy`)
- [ ] Собрал frontend (`npm run build`)
- [ ] Перезапустил backend сервисы
- [ ] Проверил статус всех сервисов
- [ ] Проверил логи на наличие ошибок
- [ ] Протестировал основной функционал на живом сайте

## Контакты и поддержка

При возникновении проблем с развертыванием:
1. Проверьте логи сервисов
2. Убедитесь в корректности символической ссылки
3. Проверьте права доступа к файлам
4. Убедитесь, что все зависимости установлены (`npm install`, `pip install -r requirements.txt`)


## ⚠️ КРИТИЧЕСКИ ВАЖНО

**ЕДИНСТВЕННАЯ РАБОЧАЯ ДИРЕКТОРИЯ:** `/home/deploy/zachot`

**СИМВОЛИЧЕСКАЯ ССЫЛКА:** `/root/zachot` → `/home/deploy/zachot`

## Правила работы

### 1. Где работать
- ✅ **ВСЕГДА** работайте в `/home/deploy/zachot` или `/root/zachot` (они указывают на одно место)
- ❌ **НИКОГДА** не создавайте отдельную папку `/root/zachot` как реальную директорию
- ❌ **НИКОГДА** не копируйте проект в другие места

### 2. Проверка перед началом работы
```bash
# Убедитесь, что /root/zachot - это символическая ссылка
ls -l /root/zachot
# Должно показать: lrwxrwxrwx ... /root/zachot -> /home/deploy/zachot

# Если это НЕ символическая ссылка, НЕМЕДЛЕННО исправьте:
sudo rm -rf /root/zachot
sudo ln -s /home/deploy/zachot /root/zachot
```

### 3. Развертывание изменений

#### Frontend (React + Vite)
```bash
cd /home/deploy/zachot
./deploy_frontend.sh
```

Или вручную:
```bash
cd /home/deploy/zachot
npm run build
rsync -av --delete dist/ /var/www/zachot-web/
sudo chown -R www-data:www-data /var/www/zachot-web
sudo systemctl reload nginx
```

#### Backend (FastAPI)
```bash
cd /home/deploy/zachot
sudo systemctl restart zachot-api
sudo systemctl restart zachot-worker
```

#### Проверка статуса сервисов
```bash
systemctl status zachot-api zachot-worker zachot-bot nginx
```

### 4. Владелец файлов
Все файлы в `/home/deploy/zachot` должны принадлежать пользователю `deploy`:
```bash
sudo chown -R deploy:deploy /home/deploy/zachot
```

### 5. Git workflow
```bash
cd /home/deploy/zachot
git status
git add .
git commit -m "Описание изменений"
git push origin main
```

### 6. Логи для отладки
```bash
# API логи
journalctl -u zachot-api -n 50 --no-pager

# Worker логи
journalctl -u zachot-worker -n 50 --no-pager

# Nginx логи
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## История проблемы

**Дата:** 13 января 2026  
**Проблема:** Десинхронизация двух рабочих директорий (`/root/zachot` и `/home/deploy/zachot`)  
**Причина:** Экстренные исправления применялись напрямую в `/home/deploy/zachot`, а последующие деплои из `/root/zachot` перезаписывали их  
**Решение:** Создана символическая ссылка `/root/zachot` → `/home/deploy/zachot` для обеспечения единого источника истины

## Контрольный список перед деплоем

- [ ] Проверил, что `/root/zachot` - это символическая ссылка
- [ ] Убедился, что работаю в `/home/deploy/zachot`
- [ ] Проверил владельца файлов (`deploy:deploy`)
- [ ] Собрал frontend (`npm run build`)
- [ ] Перезапустил backend сервисы
- [ ] Проверил статус всех сервисов
- [ ] Проверил логи на наличие ошибок
- [ ] Протестировал основной функционал на живом сайте

## Контакты и поддержка

При возникновении проблем с развертыванием:
1. Проверьте логи сервисов
2. Убедитесь в корректности символической ссылки
3. Проверьте права доступа к файлам
4. Убедитесь, что все зависимости установлены (`npm install`, `pip install -r requirements.txt`)


## ⚠️ КРИТИЧЕСКИ ВАЖНО

**ЕДИНСТВЕННАЯ РАБОЧАЯ ДИРЕКТОРИЯ:** `/home/deploy/zachot`

**СИМВОЛИЧЕСКАЯ ССЫЛКА:** `/root/zachot` → `/home/deploy/zachot`

## Правила работы

### 1. Где работать
- ✅ **ВСЕГДА** работайте в `/home/deploy/zachot` или `/root/zachot` (они указывают на одно место)
- ❌ **НИКОГДА** не создавайте отдельную папку `/root/zachot` как реальную директорию
- ❌ **НИКОГДА** не копируйте проект в другие места

### 2. Проверка перед началом работы
```bash
# Убедитесь, что /root/zachot - это символическая ссылка
ls -l /root/zachot
# Должно показать: lrwxrwxrwx ... /root/zachot -> /home/deploy/zachot

# Если это НЕ символическая ссылка, НЕМЕДЛЕННО исправьте:
sudo rm -rf /root/zachot
sudo ln -s /home/deploy/zachot /root/zachot
```

### 3. Развертывание изменений

#### Frontend (React + Vite)
```bash
cd /home/deploy/zachot
./deploy_frontend.sh
```

Или вручную:
```bash
cd /home/deploy/zachot
npm run build
rsync -av --delete dist/ /var/www/zachot-web/
sudo chown -R www-data:www-data /var/www/zachot-web
sudo systemctl reload nginx
```

#### Backend (FastAPI)
```bash
cd /home/deploy/zachot
sudo systemctl restart zachot-api
sudo systemctl restart zachot-worker
```

#### Проверка статуса сервисов
```bash
systemctl status zachot-api zachot-worker zachot-bot nginx
```

### 4. Владелец файлов
Все файлы в `/home/deploy/zachot` должны принадлежать пользователю `deploy`:
```bash
sudo chown -R deploy:deploy /home/deploy/zachot
```

### 5. Git workflow
```bash
cd /home/deploy/zachot
git status
git add .
git commit -m "Описание изменений"
git push origin main
```

### 6. Логи для отладки
```bash
# API логи
journalctl -u zachot-api -n 50 --no-pager

# Worker логи
journalctl -u zachot-worker -n 50 --no-pager

# Nginx логи
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## История проблемы

**Дата:** 13 января 2026  
**Проблема:** Десинхронизация двух рабочих директорий (`/root/zachot` и `/home/deploy/zachot`)  
**Причина:** Экстренные исправления применялись напрямую в `/home/deploy/zachot`, а последующие деплои из `/root/zachot` перезаписывали их  
**Решение:** Создана символическая ссылка `/root/zachot` → `/home/deploy/zachot` для обеспечения единого источника истины

## Контрольный список перед деплоем

- [ ] Проверил, что `/root/zachot` - это символическая ссылка
- [ ] Убедился, что работаю в `/home/deploy/zachot`
- [ ] Проверил владельца файлов (`deploy:deploy`)
- [ ] Собрал frontend (`npm run build`)
- [ ] Перезапустил backend сервисы
- [ ] Проверил статус всех сервисов
- [ ] Проверил логи на наличие ошибок
- [ ] Протестировал основной функционал на живом сайте

## Контакты и поддержка

При возникновении проблем с развертыванием:
1. Проверьте логи сервисов
2. Убедитесь в корректности символической ссылки
3. Проверьте права доступа к файлам
4. Убедитесь, что все зависимости установлены (`npm install`, `pip install -r requirements.txt`)

