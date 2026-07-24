Write-Host "Iniciando servidor local do Makro Hub..." -ForegroundColor Green
Write-Host "Acesse: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar o servidor`n" -ForegroundColor Yellow
serve -p 5000 . --no-clipboard --no-request-logging
