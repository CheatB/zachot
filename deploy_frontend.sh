#!/bin/bash
set -e

echo "🚀 Starting frontend build..."
npm run build

echo "🧹 Cleaning up /var/www/zachot-web..."
sudo rm -rf /var/www/zachot-web/*

echo "📦 Copying dist to /var/www/zachot-web..."
sudo cp -r dist/* /var/www/zachot-web/

echo "👤 Setting permissions..."
sudo chown -R www-data:www-data /var/www/zachot-web

echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

echo "✅ Deployment complete!"
