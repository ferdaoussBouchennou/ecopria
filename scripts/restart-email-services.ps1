# Recrée auth + notification avec le .env actuel (e-mails / codes de vérification)
Set-Location $PSScriptRoot\..

Write-Host "Recréation service-notification + service-auth (lit .env)..." -ForegroundColor Cyan
docker compose up -d --force-recreate service-notification-backend service-auth-backend

Write-Host ""
Write-Host "Attendez 30s puis vérifiez les logs SMTP :" -ForegroundColor Yellow
Write-Host "  docker logs service-notification-backend 2>&1 | Select-String SMTP"
Write-Host ""
Write-Host "Vous devez voir: SMTP configuré — expéditeur : ..." -ForegroundColor Green
Write-Host "Sinon: vérifiez EMAIL_USERNAME et EMAIL_PASSWORD dans .env" -ForegroundColor Red
