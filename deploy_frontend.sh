#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting frontend deployment...${NC}"

# Git commit и push перед деплоем
echo -e "${BLUE}📝 Committing changes to git...${NC}"
cd /root/zachot || exit 1

# Проверяем, есть ли изменения
if [[ -n $(git status -s) ]]; then
    git add -A
    COMMIT_MSG="deploy: Frontend deployment $(date +'%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    
    echo -e "${BLUE}⬆️  Pushing to remote repository...${NC}"
    git push origin main
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Git push failed, but continuing with deployment...${NC}"
    else
        echo -e "${GREEN}✅ Changes pushed to git${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  No changes to commit${NC}"
fi

# Переходим в директорию проекта
cd /root/zachot || exit 1

# Генерируем уникальную версию на основе timestamp
BUILD_VERSION=$(date +%s)
echo -e "${BLUE}📦 Build version: ${BUILD_VERSION}${NC}"

# Экспортируем версию как переменную окружения для Vite
export VITE_BUILD_VERSION=$BUILD_VERSION

# Очищаем старые сборки
echo -e "${BLUE}🧹 Cleaning old builds...${NC}"
rm -rf dist
rm -rf node_modules/.vite

# Собираем проект
echo -e "${BLUE}🔨 Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Создаём файл версии
echo "{\"version\": \"$BUILD_VERSION\", \"timestamp\": \"$(date -Iseconds)\"}" > dist/version.json

# Удаляем старые файлы из production
echo -e "${BLUE}🗑️  Removing old files from production...${NC}"
sudo rm -rf /var/www/zachot-web/*

# Копируем новые файлы
echo -e "${BLUE}📋 Copying new files to production...${NC}"
sudo cp -r dist/* /var/www/zachot-web/

# Устанавливаем правильные права
sudo chown -R www-data:www-data /var/www/zachot-web

# Перезагружаем Nginx
echo -e "${BLUE}🔄 Reloading Nginx...${NC}"
sudo systemctl reload nginx

# Выводим информацию о деплое
echo ""
echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo -e "${GREEN}📅 Version: ${BUILD_VERSION}${NC}"
echo -e "${GREEN}🕐 Time: $(date)${NC}"
echo -e "${GREEN}🌐 URL: https://app.zachet.tech${NC}"
echo -e "${GREEN}📊 Version info: https://app.zachet.tech/version.json${NC}"
echo ""
