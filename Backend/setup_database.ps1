# Script tự động setup database cho Windows
# Chạy script này bằng PowerShell: .\setup_database.ps1

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Database Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Python
Write-Host "Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Kiểm tra PostgreSQL
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
$pgVersion = psql --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ $pgVersion" -ForegroundColor Green
} else {
    Write-Host "⚠ PostgreSQL not found in PATH" -ForegroundColor Yellow
    Write-Host "  Make sure PostgreSQL is installed and running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "Setting up database..." -ForegroundColor Yellow
python init_db.py

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup completed!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Update database connection in config/database.py" -ForegroundColor White
Write-Host "  2. Run: python main.py" -ForegroundColor White
Write-Host "  3. Open: http://localhost:8000/docs" -ForegroundColor White
