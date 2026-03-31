#!/usr/bin/env bash
# One-time VPS setup for Civic
# Usage: scp deploy/civic.service root@46.101.104.158:/etc/systemd/system/civic.service
#        ssh root@46.101.104.158 'bash -s' < deploy/setup.sh
set -euo pipefail

echo "==> Creating /opt/civic"
mkdir -p /opt/civic
chown www-data:www-data /opt/civic

echo "==> Enabling systemd service"
systemctl daemon-reload
systemctl enable civic

echo "==> Setting up nginx"
cat > /etc/nginx/sites-enabled/civic.conf <<'NGINX'
server {
    server_name civic.example.com;

    location / {
        proxy_pass http://127.0.0.1:4444;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    listen 80;
}
NGINX

nginx -t && systemctl reload nginx

echo "==> Done!"
echo "Next steps:"
echo "  1. Update server_name in /etc/nginx/sites-enabled/civic.conf with your domain"
echo "  2. Run: certbot --nginx -d <your-domain>"
echo "  3. Deploy the binary and run: systemctl start civic"
